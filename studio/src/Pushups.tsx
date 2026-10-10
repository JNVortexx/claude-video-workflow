import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/fonts";
import { BRAND } from "./brand";
import { BROLL_START, CHUNKS, Chunk, REPS, REP_TARGET } from "./beats";

const fontFamily = "Montserrat";
loadFont({ family: fontFamily, url: staticFile("fonts/Montserrat.woff2"), weight: "700 900" });

export const FPS = 24;
export const DURATION = 574;
const CAP_Y = 1470; // feste Position (unter dem Gesicht / auf dem Teppich)
const SIZE = 88;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const SHADOW = "0 3px 22px rgba(5,7,12,0.65), 0 2px 5px rgba(5,7,12,0.75)";

// kurzes, sauberes Flackern beim Erscheinen (Frames relativ zum Start)
const FLICK = [0, 1, 0.2, 1, 0.55, 1];
const flicker = (d: number) => (d < 0 ? 0 : d >= FLICK.length ? 1 : FLICK[Math.floor(d)]);

const WordEl: React.FC<{ text: string; start: number; frame: number; color: string; size: number; shadow: boolean }> = ({ text, start, frame, color, size, shadow }) => {
  const d = frame - start;
  const k = interpolate(d, [0, 6], [0, 1], { ...clamp, easing: expoOut });
  const blur = interpolate(d, [0, 3], [5, 0], clamp);
  return (
    <span style={{ display: "inline-block", flexShrink: 0, overflow: "hidden", padding: "0.08em 0.05em 0.16em", margin: "-0.08em -0.05em -0.16em", verticalAlign: "bottom" }}>
      <span
        style={{
          display: "inline-block",
          fontFamily,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.06,
          letterSpacing: -1,
          color,
          whiteSpace: "nowrap",
          opacity: flicker(d),
          translate: `0 ${(1 - k) * 100}%`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          textShadow: shadow ? SHADOW : undefined,
        }}
      >
        {text}
      </span>
    </span>
  );
};

const ChunkEl: React.FC<{ ch: Chunk; frame: number }> = ({ ch, frame }) => {
  const f0 = Math.round(ch.words[0].t * FPS);
  const box = ch.box;
  const chars = ch.words.reduce((a, w) => a + w.text.length + 1, -1);
  const size = box ? Math.min(90, Math.floor(860 / (chars * 0.64))) : SIZE;
  const textColor = box === "gold" ? BRAND.bg : BRAND.secondary;
  // Box: wischt von links auf, flackert kurz, minimaler Pop
  const d = frame - f0;
  // Box folgt der Sprache: wächst mit jedem Wort weiter nach rechts (wie ein Textmarker)
  const total = ch.words.reduce((a, w) => a + w.text.length + 1, 0);
  const wipe = ch.words.reduce((a, w) => a + ((w.text.length + 1) / total) * 100 * interpolate(frame - Math.round(w.t * FPS), [-1, 4], [0, 1], { ...clamp, easing: expoOut }), 0);
  const pop = interpolate(d, [0, 3, 7], [0.94, 1.04, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: CAP_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
      <div style={{ position: "relative", maxWidth: box ? 980 : 900, whiteSpace: box ? "nowrap" : undefined, padding: box ? "16px 34px 20px" : 0, scale: box ? String(pop) : undefined }}>
        {box && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 18,
              background: box === "gold" ? BRAND.accent1 : BRAND.primary,
              boxShadow: box === "red" ? `0 0 0 1.5px ${BRAND.secondary}, 0 10px 30px rgba(0,0,0,0.35)` : "0 10px 30px rgba(0,0,0,0.35)",
              clipPath: `inset(-4px ${100 - wipe}% -4px -4px)`,
              opacity: flicker(d),
            }}
          />
        )}
        <div style={{ position: "relative", display: "flex", flexWrap: box ? "nowrap" : "wrap", justifyContent: "center", columnGap: size * 0.26, rowGap: 4, textAlign: "center" }}>
          {ch.words.map((w, i) => (
            <WordEl key={i} text={w.text} start={Math.round(w.t * FPS)} frame={frame} color={textColor} size={size} shadow={!box} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Counter: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < BROLL_START) return null;
  const t = frame / FPS;
  const done = REPS.filter((r) => r <= t).length;
  const n = Math.min(REP_TARGET, Math.round((done / REPS.length) * REP_TARGET));
  const lastIdx = REPS.findIndex((r, i) => Math.round(((i + 1) / REPS.length) * REP_TARGET) === n);
  const since = n === 0 ? 99 : frame - Math.round(REPS[Math.max(0, lastIdx)] * FPS);
  const k = interpolate(since, [0, 3], [0, 1], { ...clamp, easing: expoOut });
  const d = frame - BROLL_START;
  const final = n >= REP_TARGET;
  const fin = final ? interpolate(since, [0, 4], [0, 1], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: 64, top: 150, opacity: flicker(d), translate: `0 ${interpolate(d, [0, 6], [30, 0], { ...clamp, easing: expoOut })}px` }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          padding: "10px 26px 14px",
          borderRadius: 18,
          background: final ? BRAND.accent1 : "rgba(10,13,20,0.82)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          scale: String(1 + 0.08 * fin * (1 - fin) * 4),
        }}
      >
        <span style={{ display: "inline-block", overflow: "hidden", height: 118, minWidth: 128, textAlign: "right" }}>
          <span style={{ display: "inline-block", fontFamily, fontWeight: 900, fontSize: 112, lineHeight: 1.05, letterSpacing: -3, color: final ? BRAND.bg : BRAND.accent1, translate: `0 ${(1 - k) * 60}%`, opacity: 0.4 + 0.6 * k, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        </span>
        <span style={{ fontFamily, fontWeight: 700, fontSize: 48, color: final ? BRAND.bg : BRAND.secondary, opacity: 0.85 }}>/{REP_TARGET}</span>
      </div>
    </div>
  );
};

export const Pushups: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // genau ein Chunk sichtbar: vom ersten Wort bis zum ersten Wort des nächsten Chunks
  const idx = CHUNKS.findIndex((c, i) => t >= c.words[0].t - 1 / FPS && (i === CHUNKS.length - 1 || t < CHUNKS[i + 1].words[0].t - 1 / FPS));
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <OffthreadVideo src={staticFile("plate.mp4")} muted transparent />
      {idx >= 0 && <ChunkEl key={idx} ch={CHUNKS[idx]} frame={frame} />}
      <Counter frame={frame} />
    </AbsoluteFill>
  );
};
