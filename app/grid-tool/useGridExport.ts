"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Background,
  BACKGROUNDS,
  EXPORT_FPS,
  EXPORT_SCALE,
  cellPixelRect,
  exportCanvasSize,
} from "./exportGeometry";
import { type BandCount, type StripAxis, stripLayout } from "./stripGeometry";
import type { Aspect, MediaType, Rect } from "./gridLayout";
import type {
  ProbedMedia,
  RenderCell,
  RenderRequest,
  RenderWorkerRequest,
  RenderWorkerResponse,
} from "./renderWorker";

export type ExportStatus = "idle" | "preparing" | "rendering";

/** How long to wait for the worker to acknowledge a cancel before killing it
 * outright, in case it's wedged somewhere that never reaches a frame boundary. */
const CANCEL_GRACE_MS = 2000;

/** The media behind a cell, wherever that cell ends up. */
export interface ExportMedia {
  kind: MediaType;
  file: File;
}

/** A filled cell, in grid units — the hook converts to export pixels. */
export interface ExportCell extends ExportMedia {
  rect: Rect;
}

/**
 * One slot in a strip, in the order it was added.
 *
 * Empty slots are here too, carrying only their assumed shape: they take up
 * their share of the strip exactly as they do in the preview, and the export
 * simply leaves the background showing — the same thing an empty grid cell
 * does, so what you arrange is what you get either way.
 */
export interface ExportStripItem {
  media: ExportMedia | null;
  /** width / height. */
  aspectRatio: number;
}

/**
 * What to render: the two modes differ enough in their geometry that they get
 * their own shapes here, and the hook is the one place that turns either into
 * the flat list of pixel rects the worker draws.
 */
export type ExportLayout =
  | { mode: "grid"; cells: ExportCell[] }
  | {
      mode: "strip";
      /** Columns run vertical, rows run horizontal; the rest is identical. */
      axis: StripAxis;
      items: ExportStripItem[];
      bands: BandCount;
      repeat: boolean;
      /** Nominal canvas pixels per second; negative runs the strip backwards. */
      speed: number;
    };

interface StartOptions {
  layout: ExportLayout;
  aspect: Aspect;
  background: Background;
  durationSeconds: number;
  /** Without the extension; ".mp4" is appended. */
  fileName?: string;
}

/**
 * Turns a layout into the worker's flat draw list.
 *
 * Strip items are grouped by the cell they came from, so a clip `repeat`
 * replicated ten times along a strip still opens one decoder and gets blitted
 * ten times, rather than being decoded ten times over.
 */
function buildCells(
  layout: ExportLayout,
  aspect: Aspect
): Pick<RenderRequest, "cells" | "strips"> {
  if (layout.mode === "grid") {
    return {
      cells: layout.cells.map((cell) => ({
        kind: cell.kind,
        file: cell.file,
        rects: [cellPixelRect(cell.rect, aspect)],
      })),
      strips: [],
    };
  }

  const strips = stripLayout(
    layout.items.map((item) => item.aspectRatio),
    aspect,
    layout.axis,
    layout.bands,
    layout.repeat
  );

  const cells: RenderCell[] = [];
  strips.forEach((strip, stripIndex) => {
    const byItem = new Map<number, RenderCell>();

    for (const { index, rect } of strip.items) {
      const { media } = layout.items[index];
      if (!media) continue;

      const existing = byItem.get(index);
      if (existing) {
        existing.rects.push(rect);
        continue;
      }

      const cell: RenderCell = {
        kind: media.kind,
        file: media.file,
        rects: [rect],
        strip: stripIndex,
      };
      byItem.set(index, cell);
      cells.push(cell);
    }
  });

  return {
    cells,
    strips: strips.map((strip) => ({
      axis: layout.axis === "vertical" ? ("y" as const) : ("x" as const),
      length: strip.length,
      // The speed is quoted in nominal pixels so it means the same thing at
      // any EXPORT_SCALE; the strip is in canvas pixels, so it scales to match.
      pixelsPerSecond: layout.speed * EXPORT_SCALE,
    })),
  };
}

function createRenderWorker() {
  return new Worker(new URL("./renderWorker.ts", import.meta.url), { type: "module" });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Reads a file's length and shape without decoding it — the length defaults
 * the export duration, the shape sizes the item in column mode.
 *
 * Resolves to null for anything unreadable: a file we can't measure shouldn't
 * stop the user from exporting, it just keeps whatever the caller assumed.
 */
export function probeMedia(file: File, kind: MediaType): Promise<ProbedMedia | null> {
  return new Promise((resolve) => {
    const worker = createRenderWorker();

    const finish = (media: ProbedMedia | null) => {
      worker.terminate();
      resolve(media);
    };

    worker.addEventListener("message", (event: MessageEvent<RenderWorkerResponse>) => {
      if (event.data.type === "probed") finish(event.data.media);
    });
    worker.addEventListener("error", () => finish(null));

    worker.postMessage({
      type: "probe",
      id: "media",
      kind,
      file,
    } satisfies RenderWorkerRequest);
  });
}

/**
 * Drives the offline renderer in a worker and hands the finished MP4 to the
 * browser as a download.
 *
 * The worker is created per export and dropped as soon as it finishes, so a
 * failed or cancelled run can't leave decoders alive behind the next one.
 */
export function useGridExport() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const workerRef = useRef<Worker | null>(null);
  const cancelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teardown = useCallback(() => {
    if (cancelTimerRef.current !== null) {
      clearTimeout(cancelTimerRef.current);
      cancelTimerRef.current = null;
    }
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    teardown();
    setStatus("idle");
    setProgress(0);
  }, [teardown]);

  // Kill the worker if the page navigates away mid-export.
  useEffect(() => teardown, [teardown]);

  const cancel = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    // Ask it to stop at the next frame boundary so it can release its
    // decoders itself; it acks with "cancelled" once that's done.
    worker.postMessage({ type: "cancel" } satisfies RenderWorkerRequest);

    if (cancelTimerRef.current === null) {
      cancelTimerRef.current = setTimeout(reset, CANCEL_GRACE_MS);
    }
  }, [reset]);

  const start = useCallback(
    ({
      layout,
      aspect,
      background,
      durationSeconds,
      fileName = "grid-export",
    }: StartOptions) => {
      if (workerRef.current) return;

      setError(null);
      setProgress(0);
      setStatus("preparing");

      const worker = createRenderWorker();
      workerRef.current = worker;

      worker.addEventListener("message", (event: MessageEvent<RenderWorkerResponse>) => {
        const message = event.data;

        switch (message.type) {
          case "progress":
            setStatus("rendering");
            setProgress(message.progress);
            return;
          case "done":
            downloadBlob(
              new Blob([message.buffer], { type: "video/mp4" }),
              `${fileName}.mp4`
            );
            reset();
            return;
          case "error":
            setError(message.message);
            reset();
            return;
          case "cancelled":
            reset();
            return;
          case "probed":
            return;
        }
      });

      worker.addEventListener("error", () => {
        setError("The export failed to start.");
        reset();
      });

      const { width, height } = exportCanvasSize(aspect);
      worker.postMessage({
        type: "render",
        ...buildCells(layout, aspect),
        width,
        height,
        durationSeconds,
        fps: EXPORT_FPS,
        background: BACKGROUNDS[background],
      } satisfies RenderWorkerRequest);
    },
    [reset]
  );

  return { status, error, progress, start, cancel };
}
