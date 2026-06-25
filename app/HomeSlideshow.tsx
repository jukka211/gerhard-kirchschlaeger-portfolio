"use client";

import { useEffect, useState } from "react";
import { useSiteMenu } from "@/components/SiteMenuContext";

type Slide = {
  key: string;
  url: string;
  alt: string;
};

export default function HomeSlideshow({ slides }: { slides: Slide[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { setOpen } = useSiteMenu();

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = setInterval(() => {
      if (document.hidden) return;
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 200);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div
      className="home-slideshow"
      onClick={() => setOpen(true)}
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
