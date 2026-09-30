"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import type { PointerEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePageModes } from "@/components/PageModesContext";
import { GRID_SIZES, useSlideshow } from "@/components/SlideshowContext";
import { SITE_FONTS } from "@/components/siteFonts";

// Each text row in a different one of the site fonts; see type-tester.css.
const MIXED_ID = "mixed";

// Display names for the row modes whose ids run words together.
const MODE_LABELS: Record<string, string> = {
  fontsize: "font size",
  lineheight: "line height",
  gridrot: "grid rotated",
};

type SliderKey = "size" | "tracking" | "leading" | "rotation" | "columns";

type Slider = {
  key: SliderKey;
  label: string;
  min: number;
  max: number;
  step: number;
  // Where the thumb sits while the property is still on auto.
  rest: number;
  format: (value: number) => string;
  toCss: (value: number) => string;
};

const SLIDERS: Slider[] = [
  {
    key: "size",
    label: "size",
    min: 6,
    max: 800,
    step: 1,
    rest: 14,
    format: (value) => `${value} px`,
    toCss: (value) => `${value}px`,
  },
  {
    key: "tracking",
    label: "tracking",
    min: -0.2,
    max: 1,
    step: 0.01,
    rest: 0,
    format: (value) => `${value.toFixed(2)} em`,
    toCss: (value) => `${value}em`,
  },
  {
    key: "leading",
    label: "line height",
    // CSS has no negative line height, so 0 (every line on top of the
    // last) is as tight as it goes.
    min: 0,
    max: 3,
    step: 0.05,
    rest: 1.15,
    format: (value) => value.toFixed(2),
    toCss: (value) => `${value}`,
  },
  {
    key: "rotation",
    label: "rotation",
    min: -180,
    max: 180,
    step: 1,
    rest: 0,
    format: (value) => `${value}°`,
    toCss: (value) => `${value}deg`,
  },
  {
    key: "columns",
    label: "columns",
    min: 1,
    max: 8,
    step: 1,
    rest: 1,
    format: String,
    toCss: String,
  },
];

const ALIGNS = ["left", "center", "right"] as const;

type Align = (typeof ALIGNS)[number];

// A null font or slider means auto: the page's own styles (and its row
// modes) apply. Align is always set; centre is what the pages have anyway.
type Settings = { font: string | null; align: Align } & Record<SliderKey, number | null>;

const AUTO: Settings = {
  font: null,
  align: "center",
  size: null,
  tracking: null,
  leading: null,
  rotation: null,
  columns: null,
};

const NAV_LINKS = [
  { label: "home", href: "/", route: "/" },
  { label: "info", href: "/about", route: "/about" },
  { label: "legal", href: "/impressum-privacy-policy#imprint", route: "/impressum-privacy-policy" },
];

// The font this visit opened in (see siteFonts.ts), which the font list
// shows until another is picked. It's set before the page paints and never
// changes, so there's nothing to subscribe to; the server, which can't know
// it, renders the first font until hydration swaps in the real one.
const subscribeToNothing = () => () => {};

function useSiteFontId() {
  return useSyncExternalStore(subscribeToNothing, siteFontId, () => SITE_FONTS[0].id);
}

function siteFontId() {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--site-font")
    .trim()
    .replace(/^"|"$/g, "");
  return (SITE_FONTS.find((font) => font.family === family) ?? SITE_FONTS[0]).id;
}

function isCurrent(pathname: string | null, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname?.startsWith(`${route}/`);
}

