"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GridStack, GridStackItem } from "gridstack/dist/react";
import type {
  GridStackHandle,
  GridStackNode,
  GridStackOptions,
} from "gridstack/dist/react";
import "gridstack/dist/gridstack.css";
import "./grid-tool.css";
import GridCellContent from "./GridCellContent";
import StripStage, { type ScrollDirection } from "./StripStage";
import { Field, Section, Segmented, Slider, Toggle, type Choice } from "./controls";
import {
  type Aspect,
  type MediaType,
  DEFAULT_CELL_H,
  DEFAULT_CELL_W,
  GRID_COLS,
  GRID_ROWS,
  MAX_CELLS,
  MIN_CELLS,
  findFreeSpot,
  generateRandomRects,
  makeRoomFor,
  randomCellCount,
  randomId,
} from "./gridLayout";
import {
  type BandCount,
  type StripAxis,
  type StripSpacing,
  BAND_COUNTS,
  DEFAULT_SCROLL_SPEED,
  DEFAULT_STRIP_SPACING,
  FALLBACK_RATIO,
  MAX_SCROLL_SPEED,
  MAX_STRIP_SPACING,
  MIN_SCROLL_SPEED,
  MIN_STRIP_SPACING,
  clampSpacing,
  stripLayout,
  stripLoopSeconds,
} from "./stripGeometry";
import {
  type Background,
  DEFAULT_BACKGROUND,
  exportCanvasSize,
  previewMargin,
} from "./exportGeometry";
import { type MediaCell, newCell, revoke } from "./mediaCell";
import {
  type ExportCell,
  type ExportLayout,
  type ExportStripItem,
  probeMedia,
  useGridExport,
} from "./useGridExport";

const ASPECTS: Aspect[] = ["9:16", "16:9", "4:5", "5:4"];

/**
 * How the cells are arranged.
 *
 * The grid places them by hand in a 12x6 field. Column and row mode are the
 * same scrolling layout at right angles — cells stacked full-thickness along
 * one or two bands, in the order they were added, with nothing to drag or
 * resize — so they share every control below and differ only in `STRIP_AXIS`.
 */
type Mode = "grid" | "column" | "row";

const MODES: Choice<Mode>[] = [
  { value: "grid", label: "Grid" },
  { value: "column", label: "Column" },
  { value: "row", label: "Row" },
];

const STRIP_AXIS: Record<Exclude<Mode, "grid">, StripAxis> = {
  column: "vertical",
  row: "horizontal",
};

/** What "forward" and "backward" are called, once you know which way the
 * strip runs. */
const DIRECTION_LABELS: Record<StripAxis, Record<ScrollDirection, string>> = {
  vertical: { forward: "↓ Down", backward: "↑ Up" },
  horizontal: { forward: "→ Right", backward: "← Left" },
};

const DIRECTIONS: ScrollDirection[] = ["forward", "backward"];

/** What the axis calls its bands, and the gap between two of them. */
const BAND_LABEL: Record<StripAxis, string> = {
  vertical: "Columns",
  horizontal: "Rows",
};

const BAND_GAP_LABEL: Record<StripAxis, string> = {
  vertical: "Gap between columns",
  horizontal: "Gap between rows",
};

const BACKGROUND_OPTIONS: Choice<Background>[] = [
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
];

const MIN_DURATION = 1;
const MAX_DURATION = 60;
/** Used when nothing in the grid has a length of its own to borrow. */
const FALLBACK_DURATION = 5;

function clampDuration(seconds: number) {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, seconds));
}

function clampSpeed(pixelsPerSecond: number) {
  return Math.min(MAX_SCROLL_SPEED, Math.max(MIN_SCROLL_SPEED, pixelsPerSecond));
}

