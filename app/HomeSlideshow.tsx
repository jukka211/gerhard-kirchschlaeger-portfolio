"use client";

import { useEffect, useState } from "react";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

export default function HomeSlideshow({ slides }: { slides: Slide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOn, setIsOn] = useState(true);

  useEffect(() => {
    if (!isOn || slides.length < 2) return;

    const interval = setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 200);

    return () => clearInterval(interval);
  }, [isOn, slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className={`home-slideshow ${isOn ? "" : "home-slideshow--off"}`.trim()}
      onClick={() => setIsOn((on) => !on)}
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
    </div>
  );
}
