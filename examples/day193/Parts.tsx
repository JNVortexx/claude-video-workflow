import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile } from "remotion";
import { BRAND, FONT } from "../brand.config";
import { ENV, REPS } from "./data";
import { FPS193, backOut, camAt, camTransform, clamp, expoOut, hash, inOut, lerp, ramp, win, type Cam, type Key } from "./lib";

// Day 193 – kleinere Bausteine: HUD, Light Leaks, Claude-Stern, Handy-Explosion, DM, Tages-Anzeige, Rep-Zähler.
export const CLAUDE = "#D97757"; // Claude-Terrakotta – nur für das Claude-Interface
export const MONO = "Menlo, 'SF Mono', monospace";
const SH = "0 2px 18px rgba(5,7,12,0.55), 0 1px 3px rgba(5,7,12,0.6)";
const glass = (o = 0.78) => ({ background: `rgba(10,13,20,${o})`, boxShadow: `inset 0 0 0 1px rgba(223,223,230,0.22), 0 24px 60px rgba(0,0,0,0.45)` });

type T = { t: number };

// ---------- Claude-Stern (eigene Zeichnung: 10 verjüngte Strahlen) ----------
export const Spark: React.FC<{ size: number; k?: number; spin?: number; color?: string; glow?: number }> = ({ size, k = 1, spin = 0, color = CLAUDE, glow = 0 }) => {
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    const len = (i % 2 === 0 ? 0.47 : 0.38) * (0.25 + 0.75 * Math.min(1, Math.max(0, k * 1.4 - i * 0.04)));
    const w = 0.07;
    const x = Math.cos(a), y = Math.sin(a), px = -y, py = x;
    const p = (r: number, s: number) => `${50 + (x * r + px * s) * 100},${50 + (y * r + py * s) * 100}`;
    return `M${p(0.06, -w * 0.6)} L${p(len, -w * 0.18)} Q${p(len + 0.03, 0)} ${p(len, w * 0.18)} L${p(0.06, w * 0.6)} Z`;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ rotate: `${spin}deg`, overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${12 * glow}px rgba(217,119,87,${0.8 * glow}))` : undefined }}>
      {rays.map((d, i) => <path key={i} d={d} fill={color} />)}
      <circle cx={50} cy={50} r={7 * k} fill={color} />
    </svg>
  );
};

// ---------- Kamera-Sucher im Hook ----------
export const Hud: React.FC<T & { frame: number }> = ({ t, frame }) => {
  const k = Math.min(ramp(t, 0, 0.3, expoOut), 1 - ramp(t, 1.85, 2.2));
  if (k <= 0) return null;
  const ff = frame % 24, ss = Math.floor(frame / FPS193);
  const tc = `00:00:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
  const inset = lerp(90, 54, k);
  const br = (s: React.CSSProperties) => <div style={{ position: "absolute", width: 90, height: 90, borderColor: "rgba(223,223,230,0.85)", borderStyle: "solid", borderWidth: 0, ...s }} />;
  return (
    <AbsoluteFill style={{ opacity: k }}>
      {br({ left: inset, top: inset, borderLeftWidth: 4, borderTopWidth: 4, borderTopLeftRadius: 18 })}
      {br({ right: inset, top: inset, borderRightWidth: 4, borderTopWidth: 4, borderTopRightRadius: 18 })}
      {br({ left: inset, bottom: inset, borderLeftWidth: 4, borderBottomWidth: 4, borderBottomLeftRadius: 18 })}
      {br({ right: inset, bottom: inset, borderRightWidth: 4, borderBottomWidth: 4, borderBottomRightRadius: 18 })}
      <div style={{ position: "absolute", left: inset + 40, top: inset + 34, display: "flex", alignItems: "center", gap: 14, fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: BRAND.secondary, letterSpacing: 3, textShadow: SH }}>
        <div style={{ width: 22, height: 22, borderRadius: 11, background: "#E0433A", opacity: frame % 20 < 12 ? 1 : 0.25, boxShadow: "0 0 14px rgba(224,67,58,0.8)" }} />
        REC
      </div>
      <div style={{ position: "absolute", right: inset + 40, top: inset + 36, fontFamily: MONO, fontSize: 30, color: BRAND.secondary, textShadow: SH, letterSpacing: 1 }}>{tc}</div>
      <div style={{ position: "absolute", right: inset + 40, bottom: inset + 36, fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: BRAND.secondary, opacity: 0.8, letterSpacing: 2, textShadow: SH }}>4K · 23,976 FPS · RAW</div>
    </AbsoluteFill>
  );
};

