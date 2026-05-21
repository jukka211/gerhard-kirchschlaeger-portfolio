"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

type AboutOverlayProps = {
  aboutRef: RefObject<HTMLDivElement | null>;
  onCloseAction: () => void;
};

const ROWS = [
  "Our focus is on conceptual and systemic design. Typography serves as our starting point for distinctive visual systems.",
  "We explore how typography can shape identities, structures, and visual languages—from experimental type systems and editorial design to typography-driven identities.",
  "For each project, we collaborate with a curated network of experts from various fields of visual communication.",
  "Typography-first identities",
  "Corporate typesetting",
  "Editorial design",
  "Experimental font systems",
  "UX / UI experience",
  "Alongside my studio work, I am a university lecturer for layout and typography at the University of Arts Linz.",
  "3x TDC Type Directors Club",
  "3x TDC Tokyo Prize Nominee Work",
  "4x TDC Tokyo Excellent Work",
  "1x ADC*E Art Directors Club Europe siver",
  "1x ADC*E Art Directors Club Europe bronze",
  "7x CCA Creativ Club Austria Shortlist",
  "1x Joseph Binder Award Silver",
  "2x Joseph Binder Award Distinction",
  "3x CA Comm. Arts Typography",
  "3x CA Comm. Arts Design",
  "3x HKDA Hongkong Global Design Award",
  "4x Red Dot Comm. Design",
  "9x Berliner Type",
  "2x IF Design Award",
  "2x Good Design Award",
  "1x Award360 (Shortlist)",
  "+43 676 3140568",
  "gerhard@kirchschlaeger.at",
  "UID ATU49887500",
  "Fonts",
  "Web.",
  "Inst.",
] as const;

const LINK_MAP: Record<string, string> = {
  "Fonts": "https://fonts.gerhardkirchschlaeger.at",
  "Web.": "https://gerhardkirchschlaeger.at",
  "Inst.": "https://instagram.com/gerhard.kirchschlaeger",
};

const DESKTOP_BASE = 32;
const DESKTOP_HOVER = 150;
const MOBILE_SIZE = 28;

export default function AboutOverlay({
  aboutRef,
  onCloseAction,
}: AboutOverlayProps) {
  const contentRef = useRef<HTMLElement | null>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const measureRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
    [activeIndex]
  );

  const applySizes = useCallback(() => {
    if (!contentRef.current || isMobile) return;

    const content = contentRef.current;
    const availableHeight =
      window.innerHeight -
      parseFloat(getComputedStyle(content).paddingTop) -
      parseFloat(getComputedStyle(content).paddingBottom);

    const widths = rowRefs.current.map((row) =>
      row ? row.getBoundingClientRect().width : 0
    );

    const measureHeightAtSize = (index: number, size: number) => {
      const el = measureRefs.current[index];
      if (!el) return 0;
      el.style.width = `${widths[index]}px`;
      el.style.fontSize = `${size}px`;
      return el.getBoundingClientRect().height;
    };

    const minHeights = ROWS.map((_, i) => measureHeightAtSize(i, DESKTOP_BASE));
    const totalMin = minHeights.reduce((a, b) => a + b, 0);

    if (activeIndex === null || totalMin >= availableHeight) {
      const ratio = Math.min(1, availableHeight / totalMin);
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        row.style.setProperty("--row-size", `${DESKTOP_BASE * ratio}px`);
      });
      return;
    }

    const hoveredHeightAtTarget = measureHeightAtSize(activeIndex, DESKTOP_HOVER);
    const othersMinTotal = minHeights.reduce(
      (sum, h, i) => sum + (i === activeIndex ? 0 : h),
      0
    );

    if (hoveredHeightAtTarget + othersMinTotal <= availableHeight) {
      rowRefs.current.forEach((row, i) => {
        if (!row) return;
        row.style.setProperty(
          "--row-size",
          `${i === activeIndex ? DESKTOP_HOVER : DESKTOP_BASE}px`
        );
      });
      return;
    }

    const hoveredMinHeight = minHeights[activeIndex];
    const freeForHovered = Math.max(hoveredMinHeight, availableHeight - othersMinTotal);
    const ratio = freeForHovered / hoveredHeightAtTarget;
    const hoveredSize = Math.max(DESKTOP_BASE, DESKTOP_HOVER * ratio);

    rowRefs.current.forEach((row, i) => {
      if (!row) return;
      row.style.setProperty(
        "--row-size",
        `${i === activeIndex ? hoveredSize : DESKTOP_BASE}px`
      );
    });
  }, [activeIndex, isMobile]);

  useEffect(() => {
    if (isMobile) return;

    applySizes();

    const resizeObserver = new ResizeObserver(() => applySizes());
    if (contentRef.current) resizeObserver.observe(contentRef.current);
    rowRefs.current.forEach((row) => row && resizeObserver.observe(row));

    window.addEventListener("resize", applySizes);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", applySizes);
    };
  }, [applySizes, isMobile]);

  return (
    <div ref={aboutRef} className="about-sheet">
      <button type="button" className="back-button" onClick={onCloseAction}>
        ( X )
      </button>

      <main ref={contentRef} className="about">
        {ROWS.map((item, index) => {
          const href = LINK_MAP[item];

          return (
            <section
              key={`${item}-${index}`}
              ref={(el) => {
                rowRefs.current[index] = el;
              }}
              className="about-row"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {href ? (
                <p>
                  <a href={href} target="_blank" rel="noreferrer">
                    {item}
                  </a>
                </p>
              ) : (
                <p>{item}</p>
              )}

              <p
                ref={(el) => {
                  measureRefs.current[index] = el;
                }}
                className="about-row-measure"
                aria-hidden="true"
              >
                {item}
              </p>
            </section>
          );
        })}
      </main>
    </div>
  );
}