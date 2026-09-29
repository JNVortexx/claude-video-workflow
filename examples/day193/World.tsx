import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile } from "remotion";
import { BRAND, FONT } from "../brand.config";
import { ENV } from "./data";
import { BEATS193 } from "./beats";
import { CLAUDE, MONO, Spark, Thumb } from "./Parts";
import { backOut, camAt, camSpeed, camTransform, clamp, expoOut, inOut, lerp, ramp, track, type Cam, type Key } from "./lib";

// Day 193 – die Claude-Welt (6,26–12,51 s): ein 3D-App-Fenster, in dem der Prompt getippt, die Dateien
// hineingezogen, das Handoff gelesen und das Video gebaut wird. Die Kamera fährt durch alle Winkel
// (links, rechts, nah, weit, von oben); am Ende fliegt das fertige Video aus dem Fenster bildfüllend ins Bild.
export const W_A = 6.256, W_B = 12.51;

const CAM: Key<keyof Cam>[] = [
  { t: 6.12, x: -120, y: 260, z: -1400, rx: 16, ry: 42, rz: -4, s: 1 },
  { t: 6.75, x: -30, y: 60, z: -260, rx: 8, ry: 20, rz: -1.5, s: 1 },
  { t: 7.2, x: 40, y: -470, z: 0, rx: 4, ry: -12, rz: 0.8, s: 1.32 }, // nah am Eingabefeld, von rechts
  { t: 7.62, x: 20, y: -330, z: 0, rx: 5, ry: -8, rz: 0.4, s: 1.18 },
  { t: 8.22, x: 0, y: 30, z: 0, rx: 6, ry: -10, rz: 0, s: 0.98 },
  { t: 8.8, x: 60, y: 20, z: -120, rx: 7, ry: -30, rz: 1.2, s: 0.9 }, // Handoff von rechts
  { t: 9.45, x: -40, y: 0, z: -80, rx: -3, ry: 18, rz: -1, s: 0.92 }, // Orbit nach links
  { t: 10.02, x: 0, y: 20, z: 0, rx: 4, ry: 4, rz: 0, s: 0.98 },
  { t: 10.55, x: 0, y: -330, z: 0, rx: 28, ry: -4, rz: 0, s: 0.86 }, // Blick auf die Timeline
  { t: 11.15, x: -150, y: -560, z: 60, rx: 34, ry: 22, rz: -2, s: 1.12 }, // nah, von links auf den Playhead
  { t: 11.6, x: 40, y: 110, z: 0, rx: 6, ry: -16, rz: 1, s: 1.02 }, // zurück hoch zum Render-Balken
  { t: 12.51, x: 0, y: 60, z: -200, rx: 4, ry: -4, rz: 0, s: 0.92 },
];

// Fenster-Geometrie (Welt-Koordinaten, Ursprung = Bildschirm 540/860)
const WW = 880, WH = 1180, WX = -WW / 2, WY = -630;
const PROMPT = "Im Ordner findest du alles für das Video: Rohschnitt, SRT und Handoff. Geh komplett all out mit der Animation – smooth, fließend, mit Sounddesign.";
const T_TYPE: [number, number] = [6.34, 7.62];
const T_SEND = 8.2;

type Chip = { name: string; kind: "video" | "audio" | "srt" | "md"; w: number; land: number };
const CHIPS: Chip[] = [
  { name: "Chest.mp4", kind: "video", w: 150, land: 7.68 },
  { name: "Timeline 1.wav", kind: "audio", w: 182, land: 7.82 },
  { name: "timeline-1.srt", kind: "srt", w: 176, land: 7.95 },
  { name: "HANDOFF.md", kind: "md", w: 160, land: 8.07 },
];
const CH_H = 50;
// Chip-Positionen im Fenster: im Eingabefeld (eine Zeile) bzw. in der gesendeten Nachricht (2 × 2)
const inInput = (i: number) => ({ x: 30 + 28 + CHIPS.slice(0, i).reduce((a, c) => a + c.w + 12, 0), y: 900 + 172 });
const inBubble = (i: number) => ({ x: 224 + (i % 2) * 200, y: 250 + Math.floor(i / 2) * 62 });

