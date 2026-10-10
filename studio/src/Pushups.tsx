import React from "react";
import { AbsoluteFill, Easing, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { MONTSERRAT_B64 } from "./fontData";
import { BROLL_START, CHUNKS, Chunk, REPS, REP_TARGET } from "./beats";

const fontFamily = "Montserrat";
// Schrift als Data-URL eingebettet (kein Netzwerk-Request pro Render-Tab → keine delayRender-Timeouts)
if (typeof document !== "undefined" && !document.getElementById("font-montserrat")) {
  const h = delayRender("Montserrat");
  const face = new FontFace(fontFamily, `url(data:font/woff2;base64,${MONTSERRAT_B64})`, { weight: "700 900" });
  face.load().then((f) => {
    document.fonts.add(f);
    continueRender(h);
  });
  const marker = document.createElement("meta");
  marker.id = "font-montserrat";
  document.head.appendChild(marker);
}

export const FPS = 24;
export const DURATION = 574;
const CAP_Y = 1470; // feste Position (unter dem Gesicht / auf dem Teppich)
const SIZE = 88;
const WHITE = "#FFFFFF"; // Text immer weiß, ohne Hintergrund
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);
const SHADOW = "0 0 3px rgba(5,7,12,0.55), 0 3px 8px rgba(5,7,12,0.6), 0 6px 28px rgba(5,7,12,0.55)";

// kurzes, sauberes Flackern beim Erscheinen (Frames relativ zum Start)
const FLICK = [0, 1, 0.2, 1, 0.55, 1];
const flicker = (d: number) => (d < 0 ? 0 : d >= FLICK.length ? 1 : FLICK[Math.floor(d)]);
const STROBE = [0, 1, 0, 1, 0, 0.7, 1];
const strobe = (d: number) => (d < 0 ? 0 : d >= STROBE.length ? 1 : STROBE[Math.floor(d)]);

// Effekte: slide (aus Maske hoch), drop (von oben), focus (Zoom + Blur), track (Laufweite zieht zusammen),
// type (Buchstabe für Buchstabe), strobe (hartes Flackern), punch (Highlights: groß, Overshoot + Flicker)
export type Fx = "slide" | "drop" | "focus" | "track" | "type" | "strobe" | "punch";
const PLAIN: Fx[] = ["slide", "focus", "drop", "type", "track", "strobe"];

const WordEl: React.FC<{ text: string; start: number; frame: number; size: number; weight: number; fx: Fx }> = ({ text, start, frame, size, weight, fx }) => {
  const d = frame - start;
  const k = interpolate(d, [0, 6], [0, 1], { ...clamp, easing: expoOut });
  const base: React.CSSProperties = { display: "inline-block", fontFamily, fontWeight: weight, fontSize: size, lineHeight: 1.06, letterSpacing: -1, color: WHITE, whiteSpace: "nowrap", textShadow: SHADOW };
  let inner: React.CSSProperties = {};
  let content: React.ReactNode = text;
  let mask = false;
  switch (fx) {
    case "slide": {
      mask = true;
      const blur = interpolate(d, [0, 3], [5, 0], clamp);
      inner = { opacity: flicker(d), translate: `0 ${(1 - k) * 100}%`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined };
      break;
    }
    case "drop": {
      mask = true;
      inner = { opacity: flicker(d), translate: `0 ${-(1 - k) * 100}%` };
      break;
    }
    case "focus": {
      const blur = interpolate(d, [0, 5], [14, 0], { ...clamp, easing: expoOut });
      inner = { opacity: interpolate(d, [0, 3], [0, 1], clamp), scale: String(interpolate(d, [0, 6], [1.35, 1], { ...clamp, easing: expoOut })), filter: blur > 0.3 ? `blur(${blur}px)` : undefined };
      break;
    }
    case "track": {
      inner = { opacity: flicker(d), letterSpacing: interpolate(d, [0, 7], [size * 0.32, -1], { ...clamp, easing: expoOut }) };
      break;
    }
    case "type": {
      // Buchstaben erscheinen schnell nacheinander, jeder mit Mini-Flicker
      const per = Math.min(1, 5 / Math.max(1, text.length));
      content = text.split("").map((ch, i) => {
        const cd = d - i * per;
        return <span key={i} style={{ opacity: cd < 0 ? 0 : cd < 1 ? 0.35 : 1 }}>{ch}</span>;
      });
      break;
    }
    case "strobe": {
      inner = { opacity: strobe(d), translate: `0 ${(1 - k) * 18}px` };
      break;
    }
    case "punch": {
      mask = false;
      const sc = interpolate(d, [0, 5], [0.55, 1], { ...clamp, easing: backOut });
      const blur = interpolate(d, [0, 3], [8, 0], clamp);
      inner = { opacity: flicker(d), scale: String(sc), filter: blur > 0.3 ? `blur(${blur}px)` : undefined };
      break;
    }
  }
  return (
    <span style={{ display: "inline-block", flexShrink: 0, overflow: mask ? "hidden" : "visible", padding: "0.08em 0.05em 0.16em", margin: "-0.08em -0.05em -0.16em", verticalAlign: "bottom" }}>
      <span style={{ ...base, ...inner }}>{content}</span>
    </span>
  );
};

