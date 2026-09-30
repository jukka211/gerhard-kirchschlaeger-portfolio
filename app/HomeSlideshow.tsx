"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useSlideshowSettings } from "@/components/SlideshowContext";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

type CursorSide = "left" | "right" | null;

// The home page's images in a size × size grid, starting from the active
// image. Clicking a cell opens its image at 1 × 1, where the left and right
// halves of the screen step through the slides.
export default function HomeSlideshow({ slides }: { slides: Slide[] }) {
  const { gridSize, setGridSize } = useSlideshowSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const single = gridSize === 1;
  const { handlers, cursorLabel } = useSideNavigation((direction) =>
    setActiveIndex((index) => (index + direction + slides.length) % slides.length)
  );

  if (slides.length === 0) return null;

  return (
    <div
      className={`home-slideshow ${single ? "home-slideshow--single" : ""}`.trim()}
      role="presentation"
      {...(single ? handlers : {})}
    >
      <div className="home-slideshow-grid" style={{ "--size": gridSize } as CSSProperties}>
        {/* More cells than slides repeats them from the start. */}
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const slideIndex = (activeIndex + index) % slides.length;
          const slide = slides[slideIndex];
          return (
            <div
              key={index}
              className="home-slideshow-cell"
              onClick={
                single
                  ? undefined
                  : () => {
                      setActiveIndex(slideIndex);
                      setGridSize(1);
                    }
              }
            >
              <img src={slide.url} alt={slide.alt} />
            </div>
          );
        })}
      </div>
      {single && cursorLabel}
    </div>
  );
}

// Clicking the left half of the screen steps back, the right half forward,
// with a "previous" / "next" label following the pointer.
function useSideNavigation(onStep: (direction: -1 | 1) => void) {
  const [cursor, setCursor] = useState<{ x: number; y: number; side: CursorSide }>({
    x: 0,
    y: 0,
    side: null,
  });

  const sideFromEvent = (event: { clientX: number }): CursorSide =>
    event.clientX < window.innerWidth / 2 ? "left" : "right";

  const handlers = {
    onClick: (event: React.MouseEvent<HTMLDivElement>) =>
      onStep(sideFromEvent(event) === "left" ? -1 : 1),
    onMouseMove: (event: React.MouseEvent<HTMLDivElement>) =>
      setCursor({ x: event.clientX, y: event.clientY, side: sideFromEvent(event) }),
    onMouseLeave: () => setCursor((current) => ({ ...current, side: null })),
  };

  const cursorLabel = cursor.side && (
    <span
      className="home-slideshow-cursor"
      style={{
        transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`,
      }}
    >
      {cursor.side === "left" ? "previous" : "next"}
    </span>
  );

  return { handlers, cursorLabel };
}