// ---------- Light Leak auf Übergängen ----------
export const LightLeak: React.FC<T & { at: number; dir?: 1 | -1; power?: number }> = ({ t, at, dir = 1, power = 1 }) => {
  const k = interpolate(t, [at - 0.25, at, at + 0.5], [0, 1, 0], clamp);
  if (k <= 0) return null;
  const x = 50 + dir * interpolate(t, [at - 0.25, at + 0.5], [-45, 45], clamp);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: k * power, pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 38% at ${x}% 40%, rgba(255,170,90,0.85) 0%, rgba(216,120,70,0.35) 40%, rgba(130,35,35,0) 75%), radial-gradient(ellipse 30% 60% at ${100 - x}% 70%, rgba(216,184,120,0.45) 0%, rgba(216,184,120,0) 70%)` }} />
    </AbsoluteFill>
  );
};

// ---------- S1: Das Video wird zum Handy, die Ebenen fächern sich dahinter auf ----------
const EX_KEYS: Key<keyof Cam>[] = [
  { t: 2.23, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
  { t: 2.8, x: -60, y: -150, z: 0, rx: 9, ry: 20, rz: -2, s: 0.5 },
  { t: 3.45, x: -120, y: -130, z: 0, rx: 5, ry: -14, rz: 0.5, s: 0.46 },
  { t: 4.08, x: -170, y: -140, z: 0, rx: 8, ry: -34, rz: 2, s: 0.48 },
  { t: 4.33, x: 30, y: -90, z: 0, rx: 4, ry: -14, rz: 1, s: 0.6 },
  { t: 4.62, x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 },
];
export const EX_A = 2.23, EX_B = 4.62;
export const exploded = (t: number) => t > EX_A && t < EX_B;

const Pane: React.FC<{ i: number; sep: number; label: string; children?: React.ReactNode; tIn: number; t: number }> = ({ i, sep, label, children, tIn, t }) => {
  const k = ramp(t, tIn, tIn + 0.35, expoOut) * sep;
  return (
    <div style={{ position: "absolute", left: -540, top: -960, width: 1080, height: 1920, borderRadius: 96, transform: `translate3d(${sep * 250 * i}px, ${-sep * 110 * i}px, ${-sep * 380 * i}px) rotateY(${-sep * 6 * i}deg)`, background: "linear-gradient(160deg, rgba(223,223,230,0.13), rgba(10,13,20,0.55))", boxShadow: `inset 0 0 0 3px rgba(223,223,230,${0.45 * k})`, opacity: k }}>
      <div style={{ position: "absolute", right: 60, top: 60, padding: "14px 30px", borderRadius: 40, background: BRAND.primary, boxShadow: `0 0 0 2px ${BRAND.secondary}`, fontFamily: FONT.body, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: BRAND.secondary }}>{label}</div>
      {children}
    </div>
  );
};

export const ExplodedScreen: React.FC<T & { frame: number }> = ({ t, frame }) => {
  if (!exploded(t)) return null;
  const c = camAt(EX_KEYS, t);
  const sep = ramp(t, 2.5, 3.05, inOut) * (1 - ramp(t, 4.18, 4.55, inOut));
  const bez = ramp(t, 2.25, 2.7) * (1 - ramp(t, 4.4, 4.62));
  const rad = 96 * bez;
  const vf = Math.round(t * FPS193);
  return (
    <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: "50% 42%" }}>
      <div style={{ position: "absolute", left: 540, top: 960, width: 0, height: 0, transformStyle: "preserve-3d", transform: camTransform(c) }}>
        {/* Ebenen hinter dem Handy (liegen nie über dem Gesicht) */}
        <Pane i={4} sep={sep} label="SCHNITT & ZOOM" tIn={2.75} t={t}>
          <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
            <path d="M120 1500 C 380 1500, 420 700, 620 700 S 900 1100, 1000 1100" stroke={BRAND.accent1} strokeWidth={10} fill="none" strokeDasharray={1600} strokeDashoffset={1600 * (1 - ramp(t, 2.9, 3.6))} />
            {[[120, 1500], [620, 700], [1000, 1100]].map(([x, y], j) => <rect key={j} x={x - 22} y={y - 22} width={44} height={44} transform={`rotate(45 ${x} ${y})`} fill={BRAND.bg} stroke={BRAND.secondary} strokeWidth={5} />)}
          </svg>
        </Pane>
        <Pane i={3} sep={sep} label="SOUND DESIGN" tIn={2.68} t={t}>
          <div style={{ position: "absolute", left: 80, right: 80, top: 1180, height: 420, display: "flex", alignItems: "center", gap: 6 }}>
            {Array.from({ length: 70 }, (_, j) => {
              const v = ENV[Math.min(ENV.length - 1, Math.max(0, vf - 35 + j))] ?? 0;
              return <div key={j} style={{ flex: 1, height: `${8 + 92 * v}%`, borderRadius: 6, background: j === 35 ? BRAND.accent1 : "rgba(223,223,230,0.75)" }} />;
            })}
          </div>
        </Pane>
        <Pane i={2} sep={sep} label="MOTION GRAPHICS" tIn={2.61} t={t}>
          <div style={{ position: "absolute", right: 120, top: 330, width: 320, height: 320, borderRadius: "50%", border: `14px solid ${BRAND.accent1}`, rotate: `${t * 90}deg`, borderRightColor: "transparent" }} />
          <div style={{ position: "absolute", left: 140, top: 1280, width: 500, height: 170, borderRadius: 28, background: BRAND.primary, boxShadow: `0 0 0 3px ${BRAND.secondary}` }} />
          <div style={{ position: "absolute", right: 170, top: 1250 }}><Spark size={230} spin={t * 40} color={BRAND.secondary} /></div>
        </Pane>
        <Pane i={1} sep={sep} label="UNTERTITEL" tIn={2.54} t={t}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 1240, textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 110, color: BRAND.secondary, lineHeight: 1.2 }}>
            schwer
            <div style={{ fontFamily: FONT.signature, fontWeight: 400, fontSize: 180, color: BRAND.accent1, lineHeight: 1.3 }}>vorstellbar</div>
          </div>
        </Pane>
        {/* das Handy selbst: der echte Rohschnitt läuft live weiter */}
        <div style={{ position: "absolute", left: -540, top: -960, width: 1080, height: 1920, borderRadius: rad, overflow: "hidden", boxShadow: bez > 0.01 ? `0 0 0 ${26 * bez}px #15171C, 0 0 0 ${29 * bez}px rgba(223,223,230,0.55), 0 60px 140px rgba(0,0,0,${0.6 * bez})` : undefined }}>
          <OffthreadVideo src={staticFile("day193/Chest.mp4")} muted transparent style={{ width: "100%", height: "100%" }} />
          {/* Dynamic Island */}
          <div style={{ position: "absolute", left: 540 - 130, top: 44, width: 260, height: 76, borderRadius: 40, background: "#050608", opacity: bez }} />
          {/* Glanz */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${115 + c.ry * 2}deg, rgba(255,255,255,0) 35%, rgba(255,255,255,${0.12 * bez}) 48%, rgba(255,255,255,0) 60%)` }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Badge „Editiert von Claude“ (rechts oben, neben dem Kopf) ----------
export const EditBadge: React.FC<T> = ({ t }) => {
  const k = Math.max(win(t, 5.78, 6.2, 0.3, 0.12), win(t, 12.6, 15.85, 0.35, 0.2));
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", right: 56, top: 96, display: "flex", alignItems: "center", gap: 14, padding: "14px 24px 14px 18px", borderRadius: 40, ...glass(0.72), opacity: k, translate: `${(1 - k) * 40}px 0` }}>
      <Spark size={40} k={k} spin={t * 30} />
      <span style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: BRAND.secondary, letterSpacing: 0.3 }}>Editiert von Claude</span>
    </div>
  );
};

// ---------- S2: Claude-Stern über „sondern Claude.“ ----------
export const ClaudeReveal: React.FC<T> = ({ t }) => {
  const a = 5.62;
  const k = ramp(t, a, a + 0.4, expoOut) * (1 - ramp(t, 6.02, 6.2));
  if (k <= 0) return null;
  const ring = ramp(t, 5.74, 6.1, expoOut);
  return (
    <div style={{ position: "absolute", left: 540, top: 1085, width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -150 * ring, top: -150 * ring, width: 300 * ring, height: 300 * ring, borderRadius: "50%", boxShadow: `0 0 0 3px rgba(217,119,87,${0.7 * (1 - ring)})` }} />
      <div style={{ position: "absolute", left: -70, top: -70, opacity: Math.min(1, k * 1.5), scale: String(0.4 + 0.6 * k) }}>
        <Spark size={140} k={k} spin={(1 - k) * -120 + t * 20} glow={0.4 + 0.6 * (1 - ring)} />
      </div>
    </div>
  );
};

// ---------- S5: DM schreiben ----------
export const DmCard: React.FC<T> = ({ t }) => {
  const k = ramp(t, 14.3, 14.62, expoOut) * (1 - ramp(t, 15.5, 15.8));
  if (k <= 0) return null;
  const msg = "Wie funktioniert das?";
  const typed = msg.slice(0, Math.round(msg.length * ramp(t, 14.55, 14.98, (x) => x)));
  const sent = ramp(t, 15.08, 15.3, expoOut);
  const press = interpolate(t, [15.02, 15.08, 15.16], [1, 0.84, 1], clamp);
  const plane = ramp(t, 15.08, 15.5, inOut);
  const px = lerp(910, 1180, plane), py = lerp(1560, 980, plane) - Math.sin(plane * Math.PI) * 140;
  return (
    <>
      {/* gesendete Nachricht */}
      <div style={{ position: "absolute", right: 110, top: 1400, padding: "18px 30px", borderRadius: 34, borderBottomRightRadius: 10, background: BRAND.primary, boxShadow: `0 0 0 1px ${BRAND.secondary}, 0 14px 40px rgba(0,0,0,0.45)`, fontFamily: FONT.body, fontWeight: 600, fontSize: 36, color: BRAND.secondary, opacity: sent * k, scale: String(0.7 + 0.3 * sent), transformOrigin: "right bottom", translate: `0 ${(1 - sent) * 60}px` }}>{msg}</div>
      <div style={{ position: "absolute", left: 90, right: 90, top: 1500, height: 120, borderRadius: 60, ...glass(0.8), display: "flex", alignItems: "center", gap: 22, padding: "0 16px 0 18px", opacity: k, translate: `0 ${(1 - k) * 160}px` }}>
        <div style={{ width: 84, height: 84, borderRadius: 42, padding: 4, background: `conic-gradient(${BRAND.accent1}, ${BRAND.primary}, ${BRAND.accent1})` }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: BRAND.accent1 }}>J</div>
        </div>
        <div style={{ flex: 1, fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: typed ? BRAND.secondary : "rgba(223,223,230,0.45)" }}>
          {typed || "Nachricht …"}
          {t < 15.05 && <span style={{ display: "inline-block", width: 3, height: 40, marginLeft: 4, verticalAlign: "middle", background: BRAND.accent1, opacity: Math.floor(t * 4) % 2 ? 1 : 0.2 }} />}
        </div>
        <div style={{ width: 88, height: 88, borderRadius: 44, background: BRAND.accent1, display: "flex", alignItems: "center", justifyContent: "center", scale: String(press) }}>
          <svg width={44} height={44} viewBox="0 0 24 24"><path d="M3 11.5 21 3l-8.5 18-2-7.5z" fill={BRAND.bg} /></svg>
        </div>
      </div>
      {/* Papierflieger fliegt rechts am Kopf vorbei aus dem Bild */}
      {plane > 0 && plane < 1 && (
        <div style={{ position: "absolute", left: px - 40, top: py - 40, rotate: `${-35 - plane * 20}deg`, opacity: 1 - ramp(t, 15.4, 15.5) }}>
          <svg width={80} height={80} viewBox="0 0 24 24" style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))" }}><path d="M3 11.5 21 3l-8.5 18-2-7.5z" fill={BRAND.accent1} stroke={BRAND.secondary} strokeWidth={0.5} /></svg>
        </div>
      )}
    </>
  );
};

// ---------- S6: Tages-Anzeige „TAG 193“ (Walzen) ----------
const Reel: React.FC<{ digit: number; tLand: number; t: number; h: number }> = ({ digit, tLand, t, h }) => {
  const spins = 2;
  const k = ramp(t, tLand - 0.55, tLand, Easing193);
  const pos = (spins * 10 + digit) * k;
  const speed = Math.abs(pos - (spins * 10 + digit) * ramp(t - 1 / FPS193, tLand - 0.55, tLand, Easing193));
  return (
    <div style={{ height: h, overflow: "hidden", position: "relative" }}>
      <div style={{ translate: `0 ${-pos * h}px`, filter: speed > 0.15 ? `blur(${Math.min(6, speed * 5)}px)` : undefined }}>
        {Array.from({ length: spins * 10 + 10 }, (_, i) => <div key={i} style={{ height: h, lineHeight: `${h}px` }}>{i % 10}</div>)}
      </div>
    </div>
  );
};
const Easing193 = (x: number) => 1 - Math.pow(1 - x, 3.2);

export const DayFlip: React.FC<T> = ({ t }) => {
  const k = ramp(t, 15.93, 16.2, expoOut);
  if (k <= 0) return null;
  const m = ramp(t, 17.05, 17.45, inOut); // → kleines Badge oben links
  const bar = ramp(t, 16.35, 17.0, expoOut);
  const H = 250;
  return (
    <div style={{ position: "absolute", left: 540, top: lerp(430, 150, m), width: 0, height: 0 }}>
      <div style={{ position: "absolute", left: -340, top: -250, width: 680, height: 500, borderRadius: 44, ...glass(0.78), opacity: k, scale: String((0.85 + 0.15 * k) * lerp(1, 0.4, m)), translate: `${lerp(0, -330, m)}px ${(1 - k) * 40}px`, transformOrigin: "50% 50%", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 34 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, letterSpacing: 14, color: BRAND.secondary, opacity: 0.85 }}>TAG</div>
        <div style={{ display: "flex", fontFamily: FONT.display, fontWeight: 700, fontSize: 250, color: BRAND.accent1, height: H, marginTop: 4, textShadow: "0 6px 30px rgba(216,184,120,0.35)" }}>
          <Reel digit={1} tLand={16.28} t={t} h={H} />
          <Reel digit={9} tLand={16.5} t={t} h={H} />
          <Reel digit={3} tLand={16.9} t={t} h={H} />
        </div>
        <div style={{ width: 520, height: 14, borderRadius: 7, marginTop: 30, background: "rgba(92,100,121,0.55)", overflow: "hidden" }}>
          <div style={{ width: `${(193 / 365) * 100 * bar}%`, height: "100%", borderRadius: 7, background: BRAND.primary, boxShadow: `inset 0 0 0 1px ${BRAND.secondary}` }} />
        </div>
        <div style={{ width: 520, display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: BRAND.secondary, opacity: 0.75 * (1 - m) }}>
          <span>{Math.round(193 * bar)} / 365</span><span>{(52.9 * bar).toFixed(1).replace(".", ",")} %</span>
        </div>
      </div>
    </div>
  );
};

// ---------- S6: Rep-Zähler, synchron zu den 20 echten Push-ups ----------
export const RepCounter: React.FC<T> = ({ t }) => {
  const k = ramp(t, 15.95, 16.3, backOut);
  if (k <= 0) return null;
  const n = REPS.filter((r) => t >= r - 0.02).length;
  const last = n > 0 ? REPS[n - 1] : -9;
  const bump = interpolate(t, [last - 0.02, last + 0.02, last + 0.16], [0, 1, 0], clamp);
  const done = ramp(t, REPS[19], REPS[19] + 0.3, expoOut);
  const R = 150, cx = 540, cy = 1640;
  const seg = (i: number) => {
    const a0 = (i / 20) * 360 - 90 + 2.2, a1 = ((i + 1) / 20) * 360 - 90 - 2.2;
    const p = (a: number) => `${cx + R * Math.cos((a * Math.PI) / 180)} ${cy + R * Math.sin((a * Math.PI) / 180)}`;
    return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`;
  };
  return (
    <AbsoluteFill style={{ opacity: Math.min(1, k * 1.2) }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <circle cx={cx} cy={cy} r={R + 46} fill="rgba(10,13,20,0.76)" stroke="rgba(223,223,230,0.22)" strokeWidth={1} transform={`translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`} />
        {Array.from({ length: 20 }, (_, i) => {
          const on = i < n;
          const fresh = on && i === n - 1 ? bump : 0;
          return <path key={i} d={seg(i)} stroke={on ? BRAND.accent1 : "rgba(92,100,121,0.7)"} strokeWidth={on ? 22 + 8 * fresh : 14} strokeLinecap="round" fill="none" style={{ filter: on ? `drop-shadow(0 0 ${6 + 14 * fresh + 16 * done}px rgba(216,184,120,0.7))` : undefined }} />;
        })}
        {/* Abschluss-Funken bei Rep 20 */}
        {done > 0 && done < 1 && Array.from({ length: 18 }, (_, i) => {
          const a = (i / 18) * Math.PI * 2 + hash(i) * 0.3;
          const r = R + 30 + 170 * done * (0.6 + 0.4 * hash(i + 7));
          return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={7 * (1 - done)} fill={i % 3 ? BRAND.accent1 : BRAND.secondary} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: cx - 150, top: cy - 105, width: 300, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 150, lineHeight: "150px", color: done > 0.5 ? BRAND.accent1 : BRAND.secondary, scale: String(1 + 0.12 * bump), translate: `0 ${-10 * bump}px` }}>{n}</div>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: BRAND.secondary, opacity: 0.8, marginTop: 4 }}>{done > 0.5 ? "GESCHAFFT" : "/ 20 PUSH-UPS"}</div>
      </div>
    </AbsoluteFill>
  );
};

// kleine Filmstreifen-Vorschau (für Datei-Chip)
export const Thumb: React.FC<{ w: number; h: number; r?: number }> = ({ w, h, r = 6 }) => <Img src={staticFile("day193/thumb.jpg")} style={{ width: w, height: h, objectFit: "cover", borderRadius: r }} />;
