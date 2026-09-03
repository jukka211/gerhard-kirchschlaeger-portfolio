"use client";

import { useRef } from "react";
import type { Cell, MediaType } from "./gridLayout";

interface GridCellContentProps {
  cell: Cell;
  canRemove: boolean;
  /**
   * Whether this is the copy that owns the cell's controls. Column mode can
   * draw the same cell several times down a strip; only one of them should
   * offer to replace or remove it, and the clones are inert scenery.
   */
  interactive?: boolean;
  onRemove: (id: string) => void;
  onMediaFile: (id: string, type: MediaType, file: File) => void;
  onMediaClear: (id: string) => void;
}

const ACCEPT: Record<MediaType, string> = {
  image: "image/*",
  video: "video/*",
};

const LABEL: Record<MediaType, string> = {
  image: "Image",
  video: "Video",
};

export default function GridCellContent({
  cell,
  canRemove,
  interactive = true,
  onRemove,
  onMediaFile,
  onMediaClear,
}: GridCellContentProps) {
  const fileInputs = useRef<Partial<Record<MediaType, HTMLInputElement | null>>>({});

  const pickFile = (type: MediaType) => fileInputs.current[type]?.click();

  const handleFileChange = (
    type: MediaType,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) onMediaFile(cell.id, type, file);
    event.target.value = "";
  };

  return (
    <div className={`gt-cell ${interactive ? "" : "gt-cell--clone"}`}>
      {interactive && (
        <div className="gt-cell-toolbar">
          <button
            type="button"
            className="gt-chip gt-chip--danger"
            onClick={() => onRemove(cell.id)}
            disabled={!canRemove}
            title="Remove cell"
          >
            ×
          </button>
        </div>
      )}

      <div className="gt-cell-media">
        {cell.media?.type === "image" && (
          <img src={cell.media.url} alt={cell.media.name} draggable={false} />
        )}
        {cell.media?.type === "video" && (
          <video src={cell.media.url} autoPlay loop muted playsInline />
        )}
        {!cell.media && interactive && (
          <div className="gt-cell-empty">
            {(Object.keys(ACCEPT) as MediaType[]).map((type) => (
              <button
                key={type}
                type="button"
                className="gt-upload-btn"
                onClick={() => pickFile(type)}
              >
                + {LABEL[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {cell.media && interactive && (
        <div className="gt-cell-footer">
          <span className="gt-media-name">{cell.media.name}</span>
          <button
            type="button"
            className="gt-chip"
            onClick={() => onMediaClear(cell.id)}
          >
            replace
          </button>
        </div>
      )}

      {interactive && (Object.keys(ACCEPT) as MediaType[]).map((type) => (
        <input
          key={type}
          ref={(el) => {
            fileInputs.current[type] = el;
          }}
          type="file"
          accept={ACCEPT[type]}
          className="gt-file-input"
          onChange={(event) => handleFileChange(type, event)}
        />
      ))}
    </div>
  );
}
