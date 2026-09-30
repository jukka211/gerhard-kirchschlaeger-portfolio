"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { useSlideshowSettings } from "@/components/SlideshowContext";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

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

  function step(event: React.MouseEvent<HTMLDivElement>) {
    const direction = event.clientX < window.innerWidth / 2 ? -1 : 1;
    setActiveIndex((index) => (index + direction + slides.length) % slides.length);
  }

  if (slides.length === 0) return null;

  return (
    <div
      className={`home-slideshow home-slideshow--${variant} ${
        single ? "home-slideshow--single" : ""
      }`.trim()}
      role="presentation"
      onClick={single ? step : undefined}
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
    </div>
  );
}
