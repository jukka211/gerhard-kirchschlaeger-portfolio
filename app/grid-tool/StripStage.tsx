"use client";

import { useMemo } from "react";
import GridCellContent from "./GridCellContent";
import {
  type BandCount,
  type Strip,
  type StripAxis,
  type StripSpacing,
  FALLBACK_RATIO,
  stripLayout,
  stripLoopSeconds,
} from "./stripGeometry";
import { exportCanvasSize } from "./exportGeometry";
import type { Aspect, MediaType } from "./gridLayout";
import type { MediaCell } from "./mediaCell";

/**
 * Which way the strip runs its contents. `forward` is down a column and
 * rightward along a row — the direction each layout reads in.
 */
export type ScrollDirection = "forward" | "backward";

interface StripStageProps {
  cells: MediaCell[];
  aspect: Aspect;
  axis: StripAxis;
  bands: BandCount;
  repeat: boolean;
  /** The air around and between the items, in nominal pixels. */
  spacing: StripSpacing;
  /** Nominal canvas pixels per second. */
  speed: number;
  direction: ScrollDirection;
  canRemove: boolean;
  onRemove: (id: string) => void;
  onMediaFile: (id: string, type: MediaType, file: File) => void;
  onMediaClear: (id: string) => void;
}

/** Two copies of the strip end to end, so the second is arriving as the first
 * leaves and the animation can hand off between them without a seam. */
const COPIES = 2;

function percent(fraction: number) {
  return `${fraction * 100}%`;
}

/**
 * The positions in a strip that own their cell's controls.
 *
 * `repeat` can put the same cell in a strip several times over, and each
 * appearance renders the same media; showing every one of them an upload
 * button and a remove button would suggest there are more slots than there
 * are. The first appearance takes the controls, the rest are scenery.
 */
function primaryPositions(strip: Strip): Set<number> {
  const seen = new Set<number>();
  const positions = new Set<number>();

  strip.items.forEach((item, position) => {
    if (seen.has(item.index)) return;
    seen.add(item.index);
    positions.add(position);
  });

  return positions;
}

/**
 * The preview for both scrolling modes — columns and rows.
 *
 * Every measurement comes from `stripLayout` — the same function the export
 * lays out from — divided by the canvas it was measured against, so the DOM
 * carries pure ratios and lands identically at any preview size. That's the
 * contract the grid preview has with `cellPixelRect`, and it's what makes what
 * you arrange here the thing the renderer draws.
 *
 * The scroll is one CSS animation per band, sliding a two-copy stack by
 * exactly half its length per lap. A strip is never shorter than the frame
 * (stripLayout guarantees it), so those two copies always cover the canvas and
 * the hand-off is invisible.
 */
export default function StripStage({
  cells,
  aspect,
  axis,
  bands,
  repeat,
  spacing,
  speed,
  direction,
  canRemove,
  onRemove,
  onMediaFile,
  onMediaClear,
}: StripStageProps) {
  const canvas = exportCanvasSize(aspect);
  const vertical = axis === "vertical";

  const strips = useMemo(
    () =>
      stripLayout(
        cells.map((cell) => cell.media?.aspectRatio ?? FALLBACK_RATIO),
        aspect,
        axis,
        bands,
        repeat,
        spacing
      ),
    [aspect, axis, bands, cells, repeat, spacing]
  );

  return (
    <div className="gt-strips">
      {strips.map((strip, stripIndex) => {
        const loop = stripLoopSeconds(strip, speed);
        const primary = primaryPositions(strip);

        // The band's own two measurements sit across the axis; the strip's
        // whole run — both copies of it — sits along it. Which of those is a
        // width and which a height is the only thing the axis decides.
        const acrossExtent = vertical ? canvas.width : canvas.height;
        const span = COPIES * strip.length;
        const box = {
          start: percent(strip.across / acrossExtent),
          thickness: percent(strip.thickness / acrossExtent),
          run: percent(span / (vertical ? canvas.height : canvas.width)),
        };

        return (
          <div
            key={stripIndex}
            className={`gt-strip gt-strip--${axis}`}
            style={{
              animationDuration: `${loop}s`,
              // The keyframes run the strip backwards; playing them in reverse
              // is the whole of running it forwards.
              animationDirection: direction === "forward" ? "reverse" : "normal",
              animationPlayState: loop > 0 ? "running" : "paused",
              ...(vertical
                ? { left: box.start, width: box.thickness, height: box.run }
                : { top: box.start, height: box.thickness, width: box.run }),
            }}
          >
            {Array.from({ length: COPIES }, (_, copy) =>
              strip.items.map(({ index, rect }, position) => {
                const isPrimary = copy === 0 && primary.has(position);
                const offset = copy * strip.length;

                return (
                  <div
                    key={`${copy}-${position}`}
                    className="gt-strip-item"
                    style={
                      vertical
                        ? {
                            top: percent((rect.y + offset) / span),
                            height: percent(rect.height / span),
                          }
                        : {
                            left: percent((rect.x + offset) / span),
                            width: percent(rect.width / span),
                          }
                    }
                    aria-hidden={isPrimary ? undefined : true}
                  >
                    <GridCellContent
                      cell={cells[index]}
                      canRemove={canRemove}
                      interactive={isPrimary}
                      onRemove={onRemove}
                      onMediaFile={onMediaFile}
                      onMediaClear={onMediaClear}
                    />
                  </div>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
