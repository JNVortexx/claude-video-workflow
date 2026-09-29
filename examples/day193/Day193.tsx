import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Captions3 } from "../captions/Captions3";
import { zoomAt } from "../lib/zoom";
import { Stage } from "../pitch3/Scenes";
import { BEATS193 } from "./beats";
import { ClaudeReveal, DayFlip, DmCard, EditBadge, ExplodedScreen, Hud, LightLeak, RepCounter, exploded } from "./Parts";
import { FPS193, clamp, inOut, ramp } from "./lib";
import { ClaudeWorld, PreviewDive, W_A, W_B } from "./World";

// Day 193 – „Alles, was du hier siehst, hat Claude editiert.“ Leistungsschau über dem Rohschnitt (469 Frames, 23,976 fps).
// Ablauf: Hook mit Kamera-HUD → Video wird zum Handy, Ebenen fächern auf → „sondern Claude“ → Claude-Welt
// (Prompt, Dateien, Handoff, Timeline, Render) → fertiges Video fliegt ins Bild → DM → Walzen-Tag 193 → Rep-Zähler (echte 20 Reps).
// Kein Grading: das Footage bleibt farbgleich zum Rohschnitt; Filter nur für Übergänge (Unschärfe, RGB-Versatz, Whip).

const ZOOMS = [
  { at: 0, dur: 1.1, to: 1 },
  { at: 12.51, dur: 1.8, to: 1.07 },
  { at: 15.93, dur: 0.01, to: 1 },
  { at: 15.94, dur: 3.6, to: 1.06 },
];

const VideoFx: React.FC<{ t: number }> = ({ t }) => {
  const frame = Math.round(t * FPS193);
  const z = zoomAt(ZOOMS, 1.22, frame, FPS193);
  // Übergang in die Claude-Welt: rein-zoomen, weich, dunkler
  const into = t < W_A ? ramp(t, 6.02, W_A, inOut) : 0;
  // Whip-Pan am Schnitt zu den Push-ups
  const wA = ramp(t, 15.8, 15.93, (x) => x * x), wB = 1 - ramp(t, 15.93, 16.12, (x) => 1 - (1 - x) * (1 - x));
  const whip = t < 15.93 ? wA : wB;
  const dy = t < 15.93 ? -340 * wA : 340 * wB;
  const vb = Math.round(46 * whip);
  // RGB-Versatz: Hook-Start, „Claude“, Push-up-Schnitt
  const rgb = Math.round(Math.max(interpolate(t, [0, 0.22], [16, 0], clamp), interpolate(t, [5.72, 5.76, 5.95], [0, 20, 0], clamp), interpolate(t, [15.88, 15.93, 16.05], [0, 14, 0], clamp)));
  const hook = interpolate(t, [0, 0.35], [14, 0], clamp);
  const filters = [
    rgb > 0 ? `url(#rgb${rgb})` : "",
    vb > 0 ? `url(#vb${vb})` : "",
    hook > 0.3 ? `blur(${hook}px)` : "",
    into > 0 ? `blur(${18 * into}px) brightness(${1 - 0.45 * into})` : "",
  ].filter(Boolean).join(" ");
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          {vb > 0 && <filter id={`vb${vb}`} x="0" y="-10%" width="100%" height="120%"><feGaussianBlur stdDeviation={`0 ${vb}`} edgeMode="duplicate" /></filter>}
          {rgb > 0 && (
            <filter id={`rgb${rgb}`} x="-5%" y="0" width="110%" height="100%" colorInterpolationFilters="sRGB">
              <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
              <feOffset in="r" dx={rgb} result="r2" />
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
              <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
              <feOffset in="b" dx={-rgb} result="b2" />
              <feBlend in="r2" in2="g" mode="screen" result="rg" />
              <feBlend in="rg" in2="b2" mode="screen" />
            </filter>
          )}
        </defs>
      </svg>
      <OffthreadVideo
        src={staticFile("day193/Chest.mp4")}
        muted
        transparent // Frames verlustfrei als PNG statt JPEG extrahieren (Bildqualität)
        style={{ width: "100%", height: "100%", transformOrigin: "50% 30%", scale: String(z * (1 + 0.14 * into)), translate: dy ? `0 ${dy}px` : undefined, filter: filters || undefined }}
      />
    </AbsoluteFill>
  );
};

export const Day193: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS193;
  const hidden = exploded(t) || (t >= W_A && t < W_B);
  const stageK = t >= W_B ? 0 : Math.max(ramp(t, 2.25, 2.6) * (1 - ramp(t, 4.4, 4.62)), ramp(t, 6.08, 6.3));
  const top = ramp(t, 15.93, 16.1);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {!hidden && <VideoFx t={t} />}
      {stageK > 0 && <Stage frame={frame} fps={FPS193} k={stageK} />}
      {/* statisches Dither-Rauschen gegen Banding/Blockbildung in den dunklen Verläufen der Bühne */}
      {stageK > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.07 * stageK, mixBlendMode: "overlay" }}>
          <filter id="dither"><feTurbulence type="fractalNoise" baseFrequency={1.6} numOctaves={1} seed={7} /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width={1080} height={1920} filter="url(#dither)" />
        </svg>
      )}
      <ExplodedScreen t={t} frame={frame} />
      <ClaudeWorld t={t} frame={frame} />
      <PreviewDive t={t} />
      {/* Lesbarkeit über der weißen Wand bei den Push-ups (Verlauf, kein Grading) */}
      {top > 0 && <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(6,8,12,0.55) 0%, rgba(6,8,12,0.3) 30%, rgba(6,8,12,0) 45%, rgba(6,8,12,0) 75%, rgba(6,8,12,0.35) 100%)", opacity: top }} />}
      <Hud t={t} frame={frame} />
      <ClaudeReveal t={t} />
      <EditBadge t={t} />
      <DmCard t={t} />
      <DayFlip t={t} />
      <RepCounter t={t} />
      <LightLeak t={t} at={0.05} power={0.7} />
      <LightLeak t={t} at={2.3} dir={-1} power={0.55} />
      <LightLeak t={t} at={6.2} power={0.75} />
      <LightLeak t={t} at={12.51} dir={-1} power={0.7} />
      <LightLeak t={t} at={15.93} power={0.6} />
      <Captions3 beats={BEATS193} frame={frame} fps={FPS193} />
    </AbsoluteFill>
  );
};
