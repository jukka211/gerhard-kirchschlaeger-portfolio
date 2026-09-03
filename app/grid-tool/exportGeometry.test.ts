import { describe, expect, it } from "vitest";
import {
  type Background,
  BACKGROUNDS,
  DEFAULT_BACKGROUND,
  EXPORT_GAP,
  EXPORT_SCALE,
  cellPixelRect,
  coverCrop,
  exportCanvasSize,
  previewMargin,
} from "./exportGeometry";
import {
  type Aspect,
  type Rect,
  EXPORT_DIMENSIONS,
  GRID_COLS,
  GRID_ROWS,
} from "./gridLayout";

const ASPECTS: Aspect[] = ["16:9", "9:16", "4:5", "5:4"];

/** Aspects whose columns and rows are an even number of canvas pixels wide.
 * 5:4 is the odd one out (2700 / 12 = 225), so its column boundaries fall on
 * odd pixels and its gaps can't all land exactly on the gap — see the
 * tolerance in the gap tests. */
const INTEGRAL_ASPECTS: Aspect[] = ["16:9", "9:16", "4:5"];

/** EXPORT_GAP is expressed in nominal units; cellPixelRect works in canvas
 * pixels, where it (and its inset) are scaled along with everything else. */
const gap = EXPORT_GAP * EXPORT_SCALE;
const inset = gap / 2;

function fullGrid(): Rect {
  return { x: 0, y: 0, w: GRID_COLS, h: GRID_ROWS };
}

