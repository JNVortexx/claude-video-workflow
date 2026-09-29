import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile } from "remotion";

// Weiche Zooms für beide Videos: jede Bewegung startet auf einem Schnitt (oder Schlüsselwort) und
// rollt mit ease-in-out aus – die Skalierung springt nie. Schnelle Zooms bekommen leichte Bewegungsunschärfe.
export type ZoomMove = { at: number; dur: number; to: number };

const zoomEase = Easing.bezier(0.45, 0, 0.25, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const zoomAt = (moves: ZoomMove[], start: number, frame: number, fps: number) => {
  let scale = start;
  for (const m of moves) {
    const s = m.at * fps;
    if (frame < s) break;
    scale = interpolate(frame, [s, s + m.dur * fps], [scale, m.to], { ...clamp, easing: zoomEase });
  }
  return scale;
};

export const ZoomedVideo: React.FC<{
  src: string;
  frame: number;
  fps: number;
  moves: ZoomMove[];
  start?: number;
  origin?: string;
  enabled?: boolean;
  shake?: { x: number; y: number; r: number }; // optionaler Screen-Shake (Pitch Szene 3)
  filter?: string; // zusätzliche Grading-Filter (z. B. Licht-Abfall)
}> = ({ src, frame, fps, moves, start = 1, origin = "50% 28%", enabled = true, shake, filter }) => {
  const z = enabled ? zoomAt(moves, start, frame, fps) : 1;
  const speed = enabled ? Math.abs(z - zoomAt(moves, start, frame - 1, fps)) : 0;
  const mBlur = Math.min(3, Math.max(0, (speed - 0.008) * 260));
  const filters = [mBlur > 0.2 ? `blur(${mBlur}px)` : "", filter ?? ""].filter(Boolean).join(" ");
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <OffthreadVideo
        src={staticFile(src)}
        muted
        style={{
          width: "100%",
          height: "100%",
          scale: String(z),
          transformOrigin: origin,
          translate: shake ? `${shake.x}px ${shake.y}px` : undefined,
          rotate: shake ? `${shake.r}deg` : undefined,
          filter: filters || undefined,
        }}
      />
    </AbsoluteFill>
  );
};
