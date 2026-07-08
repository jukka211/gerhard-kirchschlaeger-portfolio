"use client";

import { useState } from "react";

export default function FontsInfoPanel({ introText }: { introText: string }) {
  const [open, setOpen] = useState(false);

  if (!introText) return null;

  return (
    <>
      <div
        className={`fonts-info-panel ${open ? "is-open" : ""}`.trim()}
        aria-hidden={!open}
      >
        <div className="fonts-info-panel-inner">
          {introText.split("\n").map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="fonts-info-button"
        aria-label={open ? "Close info" : "Open info"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        (info)
      </button>
    </>
  );
}