const ChipBody: React.FC<{ c: Chip; glow?: number }> = ({ c, glow = 0 }) => (
  <div style={{ width: c.w, height: CH_H, borderRadius: 12, display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 6px", background: "rgba(30,34,44,0.96)", boxShadow: `inset 0 0 0 1px rgba(223,223,230,${0.28 + 0.5 * glow}), 0 8px 22px rgba(0,0,0,0.4)`, overflow: "hidden", whiteSpace: "nowrap" }}>
    {c.kind === "video" ? <Thumb w={26} h={40} r={5} /> : (
      <div style={{ width: 34, height: 38, borderRadius: 7, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: c.kind === "audio" ? BRAND.primary : c.kind === "md" ? "rgba(217,119,87,0.9)" : BRAND.accent2, boxShadow: `0 0 0 1px ${BRAND.secondary}`, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: BRAND.secondary }}>
        {c.kind === "audio" ? (
          <svg width={24} height={20} viewBox="0 0 24 20">{[5, 12, 18, 9, 15, 6, 11].map((h, j) => <rect key={j} x={1 + j * 3.3} y={10 - h / 2} width={2} height={h} rx={1} fill={BRAND.secondary} />)}</svg>
        ) : c.kind === "md" ? "MD" : "SRT"}
      </div>
    )}
    <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 17, color: BRAND.secondary }}>{c.name}</span>
  </div>
);

const Cursor: React.FC<{ x: number; y: number; press: number }> = ({ x, y, press }) => (
  <svg width={46} height={60} viewBox="0 0 23 30" style={{ position: "absolute", left: x, top: y, scale: String(1 - 0.12 * press), transformOrigin: "0 0", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}>
    <path d="M1 1 L1 24 L7 18.5 L11 28 L15 26.3 L11 17 L19 17 Z" fill="#fff" stroke="#000" strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

const Step: React.FC<{ label: string; tDone: number; t: number; i: number }> = ({ label, tDone, t, i }) => {
  const tIn = tDone - 0.28;
  const k = ramp(t, tIn, tIn + 0.2, expoOut);
  const ok = ramp(t, tDone, tDone + 0.15, backOut);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 48, opacity: k, translate: `${(1 - k) * 30}px 0` }}>
      <div style={{ width: 32, height: 32, position: "relative" }}>
        {ok < 0.5 ? (
          <div style={{ position: "absolute", inset: 0, borderRadius: 16, border: `3px solid rgba(223,223,230,0.25)`, borderTopColor: CLAUDE, rotate: `${t * 720 + i * 40}deg` }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: BRAND.accent1, scale: String(ok), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={20} height={20} viewBox="0 0 20 20"><path d="M4 10.5 8.2 14.5 16 6" stroke={BRAND.bg} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )}
      </div>
      <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 25, color: ok >= 0.5 ? BRAND.secondary : "rgba(223,223,230,0.6)" }}>{label}</span>
    </div>
  );
};
const STEPS: [string, number][] = [
  ["Transkript & Timing analysiert", 10.5],
  ["Szenen & Kamerafahrten geplant", 10.74],
  ["3D-Animationen gebaut", 10.98],
  ["Sounddesign gemischt", 11.22],
];

