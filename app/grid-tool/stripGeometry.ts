import {
  EXPORT_GAP,
  EXPORT_SCALE,
  evenRound,
  exportCanvasSize,
  type PixelRect,
} from "./exportGeometry";
import type { Aspect } from "./gridLayout";

/**
 * Geometry for the scrolling layouts, the counterpart to exportGeometry's
 * `cellPixelRect`.
 *
 * A *strip* is a band of items longer than the frame, sliding past it and
 * wrapping back on itself: a column running down the canvas, or a row running
 * across it. The two are the same layout turned ninety degrees, so this is one
 * computation done in *along* (the way the strip runs, and scrolls) and
 * *across* (the way it is thick), projected onto x/y at the very end.
 *
 * Everything here is measured in export canvas pixels (so already through
 * EXPORT_SCALE), and the preview renders the very same numbers as percentages
 * — which is what keeps what you see and what you export in step, the way the
 * grid does it.
 */

/** Which way a strip runs, and so which way its contents scroll. */
export type StripAxis = "vertical" | "horizontal";

/** How many side-by-side bands a strip layout can have. */
export type BandCount = 1 | 2;

export const BAND_COUNTS: BandCount[] = [1, 2];

/**
 * Scroll speed, in nominal (pre-EXPORT_SCALE) canvas pixels per second.
 *
 * Nominal rather than canvas pixels so the number means the same thing at any
 * EXPORT_SCALE: 160 is a little under one 16:9 frame height every 7 seconds.
 */
export const DEFAULT_SCROLL_SPEED = 160;
export const MIN_SCROLL_SPEED = 10;
export const MAX_SCROLL_SPEED = 2000;

/**
 * The shape assumed for an item whose source hasn't been measured — an empty
 * slot, or a file whose dimensions couldn't be read. It still takes up its
 * place in the strip, in the preview and the export alike.
 */
export const FALLBACK_RATIO = 16 / 9;

/**
 * The spacing of a strip layout, in nominal (pre-EXPORT_SCALE) canvas pixels
 * so the numbers mean the same thing at any scale — the same units
 * EXPORT_GAP is quoted in.
 *
 * The grid derives all three from EXPORT_GAP alone; the scrolling modes hand
 * them to the user separately, because a column of clips wants different air
 * around it than a mosaic does.
 */
export interface StripSpacing {
  /** Inset from the two frame edges the strip runs between — a column's left
   * and right, a row's top and bottom. There is no inset along the axis: that
   * end of the strip never stops arriving. */
  padding: number;
  /** Between consecutive items along a strip. */
  cellGap: number;
  /** Between neighbouring bands: two columns, or two rows. */
  bandGap: number;
}

export const MIN_STRIP_SPACING = 0;
export const MAX_STRIP_SPACING = 120;

/**
 * What the scrolling modes start at: exactly the grid's own spacing, so
 * switching modes without touching a slider is a change of layout and nothing
 * else.
 */
export const DEFAULT_STRIP_SPACING: StripSpacing = {
  padding: EXPORT_GAP / 2,
  cellGap: EXPORT_GAP,
  bandGap: EXPORT_GAP,
};

export function clampSpacing(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_STRIP_SPACING, Math.max(MIN_STRIP_SPACING, Math.round(value)));
}

/**
 * A ceiling on how many times `repeat` will replicate a band's media.
 *
 * Only a pathologically short band can reach it (a single panorama down a tall
 * column, say), and the strip is padded out to the frame afterwards either
 * way, so hitting it costs a stretch of background rather than a broken loop.
 */
const MAX_PASSES = 12;

/** One appearance of an item in a strip. */
export interface StripItem {
  /** Index into the ratios array the strip was built from. With `repeat` on
   * the same index appears once per pass, at a different place each time. */
  index: number;
  /**
   * Where it sits. The across-axis measurements are canvas coordinates, but
   * the along-axis one is strip-local — measured from the start of the strip,
   * which moves — so `y` (vertical) or `x` (horizontal) is not a canvas
   * coordinate until the frame's scroll offset is added.
   */
  rect: PixelRect;
}

