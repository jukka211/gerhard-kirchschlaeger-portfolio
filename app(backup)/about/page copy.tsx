"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import "./about.css";

type MagneticLinesProps = {
  items: ReactNode[];
  minSize?: number;
  maxSize?: number;
  boost?: number;
};

const leftLines: ReactNode[] = [
  "Our focus is on conceptual and systemic design.",
  "Typography serves as our starting point for distinctive visual systems.",
  "We explore how typography can shape identities, structures, and visual languages—from experimental type systems and editorial design to typography-driven identities.",
  "For each project, we collaborate with a curated network of experts from various fields of visual communication.",
  "Selected fields of work include:",
  "■ Typography-first identities",
  "■ Corporate typesetting",
  "■ Editorial design",
  "■ Experimental font systems",
  "■ UX / UI experience",
  "Alongside my studio work, I am a university lecturer for layout and typography at the University of Arts Linz.",
];

const centerLines: ReactNode[] = [
  "3x TDC Type Directors Club",
  "3x TDC Tokyo Prize Nominee Work",
  "4x TDC Tokyo Excellent Work",
  "1x ADC*E Art Directors Club Europe silver",
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
];

const rightLines: ReactNode[] = [
  "Gerhard Kirchschläger",
  "Bahnhofplatz 1",
  "4600 Wels",
  "Austria",
  "+43 676 3140568",
  "gerhard@kirchschlaeger.at",
  "UID ATU49887500",
  <a key="fonts" href="https://fonts.gerhardkirchschlaeger.at">Fonts</a>,
  <a key="web" href="https://gerhardkirchschlaeger.at">Web.</a>,
  <a key="insta" href="https://instagram.com/gerhard.kirchschlaeger">Inst.</a>,
];

function MagneticLines({
  items,
  minSize = 0.9,
  maxSize = 3.8,
  boost = 2.8,
}: MagneticLinesProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (window.innerWidth <= 768) return;

    const wrap = wrapRef.current;
    const nodes = itemRefs.current.filter(
      (node): node is HTMLParagraphElement => node !== null
    );

    if (!wrap || nodes.length === 0) return;

    const getBaseSize = (index: number) => {
      if (nodes.length === 1) return maxSize;
      const t = index / (nodes.length - 1);
      return maxSize - (maxSize - minSize) * t;
    };

    const animateTo = (
      node: HTMLParagraphElement,
      size: number,
      duration: number
    ) => {
      gsap.to(node, {
        fontSize: `${size}rem`,
        duration,
        ease: "power3.out",
        overwrite: true,
      });
    };

    const reset = () => {
      nodes.forEach((node, index) => {
        animateTo(node, getBaseSize(index), 0.4);
      });
    };

    const onMove = (e: PointerEvent) => {
      const wrapRect = wrap.getBoundingClientRect();
      const maxDist = wrapRect.height * 0.45;

      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(e.clientY - centerY);
        const falloff = Math.max(0, 1 - dist / maxDist);
        const size = getBaseSize(index) + falloff * boost;

        animateTo(node, size, 0.18);
      });
    };

    reset();

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", reset);

    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", reset);
      nodes.forEach((node) => {
        gsap.killTweensOf(node);
        node.style.removeProperty("font-size");
      });
    };
  }, [items, minSize, maxSize, boost]);

  return (
    <div ref={wrapRef} className="magnetic-lines">
      {items.map((item: ReactNode, i: number) => (
        <p
          key={i}
          ref={(el: HTMLParagraphElement | null) => {
            itemRefs.current[i] = el;
          }}
        >
          {item}
        </p>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <Link href="/" className="back-button">
        ( Back )
      </Link>

      <main className="about">
        <section className="about-column left">
          <div className="about-text">
            <MagneticLines items={leftLines} minSize={0.85} maxSize={3.4} boost={2.4} />
          </div>
        </section>

        <section className="about-column center">
          <div className="about-text">
            <MagneticLines items={centerLines} minSize={0.8} maxSize={3.8} boost={2.8} />
          </div>
        </section>

        <section className="about-column right">
          <div className="about-text">
            <MagneticLines items={rightLines} minSize={0.8} maxSize={3.1} boost={2.2} />
          </div>
        </section>
      </main>
    </>
  );
}