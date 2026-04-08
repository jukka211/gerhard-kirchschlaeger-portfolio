"use client";

import Link from "next/link";
import {useLayoutEffect, useRef} from "react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import {urlFor} from "@/sanity/lib/image";
import type {GalleryItem} from "@/types/sanity";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  items: GalleryItem[];
};

export default function HorizontalGallery({items}: Props) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const slider = sliderRef.current;
    const wrapper = wrapperRef.current;

    if (!slider || !wrapper) return;

    const setupHorizontalScroll = () => {
      const totalWidth = wrapper.scrollWidth;
      const scrollLength = Math.max(totalWidth - window.innerWidth, 0);

      document.body.style.height = `${scrollLength + window.innerHeight}px`;

      ScrollTrigger.getAll().forEach((st) => st.kill());

      gsap.set(wrapper, {x: 0});

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
    };

    setupHorizontalScroll();
    window.addEventListener("resize", setupHorizontalScroll);

    return () => {
      window.removeEventListener("resize", setupHorizontalScroll);
      ScrollTrigger.getAll().forEach((st) => st.kill());
      document.body.style.height = "";
    };
  }, [items]);

  return (
    <>
      <div className="site-header">
        <Link href="/about" className="info">
          <p>Info</p>
        </Link>
      </div>

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
    </>
  );
}