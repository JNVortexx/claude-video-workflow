import React, { useEffect, useState } from "react";
import { Easing, continueRender, delayRender, interpolate } from "remotion";
import { BRAND, FONT } from "../brand.config";

// Untertitel v3 (Redesign 29.09.2026): fließend statt Kästen.
// Modi: flow (eine Aussage, schiebt sich weiter), stack (Kernaussage in Hierarchie gestapelt),
// headline (ein großer ruhiger Satz), quote (fremde Stimme, Serif kursiv mit Anführungszeichen).
// Wörter steigen aus einer Maske auf; Gold-Wörter bekommen eine gezogene Unterstreichung,
// Script-Wörter (Tempting) werden „geschrieben“. Lesbarkeit über weichen Schatten-Verlauf statt Box.

export type Hl = "gold" | "script" | "warn" | "muted" | "serif" | "strike";
export type W3 = { text: string; t: number; hl?: Hl };
export type Line3 = { words: W3[]; size?: "s" | "m" | "l" | "xl" };
export type Beat = { t0: number; t1: number; mode: "flow" | "stack" | "headline" | "quote"; lines: Line3[]; pos?: "mid" | "low" | "high" | "top"; mark?: boolean };

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
const inOut = Easing.bezier(0.65, 0, 0.35, 1);
const CENTER = { top: 300, high: 470, mid: 1250, low: 1610 };
const SIZE = { s: 44, m: 64, l: 92, xl: 150 };
const SHADOW = "0 2px 18px rgba(5,7,12,0.55), 0 1px 3px rgba(5,7,12,0.6)";

const useFontsReady = () => {
  const [ready, setReady] = useState(() => typeof document !== "undefined" && document.fonts.status === "loaded");
  const [h] = useState(() => (ready ? null : delayRender("Captions3 Schriften")));
  useEffect(() => {
    if (ready) return;
    document.fonts.ready.then(() => {
      setReady(true);
      if (h !== null) continueRender(h);
    });
  }, [ready, h]);
  return ready;
};

const Word: React.FC<{ w: W3; size: number; beat: Beat; frame: number; fps: number; lineSize: Line3["size"] }> = ({ w, size, beat, frame, fps, lineSize }) => {
  const s = w.t * fps;
  const script = w.hl === "script";
  const serif = w.hl === "serif" || beat.mode === "quote" || beat.mode === "headline";
  const color = w.hl === "gold" || script ? BRAND.accent1 : w.hl === "warn" ? BRAND.warn : w.hl === "muted" ? BRAND.muted : BRAND.secondary;
  const fam = script ? FONT.signature : serif ? FONT.display : FONT.body;
  // Tempting ist sehr breit → Schriftgröße so begrenzen, dass das Wort in ~900 px passt
  const fs = script ? Math.min(size * 1.55, 900 / Math.max(1, w.text.length * 0.43)) : size;
  const weight = script ? 400 : serif ? 700 : lineSize === "s" ? 500 : 700;
  const italic = serif && !script && beat.mode !== "headline" ? "italic" : "normal";

  if (script) {
    // „geschrieben“: Reveal von links nach rechts + leichter Glow, der ausklingt
    const r = interpolate(frame, [s - 2, s + 12], [0, 100], { ...clamp, easing: inOut });
    const glow = interpolate(frame, [s + 4, s + 12, s + 40], [0, 1, 0.35], clamp);
    return (
      <span style={{ display: "inline-block", fontFamily: fam, fontSize: fs, lineHeight: 1.0, color, padding: "0.14em 0.16em 0.12em", margin: "0 -0.05em", clipPath: `inset(-40% ${100 - r}% -40% -8%)`, textShadow: `${SHADOW}, 0 0 ${26 * glow}px rgba(216,184,120,${0.55 * glow})` }}>
        {w.text}
      </span>
    );
  }
  const k = interpolate(frame, [s - 1, s + 7], [0, 1], { ...clamp, easing: expoOut });
  const pop = interpolate(frame, [s - 1, s + 2, s + 5], [0.92, 1.05, 1], clamp);
  const blur = interpolate(frame, [s - 1, s + 4], [6, 0], clamp);
  const under = w.hl === "gold" && beat.mode !== "headline" ? interpolate(frame, [s + 3, s + 11], [0, 1], { ...clamp, easing: expoOut }) : 0;
  // „strike“ (Day 193): Wort wird durchgestrichen – roter Balken mit Platin-Kontur, Wort dimmt ab
  const strike = w.hl === "strike" ? interpolate(frame, [s + 5, s + 11], [0, 1], { ...clamp, easing: expoOut }) : 0;
  return (
    <span style={{ display: "inline-block", overflow: "hidden", padding: "0.06em 0.04em 0.14em", margin: "-0.06em -0.04em -0.14em", verticalAlign: "bottom" }}>
      <span
        style={{
          display: "inline-block",
          position: "relative",
          fontFamily: fam,
          fontWeight: weight,
          fontStyle: italic,
          fontSize: fs,
          lineHeight: 1.08,
          letterSpacing: serif ? 0 : -0.6,
          color,
          opacity: Math.min(1, k * 1.4) * (1 - 0.45 * strike),
          translate: `0 ${(1 - k) * 105}%`,
          scale: String(pop),
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          textShadow: SHADOW,
          whiteSpace: "nowrap",
        }}
      >
        {w.text}
        {strike > 0 && <span style={{ position: "absolute", left: "-6%", top: "52%", height: Math.max(5, fs * 0.09), width: `${112 * strike}%`, borderRadius: 3, background: BRAND.primary, boxShadow: `0 0 0 1px ${BRAND.secondary}, 0 3px 10px rgba(0,0,0,0.45)`, rotate: "-4deg", transformOrigin: "left center" }} />}
        {under > 0 && <span style={{ position: "absolute", left: "2%", bottom: "0.02em", height: Math.max(3, fs * 0.055), width: `${96 * under}%`, borderRadius: 4, background: BRAND.accent1, boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }} />}
      </span>
    </span>
  );
};