const ChunkEl: React.FC<{ ch: Chunk; frame: number; fx: Fx }> = ({ ch, frame, fx }) => {
  const hl = !!ch.box; // wichtige Aussage: größer + fetter, eigener Effekt
  const chars = ch.words.reduce((a, w) => a + w.text.length + 1, -1);
  const size = hl ? Math.min(108, Math.floor(920 / (chars * 0.66))) : SIZE;
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: CAP_Y, transform: "translateY(-50%)", display: "flex", justifyContent: "center" }}>
      <div style={{ maxWidth: hl ? 980 : 900, display: "flex", flexWrap: hl ? "nowrap" : "wrap", justifyContent: "center", columnGap: size * 0.26, rowGap: 4, textAlign: "center" }}>
        {ch.words.map((w, i) => (
          <WordEl key={i} text={w.text} start={Math.round(w.t * FPS)} frame={frame} size={size} weight={hl ? 900 : 800} fx={fx} />
        ))}
      </div>
    </div>
  );
};

const Counter: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < BROLL_START) return null;
  const t = frame / FPS;
  const done = REPS.filter((r) => r <= t).length;
  const n = Math.min(REP_TARGET, Math.round((done / REPS.length) * REP_TARGET));
  const lastIdx = REPS.findIndex((_, i) => Math.round(((i + 1) / REPS.length) * REP_TARGET) === n);
  const since = n === 0 ? 99 : frame - Math.round(REPS[Math.max(0, lastIdx)] * FPS);
  const k = interpolate(since, [0, 3], [0, 1], { ...clamp, easing: expoOut });
  const d = frame - BROLL_START;
  const final = n >= REP_TARGET;
  const fin = final ? interpolate(since, [0, 4], [0, 1], clamp) : 0;
  return (
    <div style={{ position: "absolute", left: 64, top: 150, opacity: flicker(d), translate: `0 ${interpolate(d, [0, 6], [30, 0], { ...clamp, easing: expoOut })}px` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, textShadow: SHADOW, scale: String(1 + 0.32 * fin * (1 - fin)) }}>
        <span style={{ display: "inline-block", overflow: "hidden", height: 118, minWidth: 128, textAlign: "right" }}>
          <span style={{ display: "inline-block", fontFamily, fontWeight: 900, fontSize: 112, lineHeight: 1.05, letterSpacing: -3, color: WHITE, translate: `0 ${(1 - k) * 60}%`, opacity: 0.4 + 0.6 * k, fontVariantNumeric: "tabular-nums" }}>{n}</span>
        </span>
        <span style={{ fontFamily, fontWeight: 700, fontSize: 48, color: WHITE, opacity: 0.85 }}>/{REP_TARGET}</span>
      </div>
    </div>
  );
};

// Effekt pro Chunk: Highlights immer „punch“, sonst rotierend (nie zweimal derselbe hintereinander)
const FX: Fx[] = (() => {
  let p = 0;
  return CHUNKS.map((c) => (c.box ? "punch" : PLAIN[p++ % PLAIN.length]));
})();

export const Pushups: React.FC<{ overlay?: boolean }> = ({ overlay = false }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // genau ein Chunk sichtbar: vom ersten Wort bis zum ersten Wort des nächsten Chunks
  const idx = CHUNKS.findIndex((c, i) => t >= c.words[0].t - 1 / FPS && (i === CHUNKS.length - 1 || t < CHUNKS[i + 1].words[0].t - 1 / FPS));
  return (
    <AbsoluteFill style={{ background: overlay ? "transparent" : "black" }}>
      {!overlay && <OffthreadVideo src={staticFile("plate.mp4")} muted transparent style={{ width: "100%", height: "100%" }} />}
      {idx >= 0 && <ChunkEl key={idx} ch={CHUNKS[idx]} frame={frame} fx={FX[idx]} />}
      <Counter frame={frame} />
    </AbsoluteFill>
  );
};