// ---------- das Fenster ----------
const Window: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const nType = Math.round(PROMPT.length * ramp(t, T_TYPE[0], T_TYPE[1], (x) => x));
  const sent = ramp(t, T_SEND, T_SEND + 0.32, expoOut);
  const answer = "Alles klar. Ich baue dir das Video – komplett all out.";
  const nAns = Math.round(answer.length * ramp(t, 10.1, 10.55, (x) => x));
  const render = ramp(t, 11.25, 11.88, (x) => 1 - Math.pow(1 - x, 1.6));
  const cur = { x: interpolate(t, [7.9, 8.14], [560, 772], { ...clamp, easing: inOut }), y: interpolate(t, [7.9, 8.14], [980, 1098], { ...clamp, easing: inOut }) };
  const press = interpolate(t, [8.14, 8.18, 8.26], [0, 1, 0], clamp);
  const sendScale = 1 - 0.14 * press;
  const avatarPulse = 1 + 0.08 * Math.sin(t * 14) * ramp(t, 10.05, 10.2) * (1 - ramp(t, 11.9, 12.1));
  return (
    <div style={{ position: "absolute", left: WX, top: WY, width: WW, height: WH, borderRadius: 34, background: "linear-gradient(180deg, #161A22 0%, #0F1218 100%)", boxShadow: "inset 0 0 0 1.5px rgba(223,223,230,0.25), 0 60px 160px rgba(0,0,0,0.6)", overflow: "hidden" }}>
      {/* Titelleiste */}
      <div style={{ height: 72, display: "flex", alignItems: "center", padding: "0 26px", borderBottom: "1px solid rgba(223,223,230,0.1)" }}>
        {["#5C6479", "#5C6479", "#5C6479"].map((c, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: c, marginRight: 10 }} />)}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginRight: 78 }}>
          <Spark size={30} spin={t * 20} />
          <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: BRAND.secondary }}>Claude</span>
        </div>
      </div>
      {/* gesendete Nachricht */}
      <div style={{ position: "absolute", left: 200, top: 100, width: 640, padding: "22px 24px 150px", borderRadius: 26, background: "rgba(223,223,230,0.07)", boxShadow: "inset 0 0 0 1px rgba(223,223,230,0.12)", fontFamily: FONT.body, fontWeight: 500, fontSize: 23, lineHeight: 1.36, color: BRAND.secondary, opacity: sent, translate: `0 ${(1 - sent) * 700}px`, scale: String(lerp(1.15, 1, sent)), transformOrigin: "50% 100%" }}>{PROMPT}</div>
      {/* Antwort */}
      <div style={{ position: "absolute", left: 40, top: 420, right: 40, opacity: ramp(t, 10.02, 10.15) }}>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          <div style={{ scale: String(avatarPulse), marginTop: -2 }}><Spark size={46} spin={t * 60} /></div>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 26, lineHeight: 1.4, color: BRAND.secondary, minHeight: 40 }}>
            {answer.slice(0, nAns)}
            {nAns < answer.length && t > 10.05 && <span style={{ display: "inline-block", width: 12, height: 26, marginLeft: 3, background: CLAUDE, verticalAlign: "middle" }} />}
          </div>
        </div>
        <div style={{ marginLeft: 64, marginTop: 20 }}>
          {STEPS.map(([l, d], i) => <Step key={i} i={i} label={l} tDone={d} t={t} />)}
          {/* Render-Fortschritt */}
          <div style={{ marginTop: 14, opacity: ramp(t, 11.2, 11.35), translate: `${(1 - ramp(t, 11.2, 11.4, expoOut)) * 30}px 0` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.body, fontWeight: 600, fontSize: 23, color: BRAND.secondary, marginBottom: 10, width: 690 }}>
              <span>{render >= 1 ? "Fertig · 4K · 2160 × 3840" : "Rendern · 4K · 2160 × 3840"}</span>
              <span style={{ fontFamily: MONO, fontSize: 21, color: render >= 1 ? BRAND.accent1 : BRAND.secondary }}>{Math.round(469 * render)}/469</span>
            </div>
            <div style={{ width: 690, height: 16, borderRadius: 8, background: "rgba(92,100,121,0.45)", overflow: "hidden" }}>
              <div style={{ width: `${render * 100}%`, height: "100%", borderRadius: 8, background: `linear-gradient(90deg, ${BRAND.primary}, ${CLAUDE} 70%, ${BRAND.accent1})`, boxShadow: `inset 0 0 0 1px rgba(223,223,230,0.6)` }} />
            </div>
          </div>
        </div>
      </div>
      {/* Eingabefeld */}
      <div style={{ position: "absolute", left: 30, top: 900, width: WW - 60, height: 250, borderRadius: 26, background: "rgba(223,223,230,0.06)", boxShadow: `inset 0 0 0 1.5px rgba(223,223,230,${t < T_SEND ? 0.35 : 0.16})` }}>
        <div style={{ position: "absolute", left: 28, top: 22, width: 740, fontFamily: FONT.body, fontWeight: 500, fontSize: 29, lineHeight: 1.36, color: t < T_SEND ? BRAND.secondary : "rgba(223,223,230,0.4)" }}>
          {t < T_SEND ? PROMPT.slice(0, nType) : "Antworten …"}
          {t < T_SEND && <span style={{ display: "inline-block", width: 3, height: 34, marginLeft: 2, verticalAlign: "middle", background: CLAUDE, opacity: nType < PROMPT.length || Math.floor(t * 4) % 2 ? 1 : 0.2 }} />}
        </div>
        <div style={{ position: "absolute", right: 22, bottom: 24, width: 56, height: 56, borderRadius: 16, background: CLAUDE, display: "flex", alignItems: "center", justifyContent: "center", scale: String(sendScale), boxShadow: press > 0 ? `0 0 0 ${8 * press}px rgba(217,119,87,0.35)` : undefined }}>
          <svg width={28} height={28} viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" stroke="#fff" strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </div>
      {t > 7.85 && t < 8.45 && <Cursor x={cur.x} y={cur.y} press={press} />}
    </div>
  );
};

