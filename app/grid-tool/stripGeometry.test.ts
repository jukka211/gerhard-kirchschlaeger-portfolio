import { describe, expect, it } from "vitest";
import {
  type BandCount,
  type Strip,
  type StripAxis,
  type StripSpacing,
  BAND_COUNTS,
  DEFAULT_SCROLL_SPEED,
  DEFAULT_STRIP_SPACING,
  FALLBACK_RATIO,
  MAX_STRIP_SPACING,
  stripLayout,
  stripLoopSeconds,
} from "./stripGeometry";
import { EXPORT_GAP, EXPORT_SCALE, exportCanvasSize } from "./exportGeometry";
import type { Aspect } from "./gridLayout";

const ASPECTS: Aspect[] = ["16:9", "9:16", "4:5", "5:4"];
const AXES: StripAxis[] = ["vertical", "horizontal"];

const gap = EXPORT_GAP * EXPORT_SCALE;

/** A spread of shapes: landscape, square, portrait, panorama, and a couple in
 * between. */
const RATIOS = [16 / 9, 1, 9 / 16, 4 / 3, 3, 2 / 3];

function each<T>(values: readonly T[], body: (value: T) => void) {
  for (const value of values) body(value);
}

/**
 * A strip's measurements resolved onto the axis it runs on, so a test can say
 * "along" and "across" once instead of branching on x/y everywhere.
 */
function resolve(axis: StripAxis, aspect: Aspect) {
  const canvas = exportCanvasSize(aspect);
  const vertical = axis === "vertical";

  return {
    acrossExtent: vertical ? canvas.width : canvas.height,
    alongExtent: vertical ? canvas.height : canvas.width,
    /** Where an item starts along the strip, and how far it runs. */
    along: (rect: { x: number; y: number }) => (vertical ? rect.y : rect.x),
    span: (rect: { width: number; height: number }) =>
      vertical ? rect.height : rect.width,
    /** The item's own extent across the band, which should be the thickness. */
    thickness: (rect: { width: number; height: number }) =>
      vertical ? rect.width : rect.height,
    across: (rect: { x: number; y: number }) => (vertical ? rect.x : rect.y),
  };
}

/** Every axis/aspect pair, as `it.each` rows. */
const CASES = AXES.flatMap((axis) => ASPECTS.map((aspect) => [axis, aspect] as const));

