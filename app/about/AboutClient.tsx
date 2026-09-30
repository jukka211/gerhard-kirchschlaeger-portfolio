"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePageModes } from "@/components/PageModesContext";
import { ROW_MODES, GRID_ROW_MODES, type RowMode } from "@/components/rowModes";
import type { AboutRow } from "@/types/sanity";

const ROT3_ANGLES = [0, 90, 180];

type Row = { key: string; content: ReactNode; href?: string };

// Under the rows from Sanity, after a blank line (a row holding just a
// <br>): the contact details. Rows like any other, so the modes and the
// type tester reach them too.
const CONTACT_ROWS: Row[] = [
  { key: "contact-break", content: <br /> },
  {
    key: "contact-instagram",
    content: "@gerhard.kirchschlaeger",
    href: "https://www.instagram.com/gerhard.kirchschlaeger/",
  },
  { key: "contact-phone", content: "+43 676 3140568", href: "tel:+436763140568" },
  {
    key: "contact-email",
    content: "gerhard@kirchschlaeger.at",
    href: "mailto:gerhard@kirchschlaeger.at",
  },
  {
    key: "contact-address",
    content: (
      <>
        Gerhard Kirchschläger,
        <br />
        Bahnhofplatz 1,
        <br />
        4600 Wels
        <br />
        AT
      </>
    ),
    href: "https://maps.app.goo.gl/WCeqwkDLHsS34HXg6",
  },
];

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export default function AboutClient({ rows }: { rows: AboutRow[] }) {
  const [mode, setMode] = useState<RowMode>("default");
  const [cols, setCols] = useState(1);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const { setPageModes } = usePageModes();

  const isGridMode = GRID_ROW_MODES.includes(mode);
  const allRows: Row[] = [
    ...rows.map((row) => ({ key: row._key, content: row.text, href: row.href })),
    ...CONTACT_ROWS,
  ];

  const selectMode = useCallback((next: string) => {
    const nextMode = next as RowMode;
    setMode(nextMode);
    if (GRID_ROW_MODES.includes(nextMode)) {
      setCols(1);
    }
  }, []);

  useEffect(() => {
    setPageModes({ modes: ROW_MODES, mode, setMode: selectMode });
    return () => setPageModes(null);
  }, [mode, selectMode, setPageModes]);

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
        {allRows.map((row, index) => (
          <section
            key={row.key}
            ref={(el) => {
              rowRefs.current[index] = el;
            }}
            className="about-row"
            data-row-index={index}
            style={{ "--i": index } as CSSProperties}
          >
            {row.href ? (
              <p>
                {/* Web links (Instagram, the map) open in a new tab. */}
                <a
                  href={row.href}
                  target={row.href.startsWith("http") ? "_blank" : undefined}
                  rel={row.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {row.content}
                </a>
              </p>
            ) : (
              <p>{row.content}</p>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