// ---------- Handoff-Dokument + Chips, die herausfliegen ----------
const DOC_LINES: { s: string; h?: 1 | 2; sw?: boolean }[] = [
  { s: "# Handoff – Jannis", h: 1 },
  { s: "## Wer & wie", h: 2 },
  { s: "- Immer auf Deutsch, kurz und direkt" },
  { s: "- Elegant, smooth, hochwertig. Keine Emojis." },
  { s: "## Brand-System", h: 2 },
  { s: "", sw: true },
  { s: "## Schriften", h: 2 },
  { s: "- Switzer · Times New Roman · Tempting" },
  { s: "## Regeln", h: 2 },
  { s: "- Grafiken nie über dem Gesicht" },
  { s: "- Jede Bewegung hat einen Sound" },
  { s: "- Keine Hintergrundmusik" },
  { s: "## Export", h: 2 },
  { s: "- 4K · 2160×3840 · 24 fps · 15 Mbit/s" },
];
const SW = [BRAND.primary, BRAND.secondary, BRAND.accent1, BRAND.accent2, BRAND.bg];
const DOC = { w: 700, h: 960, x: 30, y: -80, z: 240 };
const D_OPEN = 8.52, D_ABS = 10.02;
const lineY = (i: number) => 96 + DOC_LINES.slice(0, i).reduce((a, l) => a + (l.h === 1 ? 70 : l.h === 2 ? 60 : l.sw ? 76 : 50), 0);
const SCAN: [number, number] = [8.72, 9.92];