export default function TypeTester() {
  const id = useId();
  const pathname = usePathname();
  // The current page's row modes, if it has any.
  const { pageModes: modes } = usePageModes();
  const slideshow = useSlideshow();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(AUTO);
  const siteFont = useSiteFontId();

  // Settings live on <html> so they survive navigating between the about
  // and legal pages; type-tester.css maps each data-tt-* flag onto the
  // text of both.
  useEffect(() => {
    const root = document.documentElement;
    const flags: Record<string, string> = {};
    const vars: Record<string, string> = {};

    if (settings.font === MIXED_ID) {
      flags.font = MIXED_ID;
    } else {
      const family = SITE_FONTS.find((font) => font.id === settings.font)?.family;
      if (family) {
        flags.font = "";
        vars.font = `"${family}", monospace`;
      }
    }
    for (const { key, toCss } of SLIDERS) {
      const value = settings[key];
      if (value === null) continue;
      flags[key] = "";
      vars[key] = toCss(value);
    }
    flags.align = "";
    vars.align = settings.align;

    for (const [key, value] of Object.entries(flags)) root.setAttribute(`data-tt-${key}`, value);
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(`--tt-${key}`, value);

    return () => {
      for (const key of Object.keys(flags)) root.removeAttribute(`data-tt-${key}`);
      for (const key of Object.keys(vars)) root.style.removeProperty(`--tt-${key}`);
    };
  }, [settings]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  // The navigation and the settings are two boxes stacked in the top-right
  // corner. Closed, the settings box shrinks to its head bar.
  return (
    <div className="type-tester">
      {/* Phones only (see type-tester.css): the open settings cover much of
          the screen there, so a tap anywhere on the page closes them, and
          does nothing else. */}
      {open && (
        <div className="type-tester-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
      )}

      <nav className="type-tester-box type-tester-nav" aria-label="Site">
        <div className="type-tester-segments">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.route}
              href={link.href}
              aria-current={isCurrent(pathname, link.route) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      <section
        className={`type-tester-box type-tester-panel ${open ? "is-open" : ""}`.trim()}
        aria-label="Settings"
      >
        {/* The whole bar opens and closes the settings, not just the triangle. */}
        <button
          type="button"
          className="type-tester-head"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={() => setOpen((value) => !value)}
        >
          <span>settings</span>
          <span className="type-tester-toggle" aria-hidden="true">
            <svg width="10" height="6" viewBox="0 0 10 6">
              <path d="M0 0h10L5 6z" fill="currentColor" />
            </svg>
          </span>
        </button>

        {/* Always mounted, so opening and closing can slide: the drawer's one
            row grows from nothing to the controls' height. Inert while
            closed, so nothing in it can be focused or clicked. */}
        <div className="type-tester-drawer" inert={!open}>
          <div className="type-tester-drawer-inner">
            {/* With a slideshow on the page the panel offers only its grid
                size, otherwise only the type settings. */}
            <div id={`${id}-body`} className="type-tester-body">
              {slideshow.active ? (
                <GridSizeField
                  id={`${id}-grid`}
                  size={slideshow.gridSize}
                  onChange={slideshow.setGridSize}
                />
              ) : (
                <>
                  <div className="type-tester-field">
                    <label htmlFor={`${id}-font`}>font</label>
                    <select
                      id={`${id}-font`}
                      value={settings.font ?? siteFont}
                      onChange={(event) => update("font", event.target.value)}
                    >
                      {SITE_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.label}
                        </option>
                      ))}
                      <option value={MIXED_ID}>Mixed</option>
                    </select>
                  </div>

                  {SLIDERS.map((slider) => {
                    const value = settings[slider.key];
                    const inputId = `${id}-${slider.key}`;

                    return (
                      <div
                        key={slider.key}
                        className={`type-tester-field ${value === null ? "is-auto" : ""}`.trim()}
                      >
                        <div className="type-tester-label">
                          <label htmlFor={inputId}>{slider.label}</label>
                          <button
                            type="button"
                            className="type-tester-value"
                            title="Back to auto"
                            disabled={value === null}
                            onClick={() => update(slider.key, null)}
                          >
                            {value === null ? "auto" : slider.format(value)}
                          </button>
                        </div>
                        <RangeInput
                          id={inputId}
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          value={value ?? slider.rest}
                          onValueChange={(next) => update(slider.key, next)}
                        />
                      </div>
                    );
                  })}

                  <div className="type-tester-field">
                    <span id={`${id}-align`}>align</span>
                    <div
                      className="type-tester-segments"
                      role="group"
                      aria-labelledby={`${id}-align`}
                    >
                      {ALIGNS.map((align) => (
                        <button
                          key={align}
                          type="button"
                          aria-pressed={settings.align === align}
                          onClick={() => update("align", align)}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {modes && (
                    <div className="type-tester-field">
                      <label htmlFor={`${id}-mode`}>mode</label>
                      <select
                        id={`${id}-mode`}
                        value={modes.mode}
                        onChange={(event) => modes.setMode(event.target.value)}
                      >
                        {/* Default is only what the page opens on: shown, but not in the list. */}
                        {modes.modes.map((mode) => (
                          <option
                            key={mode}
                            value={mode}
                            disabled={mode === "default"}
                            hidden={mode === "default"}
                          >
                            {MODE_LABELS[mode] ?? mode}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// The home grid's size. The slider moves through GRID_SIZES rather than
// every number, so it holds each stop's index.
function GridSizeField({
  id,
  size,
  onChange,
}: {
  id: string;
  size: number;
  onChange: (size: number) => void;
}) {
  return (
    <div className="type-tester-field">
      <div className="type-tester-label">
        <label htmlFor={id}>grid</label>
        <span>
          {size} × {size}
        </span>
      </div>
      <RangeInput
        id={id}
        min={0}
        max={GRID_SIZES.length - 1}
        step={1}
        value={GRID_SIZES.indexOf(size as (typeof GRID_SIZES)[number])}
        onValueChange={(index) => onChange(GRID_SIZES[index])}
      />
    </div>
  );
}

// A range input that also follows a finger. Touch browsers only move a range
// when the drag starts right on its small thumb (iOS Safari won't even jump
// to a tap), so a touch anywhere on the track sets the value from where the
// finger is and keeps doing so while it moves. Mouse and keyboard use the
// input as usual.
function RangeInput({
  id,
  min,
  max,
  step,
  value,
  onValueChange,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onValueChange: (value: number) => void;
}) {
  const decimals = String(step).split(".")[1]?.length ?? 0;

  function setFromPointer(event: PointerEvent<HTMLInputElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const steps = Math.round((ratio * (max - min)) / step);
    // Rounded to the step's decimals, so 0.05 steps don't come out as 0.15000000000000002.
    onValueChange(Number((min + steps * step).toFixed(decimals)));
  }

  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
      onPointerDown={(event) => {
        if (event.pointerType !== "touch") return;
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "touch") return;
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        setFromPointer(event);
      }}
    />
  );
}