describe("cellPixelRect", () => {
  it.each(ASPECTS)("insets a full-grid cell by half the gap on %s", (aspect) => {
    const { width, height } = exportCanvasSize(aspect);
    const rect = cellPixelRect(fullGrid(), aspect);

    expect(rect).toEqual({
      x: inset,
      y: inset,
      width: width - gap,
      height: height - gap,
    });
  });

  it.each(ASPECTS)("produces only even coordinates and sizes on %s", (aspect) => {
    // Every distinct cell shape the grid can hold, at every position it fits.
    for (let w = 1; w <= GRID_COLS; w++) {
      for (let h = 1; h <= GRID_ROWS; h++) {
        for (let x = 0; x <= GRID_COLS - w; x++) {
          for (let y = 0; y <= GRID_ROWS - h; y++) {
            const rect = cellPixelRect({ x, y, w, h }, aspect);
            expect(rect.x % 2, `x of ${x},${y},${w},${h}`).toBe(0);
            expect(rect.y % 2, `y of ${x},${y},${w},${h}`).toBe(0);
            expect(rect.width % 2, `width of ${x},${y},${w},${h}`).toBe(0);
            expect(rect.height % 2, `height of ${x},${y},${w},${h}`).toBe(0);
          }
        }
      }
    }
  });

  it.each(ASPECTS)("keeps every cell inside the canvas on %s", (aspect) => {
    const { width, height } = exportCanvasSize(aspect);
    for (let w = 1; w <= GRID_COLS; w++) {
      for (let h = 1; h <= GRID_ROWS; h++) {
        for (let x = 0; x <= GRID_COLS - w; x++) {
          for (let y = 0; y <= GRID_ROWS - h; y++) {
            const rect = cellPixelRect({ x, y, w, h }, aspect);
            expect(rect.x).toBeGreaterThanOrEqual(0);
            expect(rect.y).toBeGreaterThanOrEqual(0);
            expect(rect.x + rect.width).toBeLessThanOrEqual(width);
            expect(rect.y + rect.height).toBeLessThanOrEqual(height);
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it.each(ASPECTS)("puts edge cells half a gap from the canvas edge on %s", (aspect) => {
    const { width, height } = exportCanvasSize(aspect);

    const topLeft = cellPixelRect({ x: 0, y: 0, w: 2, h: 2 }, aspect);
    expect(topLeft.x).toBe(inset);
    expect(topLeft.y).toBe(inset);

    const bottomRight = cellPixelRect(
      { x: GRID_COLS - 2, y: GRID_ROWS - 2, w: 2, h: 2 },
      aspect
    );
    expect(bottomRight.x + bottomRight.width).toBe(width - inset);
    expect(bottomRight.y + bottomRight.height).toBe(height - inset);
  });

  it.each(INTEGRAL_ASPECTS)("leaves exactly one gap between neighbours on %s", (aspect) => {
    const left = cellPixelRect({ x: 0, y: 0, w: 3, h: 2 }, aspect);
    const right = cellPixelRect({ x: 3, y: 0, w: 3, h: 2 }, aspect);
    expect(right.x - (left.x + left.width)).toBe(gap);

    const top = cellPixelRect({ x: 0, y: 0, w: 3, h: 2 }, aspect);
    const below = cellPixelRect({ x: 0, y: 2, w: 3, h: 2 }, aspect);
    expect(below.y - (top.y + top.height)).toBe(gap);
  });

  it("stays within a pixel of the gap on 5:4, whose columns are odd", () => {
    // 2700 / 12 = 225, so column boundaries fall on odd pixels and the
    // even-snapping can pull a gap 2px either way. Rows are even (360).
    for (let x = 1; x < GRID_COLS; x++) {
      const left = cellPixelRect({ x: x - 1, y: 0, w: 1, h: 1 }, "5:4");
      const right = cellPixelRect({ x, y: 0, w: 1, h: 1 }, "5:4");
      const neighbourGap = right.x - (left.x + left.width);
      expect(Math.abs(neighbourGap - gap)).toBeLessThanOrEqual(2);
    }

    for (let y = 1; y < GRID_ROWS; y++) {
      const above = cellPixelRect({ x: 0, y: y - 1, w: 1, h: 1 }, "5:4");
      const below = cellPixelRect({ x: 0, y, w: 1, h: 1 }, "5:4");
      expect(below.y - (above.y + above.height)).toBe(gap);
    }
  });

  it.each(ASPECTS)("never overlaps neighbouring cells on %s", (aspect) => {
    // Tile the whole grid with 2x2 cells and check no two rects intersect.
    const rects = [];
    for (let x = 0; x < GRID_COLS; x += 2) {
      for (let y = 0; y < GRID_ROWS; y += 2) {
        rects.push(cellPixelRect({ x, y, w: 2, h: 2 }, aspect));
      }
    }

    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlaps =
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y;
        expect(overlaps).toBe(false);
      }
    }
  });
});

describe("coverCrop", () => {
  it("uses the whole source when the ratios match", () => {
    expect(coverCrop(1920, 1080, 960, 540)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 1920,
      sHeight: 1080,
    });
  });

  it("trims the sides evenly when the source is wider than the slot", () => {
    // 1000x500 (2:1) into a 1:1 slot keeps the full height and a 500px band.
    expect(coverCrop(1000, 500, 400, 400)).toEqual({
      sx: 250,
      sy: 0,
      sWidth: 500,
      sHeight: 500,
    });
  });

  it("trims top and bottom evenly when the source is taller than the slot", () => {
    // 500x1000 (1:2) into a 1:1 slot keeps the full width and a 500px band.
    expect(coverCrop(500, 1000, 400, 400)).toEqual({
      sx: 0,
      sy: 250,
      sWidth: 500,
      sHeight: 500,
    });
  });

  it("always covers the slot without distorting the source", () => {
    const cases = [
      [1920, 1080, 400, 900],
      [640, 480, 1000, 200],
      [1080, 1920, 500, 500],
      [3000, 200, 800, 600],
    ] as const;

    for (const [sw, sh, dw, dh] of cases) {
      const crop = coverCrop(sw, sh, dw, dh)!;
      expect(crop).not.toBeNull();
      // The crop is inside the source...
      expect(crop.sx).toBeGreaterThanOrEqual(0);
      expect(crop.sy).toBeGreaterThanOrEqual(0);
      expect(crop.sx + crop.sWidth).toBeLessThanOrEqual(sw + 1e-9);
      expect(crop.sy + crop.sHeight).toBeLessThanOrEqual(sh + 1e-9);
      // ...and matches the destination's aspect ratio, so scaling it to the
      // slot neither stretches nor letterboxes.
      expect(crop.sWidth / crop.sHeight).toBeCloseTo(dw / dh, 6);
    }
  });

  it("returns null when there is nothing to draw", () => {
    expect(coverCrop(0, 100, 100, 100)).toBeNull();
    expect(coverCrop(100, 0, 100, 100)).toBeNull();
    expect(coverCrop(100, 100, 0, 100)).toBeNull();
    expect(coverCrop(100, 100, 100, 0)).toBeNull();
  });
});

describe("BACKGROUNDS", () => {
  const grounds: Background[] = ["black", "white"];

  it("paints every ground the type allows", () => {
    // A ground with no colour would fill the canvas with `undefined`, which
    // Canvas2D silently ignores — leaving whatever the last frame drew.
    expect(Object.keys(BACKGROUNDS).sort()).toEqual([...grounds].sort());
    for (const ground of grounds) {
      expect(BACKGROUNDS[ground]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("makes the two grounds actually different", () => {
    expect(BACKGROUNDS.black).not.toBe(BACKGROUNDS.white);
  });

  it("defaults to one of them", () => {
    expect(BACKGROUNDS[DEFAULT_BACKGROUND]).toBeDefined();
  });
});

describe("exportCanvasSize", () => {
  it.each(ASPECTS)("is EXPORT_SCALE times the nominal size on %s", (aspect) => {
    const nominal = EXPORT_DIMENSIONS[aspect];
    expect(exportCanvasSize(aspect)).toEqual({
      width: nominal.width * EXPORT_SCALE,
      height: nominal.height * EXPORT_SCALE,
    });
  });

  it.each(ASPECTS)("stays even on both axes on %s, as H.264 needs", (aspect) => {
    const { width, height } = exportCanvasSize(aspect);
    expect(width % 2).toBe(0);
    expect(height % 2).toBe(0);
    // The renderer falls back to the nominal size when the encoder won't take
    // the full canvas, so that has to be encodable too.
    expect((width / EXPORT_SCALE) % 2).toBe(0);
    expect((height / EXPORT_SCALE) % 2).toBe(0);
  });
});

describe("previewMargin", () => {
  it.each(ASPECTS)("is half the gap when the preview is at nominal size on %s", (aspect) => {
    const { width } = EXPORT_DIMENSIONS[aspect];
    expect(previewMargin(width, aspect)).toBe(EXPORT_GAP / 2);
  });

  it.each(ASPECTS)("matches the export's own inset at canvas size on %s", (aspect) => {
    // EXPORT_SCALE multiplies the canvas and the gap alike, so a preview
    // rendered at the real canvas width wants exactly the inset cellPixelRect
    // uses — that equality is what keeps preview and export in step.
    const { width } = exportCanvasSize(aspect);
    expect(previewMargin(width, aspect)).toBe(inset);
  });

  it("scales with the preview", () => {
    const { width } = EXPORT_DIMENSIONS["16:9"];
    expect(previewMargin(width / 2, "16:9")).toBe(EXPORT_GAP / 4);
    expect(previewMargin(width * 2, "16:9")).toBe(EXPORT_GAP);
  });

  it("doubles to the full gap between two neighbouring preview items", () => {
    // GridStack insets each item by `margin` on all four sides, so the space
    // between neighbours is twice it. At export scale that must be EXPORT_GAP.
    const { width } = EXPORT_DIMENSIONS["16:9"];
    expect(previewMargin(width, "16:9") * 2).toBe(EXPORT_GAP);
  });
});
