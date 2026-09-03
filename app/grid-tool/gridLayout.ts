export type Aspect = "16:9" | "9:16" | "4:5" | "5:4";
export type MediaType = "image" | "video";

export interface CellMedia {
  type: MediaType;
  url: string;
  name: string;
}

/** Pixel dimensions rendered to the offscreen export canvas for each aspect. */
export const EXPORT_DIMENSIONS: Record<Aspect, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "4:5": { width: 1080, height: 1350 },
  "5:4": { width: 1350, height: 1080 },
};

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Cell extends Rect {
  id: string;
  media: CellMedia | null;
}

// Resize/drag is always quantized to this logical grid, regardless of which
// aspect ratio the canvas is previewing (16:9 vs 9:16 only changes the pixel
// size of a column/row, never the column/row count).
export const GRID_COLS = 12;
export const GRID_ROWS = 6;

export const MIN_CELLS = 1;
export const MAX_CELLS = 16;

export const DEFAULT_CELL_W = 4;
export const DEFAULT_CELL_H = 3;

export function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function overlaps(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** First (row-major) free x/y for a w×h box that fits the canvas without overlapping existing cells. */
export function findFreeSpot(
  cells: Rect[],
  w: number,
  h: number
): { x: number; y: number } | null {
  if (w > GRID_COLS || h > GRID_ROWS) return null;
  for (let y = 0; y <= GRID_ROWS - h; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      const candidate = { x, y, w, h };
      if (!cells.some((c) => overlaps(candidate, c))) return { x, y };
    }
  }
  return null;
}

export function canFit(cells: Rect[]) {
  return findFreeSpot(cells, 1, 1) !== null;
}

/**
 * Trims exactly the cells overlapping `target` just enough to clear it,
 * shrinking each one's right edge (if it starts left of the target) or
 * bottom edge (if it starts above the target) — never moving a cell. If some
 * overlapping cell's own top-left corner sits inside the target, it can't be
 * cleared this way (that cell would have to move), so this returns null.
 */
function clearRegion<T extends Rect>(
  cells: T[],
  target: Rect
): { next: T[]; cost: number } | null {
  const next = cells.map((c) => ({ ...c }));
  let cost = 0;
  for (const c of next) {
    if (!overlaps(c, target)) continue;
    if (c.x < target.x) {
      const newW = target.x - c.x;
      cost += (c.w - newW) * c.h;
      c.w = newW;
    } else if (c.y < target.y) {
      const newH = target.y - c.y;
      cost += c.w * (c.h - newH);
      c.h = newH;
    } else {
      return null;
    }
  }
  return { next, cost };
}

/** Every position for a w×h window, cheapest clearable one wins (see clearRegion). */
function findClearableWindow<T extends Rect>(
  cells: T[],
  w: number,
  h: number
): { next: T[]; cost: number } | null {
  let best: { next: T[]; cost: number } | null = null;
  for (let y = 0; y <= GRID_ROWS - h; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      const attempt = clearRegion(cells, { x, y, w, h });
      if (attempt && (!best || attempt.cost < best.cost)) best = attempt;
    }
  }
  return best;
}

/**
 * Last-resort fallback for the rare case where not even a 1×1 window can be
 * opened by trimming alone. Shrinks the largest cell's longer side one unit
 * at a time until room opens or everything has bottomed out at 1×1.
 */
function shrinkLargestUntilFits<T extends Rect>(cells: T[], w: number, h: number): T[] {
  const next = cells.map((c) => ({ ...c }));
  while (!findFreeSpot(next, w, h)) {
    let target: T | null = null;
    for (const c of next) {
      if (c.w > 1 || c.h > 1) {
        if (!target || c.w * c.h > target.w * target.h) target = c;
      }
    }
    if (!target) break; // everything is already 1x1 — can't make more room
    if (target.w >= target.h) target.w -= 1;
    else target.h -= 1;
  }
  return next;
}

/**
 * Opens up a free spot for a new cell while disturbing the existing layout
 * as little as possible. Tries the requested w×h first: every possible
 * position for it, asking clearRegion what it would cost (in area removed)
 * to trim only the cells that actually overlap that position, and keeps the
 * cheapest one. Some layouts (e.g. a grid tiled exactly at multiples of
 * w×h) have no position where the requested size can be opened without
 * moving a cell — the new cell's own corner would always land inside
 * another cell, no matter where it goes. Rather than force that size by
 * flattening cells to 1×1, this falls through the same size ladder
 * createCell uses (3x3, 3x2, 2x2, 2x1, 1x1), so the new cell shrinks first
 * and the rest of the grid stays as full as it already was. The caller
 * (createCell, called right after) picks whichever size actually fits the
 * free spot this leaves behind.
 */
export function makeRoomFor<T extends Rect>(cells: T[], w: number, h: number): T[] {
  for (const [tw, th] of [[w, h], ...FALLBACK_SIZES]) {
    if (tw > GRID_COLS || th > GRID_ROWS) continue;
    const found = findClearableWindow(cells, tw, th);
    if (found) return found.next;
  }
  return shrinkLargestUntilFits(cells, w, h);
}

// Tried largest-first when the default size doesn't fit. Shrinking existing
// cells in place (see makeRoomFor) only ever trims their right/bottom edge,
// so their top-left corners stay put — on a grid that happens to be tiled
// exactly at multiples of the default size, that can leave every remaining
// gap too narrow for another 4x3 no matter how far cells shrink. Falling
// back through a few smaller sizes finds the best one actually available
// instead of jumping straight to 1x1.
const FALLBACK_SIZES: ReadonlyArray<readonly [number, number]> = [
  [3, 3],
  [3, 2],
  [2, 2],
  [2, 1],
  [1, 1],
];

export function createCell(existing: Rect[]): Cell {
  for (const [w, h] of [[DEFAULT_CELL_W, DEFAULT_CELL_H], ...FALLBACK_SIZES]) {
    const spot = findFreeSpot(existing, w, h);
    if (spot) {
      return { id: randomId(), x: spot.x, y: spot.y, w, h, media: null };
    }
  }
  return { id: randomId(), x: 0, y: 0, w: 1, h: 1, media: null };
}

export function randomCellCount() {
  return Math.floor(Math.random() * 8) + 5; // 5..12
}

/**
 * Rects only (no id/media) so callers can re-attach existing cell ids in
 * place rather than replacing every id at once — GridStack's React item
 * wrapper defers DOM removal by a microtask, and swapping an entire list to
 * brand-new ids in one commit (many unmounts + many mounts together) can
 * race that cleanup and leave stale items behind. Reusing ids for as much
 * of the list as possible keeps a randomize a pure add or a pure trim.
 */
export function generateRandomRects(count: number): Rect[] {
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const w = 2 + Math.floor(Math.random() * 3); // 2..4
    const h = 1 + Math.floor(Math.random() * 3); // 1..3
    const spot = findFreeSpot(rects, w, h);
    if (!spot) break; // canvas full — leftover empty space is fine
    rects.push({ x: spot.x, y: spot.y, w, h });
  }
  return rects;
}
