"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useSlideshowSettings } from "@/components/SlideshowContext";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

// The intro shows the first grid's images one at a time, in reading order:
// the first row left to right, then the next. Each waits for its image to
// load, so the order holds however slowly they arrive.
const INTRO_CELL_DELAY_MS = 45;

// The home page's images in a size × size grid, starting from the active
// image. Clicking a cell opens its image at 1 × 1, where the left and right
// halves of the screen step through the slides.
export default function HomeSlideshow({
  slides,
  variant,
}: {
  slides: Slide[];
  variant: "desktop" | "mobile";
}) {
  const { gridSize, setGridSize } = useSlideshowSettings();
  const [activeIndex, setActiveIndex] = useState(0);
  const single = gridSize === 1;
  const gridRef = useRef<HTMLDivElement>(null);
  // Cells shown so far by the intro; Infinity once it's over.
  const [revealed, setRevealed] = useState(0);
  const hasSlides = slides.length > 0;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let count = 0;
    const timer = window.setInterval(() => {
      const images = grid.querySelectorAll("img");
      if (count >= images.length) {
        window.clearInterval(timer);
        setRevealed(Infinity);
        return;
      }
      // complete is also true for an image that failed, so one can't hold up the rest.
      if (!images[count].complete) return;
      count += 1;
      setRevealed(count);
    }, INTRO_CELL_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [hasSlides]);

  function step(event: React.MouseEvent<HTMLDivElement>) {
    const direction = event.clientX < window.innerWidth / 2 ? -1 : 1;
    setActiveIndex((index) => (index + direction + slides.length) % slides.length);
  }

  if (!hasSlides) return null;

  return (
    <div
      className={`home-slideshow home-slideshow--${variant} ${
        single ? "home-slideshow--single" : ""
      }`.trim()}
      role="presentation"
      onClick={single ? step : undefined}
    >
      <div
        ref={gridRef}
        className="home-slideshow-grid"
        style={{ "--size": gridSize } as CSSProperties}
      >
        {/* More cells than slides repeats them from the start. */}
        {Array.from({ length: gridSize * gridSize }, (_, index) => {
          const slideIndex = (activeIndex + index) % slides.length;
          const slide = slides[slideIndex];
          return (
            <div
              key={index}
              className={`home-slideshow-cell ${
                index < revealed ? "" : "home-slideshow-cell--hidden"
              }`.trim()}
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
    </div>
  );
}
