"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSiteMenu } from "@/components/SiteMenuContext";
import { ROW_MODES } from "@/components/rowModes";

const CLOSE_LABEL_ROUTES = ["/about", "/impressum-privacy-policy", "/fonts"];
const HIDE_BUTTON_ROUTES: string[] = [];
const ROT3_ANGLES = [0, 90, 180];

function matchesRoute(pathname: string | null, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );
}

function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function rowStyle(index: number) {
  return { "--i": index } as CSSProperties;
}

export default function SiteMenu() {
  const { open, setOpen, pageAction } = useSiteMenu();
  const pathname = usePathname();
  const showCloseLabel = matchesRoute(pathname, CLOSE_LABEL_ROUTES);
  const hideButton = matchesRoute(pathname, HIDE_BUTTON_ROUTES);

  const [menuModeIndex, setMenuModeIndex] = useState(0);
  const menuMode = ROW_MODES[menuModeIndex];
  const panelRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLElement | null)[]>([]);

  const cycleMenuMode = useCallback(() => {
    setMenuModeIndex((index) => (index + 1) % ROW_MODES.length);
  }, []);

  const handleRefreshClick = () => {
    if (open) {
      cycleMenuMode();
      return;
    }
    pageAction?.();
  };

  const showRefreshButton = !hideButton && ((showCloseLabel && !open) || open);

  useEffect(() => {
    linkRefs.current.forEach((link) => {
      if (!link) return;
      const rotdir = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.9);
      const rot3 = ROT3_ANGLES[Math.floor(Math.random() * ROT3_ANGLES.length)];
      link.style.setProperty("--rotdir", rotdir.toFixed(2));
      link.style.setProperty("--rot3", `${rot3}deg`);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    function handlePointerMove(event: PointerEvent) {
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      const mx = clamp01((event.clientX - rect.left) / rect.width);
      const my = clamp01((event.clientY - rect.top) / rect.height);
      panel.style.setProperty("--mx", mx.toFixed(3));
      panel.style.setProperty("--my", my.toFixed(3));

      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      const link = el?.closest<HTMLElement>("[data-row-index]");
      if (link?.dataset.rowIndex) {
        panel.style.setProperty("--focus", link.dataset.rowIndex);
      }
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [open]);

  return (
    <div className="site-menu">
      <div
        ref={panelRef}
        className={`site-menu-panel mode-${menuMode} ${open ? "is-open" : ""}`.trim()}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <div className="site-menu-panel-inner">
          <div className="site-menu-links">
            <Link
              href="/#"
              ref={(el) => {
                linkRefs.current[0] = el;
              }}
              data-row-index={0}
              style={rowStyle(0)}
              onClick={() => setOpen(false)}
            >
              gerhrad   kirchschläger
            </Link>
            <Link
              href="/about"
              ref={(el) => {
                linkRefs.current[1] = el;
              }}
              data-row-index={1}
              style={rowStyle(1)}
              onClick={() => setOpen(false)}
            >
              about
            </Link>
            <Link
              href="/play"
              ref={(el) => {
                linkRefs.current[3] = el;
              }}
              data-row-index={3}
              style={rowStyle(3)}
              onClick={() => setOpen(false)}
            >
              play
            </Link>
            <Link
              href="/fonts"
              ref={(el) => {
                linkRefs.current[4] = el;
              }}
              data-row-index={4}
              style={rowStyle(4)}
              onClick={() => setOpen(false)}
            >
              fonts
            </Link>
          </div>

          <div className="site-menu-links site-menu-links--contact">
            <a
              href="https://www.google.com/maps/place/Bahnhofplatz+1,+4600+Wels,+Austria"
              target="_blank"
              rel="noreferrer"
              ref={(el) => {
                linkRefs.current[5] = el;
              }}
              data-row-index={5}
              style={rowStyle(5)}
              onClick={() => setOpen(false)}
            >
              address
            </a>
            <a
              href="mailto:gerhard@kirchschlaeger.at"
              ref={(el) => {
                linkRefs.current[6] = el;
              }}
              data-row-index={6}
              style={rowStyle(6)}
              onClick={() => setOpen(false)}
            >
              mail
            </a>
            <a
              href="tel:+436763140568"
              ref={(el) => {
                linkRefs.current[7] = el;
              }}
              data-row-index={7}
              style={rowStyle(7)}
              onClick={() => setOpen(false)}
            >
              phone
            </a>
            <a
              href="https://instagram.com/gerhard.kirchschlaeger"
              target="_blank"
              rel="noreferrer"
              ref={(el) => {
                linkRefs.current[8] = el;
              }}
              data-row-index={8}
              style={rowStyle(8)}
              onClick={() => setOpen(false)}
            >
              inst.
            </a>
          </div>

          <div className="site-menu-links">
            <Link
              href="/impressum-privacy-policy#imprint"
              ref={(el) => {
                linkRefs.current[9] = el;
              }}
              data-row-index={9}
              style={rowStyle(9)}
              onClick={() => setOpen(false)}
            >
              legal
            </Link>
          </div>
        </div>
      </div>

      {showRefreshButton && (
        <button
          type="button"
          className="site-menu-refresh-button"
          aria-label="Next mode"
          onClick={handleRefreshClick}
        >
          <img src="/refresh-icon.svg" alt="Next mode" />
        </button>
      )}

      {!open && !hideButton && (
        <div
          className={`site-menu-button-group ${showCloseLabel ? "site-menu-button-group--top" : ""}`.trim()}
        >
          <button
            type="button"
            className="site-menu-button"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <a>{showCloseLabel ? "(x)" : "menu"}</a>
          </button>
        </div>
      )}
    </div>
  );
}