type Pop = { t: number; line: number; x: number; y: number; z: number; r: number; node: React.ReactNode };
const chipBox = (children: React.ReactNode, pad = "18px 26px") => (
  <div style={{ padding: pad, borderRadius: 24, background: "rgba(16,19,26,0.94)", boxShadow: "inset 0 0 0 1.5px rgba(223,223,230,0.35), 0 30px 70px rgba(0,0,0,0.55)", whiteSpace: "nowrap" }}>{children}</div>
);
const lab = (s: string) => <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 18, letterSpacing: 3, color: BRAND.secondary, opacity: 0.6, marginBottom: 10 }}>{s}</div>;
const POPS: Pop[] = [
  { t: 9.0, line: 5, x: -330, y: -560, z: 460, r: -8, node: chipBox(<>{lab("BRAND-FARBEN")}<div style={{ display: "flex", gap: 12 }}>{SW.map((c, i) => <div key={i} style={{ width: 54, height: 54, borderRadius: 27, background: c, boxShadow: `0 0 0 1.5px ${BRAND.secondary}` }} />)}</div></>) },
  { t: 9.18, line: 7, x: 330, y: -330, z: 380, r: 7, node: chipBox(<>{lab("SCHRIFTEN")}<div style={{ display: "flex", gap: 20, alignItems: "baseline", color: BRAND.secondary }}><span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38 }}>Switzer</span><span style={{ fontFamily: FONT.display, fontSize: 40 }}>Times</span><span style={{ fontFamily: FONT.signature, fontSize: 52, color: BRAND.accent1 }}>Tempting</span></div></>) },
  { t: 9.38, line: 9, x: -350, y: 60, z: 520, r: -5, node: chipBox(<div style={{ display: "flex", alignItems: "center", gap: 16 }}><svg width={46} height={46} viewBox="0 0 46 46"><circle cx={23} cy={18} r={9} fill="none" stroke={BRAND.secondary} strokeWidth={3} /><path d="M7 42c2-9 9-13 16-13s14 4 16 13" fill="none" stroke={BRAND.secondary} strokeWidth={3} /><path d="M4 4 42 42" stroke={BRAND.warn} strokeWidth={3.5} /></svg><span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: BRAND.secondary }}>Gesicht nie verdecken</span></div>) },
  { t: 9.52, line: 10, x: 340, y: 200, z: 430, r: 6, node: chipBox(<div style={{ display: "flex", alignItems: "center", gap: 16 }}><svg width={44} height={36} viewBox="0 0 44 36">{[10, 24, 34, 18, 28, 12, 20].map((h, j) => <rect key={j} x={2 + j * 6} y={18 - h / 2} width={3.6} height={h} rx={1.8} fill={BRAND.accent1} />)}</svg><span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: BRAND.secondary }}>Jede Bewegung = Sound</span></div>) },
  { t: 9.72, line: 13, x: -250, y: 430, z: 360, r: -4, node: chipBox(<span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: BRAND.secondary }}>4K <span style={{ color: BRAND.accent2 }}>·</span> 24 fps <span style={{ color: BRAND.accent2 }}>·</span> 15 Mbit/s</span>) },
  { t: 9.84, line: 1, x: 300, y: 500, z: 470, r: 5, node: chipBox(<div style={{ display: "flex", alignItems: "baseline", gap: 14 }}><span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: BRAND.secondary }}>TAG</span><span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: BRAND.accent1 }}>193</span></div>, "10px 30px") },
];
// Ziel beim „Aufsaugen“: Claude-Avatar im Fenster
const ABS = { x: WX + 40 + 23, y: WY + 420 + 23, z: 0 };

const Doc: React.FC<{ t: number }> = ({ t }) => {
  const open = ramp(t, D_OPEN, D_OPEN + 0.4, expoOut);
  const abs = ramp(t, D_ABS, D_ABS + 0.36, inOut);
  if (open <= 0 || abs >= 1) return null;
  const from = { x: WX + inBubble(3).x + CHIPS[3].w / 2, y: WY + inBubble(3).y + CH_H / 2 };
  const cx = lerp(lerp(from.x, DOC.x, open), ABS.x, abs), cy = lerp(lerp(from.y, DOC.y, open), ABS.y, abs);
  const s = lerp(lerp(0.22, 1, open), 0.05, abs);
  const z = lerp(DOC.z * open, 0, abs);
  const scanK = ramp(t, SCAN[0], SCAN[1], (x) => x);
  const scanY = lerp(lineY(1), lineY(DOC_LINES.length - 1) + 50, scanK);
  return (
    <div style={{ position: "absolute", left: cx - DOC.w / 2, top: cy - DOC.h / 2, width: DOC.w, height: DOC.h, transform: `translateZ(${z}px) rotateY(${-10 * open}deg) rotateZ(${-2 * open}deg) scale(${s})`, borderRadius: 28, background: "linear-gradient(180deg, #1B1F28, #12151C)", boxShadow: "inset 0 0 0 1.5px rgba(223,223,230,0.3), 0 50px 120px rgba(0,0,0,0.6)", overflow: "hidden", opacity: Math.min(1, open * 2) * (1 - abs * 0.6) }}>
      <div style={{ height: 64, display: "flex", alignItems: "center", gap: 12, padding: "0 26px", borderBottom: "1px solid rgba(223,223,230,0.12)", fontFamily: MONO, fontSize: 22, color: BRAND.secondary }}>
        <div style={{ padding: "4px 8px", borderRadius: 6, background: "rgba(217,119,87,0.9)", fontSize: 14, fontWeight: 700 }}>MD</div>HANDOFF.md
      </div>
      {/* Lese-Balken */}
      {scanK > 0 && scanK < 1 && <div style={{ position: "absolute", left: 0, right: 0, top: scanY - 6, height: 52, background: "linear-gradient(90deg, rgba(216,184,120,0) 0%, rgba(216,184,120,0.18) 20%, rgba(216,184,120,0.18) 80%, rgba(216,184,120,0) 100%)", boxShadow: "0 0 0 1px rgba(216,184,120,0.25)" }} />}
      {DOC_LINES.map((l, i) => {
        const read = scanY > lineY(i) + 20;
        return (
          <div key={i} style={{ position: "absolute", left: 34, top: lineY(i), fontFamily: MONO, fontSize: l.h === 1 ? 32 : l.h === 2 ? 25 : 22, fontWeight: l.h ? 700 : 400, color: l.h ? (l.h === 1 ? BRAND.secondary : BRAND.accent1) : `rgba(223,223,230,${read ? 0.95 : 0.6})`, whiteSpace: "nowrap" }}>
            {l.sw ? <div style={{ display: "flex", gap: 14 }}>{SW.map((c, j) => <div key={j} style={{ width: 44, height: 44, borderRadius: 10, background: c, boxShadow: `0 0 0 1px ${BRAND.secondary}` }} />)}</div> : l.s}
          </div>
        );
      })}
    </div>
  );
};