describe("stripLayout", () => {
  it.each(CASES)("returns one strip per band (%s, %s)", (axis, aspect) => {
    each(BAND_COUNTS, (bands) => {
      expect(stripLayout(RATIOS, aspect, axis, bands, true)).toHaveLength(bands);
    });
  });

  it.each(CASES)("fills the frame across with bands and gaps (%s, %s)", (axis, aspect) => {
    const { acrossExtent } = resolve(axis, aspect);

    each(BAND_COUNTS, (bands) => {
      const strips = stripLayout(RATIOS, aspect, axis, bands, true);

      // Half a gap in from each edge, a full gap between neighbours — the same
      // spacing the grid uses, so every mode looks like one tool.
      expect(strips[0].across).toBe(gap / 2);
      const last = strips[strips.length - 1];
      expect(
        Math.abs(acrossExtent - gap / 2 - (last.across + last.thickness))
      ).toBeLessThanOrEqual(2);

      for (let i = 1; i < strips.length; i++) {
        expect(strips[i].across - (strips[i - 1].across + strips[i - 1].thickness)).toBe(
          gap
        );
      }
    });
  });

  it.each(CASES)("gives every item its band's full thickness (%s, %s)", (axis, aspect) => {
    const at = resolve(axis, aspect);

    each(BAND_COUNTS, (bands) => {
      for (const strip of stripLayout(RATIOS, aspect, axis, bands, true)) {
        for (const { rect } of strip.items) {
          expect(at.across(rect)).toBe(strip.across);
          expect(at.thickness(rect)).toBe(strip.thickness);
        }
      }
    });
  });

  it.each(CASES)("sizes items from their own shape, uncropped (%s, %s)", (axis, aspect) => {
    // One band, so every ratio lands in the same strip in order.
    const [strip] = stripLayout(RATIOS, aspect, axis, 1, false);

    strip.items.forEach(({ index, rect }) => {
      // Even-snapping can move an edge by a pixel; anything more would mean
      // the item is being distorted rather than measured.
      expect(Math.abs(rect.width / rect.height - RATIOS[index])).toBeLessThan(
        RATIOS[index] * 0.01
      );
    });
  });

  it.each(CASES)("stacks items in order with one gap between (%s, %s)", (axis, aspect) => {
    const at = resolve(axis, aspect);

    each(BAND_COUNTS, (bands) => {
      for (const strip of stripLayout(RATIOS, aspect, axis, bands, true)) {
        expect(at.along(strip.items[0].rect)).toBe(0);

        for (let i = 1; i < strip.items.length; i++) {
          const previous = strip.items[i - 1].rect;
          expect(at.along(strip.items[i].rect) - (at.along(previous) + at.span(previous)))
            .toBe(gap);
        }
      }
    });
  });

  it.each(CASES)("deals items round-robin across bands (%s, %s)", (axis, aspect) => {
    const strips = stripLayout(RATIOS, aspect, axis, 2, false);
    expect(strips[0].items.map((item) => item.index)).toEqual([0, 2, 4]);
    expect(strips[1].items.map((item) => item.index)).toEqual([1, 3, 5]);
  });

  // The renderer draws a scrolling cell twice — where it sits, and one strip
  // back — and that only covers the frame if a strip is at least a frame long.
  it.each(CASES)("never returns a strip shorter than the frame (%s, %s)", (axis, aspect) => {
    const { alongExtent } = resolve(axis, aspect);

    each(BAND_COUNTS, (bands) => {
      each([true, false], (repeat) => {
        // Including the awkward cases: nothing at all, and single items at
        // either extreme of shape.
        each([[], [3], [1 / 3], [FALLBACK_RATIO], RATIOS], (ratios) => {
          for (const strip of stripLayout(ratios, aspect, axis, bands, repeat)) {
            expect(strip.length).toBeGreaterThanOrEqual(alongExtent);
          }
        });
      });
    });
  });

  it.each(CASES)("leaves the last item a gap short of the wrap (%s, %s)", (axis, aspect) => {
    const at = resolve(axis, aspect);
    // Media long enough along the axis that the strip is content rather than
    // padding, so the wrap lands on the seam we actually laid out. A column
    // wants portraits; a row wants panoramas.
    const long = Array.from({ length: 4 }, () => (axis === "vertical" ? 9 / 16 : 3));
    const [strip] = stripLayout(long, aspect, axis, 1, false);
    const last = strip.items[strip.items.length - 1].rect;

    expect(strip.length).toBe(at.along(last) + at.span(last) + gap);
  });

  describe("repeat", () => {
    /** Short along the axis in question: a panorama barely fills a column, a
     * portrait barely fills a row. */
    const short = (axis: StripAxis) => [axis === "vertical" ? 3 : 1 / 3];

    it.each(CASES)("replicates short bands until they fill the frame (%s, %s)", (axis, aspect) => {
      const ratios = short(axis);
      const [repeated] = stripLayout(ratios, aspect, axis, 1, true);
      const [once] = stripLayout(ratios, aspect, axis, 1, false);
      const at = resolve(axis, aspect);

      expect(repeated.items.length).toBeGreaterThan(once.items.length);
      // Every appearance is the same cell, at a different place along the strip.
      expect(new Set(repeated.items.map((item) => item.index))).toEqual(new Set([0]));
      expect(new Set(repeated.items.map((item) => at.along(item.rect))).size).toBe(
        repeated.items.length
      );
    });

    it.each(CASES)("leaves a band that already fills the frame alone (%s, %s)", (axis, aspect) => {
      const long = Array.from({ length: 6 }, () => (axis === "vertical" ? 9 / 16 : 3));
      expect(stripLayout(long, aspect, axis, 1, true)[0].items).toHaveLength(6);
    });

    it.each(CASES)("pads rather than replicates when off (%s, %s)", (axis, aspect) => {
      const [strip] = stripLayout(short(axis), aspect, axis, 1, false);
      const { alongExtent } = resolve(axis, aspect);

      expect(strip.items).toHaveLength(1);
      // The padding is what makes the shortfall show as background instead of
      // breaking the renderer's one-wrapped-copy assumption.
      expect(strip.length).toBe(alongExtent);
    });
  });

  it.each(CASES)("treats an unmeasured item as the fallback shape (%s, %s)", (axis, aspect) => {
    const at = resolve(axis, aspect);
    const [measured] = stripLayout([FALLBACK_RATIO], aspect, axis, 1, false);

    each([0, -1, Number.NaN], (bad) => {
      const [fallback] = stripLayout([bad], aspect, axis, 1, false);
      expect(at.span(fallback.items[0].rect)).toBe(at.span(measured.items[0].rect));
    });
  });

  it.each(CASES)("produces only even edges (%s, %s), as H.264 needs", (axis, aspect) => {
    each(BAND_COUNTS, (bands) => {
      for (const strip of stripLayout(RATIOS, aspect, axis, bands, true)) {
        expect(strip.across % 2).toBe(0);
        expect(strip.thickness % 2).toBe(0);
        for (const { rect } of strip.items) {
          expect(rect.x % 2).toBe(0);
          expect(rect.y % 2).toBe(0);
          expect(rect.width % 2).toBe(0);
          expect(rect.height % 2).toBe(0);
        }
      }
    });
  });

  it.each(AXES)("gives a band with no items of its own a usable box (%s)", (axis) => {
    // One item, two bands: the second is empty but still has to report where
    // it would be, or the preview can't place it.
    const [, empty] = stripLayout([16 / 9], "16:9", axis, 2, true);
    expect(empty.items).toHaveLength(0);
    expect(empty.thickness).toBeGreaterThan(0);
    expect(empty.across).toBeGreaterThan(0);
  });

  // Aspects that are each other turned on their side, so a vertical layout on
  // one measures against exactly the extents a horizontal layout does on the
  // other.
  const TRANSPOSED: [Aspect, Aspect][] = [
    ["16:9", "9:16"],
    ["4:5", "5:4"],
  ];

  it.each(TRANSPOSED)("is the same layout at right angles (%s / %s)", (tall, wide) => {
    // A row of items is a column of their reciprocals: an item spans its band
    // either way, and the extent it takes along the strip inverts with it.
    each(BAND_COUNTS, (bands) => {
      const column = stripLayout(RATIOS, tall, "vertical", bands, true);
      const row = stripLayout(
        RATIOS.map((ratio) => 1 / ratio),
        wide,
        "horizontal",
        bands,
        true
      );

      expect(row).toHaveLength(column.length);
      row.forEach((strip, index) => {
        expect(strip.across).toBe(column[index].across);
        expect(strip.thickness).toBe(column[index].thickness);
        expect(strip.length).toBe(column[index].length);
        expect(strip.items.map((item) => item.index)).toEqual(
          column[index].items.map((item) => item.index)
        );
      });
    });
  });
});