const QuoteMark: React.FC<{ frame: number; s: number }> = ({ frame, s }) => {
  const k = interpolate(frame, [s, s + 8], [0, 1], { ...clamp, easing: expoOut });
  return (
    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 210, lineHeight: 0.6, height: 70, color: BRAND.primary, WebkitTextStroke: `1.5px ${BRAND.secondary}`, opacity: k, translate: `0 ${(1 - k) * 20}px`, textShadow: "0 6px 24px rgba(0,0,0,0.4)" }}>„</div>
  );
};

export const Captions3: React.FC<{ beats: Beat[]; frame: number; fps: number }> = ({ beats, frame, fps }) => {
  const ready = useFontsReady();
  if (!ready) return null;
  return (
    <>
      {beats.map((b, i) => {
        const f0 = b.t0 * fps, f1 = b.t1 * fps;
        if (frame < f0 - 2 || frame > f1 + 8) return null;
        // Abgang: nach oben weg mit Unschärfe (fließend in den nächsten Beat)
        const out = interpolate(frame, [f1 - 1, f1 + 6], [0, 1], { ...clamp, easing: inOut });
        const cy = CENTER[b.pos ?? "mid"];
        const scrim = interpolate(frame, [f0 - 2, f0 + 6], [0, 1], clamp) * (1 - out);
        return (
          <div key={i} style={{ position: "absolute", left: 0, right: 0, top: cy, height: 0 }}>
            {/* weicher dunkler Verlauf hinter dem Text – keine Box */}
            <div style={{ position: "absolute", left: -120, right: -120, top: -260, height: 520, background: "radial-gradient(ellipse 50% 42% at 50% 50%, rgba(8,10,16,0.55) 0%, rgba(8,10,16,0.28) 45%, rgba(8,10,16,0) 75%)", opacity: scrim }} />
            <div
              style={{
                position: "absolute",
                left: 70,
                right: 70,
                top: 0,
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: b.mode === "stack" ? 10 : 0,
                opacity: 1 - out,
                translate: `0 ${-out * 46}px`,
                filter: out > 0.02 ? `blur(${out * 10}px)` : undefined,
              }}
            >
              {b.mode === "quote" && b.mark !== false && (
                <div style={{ position: "absolute", left: -8, top: -118 }}>
                  <QuoteMark frame={frame} s={i > 0 && beats[i - 1].mode === "quote" ? beats[i - 1].t0 * fps : f0} />
                </div>
              )}
              {b.lines.map((ln, li) => {
                const size = SIZE[ln.size ?? (b.mode === "headline" ? "l" : b.mode === "flow" || b.mode === "quote" ? "m" : "m")];
                return (
                  <div key={li} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "baseline", columnGap: size * 0.26, rowGap: size * 0.02, textAlign: "center", opacity: ln.size === "s" ? 0.9 : 1, marginTop: li > 0 && ln.words.some((x) => x.hl === "script") ? size * 0.42 : 0, marginBottom: ln.words.some((x) => x.hl === "script") ? size * 0.08 : 0 }}>
                    {ln.words.map((w, wi) => (
                      <Word key={wi} w={w} size={size} beat={b} frame={frame} fps={fps} lineSize={ln.size} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

// Hilfen zum Schreiben der Beats
export const L = (size: Line3["size"], ...words: W3[]): Line3 => ({ size, words });
export const w = (text: string, t: number, hl?: Hl): W3 => ({ text, t, hl });