const Pops: React.FC<{ t: number }> = ({ t }) => {
  const abs = ramp(t, D_ABS - 0.02, D_ABS + 0.34, inOut);
  if (t < POPS[0].t - 0.01 || abs >= 1) return null;
  return (
    <>
      {POPS.map((p, i) => {
        const k = ramp(t, p.t, p.t + 0.42, backOut);
        if (k <= 0) return null;
        const a = ramp(t, D_ABS + i * 0.025, D_ABS + 0.3 + i * 0.025, inOut);
        const sx = DOC.x - DOC.w / 2 + 200, sy = DOC.y - DOC.h / 2 + lineY(p.line) + 20;
        const bob = Math.sin(t * 2.4 + i * 1.7) * 10;
        const x = lerp(lerp(sx, p.x, k), ABS.x, a), y = lerp(lerp(sy, p.y, k), ABS.y, a) + bob * (1 - a);
        const z = lerp(lerp(DOC.z, p.z, k), 0, a);
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 0, height: 0, transform: `translateZ(${z}px)` }}>
            <div style={{ position: "absolute", transform: `translate(-50%, -50%) rotate(${p.r * k}deg) scale(${lerp(0.3, 1, Math.min(1, k)) * (1 - 0.9 * a)})`, opacity: Math.min(1, k * 2) * (1 - a) }}>{p.node}</div>
          </div>
        );
      })}
    </>
  );
};

