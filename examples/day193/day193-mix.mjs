// Day 193 – Sounddesign. Prinzip wie im Pitch: jede Bewegung hat einen Sound, kein Sound ohne Bewegung, keine Musik.
// Zeiten = Videozeit (= SRT); `at` = Moment, in dem der Peak des Sounds auf der Bewegung sitzt.
// Stimme: Ton aus Chest.mp4 (−23,8 LUFS) → +7,5 dB + Limiter ≈ −16 LUFS.
import { execFileSync } from "node:child_process";
import { MIXKIT_DIR as K, SFX_DIR as D, mix } from "./mixlib.mjs";

const OUT = "./out/d193/";
const f = (p) => D + p;
const S = {
  click: { file: f("Clicks/ES_Computers, Keyboard & Mouse, Mouse, Apple, Mighty Mouse, Click - Epidemic Sound.mp3"), peakT: 0.097, offset: 0.06, len: 0.08 },
  btn: { file: f("Clicks/ES_Computers, Keyboard & Mouse, Mouse, Button, Click - Epidemic Sound.mp3"), peakT: 2.966, offset: 2.9, len: 0.2 },
  pop: { file: f("Pop/ES_Cartoon, Pop, Small Lid - Epidemic Sound.mp3"), peakT: 0.056, len: 0.2 },
  popLight: { file: K + "sfx_3005_light-pop.mp3", peakT: 0, len: 0.18 },
  bubble: { file: K + "sfx_2357_bubble-pop.mp3", peakT: 0.128, len: 0.35 },
  hardPop: { file: K + "sfx_2364_hard-pop-click.mp3", peakT: 0.006, len: 0.3 },
  whoosh: { file: f("Whooshes/dragon-studio-simple-whoosh-382724.mp3"), peakT: 0.161, offset: 0.05, len: 0.28 },
  soft: { file: f("Whooshes/ES_Swooshes, Whoosh, Soft, Clean - Epidemic Sound.mp3"), peakT: 0.754, offset: 0.45, len: 0.5 },
  airy: { file: f("Whooshes/ES_Designed, Whoosh, Soft Airy - Epidemic Sound.mp3"), peakT: 0.4, offset: 0.1, len: 0.6 },
  swish: { file: f("Whooshes/ES_Cartoon, Swish, Whoosh, Fast Pass - Epidemic Sound.mp3"), peakT: 0.1, offset: 0.03, len: 0.24 },
  zoom: { file: f("Whooshes/ES_Swooshes, Whoosh, Fast, Close, Airy, Zoom 01 - Epidemic Sound.mp3"), peakT: 0.85, offset: 0.35, len: 0.9, fade: 0.25 },
  epic: { file: f("Whooshes/dragon-studio-epic-whoosh-478371.mp3"), peakT: 0.643, offset: 0.2, len: 0.95 },
  tech: { file: f("Whooshes/ES_Swooshes, Whoosh, Technical, Sharp, Fast - Epidemic Sound.mp3"), peakT: 6.775, offset: 6.55, len: 0.55 },
  tonal: { file: f("Whooshes/ES_Swooshes, Whoosh, Synthetic, Tonal Swoosh 01 - Epidemic Sound.mp3"), peakT: 0.731, offset: 0.2, len: 1.0 },
  rocket: { file: f("Whooshes/ES_Swooshes, Whoosh, Rocket, Launch, Pass By, Fast 03 - Epidemic Sound.mp3"), peakT: 1.787, offset: 1.35, len: 0.85 },
  low: { file: f("Whooshes/ES_Swooshes, Whoosh, Low, Long 01 - Epidemic Sound.mp3"), peakT: 2.223, offset: 1.2, len: 1.6 },
  slide: { file: K + "sfx_3120_tech-slide.mp3", peakT: 0.15, len: 0.6 },
  sparkle: { file: K + "sfx_2350_sparkle-whoosh.mp3", peakT: 0.457, len: 1.3 },
  glitter: { file: K + "sfx_2353_glitter-shot.mp3", peakT: 1.023, offset: 0.7, len: 1.4 },
  zoomHit: { file: K + "sfx_772_quick-zoom-impact.mp3", peakT: 0.414, len: 1.0 },
  deep: { file: K + "sfx_1143_whoosh-deep-impact.mp3", peakT: 0.551, len: 2.0 },
  glitch: { file: f("Glitch/ES_User Interface, Glitch, Glitch Databend 04 - Epidemic Sound.mp3"), peakT: 0.158, len: 0.45 },
  qglitch: { file: K + "sfx_2946_quick-glitch.mp3", peakT: 1.16, offset: 1.0, len: 0.4 },
  riser: { file: f("Riser/ES_Designed, Riser, Transition, Fast, Short, Clean 01 - Epidemic Sound.mp3"), peakT: 4.129, offset: 3.4, len: 0.8, fade: 0.08 },
  shutter: { file: f("Camera/ES_Communications, Camera, Take Photo, Designed, Flash, Shutter Click - Epidemic Sound.mp3"), peakT: 0.28, len: 0.9 },
  pencil: { file: f("Pencil Strokes/ES_Objects, Writing, Pencil On Paper, Stroke - Epidemic Sound.mp3"), peakT: 0.55, offset: 0.3, len: 0.5 },
  marker: { file: f("Pencil Strokes/ES_Objects, Writing, Marker On Paper Stroke - Epidemic Sound.mp3"), peakT: 0.3, len: 0.5 },
  reel: { file: f("Gear/ElevenLabs_Hyper-realistic_mechanical_heavy_gear_winding,_smooth_metallic_swoosh,_premium_slot_machine_reel_spi.mp3"), peakT: 2.255, offset: 1.1, len: 1.5, fade: 0.3 },
  kick: { file: f("Cinematic/soundreality-cinematic-percussion-kick-474176.mp3"), peakT: 4.494, offset: 4.42, len: 1.2 },
  thud: { file: f("Impact/freesound_community-impact-6291.mp3"), peakT: 0.75, offset: 0.6, len: 0.5, fx: "lowpass=f=1800" },
  // Tippen: Segmente, `at` = Start (peakT = offset)
  keys: { file: f("Random/dragon-studio-keyboard-typing-sound-effect-335503.mp3"), peakT: 1.0, offset: 1.0 },
  phone: { file: K + "sfx_1393_smartphone-typing.mp3", peakT: 0.5, offset: 0.5 },
};
const BOOST = 3; // „Banger“: SFX etwas präsenter als im Pitch
const e = (s, at, peak, extra = {}) => ({ ...S[s], at, peak: peak + BOOST, ...extra });
const REPS = [16.064, 16.287, 16.483, 16.663, 16.85, 17.027, 17.207, 17.374, 17.551, 17.719, 17.889, 18.06, 18.228, 18.4, 18.571, 18.738, 18.9, 19.065, 19.227, 19.402];