describe("stripLoopSeconds", () => {
  const strip: Strip = { across: 0, thickness: 100, length: 2160, items: [] };

  it("is the strip length over the speed, in nominal units", () => {
    // The speed is quoted in nominal pixels and the strip is in canvas pixels,
    // so EXPORT_SCALE cancels and the answer doesn't move with it.
    expect(stripLoopSeconds(strip, 108)).toBe(2160 / EXPORT_SCALE / 108);
  });

  it("ignores the direction the speed encodes", () => {
    expect(stripLoopSeconds(strip, -DEFAULT_SCROLL_SPEED)).toBe(
      stripLoopSeconds(strip, DEFAULT_SCROLL_SPEED)
    );
  });

  it("is zero when nothing is moving, rather than infinite", () => {
    expect(stripLoopSeconds(strip, 0)).toBe(0);
  });
});

describe("BandCount", () => {
  it("lists every count the type allows", () => {
    const counts: BandCount[] = [1, 2];
    expect(BAND_COUNTS).toEqual(counts);
  });
});

describe("stripLayout spacing", () => {
  /** DEFAULT_STRIP_SPACING with one measurement changed. */
  function spacing(overrides: Partial<StripSpacing>): StripSpacing {
    return { ...DEFAULT_STRIP_SPACING, ...overrides };
  }

  it("defaults to the grid's own spacing when none is given", () => {
    each(AXES, (axis) => {
      each(BAND_COUNTS, (bands) => {
        expect(stripLayout(RATIOS, "16:9", axis, bands, true)).toEqual(
          stripLayout(RATIOS, "16:9", axis, bands, true, DEFAULT_STRIP_SPACING)
        );
      });
    });
  });

  it.each(CASES)("insets the bands by the padding (%s, %s)", (axis, aspect) => {
    const { acrossExtent } = resolve(axis, aspect);

    each([0, 24, 60], (padding) => {
      const strips = stripLayout(RATIOS, aspect, axis, 2, true, spacing({ padding }));
      const inset = padding * EXPORT_SCALE;
      const last = strips[strips.length - 1];

      expect(strips[0].across).toBe(inset);
      expect(
        Math.abs(acrossExtent - inset - (last.across + last.thickness))
      ).toBeLessThanOrEqual(2);
    });
  });

  it.each(CASES)("separates neighbouring bands by the band gap (%s, %s)", (axis, aspect) => {
    each([0, 16, 48], (bandGap) => {
      const [first, second] = stripLayout(
        RATIOS,
        aspect,
        axis,
        2,
        true,
        spacing({ bandGap })
      );
      expect(second.across - (first.across + first.thickness)).toBe(
        bandGap * EXPORT_SCALE
      );
    });
  });

  it.each(CASES)("separates consecutive items by the cell gap (%s, %s)", (axis, aspect) => {
    const at = resolve(axis, aspect);

    each([0, 12, 40], (cellGap) => {
      const [strip] = stripLayout(RATIOS, aspect, axis, 1, false, spacing({ cellGap }));

      for (let i = 1; i < strip.items.length; i++) {
        const previous = strip.items[i - 1].rect;
        const current = strip.items[i].rect;
        expect(at.along(current) - (at.along(previous) + at.span(previous))).toBe(
          cellGap * EXPORT_SCALE
        );
      }
    });
  });

  it.each(CASES)("clamps spacing to the range the controls offer (%s, %s)", (axis, aspect) => {
    const floor = stripLayout(RATIOS, aspect, axis, 2, true, spacing({ padding: 0 }));
    const ceiling = stripLayout(
      RATIOS,
      aspect,
      axis,
      2,
      true,
      spacing({ padding: MAX_STRIP_SPACING })
    );

    each([-40, Number.NaN], (bad) => {
      expect(stripLayout(RATIOS, aspect, axis, 2, true, spacing({ padding: bad }))).toEqual(
        floor
      );
    });
    expect(
      stripLayout(RATIOS, aspect, axis, 2, true, spacing({ padding: 10_000 }))
    ).toEqual(ceiling);
  });

  it.each(CASES)("keeps a band usable however wide the padding gets (%s, %s)", (axis, aspect) => {
    // The widest padding the controls allow, on the narrowest frame, with the
    // bands split two ways — nothing here may collapse to a zero-sized band,
    // which would divide by zero on the way to an item's length.
    each(BAND_COUNTS, (bands) => {
      for (const strip of stripLayout(
        RATIOS,
        aspect,
        axis,
        bands,
        true,
        { padding: MAX_STRIP_SPACING, cellGap: MAX_STRIP_SPACING, bandGap: MAX_STRIP_SPACING }
      )) {
        expect(strip.thickness).toBeGreaterThanOrEqual(2);
        expect(strip.length).toBeGreaterThan(0);
        for (const { rect } of strip.items) {
          expect(at(axis, rect)).toBeGreaterThan(0);
        }
      }
    });
  });

  /** An item's extent along the strip, which is the measurement that can
   * collapse when the band it spans gets thin. */
  function at(axis: StripAxis, rect: { width: number; height: number }) {
    return axis === "vertical" ? rect.height : rect.width;
  }
});