// ---------- Timeline-Tisch vor dem Fenster ----------
const TL = { w: 940, h: 540, y: 600, z: 120 };
const Timeline: React.FC<{ t: number }> = ({ t }) => {
  const k = ramp(t, 10.12, 10.5, expoOut);
  if (k <= 0) return null;
  const x0 = 170, x1 = TL.w - 30, tw = x1 - x0;
  const play = ramp(t, 10.55, 12.0, (x) => x);
  const px = x0 + tw * play;
  const fr = Math.round(469 * play);
  const rows = ["VIDEO", "GRAFIK", "UNTERTITEL", "SFX"];
  const rowY = (i: number) => 96 + i * 104;
  const clips: [number, number, string][] = [[0.11, 0.24, BRAND.primary], [0.31, 0.64, BRAND.primary], [0.68, 0.8, CLAUDE], [0.82, 1, BRAND.primary]];
  const words = BEATS193.flatMap((b) => b.lines.flatMap((l) => l.words));
  return (
    <div style={{ position: "absolute", left: -TL.w / 2, top: TL.y, width: TL.w, height: TL.h, transformOrigin: "50% 0%", transform: `translateZ(${TL.z}px) rotateX(${lerp(-70, 38, k)}deg)`, borderRadius: 28, background: "rgba(13,16,22,0.95)", boxShadow: "inset 0 0 0 1.5px rgba(223,223,230,0.28), 0 40px 100px rgba(0,0,0,0.6)", opacity: Math.min(1, k * 1.6) * (1 - ramp(t, 11.9, 12.15)), overflow: "hidden" }}>
      <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: "1px solid rgba(223,223,230,0.1)", fontFamily: MONO, fontSize: 20, color: "rgba(223,223,230,0.75)" }}>
        <span>Day193.tsx · 23,976 fps</span>
        <span style={{ color: BRAND.accent1 }}>Frame {String(fr).padStart(3, "0")} / 469</span>
      </div>
      {rows.map((r, i) => (
        <div key={r} style={{ position: "absolute", left: 0, top: rowY(i), width: TL.w, height: 88 }}>
          <div style={{ position: "absolute", left: 26, top: 30, fontFamily: FONT.body, fontWeight: 700, fontSize: 17, letterSpacing: 2.5, color: "rgba(223,223,230,0.6)" }}>{r}</div>
          <div style={{ position: "absolute", left: x0, top: 6, width: tw, height: 76, borderRadius: 12, background: "rgba(92,100,121,0.14)" }} />
        </div>
      ))}
      {/* VIDEO: Filmstreifen */}
      <div style={{ position: "absolute", left: x0, top: rowY(0) + 6, width: tw, height: 76, display: "flex", gap: 3, borderRadius: 12, overflow: "hidden", clipPath: `inset(0 ${100 - 100 * ramp(t, 10.3, 10.75, expoOut)}% 0 0)` }}>
        {Array.from({ length: 8 }, (_, j) => <Img key={j} src={staticFile(`day193/strip_${j}.jpg`)} style={{ flex: 1, height: "100%", objectFit: "cover" }} />)}
      </div>
      {/* GRAFIK: Clips poppen hinein */}
      {clips.map(([a, b, c], j) => {
        const q = ramp(t, 10.42 + j * 0.1, 10.64 + j * 0.1, backOut);
        return <div key={j} style={{ position: "absolute", left: x0 + tw * a, top: rowY(1) + 12, width: tw * (b - a) - 6, height: 64, borderRadius: 10, background: c, boxShadow: `0 0 0 1px ${BRAND.secondary}`, scale: `${q} 1`, transformOrigin: "0 50%", opacity: Math.min(1, q * 2) }} />;
      })}
      {/* UNTERTITEL: jedes Wort ein Block an seiner echten Zeit */}
      {words.map((wd, j) => {
        const q = ramp(t, 10.5 + wd.t * 0.028, 10.62 + wd.t * 0.028, expoOut);
        return <div key={j} style={{ position: "absolute", left: x0 + (tw * wd.t) / 19.56, top: rowY(2) + 22 + (j % 2) * 18, width: Math.max(8, wd.text.length * 2.2), height: 14, borderRadius: 4, background: wd.hl === "gold" || wd.hl === "script" ? BRAND.accent1 : "rgba(223,223,230,0.8)", opacity: q, scale: String(q) }} />;
      })}
      {/* SFX: Stimm-Hüllkurve als Wellenform */}
      <div style={{ position: "absolute", left: x0, top: rowY(3) + 6, width: tw, height: 76, display: "flex", alignItems: "center", gap: 1.5 }}>
        {Array.from({ length: 150 }, (_, j) => {
          const v = ENV[Math.floor((j / 150) * ENV.length)] ?? 0;
          const q = ramp(t, 10.6 + j * 0.004, 10.75 + j * 0.004, expoOut);
          return <div key={j} style={{ flex: 1, height: `${(6 + 88 * v) * q}%`, borderRadius: 2, background: x0 + (tw * j) / 150 < px ? BRAND.accent1 : "rgba(223,223,230,0.6)" }} />;
        })}
      </div>
      {/* Playhead */}
      {play > 0 && (
        <div style={{ position: "absolute", left: px - 1.5, top: 66, width: 3, height: TL.h - 80, background: BRAND.accent1, boxShadow: "0 0 14px rgba(216,184,120,0.8)" }}>
          <div style={{ position: "absolute", left: -12, top: -8, width: 27, height: 22, borderRadius: 6, background: BRAND.accent1 }} />
        </div>
      )}
    </div>
  );
};