const events = [
  // Hook: Auslöser + Fokus-Zoom, „vorstellbar“ wird geschrieben
  e("shutter", 0.03, -24),
  e("qglitch", 0.06, -32),
  e("airy", 0.4, -29),
  e("pencil", 1.72, -32),
  // S1: Video schrumpft zum Handy, Ebenen fahren auf, Orbit, Rückflug ins Bild
  e("epic", 2.6, -24),
  ...[2.62, 2.69, 2.76, 2.83].map((t, i) => e("slide", t, -33, { rate: 1 + i * 0.08 })),
  e("soft", 3.3, -31),
  e("airy", 3.95, -30, { rate: 0.9 }),
  e("zoom", 4.5, -25),
  e("zoomHit", 4.63, -27),
  // S2: „ich“ durchgestrichen, Claude-Stern + Glitch, Badge
  e("marker", 5.12, -29),
  e("sparkle", 5.72, -25),
  e("glitch", 5.745, -28),
  e("popLight", 5.95, -31),
  // Claude-Welt: Einflug, Kamerafahrten, Tippen, Dateien, Senden
  e("deep", 6.32, -23),
  e("soft", 6.75, -32),
  { ...S.keys, at: 6.34, peak: -26, len: 1.3 },
  e("swish", 7.15, -30),
  e("soft", 7.6, -33),
  e("whoosh", 7.5, -32, { rate: 1.1 }),
  ...[7.68, 7.82, 7.95, 8.07].map((t, i) => e("bubble", t, -27, { rate: 1 + i * 0.07 })),
  e("btn", 8.17, -24),
  e("tech", 8.32, -27),
  // Handoff: Dokument klappt auf, Lesebalken, Chips ploppen heraus, Orbit, Aufsaugen
  e("airy", 8.72, -26),
  e("slide", 8.78, -35, { rate: 0.8 }),
  ...[9.0, 9.18, 9.38, 9.52, 9.72, 9.84].map((t, i) => e("pop", t + 0.08, -27, { rate: 0.9 + i * 0.06 })),
  e("soft", 9.45, -31),
  e("tonal", 10.28, -27, { reverse: true }),
  // Bauen: Antwort streamt, Timeline klappt hoch, Clips, Häkchen, Kamera, Render-Balken
  { ...S.phone, at: 10.1, peak: -30, len: 0.45 },
  e("slide", 10.36, -29),
  e("swish", 10.5, -32, { rate: 0.9 }),
  ...[0, 1, 2, 3].map((i) => e("click", 10.5 + i * 0.1, -31, { rate: 1.1 + i * 0.05 })),
  ...[10.5, 10.74, 10.98, 11.22].map((t, i) => e("popLight", t + 0.02, -28, { rate: 1 + i * 0.07 })),
  e("airy", 10.9, -30, { rate: 1.1 }),
  e("soft", 11.45, -31),
  e("riser", 11.88, -27),
  // Ergebnis fliegt aus dem Fenster und füllt das Bild
  e("glitter", 11.95, -27),
  e("zoom", 12.42, -24),
  e("zoomHit", 12.52, -25),
  e("popLight", 12.7, -32),
  e("low", 13.3, -37),
  // DM: Leiste fährt hoch, Tippen, Senden, Papierflieger, Leiste raus
  e("whoosh", 14.45, -29),
  { ...S.phone, at: 14.55, peak: -27, len: 0.45 },
  e("btn", 15.07, -25),
  e("hardPop", 15.12, -28),
  e("rocket", 15.32, -28),
  e("swish", 15.66, -33),
  // Whip-Pan zu den Push-ups, Walzen „193“, Balken, Badge
  e("epic", 15.93, -22, { rate: 1.1 }),
  e("thud", 15.96, -25),
  e("reel", 16.28, -28),
  ...[16.28, 16.5, 16.9].map((t, i) => e("hardPop", t, -27, { rate: 0.85 + i * 0.1 })),
  e("slide", 16.6, -34, { rate: 1.1 }),
  e("swish", 17.25, -32),
  // Rep-Zähler: erscheint, tickt bei jeder echten Wiederholung, Abschluss bei Rep 20
  e("popLight", 16.02, -31),
  ...REPS.map((t, i) => e("click", t, -31 + i * 0.2, { rate: 0.95 + i * 0.022 })),
  e("glitter", REPS[19] + 0.05, -25),
  e("kick", REPS[19] + 0.02, -24),
];

execFileSync("ffmpeg", ["-v", "error", "-y", "-i", "./public/day193/Chest.mp4", "-vn", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s24le", OUT + "voice.wav"]);
mix({ events, voice: OUT + "voice.wav", voiceGain: 7.5, end: 19.561, sfxOut: OUT + "Day193_SFX.wav", mixOut: OUT + "Day193_Mix.wav" });
