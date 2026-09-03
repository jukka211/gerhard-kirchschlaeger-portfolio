"use client";

import type { ReactNode } from "react";

/**
 * The sidebar's vocabulary.
 *
 * Every control in the panel is one of these five, so the whole thing has one
 * rhythm: a numbered section holds labelled fields, and a field holds either a
 * segmented row of choices, a slider with its number, or a plain number.
 * They're presentational on purpose — all the state lives in GridTool, and
 * these only know how to draw it.
 */

export function Section({
  index,
  title,
  children,
}: {
  /** The step number shown against the heading. */
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="gt-section">
      <h2 className="gt-section-title">
        <span className="gt-section-index">{index}</span>
        {title}
      </h2>
      <div className="gt-section-body">{children}</div>
    </section>
  );
}

/** A labelled row. `stacked` puts the control on its own line underneath,
 * which is what anything wider than a couple of buttons needs. */
export function Field({
  label,
  hint,
  stacked = false,
  children,
}: {
  label?: string;
  hint?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`gt-field ${stacked ? "gt-field--stacked" : ""}`}>
      {label && <span className="gt-field-label">{label}</span>}
      <div className="gt-field-control">{children}</div>
      {hint && <p className="gt-field-hint">{hint}</p>}
    </div>
  );
}

export interface Choice<T> {
  value: T;
  label: string;
  title?: string;
}

/** One choice out of a handful, as a row of joined buttons. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="gt-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={`gt-seg ${option.value === value ? "gt-seg--on" : ""}`}
          onClick={() => onChange(option.value)}
          disabled={disabled}
          title={option.title}
          aria-pressed={option.value === value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * A slider and the number it's showing, driving the same value.
 *
 * The slider is for finding a value by eye and the number for saying one
 * exactly; both are clamped by the caller, which is the only place that knows
 * what the value means.
 */
export function Slider({
  id,
  value,
  min,
  max,
  step = 1,
  suffix,
  disabled = false,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const commit = (raw: string) => {
    const next = Number(raw);
    if (Number.isFinite(next)) onChange(next);
  };

  return (
    <div className="gt-slider">
      <input
        id={id}
        type="range"
        className="gt-range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => commit(event.target.value)}
      />
      <span className="gt-slider-value">
        <input
          type="number"
          className="gt-number"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => commit(event.target.value)}
          aria-label={suffix}
        />
        {suffix && <span className="gt-unit">{suffix}</span>}
      </span>
    </div>
  );
}

/** A button that stays pressed. */
export function Toggle({
  on,
  onClick,
  disabled = false,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`gt-btn ${on ? "gt-btn--on" : ""}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={on}
    >
      {children}
    </button>
  );
}
