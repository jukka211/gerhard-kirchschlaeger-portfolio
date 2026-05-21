"use client";

import { useLayoutEffect, useRef, useCallback, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { urlFor } from "@/sanity/lib/image";
import type { GalleryItem } from "@/types/sanity";
import AboutOverlay from "@/components/AboutOverlay";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  items: GalleryItem[];
};

export default function HomePage({ items }: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const aboutRef = useRef<HTMLDivElement | null>(null);

  const [aboutVisible, setAboutVisible] = useState(false);

  const setupHorizontalScroll = useCallback(() => {
    const slider = sliderRef.current;
    const wrapper = wrapperRef.current;
    if (!slider || !wrapper) return;

    const totalWidth = wrapper.scrollWidth;
    const scrollLength = Math.max(totalWidth - window.innerWidth, 0);

    document.body.style.height = `${scrollLength + window.innerHeight}px`;

    ScrollTrigger.getAll().forEach((st) => st.kill());

    gsap.set(wrapper, { x: 0 });

    gsap.to(wrapper, {
      x: -scrollLength,
      ease: "none",
      scrollTrigger: {
        trigger: slider,
        pin: true,
        scrub: 1,
        start: "top top",
        end: `+=${scrollLength}`,
      },
    });

    ScrollTrigger.refresh();
  }, []);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const images = Array.from(wrapper.querySelectorAll("img"));
    const videos = Array.from(wrapper.querySelectorAll("video"));

    const mediaPromises: Promise<void>[] = [];

    images.forEach((img) => {
      if (img.complete) return;
      mediaPromises.push(
        new Promise((resolve) => {
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
      );
    });

    videos.forEach((video) => {
      if (video.readyState >= 1) return;
      mediaPromises.push(
        new Promise((resolve) => {
          video.addEventListener("loadedmetadata", () => resolve(), { once: true });
          video.addEventListener("error", () => resolve(), { once: true });
        })
      );
    });

    if (mediaPromises.length === 0) {
      setupHorizontalScroll();
    } else {
      Promise.all(mediaPromises).then(setupHorizontalScroll);
    }

    const fallbackTimer = setTimeout(() => {
      setupHorizontalScroll();
    }, 2000);

    window.addEventListener("resize", setupHorizontalScroll);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener("resize", setupHorizontalScroll);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      document.body.style.height = "";
    };
  }, [items, setupHorizontalScroll]);

  const openAbout = useCallback(() => {
    setAboutVisible(true);
  }, []);

  const closeAbout = useCallback(() => {
    const about = aboutRef.current;
    if (!about) return;

    gsap.to(about, {
      yPercent: -100,
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: () => {
        setAboutVisible(false);
        gsap.set(about, { clearProps: "transform" });
      },
    });
  }, []);

  useEffect(() => {
    const about = aboutRef.current;
    if (!about || !aboutVisible) return;

    gsap.set(about, { yPercent: -100 });
    gsap.to(about, {
      yPercent: 0,
      duration: 0.6,
      ease: "power3.inOut",
    });
  }, [aboutVisible]);

  useEffect(() => {
    if (aboutVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [aboutVisible]);

  return (
    <>
      <div className="container">
        <div className="slider" ref={sliderRef}>
          <div className="slides-wrapper" ref={wrapperRef}>
            {items.map((item) => (
              <section className={`slide ${item.orientation}`} key={item._key}>
                {item.mediaType === "image" && item.image ? (
                  <img
                    className="media"
                    src={urlFor(item.image).url()}
                    alt={item.image.alt || ""}
                  />
                ) : (
                  <video
                    className="media"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={
                      item.video?.poster ? urlFor(item.video.poster).url() : undefined
                    }
                  >
                    {item.video?.webm?.asset?.url && (
                      <source src={item.video.webm.asset.url} type="video/webm" />
                    )}
                    {item.video?.mp4?.asset?.url && (
                      <source src={item.video.mp4.asset.url} type="video/mp4" />
                    )}
                  </video>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>

      {aboutVisible && (
        <AboutOverlay aboutRef={aboutRef} onCloseAction={closeAbout} />
      )}
    </>
  );
}