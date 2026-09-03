/// <reference lib="webworker" />

import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSource,
  Input,
  Mp4OutputFormat,
  Output,
  Quality,
  VideoSampleSink,
  getFirstEncodableVideoCodec,
  type VideoCodec,
  type VideoSample,
} from "mediabunny";
import { EXPORT_SCALE, coverCrop, type PixelRect } from "./exportGeometry";

/**
 * Renders the grid offline, one frame at a time, and muxes the result to MP4.
 *
 * Nothing here is real time: frame `n`'s timestamp is derived from `n`, not
 * from a clock, which is what makes the output constant-frame-rate. Every
 * source is read forward exactly once per loop pass — there is no seeking —
 * and the whole pipeline lives in this worker so the UI thread stays free.
 */

/** How often a key frame is forced, in seconds. */
const KEY_FRAME_INTERVAL = 2;

/**
 * The quantizer every export is encoded at — constant-quality (CRF-style)
 * rate control, so the file spends whatever bits the content needs instead of
 * dividing a fixed budget among the cells.
 *
 * A grid is the case a fixed bitrate starves: N clips playing at once are N
 * uncorrelated motion fields with no redundancy between them, so each cell
 * effectively gets the target rate divided by N and turns blocky. Holding the
 * quantizer instead lets a busy grid cost more than a calm one, which is the
 * right trade for an export the user downloads once.
 *
 * The AVC scale runs from 0 (lossless) to 51; for reference, mediabunny's own
 * 'high' quality level lands on 22 and 'very-high' on 16. 20 sits between
 * them, which at EXPORT_SCALE'd resolution is well past the point where the
 * quantizer is the visible limit — and since nothing caps the file size any
 * more, going lower mostly buys bytes. This is the knob to turn if a future
 * export still looks soft.
 */
const QUANTIZER = 20;

/**
 * Bits per pixel per second behind the fallback bitrate, used only by encoders
 * that can't do quantizer-based rate control. Generous on purpose: it has to
 * hit a number rather than a quality, so it needs headroom for the busy case
 * QUANTIZER exists to serve.
 */
const FALLBACK_BITS_PER_PIXEL = 0.2;

/** One cell's contribution to the export. */
export interface RenderCell {
  kind: "image" | "video";
  /** The raw file backing the cell. `File` is structured-cloneable, so this
   * crosses the worker boundary without reading the bytes on the UI thread. */
  file: File;
  /**
   * Where the cell lands, in pixels. A grid cell has exactly one; a column
   * item that `repeat` replicated has one per copy, all the same size — one
   * entry per place the same decoded frame gets drawn, so a repeated clip
   * still costs a single decoder.
   *
   * When `strip` is set these are strip-local along its axis: that coordinate
   * is measured from the start of the strip and only becomes a canvas one once
   * the frame's scroll offset is added.
   */
  rects: PixelRect[];
  /** Index into RenderRequest.strips, for a cell that scrolls. */
  strip?: number;
}

/** A scrolling band of cells, and how fast it moves. */
export interface RenderStrip {
  /** Which canvas axis the strip runs and scrolls along. */
  axis: "x" | "y";
  /** The distance the scroll wraps at. Never less than the canvas measures
   * along `axis` — see cellDestinations for what that buys. */
  length: number;
  /** Canvas pixels per second along `axis`. Negative runs it backwards: up a
   * column, or leftward along a row. */
  pixelsPerSecond: number;
}

export interface RenderRequest {
  type: "render";
  cells: RenderCell[];
  /** Empty in grid mode, where every cell holds still. */
  strips: RenderStrip[];
  /** Export canvas size, in pixels. Both must be even (H.264 + yuv420p). */
  width: number;
  height: number;
  durationSeconds: number;
  fps: number;
  /** CSS colour painted behind the cells and in the gaps between them. */
  background: string;
}

/** What a source turns out to be, once read. */
export interface ProbedMedia {
  /** Null for a still. */
  durationSeconds: number | null;
  /** Corrected for rotation and pixel aspect ratio, so it's the shape the
   * source looks like rather than the shape it's stored as. */
  width: number;
  height: number;
}

/** Asks what a file is: its length, which defaults the export duration, and
 * its shape, which is what column mode sizes an item from. */
export interface ProbeRequest {
  type: "probe";
  /** Echoed back so the caller can match the answer to the cell it asked for. */
  id: string;
  kind: "image" | "video";
  file: File;
}

export type RenderWorkerRequest = RenderRequest | ProbeRequest | { type: "cancel" };

export type RenderWorkerResponse =
  | { type: "progress"; progress: number }
  | { type: "done"; buffer: ArrayBuffer }
  | { type: "error"; message: string }
  /** Sent once the render has stopped and released its decoders, so the
   * caller knows it's safe to drop the worker. */
  | { type: "cancelled" }
  | { type: "probed"; id: string; media: ProbedMedia | null };