// ---------- fliegende Datei-Chips (Welt-Koordinaten) ----------
const Chips: React.FC<{ t: number }> = ({ t }) => {
  const sent = ramp(t, T_SEND, T_SEND + 0.32, expoOut);
  const fade = 1 - ramp(t, 10.0, 10.25);
  return (
    <>
      {CHIPS.map((c, i) => {
        const fl = ramp(t, c.land - 0.34, c.land, (x) => 1 - Math.pow(1 - x, 3));
        if (fl <= 0) return null;
        const a = inInput(i), b = inBubble(i);
        const land = { x: lerp(a.x, b.x, sent), y: lerp(a.y, b.y, sent) };
        const start = { x: 620 + i * 60, y: 1300 - i * 120, z: 900 };
        const x = lerp(start.x, land.x, fl), y = lerp(start.y, land.y, fl) - Math.sin(fl * Math.PI) * 240;
        const z = lerp(start.z, 2, fl);
        const glow = interpolate(t, [c.land, c.land + 0.25], [1, 0], clamp);
        const hide = c.kind === "md" ? 1 - ramp(t, D_OPEN, D_OPEN + 0.08) : 1; // HANDOFF.md wird zum Dokument
        return (
          <div key={c.name} style={{ position: "absolute", left: WX + x, top: WY + y, transform: `translateZ(${z}px) rotateZ(${(1 - fl) * (i % 2 ? 24 : -18)}deg)`, transformOrigin: "0 0", opacity: Math.min(1, fl * 3) * fade * hide }}>
            <ChipBody c={c} glow={glow} />
          </div>
        );
      })}
    </>
  );
};

export const ClaudeWorld: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  if (t < 6.1 || t >= W_B) return null;
  const c = camAt(CAM, t);
  const sp = camSpeed(CAM, t);
  const blur = Math.min(7, Math.max(0, (sp - 1.2) * 1.4));
  const vis = ramp(t, 6.12, 6.35, expoOut);
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 45%", opacity: vis, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
      <div style={{ position: "absolute", left: 540, top: 860, width: 0, height: 0, transformStyle: "preserve-3d", transform: camTransform(c) }}>
        <Timeline t={t} />
        <Window t={t} frame={frame} />
        <Chips t={t} />
        <Doc t={t} />
        <Pops t={t} />
      </div>
    </AbsoluteFill>
  );
};

// ---------- Ergebnis: das fertige Video fliegt aus dem Fenster und füllt bei 12,51 s das Bild ----------
const PV: Key<"x" | "y" | "rx" | "ry" | "s">[] = [
  { t: 11.86, x: 0, y: -40, rx: 10, ry: -24, s: 0.12 },
  { t: 12.08, x: 60, y: -120, rx: 6, ry: -16, s: 0.4 },
  { t: 12.28, x: 30, y: -80, rx: 3, ry: 8, s: 0.5 },
  { t: 12.51, x: 0, y: 0, rx: 0, ry: 0, s: 1 },
];
export const PreviewDive: React.FC<{ t: number }> = ({ t }) => {
  if (t < PV[0].t || t >= W_B) return null;
  const g = (ch: "x" | "y" | "rx" | "ry" | "s") => track(PV, ch, t);
  const s = g("s");
  const k = ramp(t, 11.86, 11.98, expoOut);
  const frame = 1 - ramp(t, 12.3, 12.51);
  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transform: `translate3d(${g("x")}px, ${g("y")}px, 0) rotateX(${g("rx")}deg) rotateY(${g("ry")}deg) scale(${s})`, borderRadius: 90 * frame, overflow: "hidden", opacity: k, boxShadow: `0 0 0 ${14 * frame}px rgba(216,184,120,${0.9 * frame}), 0 80px 200px rgba(0,0,0,${0.7 * frame})` }}>
        <OffthreadVideo src={staticFile("day193/Chest.mp4")} muted transparent style={{ width: "100%", height: "100%" }} />
        <div style={{ position: "absolute", left: 60, top: 60, padding: "18px 34px", borderRadius: 50, background: BRAND.accent1, fontFamily: FONT.body, fontWeight: 700, fontSize: 56, color: BRAND.bg, opacity: frame, display: "flex", alignItems: "center", gap: 14 }}>
          <svg width={50} height={50} viewBox="0 0 20 20"><path d="M4 10.5 8.2 14.5 16 6" stroke={BRAND.bg} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Fertig
        </div>
      </div>
    </AbsoluteFill>
  );
};
