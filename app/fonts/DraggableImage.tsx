"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type Position = { x: number; y: number };

export default function DraggableImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ pointerX: number; pointerY: number; origin: Position } | null>(
    null,
  );

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      origin: position,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!dragStart.current) return;
    const { pointerX, pointerY, origin } = dragStart.current;
    setPosition({
      x: origin.x + (event.clientX - pointerX),
      y: origin.y + (event.clientY - pointerY),
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    dragStart.current = null;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <figure
      className={`${className ?? ""} ${dragging ? "is-dragging" : ""}`.trim()}
      style={{
        ...style,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img src={src} alt={alt} draggable={false} />
    </figure>
  );
}