const worker = self as unknown as DedicatedWorkerGlobalScope;

/** Set by a "cancel" message and checked between frames. */
let cancelled = false;

function post(message: RenderWorkerResponse, transfer?: Transferable[]) {
  worker.postMessage(message, transfer ?? []);
}

/**
 * Draws one cell's worth of the output, frame by frame.
 *
 * `prepare` and `release` bracket every frame so that per-frame resources
 * (decoded video samples, which are large and GPU-backed) are held for exactly
 * as long as it takes to draw them. prepare and release are called once each
 * per output frame, in order — the renderers advance in lockstep with the
 * output clock, which is why none of them need to be told which frame it is.
 *
 * `draw` runs once per place the cell appears this frame, which is once for a
 * grid cell and possibly several times for a scrolling one. Where those places
 * are is the render loop's business, not the renderer's: all a renderer knows
 * is how to put its current frame into a box.
 */
interface CellRenderer {
  prepare(): Promise<void>;
  draw(ctx: OffscreenCanvasRenderingContext2D, rect: PixelRect): void;
  release(): void;
  close(): Promise<void>;
}

/** Draws a source into its cell, cropped like CSS `object-fit: cover`. */
function drawSample(
  ctx: OffscreenCanvasRenderingContext2D,
  sample: VideoSample,
  rect: PixelRect
) {
  // displayWidth/Height are corrected for rotation and pixel aspect ratio, so
  // a clip shot in portrait crops the way it looks, not the way it's stored.
  const crop = coverCrop(sample.displayWidth, sample.displayHeight, rect.width, rect.height);
  if (!crop) return;
  sample.draw(
    ctx,
    crop.sx,
    crop.sy,
    crop.sWidth,
    crop.sHeight,
    rect.x,
    rect.y,
    rect.width,
    rect.height
  );
}

/** The clip's length, preferring the cheap metadata read over a full scan. */
async function readDuration(input: Input): Promise<number> {
  const fromMetadata = await input.getDurationFromMetadata();
  if (fromMetadata !== null && fromMetadata > 0) return fromMetadata;
  return input.computeDuration();
}

/**
 * Yields one sample per output frame, restarting the clip whenever it runs
 * out — matching the preview, where every cell is a `<video loop>`.
 *
 * Each pass over the clip gets its own `samplesAtTimestamps` call, fed the
 * source times for just that pass. Those are monotonically increasing within
 * a pass, which is the case mediabunny optimises for: it walks the file
 * forward decoding each packet at most once. Only wrapping around costs a
 * restart, and a clip at least as long as the export never wraps at all.
 */
async function* loopedSamples(
  sink: VideoSampleSink,
  frameTimestamps: number[],
  clipDuration: number
): AsyncGenerator<VideoSample | null, void, unknown> {
  const loops = clipDuration > 0;
  let index = 0;

  while (index < frameTimestamps.length) {
    const pass = loops ? Math.floor(frameTimestamps[index] / clipDuration) : 0;
    const offset = pass * clipDuration;

    const passTimestamps: number[] = [];
    while (index < frameTimestamps.length) {
      const timestamp = frameTimestamps[index];
      if (loops && Math.floor(timestamp / clipDuration) !== pass) break;
      passTimestamps.push(timestamp - offset);
      index++;
    }

    yield* sink.samplesAtTimestamps(passTimestamps);
  }
}

/**
 * Opens a video file and hands back its frames in output order.
 *
 * mediabunny clones internally when one source frame covers several output
 * frames, so every yielded sample is ours alone and must be closed exactly
 * once.
 */
async function openVideoCell(
  cell: RenderCell,
  frameTimestamps: number[]
): Promise<CellRenderer> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(cell.file) });

  let samples: AsyncGenerator<VideoSample | null, void, unknown>;
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error(`"${cell.file.name}" doesn't contain a video track.`);
    samples = loopedSamples(
      new VideoSampleSink(track),
      frameTimestamps,
      await readDuration(input)
    );
  } catch (error) {
    input.dispose();
    throw error;
  }

  let current: VideoSample | null = null;

  return {
    async prepare() {
      const result = await samples.next();
      current = result.done ? null : result.value;
    },
    draw(ctx, rect) {
      // null means the clip has nothing at this time — a source that starts
      // after zero. The background shows through, as it would in the preview.
      if (current) drawSample(ctx, current, rect);
    },
    release() {
      // Never hold more than the frame being drawn: a handful of unclosed
      // 1080p samples exhausts GPU memory within seconds of footage.
      current?.close();
      current = null;
    },
    async close() {
      current?.close();
      current = null;
      // Returning early makes the generator close anything still queued.
      await samples.return(undefined);
      input.dispose();
    },
  };
}

