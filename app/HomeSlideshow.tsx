"use client";

import { useEffect, useState } from "react";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

type CursorSide = "left" | "right" | null;

export default function HomeSlideshow({
  slides,
  variant,
}: {
  slides: Slide[];
  variant: "desktop" | "mobile";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [intervalMs, setIntervalMs] = useState(200);
  const [cursor, setCursor] = useState<{ x: number; y: number; side: CursorSide }>({
    x: 0,
    y: 0,
    side: null,
  });

  useEffect(() => {
    if (paused || slides.length < 2) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((index) => (index + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [slides.length, paused, intervalMs]);

  const sideFromEvent = (event: { clientX: number }): CursorSide =>
    event.clientX < window.innerWidth / 2 ? "left" : "right";

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    setIntervalMs((current) =>
      Math.min(1500, Math.max(100, current + Math.sign(event.deltaY) * 20))
    );
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setPaused(true);
    if (sideFromEvent(event) === "left") {
      setActiveIndex((index) => (index - 1 + slides.length) % slides.length);
    } else {
      setActiveIndex((index) => (index + 1) % slides.length);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    setCursor({ x: event.clientX, y: event.clientY, side: sideFromEvent(event) });
  };

  const handleMouseLeave = () => {
    setCursor((current) => ({ ...current, side: null }));
  };

  if (slides.length === 0) return null;

  return (
    <div
      className={`home-slideshow home-slideshow--${variant}`}
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="presentation"
    >
      {slides.map((slide, index) => (
        <div
          key={slide.key}
          className={`home-slideshow-slide ${
            index === activeIndex ? "is-active" : ""
          }`.trim()}
        >
          <img src={slide.url} alt={slide.alt} />
        </div>
      ))}
      {cursor.side && (
        <span
          className="home-slideshow-cursor"
          style={{
            transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0) translate(-50%, -50%)`,
          }}
        >
          {cursor.side === "left" ? "previous" : "next"}
        </span>
      )}
    </div>
  );
}
