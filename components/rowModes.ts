export const ROW_MODES = [
  "default",
  "focus",
  "fontsize",
  "converge",
  "wave",
  "cascade",
  "lineheight",
  "gridrot",
  "grid",
  "marquee",
] as const;

export type RowMode = (typeof ROW_MODES)[number];

export const GRID_ROW_MODES: RowMode[] = ["grid", "gridrot"];