/**
 * Decodes a still once, pre-cropped and pre-scaled to its cell, and blits
 * that same bitmap on every frame.
 *
 * A still never changes, so the expensive resample is done once here rather
 * than every frame — for a large photo scaled into a small cell that is the
 * difference between one resize and hundreds.
 */
async function openImageCell(cell: RenderCell): Promise<CellRenderer> {
  // Every rect a cell has is the same size — repeats of a column item differ
  // only in where they sit — so one pre-scaled bitmap serves all of them.
  const rect = cell.rects[0];
  let bitmap: ImageBitmap;

  try {
    // from-image applies EXIF orientation, matching what an <img> shows in
    // the preview.
    const decoded = await createImageBitmap(cell.file, { imageOrientation: "from-image" });
    const crop = coverCrop(decoded.width, decoded.height, rect.width, rect.height);

    if (!crop) {
      decoded.close();
      throw new Error(`"${cell.file.name}" has no drawable image data.`);
    }

    try {
      bitmap = await createImageBitmap(
        decoded,
        Math.round(crop.sx),
        Math.round(crop.sy),
        Math.round(crop.sWidth),
        Math.round(crop.sHeight),
        { resizeWidth: rect.width, resizeHeight: rect.height, resizeQuality: "high" }
      );
    } finally {
      decoded.close();
    }
  } catch (error) {
    throw error instanceof Error && error.message.includes(cell.file.name)
      ? error
      : new Error(`"${cell.file.name}" couldn't be decoded as an image.`);
  }

  return {
    async prepare() {},
    draw(ctx, at) {
      // Already cropped and sized to the cell, so this is a straight blit.
      ctx.drawImage(bitmap, at.x, at.y);
    },
    release() {},
    async close() {
      bitmap.close();
    },
  };
}

function openCell(cell: RenderCell, frameTimestamps: number[]): Promise<CellRenderer> {
  return cell.kind === "video"
    ? openVideoCell(cell, frameTimestamps)
    : openImageCell(cell);
}

/**
 * How far each strip has scrolled at `time`, wrapped into [0, height).
 *
 * Derived from the time rather than accumulated frame by frame, so the motion
 * is exact at every frame instead of drifting with rounding, and the loop
 * closes on itself the way the preview's CSS animation does.
 */
function stripOffsets(strips: RenderStrip[], time: number): number[] {
  return strips.map(({ length, pixelsPerSecond }) => {
    const offset = (time * pixelsPerSecond) % length;
    // % keeps the sign of the dividend, and running backwards is negative.
    return offset < 0 ? offset + length : offset;
  });
}

/**
 * Every place a cell has to be drawn this frame.
 *
 * A scrolling cell gets its own place in the strip plus the copy one strip
 * back, which is what covers the wrap. Two candidates is always enough because
 * a strip is never shorter than the frame it runs across (see stripLayout):
 * the pair spans more than a frame whatever the offset, so no third copy can
 * ever be on screen.
 */
function* cellDestinations(
  cell: RenderCell,
  strips: RenderStrip[],
  offsets: number[],
  canvas: { width: number; height: number }
): Generator<PixelRect> {
  if (cell.strip === undefined) {
    yield* cell.rects;
    return;
  }

  const { axis, length } = strips[cell.strip];
  const offset = offsets[cell.strip];
  const horizontal = axis === "x";
  const extent = horizontal ? canvas.width : canvas.height;

  for (const rect of cell.rects) {
    const start = horizontal ? rect.x : rect.y;
    const size = horizontal ? rect.width : rect.height;

    for (const wrap of [0, -length]) {
      const moved = start + offset + wrap;
      if (moved >= extent || moved + size <= 0) continue;
      yield horizontal ? { ...rect, x: moved } : { ...rect, y: moved };
    }
  }
}

/** What the encoder was willing to take, and how to feed it. */
interface EncodeTarget {
  codec: VideoCodec;
  quality: Quality;
  /** Set only when the encoder refused the full canvas, telling mediabunny to
   * scale every frame down to this size before encoding. `fill` is required
   * whenever both axes are given, and can't distort here: the target is
   * exactly half the canvas on both, so there is nothing to fit. */
  transform?: { width: number; height: number; fit: "fill" };
}

/**
 * Finds the largest size the browser will encode: the canvas as drawn, or —
 * for an encoder that won't take EXPORT_SCALE'd 4K-class frames — the nominal
 * size below it.
 *
 * Falling back costs resolution but not the supersampling: the canvas is still
 * drawn at full scale, and mediabunny's 2:1 reduction on the way into the
 * encoder is a better resample than drawing each cell small in the first place.
 */