export interface Strip {
  /** Where the band sits across the axis it runs on: a column's left edge, a
   * row's top edge. */
  across: number;
  /** How thick the band is: a column's width, a row's height. */
  thickness: number;
  /**
   * The distance the scroll wraps at, measured along the axis.
   *
   * Never less than the canvas measures along that axis, which is the
   * invariant the renderer leans on: it means one wrapped copy of an item is
   * always enough to cover the frame, whatever the offset (see
   * cellDestinations in renderWorker).
   */
  length: number;
  items: StripItem[];
}

/**
 * Lays out `ratios.length` items (width / height each) into `bands` scrolling
 * strips running along `axis`.
 *
 * Items are dealt round-robin, so the order they were added in reads across
 * the bands and then along them. Each one spans its band completely, with the
 * other axis following from its own shape — no cropping, unlike the grid.
 *
 * `repeat` replicates a band's media until the strip is at least a frame long,
 * so a handful of clips still make a band that's full at every moment of the
 * loop. Without it a short band scrolls its items past once per lap and shows
 * background for the rest.
 *
 * `spacing` is the air around and between the items, in nominal pixels; it
 * defaults to the grid's own spacing, which is what every measurement here
 * used to be fixed at.
 */
export function stripLayout(
  ratios: number[],
  aspect: Aspect,
  axis: StripAxis,
  bands: BandCount,
  repeat: boolean,
  spacing: StripSpacing = DEFAULT_STRIP_SPACING
): Strip[] {
  const canvas = exportCanvasSize(aspect);
  const vertical = axis === "vertical";
  // A vertical strip runs down the frame with its bands side by side across
  // the width; a horizontal one is exactly that on its side.
  const acrossExtent = vertical ? canvas.width : canvas.height;
  const alongExtent = vertical ? canvas.height : canvas.width;

  const padding = clampSpacing(spacing.padding) * EXPORT_SCALE;
  const cellGap = clampSpacing(spacing.cellGap) * EXPORT_SCALE;
  const bandGap = clampSpacing(spacing.bandGap) * EXPORT_SCALE;
  // Whatever's left of the frame once the edges and the band gaps have taken
  // their share, split evenly. Two pixels is the floor: a band thin enough to
  // round to nothing would divide by zero on the way to an item's length.
  const thickness = Math.max(
    2,
    evenRound((acrossExtent - 2 * padding - bandGap * (bands - 1)) / bands)
  );

  return Array.from({ length: bands }, (_, band): Strip => {
    const across = evenRound(padding + band * (thickness + bandGap));

    const sizes: { index: number; length: number }[] = [];
    for (let index = band; index < ratios.length; index += bands) {
      const ratio = ratios[index] > 0 ? ratios[index] : FALLBACK_RATIO;
      // An item fills its band's thickness, so its extent along the strip is
      // whatever its own shape makes of that: a column's items are as tall as
      // their width divides, a row's as wide as their height multiplies.
      const length = vertical ? thickness / ratio : thickness * ratio;
      sizes.push({ index, length: Math.max(2, evenRound(length)) });
    }

    if (!sizes.length) return { across, thickness, length: alongExtent, items: [] };

    // One pass through the band's media, each item followed by a gap — the
    // trailing one included, so the wrap doesn't butt the last item against
    // the first.
    const passLength = sizes.reduce((total, item) => total + item.length + cellGap, 0);
    const passes = repeat
      ? Math.min(MAX_PASSES, Math.max(1, Math.ceil(alongExtent / passLength)))
      : 1;

    const items: StripItem[] = [];
    let along = 0;
    for (let pass = 0; pass < passes; pass++) {
      for (const { index, length } of sizes) {
        items.push({
          index,
          rect: vertical
            ? { x: across, y: along, width: thickness, height: length }
            : { x: along, y: across, width: length, height: thickness },
        });
        along += length + cellGap;
      }
    }

    // Padding a short strip out to the frame is what makes "repeat off" a
    // stretch of background rather than a special case: the geometry says the
    // same thing either way, and the renderer's one-wrapped-copy assumption
    // keeps holding.
    return { across, thickness, length: Math.max(along, alongExtent), items };
  });
}

/** How long one lap of a strip takes, in seconds. */
export function stripLoopSeconds(strip: Strip, nominalSpeed: number): number {
  const speed = Math.abs(nominalSpeed) * EXPORT_SCALE;
  return speed > 0 ? strip.length / speed : 0;
}
