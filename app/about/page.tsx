"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import "./about.css";
import { useSiteMenu } from "@/components/SiteMenuContext";
import { ROW_MODES, GRID_ROW_MODES } from "@/components/rowModes";

const ROWS: { key: string; content: ReactNode }[] = [
  {
    key: "focus-intro",
    content: (
      <p>
        Our focus is on conceptual and systemic design. Typography serves as
        our starting point for distinctive visual systems.
      </p>
    ),
  },
  {
    key: "explore",
    content: (
      <p>
        We explore how typography can shape identities, structures, and
        visual languages—from experimental type systems and editorial design
        to typography-driven identities.
      </p>
    ),
  },
  {
    key: "collaborate",
    content: (
      <p>
        For each project, we collaborate with a curated network of experts
        from various fields of visual communication.
      </p>
    ),
  },
  { key: "typography-first", content: <p>Typography-first identities</p> },
  { key: "corporate-typesetting", content: <p>Corporate typesetting</p> },
  { key: "editorial-design", content: <p>Editorial design</p> },
  { key: "experimental-font-systems", content: <p>Experimental font systems</p> },
  { key: "ux-ui", content: <p>UX / UI experience</p> },
  {
    key: "lecturer",
    content: (
      <p>
        Alongside my studio work, I am a university lecturer for layout and
        typography at the University of Arts Linz.
      </p>
    ),
  },
  { key: "tdc", content: <p>3x TDC Type Directors Club</p> },
  { key: "tdc-tokyo-nominee", content: <p>3x TDC Tokyo Prize Nominee Work</p> },
  { key: "tdc-tokyo-excellent", content: <p>4x TDC Tokyo Excellent Work</p> },
  { key: "adce-silver", content: <p>1x ADC*E Art Directors Club Europe silver</p> },
  { key: "adce-bronze", content: <p>1x ADC*E Art Directors Club Europe bronze</p> },
  { key: "cca-shortlist", content: <p>7x CCA Creativ Club Austria Shortlist</p> },
  { key: "binder-silver", content: <p>1x Joseph Binder Award Silver</p> },
  { key: "binder-distinction", content: <p>2x Joseph Binder Award Distinction</p> },
  { key: "ca-typography", content: <p>3x CA Comm. Arts Typography</p> },
  { key: "ca-design", content: <p>3x CA Comm. Arts Design</p> },
  { key: "hkda", content: <p>3x HKDA Hong Kong Global Design Award</p> },
  { key: "red-dot", content: <p>4x Red Dot Comm. Design</p> },
  { key: "berliner-type", content: <p>9x Berliner Type</p> },
  { key: "if-design", content: <p>2x IF Design Award</p> },
  { key: "good-design", content: <p>2x Good Design Award</p> },
  { key: "award360", content: <p>1x Award360 Shortlist</p> },
  {
    key: "phone",
    content: (
      <p>
        <a href="tel:+436763140568">+43 676 3140568</a>
      </p>
    ),
  },
  {
    key: "email",
    content: (
      <p>
        <a href="mailto:gerhard@kirchschlaeger.at">
          gerhard@kirchschlaeger.at
        </a>
      </p>
    ),
  },
  { key: "uid", content: <p>UID ATU49887500</p> },
];

const ROT3_ANGLES = [0, 90, 180];

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function AboutPage() {
  const [modeIndex, setModeIndex] = useState(0);
  const [cols, setCols] = useState(1);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const { setPageAction } = useSiteMenu();

  const mode = ROW_MODES[modeIndex];
  const isGridMode = GRID_ROW_MODES.includes(mode);

  const cycleMode = useCallback(() => {
    setModeIndex((index) => {
      const nextIndex = (index + 1) % ROW_MODES.length;
      if (GRID_ROW_MODES.includes(ROW_MODES[nextIndex])) {
        setCols(1);
      }
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    setPageAction(cycleMode);
    return () => setPageAction(null);
  }, [cycleMode, setPageAction]);

  useEffect(() => {
    rowRefs.current.forEach((row) => {
      if (!row) return;
      const rotdir = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9);
      const rot3 = ROT3_ANGLES[Math.floor(Math.random() * ROT3_ANGLES.length)];
      row.style.setProperty("--rotdir", rotdir.toFixed(2));
      row.style.setProperty("--rot3", `${rot3}deg`);
    });
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    function handlePointerMove(event: PointerEvent) {
      if (!sheet) return;
      const rect = sheet.getBoundingClientRect();
      const mx = clamp01((event.clientX - rect.left) / rect.width);
      const my = clamp01((event.clientY - rect.top) / rect.height);
      sheet.style.setProperty("--mx", mx.toFixed(3));
      sheet.style.setProperty("--my", my.toFixed(3));

      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const row = el?.closest<HTMLElement>(".about-row");
      if (row?.dataset.rowIndex) {
        sheet.style.setProperty("--focus", row.dataset.rowIndex);
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const handleSheetClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isGridMode) return;
    if ((event.target as HTMLElement).closest("a[href]")) return;
    setCols((count) => (count >= 20 ? 1 : count + 1));
  };

  return (
    <div
      ref={sheetRef}
      className={`about-sheet mode-${mode}`}
      style={{ "--cols": cols } as CSSProperties}
      onClick={handleSheetClick}
    >
      <Link href="/" className="back-button">

      </Link>

      <main className="about">
        {ROWS.map((row, index) => (
          <section
            key={row.key}
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            className="about-row"
            data-row-index={index}
            style={{ "--i": index } as CSSProperties}
          >
            {row.content}
          </section>
        ))}
      </main>
    </div>
  );
}