export default function GridTool() {
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [background, setBackground] = useState<Background>(DEFAULT_BACKGROUND);
  const [mode, setMode] = useState<Mode>("grid");
  const [cells, setCells] = useState<MediaCell[]>(() => [newCell([])]);
  /** null until the user types a length of their own, so the field keeps
   * tracking the footage until they take it over. */
  const [durationOverride, setDurationOverride] = useState<number | null>(null);
  /** The control panel is an overlay you can get out of the way; the canvas
   * takes the room back while it's hidden. */
  const [panelOpen, setPanelOpen] = useState(true);

  // Shared by both scrolling modes: turning a column layout on its side should
  // keep how many bands, how fast, which way, and how much air you already
  // asked for.
  const [bands, setBands] = useState<BandCount>(1);
  const [repeat, setRepeat] = useState(true);
  const [speed, setSpeed] = useState(DEFAULT_SCROLL_SPEED);
  const [direction, setDirection] = useState<ScrollDirection>("forward");
  const [spacing, setSpacing] = useState<StripSpacing>(DEFAULT_STRIP_SPACING);

  const axis = mode === "grid" ? null : STRIP_AXIS[mode];

  const setSpacingValue = useCallback((key: keyof StripSpacing, value: number) => {
    setSpacing((prev) => ({ ...prev, [key]: clampSpacing(value) }));
  }, []);

  const cellsRef = useRef(cells);
  useEffect(() => {
    cellsRef.current = cells;
  }, [cells]);
  useEffect(
    () => () => {
      cellsRef.current.forEach((c) => revoke(c));
    },
    []
  );

  const gridRef = useRef<GridStackHandle>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const gridOptions: GridStackOptions = useMemo(
    () => ({
      column: GRID_COLS,
      row: GRID_ROWS,
      cellHeight: 10,
      // Placeholder only — the ResizeObserver below replaces this with the
      // gap scaled from EXPORT_GAP as soon as the canvas has a size.
      margin: 4,
      float: true,
      animate: true,
      draggable: { handle: ".gt-cell-media" },
      resizable: { handles: "e, se, s, sw, w" },
    }),
    []
  );

  // Keep GridStack's row pixel height in sync with the rendered canvas box,
  // so GRID_ROWS always exactly fills the aspect-ratio container, and scale
  // the gap so the preview shows the same spacing the export will render.
  // The observer is also what keeps the grid honest when the control panel
  // opens or closes and the canvas gets a different amount of room.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "grid") return;
    const applyMetrics = () => {
      const grid = gridRef.current?.getGrid();
      if (!grid) return;
      const px = canvas.clientHeight / GRID_ROWS;
      if (px > 0) grid.cellHeight(px);
      if (canvas.clientWidth > 0) {
        grid.margin(previewMargin(canvas.clientWidth, aspect));
      }
    };
    applyMetrics();
    const observer = new ResizeObserver(applyMetrics);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [aspect, mode]);

  // Fires after a real user drag or resize (never from our own state
  // updates), with just the nodes that moved/resized — persist their new
  // x/y/w/h onto matching cells. Gaps are fine; GridStack's own collision
  // handling keeps items from overlapping.
  const handleGridChange = useCallback(
    (_event: Event, nodes: GridStackNode[]) => {
      if (!nodes.length) return;
      setCells((prev) => {
        const updates = new Map(nodes.map((n) => [n.id as string, n]));
        return prev.map((c) => {
          const n = updates.get(c.id);
          if (!n) return c;
          return {
            ...c,
            x: n.x ?? c.x,
            y: n.y ?? c.y,
            w: n.w ?? c.w,
            h: n.h ?? c.h,
          };
        });
      });
    },
    []
  );

  // When the grid has no room left, shrinking several cells and mounting
  // the new one all in the same render lets GridStack apply those DOM
  // updates one item at a time — a not-yet-shrunk neighbor can still be
  // "live" when the new item gets placed, tripping GridStack's own
  // collision push and drifting away from the layout we computed. Splitting
  // it into two commits (shrink, let it settle, then add) avoids that:
  // shrinking alone can never create an overlap, so step one is safe
  // regardless of DOM update order, and step two then adds a single item
  // against a grid state that's already fully caught up.
  const [pendingAdd, setPendingAdd] = useState(false);

  // The room check reads `cells` directly (not via a setCells updater) so
  // deciding to shrink and flagging pendingAdd both happen in the plain
  // event-handler body — setState updaters must stay pure, and calling
  // setPendingAdd from inside one isn't guaranteed to run exactly once.
  const addCell = useCallback(() => {
    if (cells.length >= MAX_CELLS) return;
    if (findFreeSpot(cells, DEFAULT_CELL_W, DEFAULT_CELL_H)) {
      setCells((prev) => [...prev, newCell(prev)]);
      return;
    }
    setPendingAdd(true);
    setCells((prev) => makeRoomFor(prev, DEFAULT_CELL_W, DEFAULT_CELL_H));
  }, [cells]);

  useEffect(() => {
    if (!pendingAdd) return;
    // Intentional: this waits for GridStack's own DOM sync from the shrink
    // commit above to fully settle before adding the new cell (see comment
    // above addCell) — not deriving state from props/state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPendingAdd(false);
    setCells((prev) => [...prev, newCell(prev)]);
  }, [pendingAdd]);

  const removeCell = useCallback((id: string) => {
    setCells((prev) => {
      if (prev.length <= MIN_CELLS) return prev;
      revoke(prev.find((c) => c.id === id));
      return prev.filter((c) => c.id !== id);
    });
  }, []);

  const handleMediaFile = useCallback(
    (id: string, type: MediaType, file: File) => {
      const url = URL.createObjectURL(file);
      setCells((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          revoke(c);
          return { ...c, media: { type, url, name: file.name, file } };
        })
      );

      // Measuring happens off the main thread and can land after the user has
      // already swapped this cell's media, so the result is only kept if the
      // very same file is still there.
      void probeMedia(file, type).then((probed) => {
        if (!probed) return;
        setCells((prev) =>
          prev.map((c) =>
            c.id === id && c.media?.file === file
              ? {
                  ...c,
                  media: {
                    ...c.media,
                    durationSeconds: probed.durationSeconds ?? undefined,
                    aspectRatio: probed.height > 0 ? probed.width / probed.height : undefined,
                  },
                }
              : c
          )
        );
      });
    },
    []
  );

  const handleMediaClear = useCallback((id: string) => {
    setCells((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        revoke(c);
        return { ...c, media: null };
      })
    );
  }, []);

  const randomize = useCallback(() => {
    setCells((prev) => {
      prev.forEach((c) => revoke(c));
      // Reuse existing ids in place (update, not remount) and only add or
      // trim the count difference — see generateRandomRects for why.
      return generateRandomRects(randomCellCount()).map((rect, i) => ({
        id: prev[i]?.id ?? randomId(),
        media: null,
        ...rect,
      }));
    });
  }, []);

  const { status, error, progress, start, cancel } = useGridExport();
  const isBusy = status !== "idle";
  const supportsExport = typeof VideoEncoder !== "undefined";

  const exportCells = useMemo<ExportCell[]>(
    () =>
      cells.flatMap((cell) =>
        cell.media
          ? [
              {
                kind: cell.media.type,
                file: cell.media.file,
                rect: { x: cell.x, y: cell.y, w: cell.w, h: cell.h },
              },
            ]
          : []
      ),
    [cells]
  );

  const stripItems = useMemo<ExportStripItem[]>(
    () =>
      cells.map((cell) => ({
        media: cell.media ? { kind: cell.media.type, file: cell.media.file } : null,
        aspectRatio: cell.media?.aspectRatio ?? FALLBACK_RATIO,
      })),
    [cells]
  );

  const layout = useMemo<ExportLayout>(
    () =>
      axis === null
        ? { mode: "grid", cells: exportCells }
        : {
            mode: "strip",
            axis,
            items: stripItems,
            bands,
            repeat,
            spacing,
            // Direction lives in the sign, which is all the renderer needs to
            // know to run the strip the other way.
            speed: direction === "backward" ? -speed : speed,
          },
    [axis, bands, direction, exportCells, repeat, spacing, speed, stripItems]
  );

  /**
   * How long one lap of the slowest band takes.
   *
   * That's the natural length for a scrolling export: any shorter and the loop
   * is cut off mid-way, any longer and it starts repeating itself.
   */
  const stripLoop = useMemo(() => {
    if (axis === null) return null;
    const laps = stripLayout(
      stripItems.map((item) => item.aspectRatio),
      aspect,
      axis,
      bands,
      repeat,
      spacing
    ).map((strip) => stripLoopSeconds(strip, speed));
    return laps.length ? Math.max(...laps) : null;
  }, [aspect, axis, bands, repeat, spacing, speed, stripItems]);

  // Long enough for the longest clip to play through once — or, in a scrolling
  // mode, for the strip to come back round — until the user says otherwise.
  const duration = useMemo(() => {
    if (durationOverride !== null) return durationOverride;
    if (stripLoop !== null && stripLoop > 0) {
      return clampDuration(Math.ceil(stripLoop));
    }
    const lengths = cells
      .map((cell) => cell.media?.durationSeconds)
      .filter((value): value is number => value !== undefined);
    return lengths.length
      ? clampDuration(Math.ceil(Math.max(...lengths)))
      : FALLBACK_DURATION;
  }, [cells, durationOverride, stripLoop]);

  const handleExportClick = useCallback(() => {
    if (isBusy || !exportCells.length) return;
    start({
      layout,
      aspect,
      background,
      durationSeconds: duration,
      fileName: `${mode}-export-${aspect.replace(":", "x")}`,
    });
  }, [aspect, background, duration, exportCells.length, isBusy, layout, mode, start]);

  const exportLabel = {
    idle: "Export MP4",
    preparing: "Preparing…",
    rendering: `Rendering… ${Math.round(progress * 100)}%`,
  }[status];

  /** The cell counter and its two buttons, which every mode wants. */
  const cellControls = (
    <Field label={`Cells — ${cells.length}/${MAX_CELLS}`} stacked>
      <div className="gt-btn-row">
        <button
          type="button"
          className="gt-btn"
          onClick={addCell}
          disabled={cells.length >= MAX_CELLS}
        >
          + Add cell
        </button>
        {mode === "grid" && (
          <button type="button" className="gt-btn" onClick={randomize} disabled={isBusy}>
            Randomize
          </button>
        )}
      </div>
    </Field>
  );

  return (
    <main className={`gt-page ${panelOpen ? "gt-page--panel" : ""}`}>
      <aside className="gt-panel" aria-hidden={!panelOpen} inert={!panelOpen}>
        <header className="gt-panel-head">
          <h1 className="gt-panel-title">Grid Tool</h1>
          <span className="gt-panel-sub">
            {exportCanvasSize(aspect).width}×{exportCanvasSize(aspect).height}
          </span>
        </header>

        <div className="gt-panel-body">
          <Section index={1} title="Ratio">
            <Field label="Aspect" stacked>
              <Segmented
                ariaLabel="Aspect ratio"
                options={ASPECTS.map((value) => ({
                  value,
                  label: value,
                  title: `${exportCanvasSize(value).width}×${exportCanvasSize(value).height}`,
                }))}
                value={aspect}
                onChange={setAspect}
                disabled={isBusy}
              />
            </Field>
            <Field label="Background">
              <Segmented
                ariaLabel="Background"
                options={BACKGROUND_OPTIONS}
                value={background}
                onChange={setBackground}
                disabled={isBusy}
              />
            </Field>
          </Section>

          <Section index={2} title="Mode">
            <Field stacked>
              <Segmented
                ariaLabel="Layout mode"
                options={MODES}
                value={mode}
                onChange={setMode}
                disabled={isBusy}
              />
            </Field>

            {axis === null ? (
              <div className="gt-subpanel">
                <p className="gt-note">
                  Drag a cell by its media to move it, or pull an edge to resize. The
                  field is {GRID_COLS}×{GRID_ROWS}.
                </p>
                {cellControls}
              </div>
            ) : (
              <div className="gt-subpanel">
                <Field label={BAND_LABEL[axis]}>
                  <Segmented
                    ariaLabel={BAND_LABEL[axis]}
                    options={BAND_COUNTS.map((value) => ({
                      value,
                      label: String(value),
                    }))}
                    value={bands}
                    onChange={setBands}
                    disabled={isBusy}
                  />
                </Field>

                <Field label="Direction">
                  <Segmented
                    ariaLabel="Scroll direction"
                    options={DIRECTIONS.map((value) => ({
                      value,
                      label: DIRECTION_LABELS[axis][value],
                    }))}
                    value={direction}
                    onChange={setDirection}
                    disabled={isBusy}
                  />
                </Field>

                <Field label="Repeat">
                  <Toggle
                    on={repeat}
                    onClick={() => setRepeat((value) => !value)}
                    disabled={isBusy}
                    title="Replicate the media until each band is longer than the frame, so the loop never runs dry"
                  >
                    {repeat ? "On" : "Off"}
                  </Toggle>
                </Field>

                <Field label="Padding" stacked>
                  <Slider
                    id="gt-padding"
                    value={spacing.padding}
                    min={MIN_STRIP_SPACING}
                    max={MAX_STRIP_SPACING}
                    suffix="px"
                    disabled={isBusy}
                    onChange={(value) => setSpacingValue("padding", value)}
                  />
                </Field>

                <Field label="Gap between cells" stacked>
                  <Slider
                    id="gt-cell-gap"
                    value={spacing.cellGap}
                    min={MIN_STRIP_SPACING}
                    max={MAX_STRIP_SPACING}
                    suffix="px"
                    disabled={isBusy}
                    onChange={(value) => setSpacingValue("cellGap", value)}
                  />
                </Field>

                <Field
                  label={BAND_GAP_LABEL[axis]}
                  stacked
                  hint={bands === 1 ? "Takes effect with two bands." : undefined}
                >
                  <Slider
                    id="gt-band-gap"
                    value={spacing.bandGap}
                    min={MIN_STRIP_SPACING}
                    max={MAX_STRIP_SPACING}
                    suffix="px"
                    disabled={isBusy || bands === 1}
                    onChange={(value) => setSpacingValue("bandGap", value)}
                  />
                </Field>

                {cellControls}
              </div>
            )}
          </Section>

          <Section index={3} title="Speed, duration & export">
            {axis === null ? (
              <p className="gt-note">Speed applies to the scrolling modes.</p>
            ) : (
              <Field label="Speed" stacked>
                <Slider
                  id="gt-speed"
                  value={speed}
                  min={MIN_SCROLL_SPEED}
                  max={MAX_SCROLL_SPEED}
                  step={10}
                  suffix="px/s"
                  disabled={isBusy}
                  onChange={(value) => setSpeed(clampSpeed(value))}
                />
              </Field>
            )}

            <Field
              label="Duration"
              stacked
              hint={
                durationOverride === null
                  ? "Following the footage."
                  : undefined
              }
            >
              <div className="gt-inline">
                <input
                  id="gt-duration"
                  type="number"
                  className="gt-number"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  step={1}
                  value={duration}
                  disabled={isBusy}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isFinite(next)) setDurationOverride(clampDuration(next));
                  }}
                />
                <span className="gt-unit">sec</span>
                {durationOverride !== null && (
                  <button
                    type="button"
                    className="gt-btn gt-btn--quiet"
                    onClick={() => setDurationOverride(null)}
                    disabled={isBusy}
                    title="Go back to following the footage"
                  >
                    Auto
                  </button>
                )}
              </div>
            </Field>

            <div className="gt-export">
              <button
                type="button"
                className="gt-btn gt-btn--export"
                onClick={handleExportClick}
                disabled={!supportsExport || isBusy || exportCells.length === 0}
              >
                {exportLabel}
              </button>
              {isBusy && (
                <button type="button" className="gt-btn" onClick={cancel}>
                  Cancel
                </button>
              )}
            </div>

            {isBusy && (
              <div className="gt-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)}>
                <div className="gt-progress-bar" style={{ width: `${progress * 100}%` }} />
              </div>
            )}

            {!supportsExport && (
              <p className="gt-note">Video export isn&apos;t supported in this browser.</p>
            )}
            {supportsExport && exportCells.length === 0 && (
              <p className="gt-note">Add an image or video to a cell first.</p>
            )}
            {error && <p className="gt-note gt-note--error">{error}</p>}
          </Section>
        </div>
      </aside>

      <button
        type="button"
        className="gt-panel-tab"
        onClick={() => setPanelOpen((open) => !open)}
        aria-expanded={panelOpen}
        aria-label={panelOpen ? "Hide controls" : "Show controls"}
      >
        {panelOpen ? "‹" : "Controls ›"}
      </button>

      {/* The preview plays each cell on its own clock; the export always
          renders every cell from its start. Deliberate — the export is the
          authoritative render, not a capture of what's on screen. */}

      <div className="gt-canvas-stage">
        <div
          ref={canvasRef}
          className={`gt-canvas gt-canvas--${background} gt-aspect-${aspect.replace(
            ":",
            "-"
          )}`}
        >
          {axis === null ? (
            <GridStack
              ref={gridRef}
              options={gridOptions}
              onChange={handleGridChange}
              className="gt-grid"
            >
              {cells.map((cell) => (
                <GridStackItem
                  key={cell.id}
                  id={cell.id}
                  options={{ x: cell.x, y: cell.y, w: cell.w, h: cell.h }}
                >
                  <GridCellContent
                    cell={cell}
                    canRemove={cells.length > MIN_CELLS}
                    onRemove={removeCell}
                    onMediaFile={handleMediaFile}
                    onMediaClear={handleMediaClear}
                  />
                </GridStackItem>
              ))}
            </GridStack>
          ) : (
            <StripStage
              cells={cells}
              aspect={aspect}
              axis={axis}
              bands={bands}
              repeat={repeat}
              spacing={spacing}
              speed={speed}
              direction={direction}
              canRemove={cells.length > MIN_CELLS}
              onRemove={removeCell}
              onMediaFile={handleMediaFile}
              onMediaClear={handleMediaClear}
            />
          )}
        </div>
      </div>
    </main>
  );
}