async function resolveEncodeTarget(
  width: number,
  height: number,
  fps: number
): Promise<EncodeTarget | null> {
  const sizes = [
    { width, height },
    { width: width / EXPORT_SCALE, height: height / EXPORT_SCALE },
  ];

  for (const [index, size] of sizes.entries()) {
    const quality = new Quality({
      quantizer: QUANTIZER,
      // A fallback for encoders without quantizer-based rate control, sized
      // for whatever resolution actually reaches the encoder.
      bitrate: Math.round(size.width * size.height * fps * FALLBACK_BITS_PER_PIXEL),
    });
    const codec = await getFirstEncodableVideoCodec(["avc"], { ...size, quality });
    if (codec) {
      return {
        codec,
        quality,
        transform: index === 0 ? undefined : { ...size, fit: "fill" },
      };
    }
  }

  return null;
}

async function render(request: RenderRequest) {
  const { width, height, fps } = request;
  const totalFrames = Math.max(1, Math.round(request.durationSeconds * fps));
  const frameTimestamps = Array.from({ length: totalFrames }, (_, n) => n / fps);

  const canvasSize = { width, height };
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Couldn't create the export canvas.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const target = await resolveEncodeTarget(width, height, fps);
  if (!target) {
    // Neither size worked, so quote the smaller one — the floor it couldn't meet.
    const floorWidth = width / EXPORT_SCALE;
    const floorHeight = height / EXPORT_SCALE;
    throw new Error(`This browser can't encode H.264 video at ${floorWidth}×${floorHeight}.`);
  }

  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: target.codec,
    quality: target.quality,
    keyFrameInterval: KEY_FRAME_INTERVAL,
    latencyMode: "quality",
    transform: target.transform,
  });
  // Snapping to a declared frame rate is what guarantees the output is CFR.
  output.addVideoTrack(source, { frameRate: fps });
  // An audio track would be added here, mixing the cells' audio into an
  // AudioBufferSource; the export is deliberately video-only for now.

  const renderers: CellRenderer[] = [];
  try {
    // Opened in parallel: each one reads its own file's header.
    renderers.push(
      ...(await Promise.all(request.cells.map((cell) => openCell(cell, frameTimestamps))))
    );

    await output.start();

    for (let frame = 0; frame < totalFrames; frame++) {
      if (cancelled) {
        await output.cancel();
        return;
      }

      // Fetch every cell's frame together, so one slow source doesn't
      // serialise the others, then draw them in order.
      await Promise.all(renderers.map((renderer) => renderer.prepare()));

      ctx.fillStyle = request.background;
      ctx.fillRect(0, 0, width, height);

      const offsets = stripOffsets(request.strips, frame / fps);

      try {
        renderers.forEach((renderer, index) => {
          const cell = request.cells[index];
          for (const rect of cellDestinations(cell, request.strips, offsets, canvasSize)) {
            renderer.draw(ctx, rect);
          }
        });
      } finally {
        for (const renderer of renderers) renderer.release();
      }

      // Awaiting each add() is mediabunny's own backpressure mechanism — the
      // promise resolves when the encoder is ready for more, not when this
      // frame has finished encoding, so the pipeline stays full.
      await source.add(frame / fps, 1 / fps);
      post({ type: "progress", progress: (frame + 1) / totalFrames });
    }

    await output.finalize();

    const buffer = output.target.buffer;
    if (!buffer) throw new Error("The export produced no data.");
    post({ type: "done", buffer }, [buffer]);
  } finally {
    await Promise.all(renderers.map((renderer) => renderer.close()));
  }
}

async function probeImage(file: File): Promise<ProbedMedia> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    // from-image means these are post-EXIF, matching what the preview shows
    // and what openImageCell will decode.
    return { durationSeconds: null, width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
}

async function probeVideo(file: File): Promise<ProbedMedia | null> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) return null;
    return {
      durationSeconds: await readDuration(input),
      width: track.displayWidth,
      height: track.displayHeight,
    };
  } finally {
    input.dispose();
  }
}

async function probe(request: ProbeRequest) {
  try {
    const media =
      request.kind === "image"
        ? await probeImage(request.file)
        : await probeVideo(request.file);
    post({ type: "probed", id: request.id, media });
  } catch {
    // A file we can't read shouldn't break the toolbar; the caller falls back
    // to the shape and length it already had.
    post({ type: "probed", id: request.id, media: null });
  }
}

worker.addEventListener("message", (event: MessageEvent<RenderWorkerRequest>) => {
  const request = event.data;

  if (request.type === "cancel") {
    cancelled = true;
    return;
  }

  if (request.type === "probe") {
    void probe(request);
    return;
  }

  cancelled = false;
  void render(request)
    // render() only returns once its `finally` has closed every renderer, so
    // by here the decoders are already released.
    .then(() => {
      if (cancelled) post({ type: "cancelled" });
    })
    .catch((error: unknown) => {
      post({
        type: "error",
        message: error instanceof Error ? error.message : "The export failed.",
      });
    });
});
