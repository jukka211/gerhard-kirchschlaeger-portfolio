import { type Cell, type CellMedia, createCell } from "./gridLayout";

/**
 * The cell as the tool works with it, shared by both layout modes.
 *
 * The renderer works from the original `File`, not the preview's object URL,
 * so the file travels alongside it. Media also carries what probing found out
 * about it: its length, which defaults the export duration, and its shape,
 * which is what column mode sizes an item from.
 *
 * This is a local widening of gridLayout's `Cell` rather than a change to it:
 * the grid model stays the single source of truth for layout, and a
 * `MediaCell` is still structurally a `Cell`, so the layout helpers and
 * GridCellContent take it unchanged. The x/y/w/h it carries are grid
 * coordinates, kept up to date even in column mode so that switching back
 * finds the grid exactly as it was left.
 */
export interface CellFile extends CellMedia {
  file: File;
  durationSeconds?: number;
  /** width / height of the source, once probed. */
  aspectRatio?: number;
}

export type MediaCell = Omit<Cell, "media"> & { media: CellFile | null };

export function revoke(cell: MediaCell | undefined) {
  if (cell?.media) URL.revokeObjectURL(cell.media.url);
}

export function newCell(existing: MediaCell[]): MediaCell {
  return { ...createCell(existing), media: null };
}
