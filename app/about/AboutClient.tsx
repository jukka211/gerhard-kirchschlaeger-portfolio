"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useSiteMenu } from "@/components/SiteMenuContext";
import { ROW_MODES, GRID_ROW_MODES } from "@/components/rowModes";
import type { AboutRow } from "@/types/sanity";

const ROT3_ANGLES = [0, 90, 180];

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function AboutClient({ rows }: { rows: AboutRow[] }) {
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
        {rows.map((row, index) => (
          <section
            key={row._key}
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            className="about-row"
            data-row-index={index}
            style={{ "--i": index } as CSSProperties}
          >
            {row.href ? (
              <p>
                <a href={row.href}>{row.text}</a>
              </p>
            ) : (
              <p>{row.text}</p>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
