import {
  type Aspect,
  type Rect,
  EXPORT_DIMENSIONS,
  GRID_COLS,
  GRID_ROWS,
} from "./gridLayout";

/** Frames per second every export is rendered at. Constant by design: the
 * render loop derives each frame's timestamp from its index, which is what
 * makes the output constant-frame-rate. */
export const EXPORT_FPS = 30;

/**
 * How many canvas pixels the renderer draws per pixel of the nominal sizes in
 * EXPORT_DIMENSIONS.
 *
 * A cell only ever gets a fraction of the canvas — a 2x2 cell on a 12x6 grid
 * is a sixth of its width — so at the nominal 1080p-class sizes an individual
 * cell has a few hundred pixels to work with, and a source clip lands there
 * through a single bilinear step that undersamples it badly: fine detail
 * aliases, and the shimmer that produces costs the encoder bits on top. Every
 * cell gets twice the linear resolution here, and those extra samples are not
 * wasted even when the encoder scales the frame back down (see renderWorker),
 * because that reduction is a clean 2:1 rather than an arbitrary ratio.
 *
 * Only exportCanvasSize and cellPixelRect know about the scale; every other
 * measurement here stays in nominal units and is multiplied through by those
 * two, so the layout can't drift out of step with the canvas it lands on.
 */
export const EXPORT_SCALE = 2;

/**
 * The gap between neighbouring cells, in nominal (pre-EXPORT_SCALE) pixels,
 * and the single source of truth for cell spacing.
 *
 * The export insets every cell by half of this on each side, so two adjacent
 * cells end up EXPORT_GAP apart and every cell sits EXPORT_GAP / 2 in from the
 * canvas edge. GridStack's preview margin is derived from the same number (see
 * previewMargin) rather than the other way round, so the preview can't drift
 * away from what the export actually renders.
 */
export const EXPORT_GAP = 8;

/**
 * The pixel size of the export canvas for an aspect — what the renderer
 * actually draws into, as opposed to the nominal EXPORT_DIMENSIONS the layout
 * is expressed in.
 *
 * Usually the encoded file's size too, though not necessarily: an encoder that
 * won't take frames this large makes the renderer scale them down on the way
 * in (see resolveEncodeTarget), which costs resolution but keeps the benefit
 * of having drawn at this size.
 */
export function exportCanvasSize(aspect: Aspect): { width: number; height: number } {
  const { width, height } = EXPORT_DIMENSIONS[aspect];
  return { width: width * EXPORT_SCALE, height: height * EXPORT_SCALE };
}

/** The ground an export is laid on. */
export type Background = "black" | "white";

/**
 * What each ground actually paints, behind the cells and in the gaps between
 * them.
 *
 * The preview reads the same two colours through the `--gt-bg` custom property
 * in grid-tool.css, so an empty cell and a gap look on screen exactly as they
 * will in the file. (The preview does tint an *empty* cell a shade off the
 * ground, so a slot you can still fill is visible; nothing is drawn there in
 * the export, which is the honest answer for a cell with no media in it.)
 */
export const BACKGROUNDS: Record<Background, string> = {
  black: "#000000",
  white: "#ffffff",
};

export const DEFAULT_BACKGROUND: Background = "white";

/** A cell's placement on the export canvas, in pixels. */
export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The region of a source image/frame to sample from. */
export interface CropRect {
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

/**
 * Rounds to the nearest even number.
 *
 * Cell edges are snapped this way so they land on 4:2:0 chroma block
 * boundaries — H.264 stores colour at half resolution, so an edge on an odd
 * pixel splits a chroma sample between a cell and the gap behind it and the
 * boundary smears. Snapping the *edges* (rather than rounding each width
 * independently) also keeps neighbours tiling consistently: the boundary
 * between two cells is derived from the same underlying coordinate on both
 * sides, so it can't round two different ways and leave a seam.
 *
 * Exported because column layouts snap their own edges the same way.
 */
export function evenRound(value: number) {
  return 2 * Math.round(value / 2);
}

/**
 * Converts a cell's grid units into its pixel rect on the export canvas.
 *
 * Geometry comes from the grid model, never from measuring the DOM, so an
 * export is identical no matter what size the preview happens to be on screen.
 */
export function cellPixelRect(cell: Rect, aspect: Aspect): PixelRect {
  const { width: canvasWidth, height: canvasHeight } = exportCanvasSize(aspect);
  const colPx = canvasWidth / GRID_COLS;
  const rowPx = canvasHeight / GRID_ROWS;
  // The gap scales with everything else, so it stays the same fraction of the
  // frame whatever EXPORT_SCALE is.
  const inset = (EXPORT_GAP * EXPORT_SCALE) / 2;

  const left = evenRound(cell.x * colPx + inset);
  const top = evenRound(cell.y * rowPx + inset);
  const right = evenRound((cell.x + cell.w) * colPx - inset);
  const bottom = evenRound((cell.y + cell.h) * rowPx - inset);

  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

/**
 * The source rect that fills `destWidth` × `destHeight` without distorting the
 * image, cropping the overflowing axis evenly from both sides — the geometry
 * behind CSS `object-fit: cover`, which is what the preview draws with.
 *
 * Returns null when there's nothing sensible to draw (a zero-sized source or
 * destination), so callers can skip the draw entirely.
 */
export function coverCrop(
  sourceWidth: number,
  sourceHeight: number,
  destWidth: number,
  destHeight: number
): CropRect | null {
  if (sourceWidth <= 0 || sourceHeight <= 0 || destWidth <= 0 || destHeight <= 0) {
    return null;
  }

  const sourceRatio = sourceWidth / sourceHeight;
  const destRatio = destWidth / destHeight;

  if (sourceRatio > destRatio) {
    // Source is wider than the slot: keep full height, trim the sides.
    const sWidth = sourceHeight * destRatio;
    return { sx: (sourceWidth - sWidth) / 2, sy: 0, sWidth, sHeight: sourceHeight };
  }

  // Source is taller than (or as wide as) the slot: keep full width, trim top
  // and bottom.
  const sHeight = sourceWidth / destRatio;
  return { sx: 0, sy: (sourceHeight - sHeight) / 2, sWidth: sourceWidth, sHeight };
}

/**
 * GridStack's per-item margin, in CSS pixels, that reproduces EXPORT_GAP at
 * whatever size the preview is currently rendered.
 *
 * GridStack applies `margin` as an inset on all four sides of each item, so
 * the space between two neighbours is twice the margin — hence the half. Feed
 * this to `grid.margin()` whenever the preview is resized.
 *
 * EXPORT_SCALE doesn't enter into it: it multiplies the canvas and the gap
 * alike, so the margin's share of the frame is the same at any scale.
 */
export function previewMargin(previewWidth: number, aspect: Aspect): number {
  const scale = previewWidth / EXPORT_DIMENSIONS[aspect].width;
  return (EXPORT_GAP / 2) * scale;
}
