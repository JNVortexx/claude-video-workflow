// Zeiten = Videozeit im geschnittenen Clip (Sekunden). Wort-Startzeiten aus Whisper (large-v3-turbo).
// Schnitt: Quelle 12.58–13.00 s entfernt (−0.4167 s für alles danach).
export type Box = "gold" | "red";
export type Word = { text: string; t: number };
export type Chunk = { words: Word[]; t1: number; box?: Box; lines?: number[] };

const CUT_A = 302 / 24, CUT_SHIFT = 10 / 24;
const T = (src: number) => (src < CUT_A ? src : src - CUT_SHIFT);
const c = (box: Box | undefined, t1: number, ...pairs: [string, number][]): Chunk => ({ box, t1: T(t1), words: pairs.map(([text, t]) => ({ text, t: T(t) })) });

export const CHUNKS: Chunk[] = [
  c(undefined, 0.86, ["Innerhalb", 0.0], ["der", 0.54], ["letzten", 0.64]),
  c("gold", 2.02, ["204", 0.88], ["Tage", 1.7]),
  c(undefined, 3.28, ["habe", 2.04], ["ich", 2.4], ["es", 2.54], ["geschafft,", 2.68]),
  c(undefined, 3.66, ["über", 3.3]),
  c("red", 4.58, ["1.000", 3.68], ["Follower", 4.3]),
  c(undefined, 5.4, ["zu", 4.6], ["sammeln.", 4.74]),
  c(undefined, 6.3, ["Und", 5.48], ["hier", 5.56], ["ist", 5.66], ["wie?", 5.82]),
  c(undefined, 7.08, ["Ganz", 6.34], ["einfach.", 6.62]),
  c(undefined, 7.42, ["Ich", 7.12], ["habe", 7.24]),
  c("gold", 8.1, ["5", 7.44], ["Push-ups", 7.74]),
  c(undefined, 9.12, ["für", 8.12], ["jeden", 8.32], ["Follower", 8.42], ["gemacht,", 8.74]),
  c(undefined, 9.82, ["den", 9.14], ["ich", 9.18], ["bekomme.", 9.28]),
  c(undefined, 10.36, ["Jetzt", 9.86], ["mal", 10.0], ["ehrlich,", 10.12]),
  c(undefined, 10.96, ["1.000", 10.38], ["Follower", 10.64]),
  c(undefined, 11.64, ["sind", 10.98], ["jetzt", 11.44]),
  c(undefined, 12.56, ["nicht", 11.66], ["so", 11.84], ["viel,", 12.0]),
  c(undefined, 14.34, ["gebe", 13.02], ["ich", 13.1], ["ganz", 13.26], ["ehrlich", 13.52], ["zu.", 13.88]),
  c(undefined, 15.76, ["Das", 14.4], ["feiern", 14.8], ["wir", 15.22], ["heute,", 15.34]),
  c(undefined, 16.02, ["indem", 15.78], ["wir", 15.84]),
  c("gold", 16.72, ["40", 16.04], ["Push-ups", 16.32]),
  c(undefined, 17.26, ["machen,", 16.74]),
  c(undefined, 17.56, ["weil", 17.28], ["wir", 17.48]),
  c("red", 18.3, ["8", 17.58], ["neue", 17.78], ["Follower", 17.96]),
  c(undefined, 19.24, ["dazubekommen", 18.32], ["haben.", 18.74]),
  c(undefined, 19.82, ["Und", 19.26], ["wenn", 19.38], ["du", 19.52], ["mich", 19.66]),
  c(undefined, 20.78, ["nochmal", 19.84], ["wiedersehen", 19.98], ["willst,", 20.38]),
  c(undefined, 21.16, ["dann", 20.8], ["solltest", 20.88], ["du", 21.08]),
  c("red", 21.8, ["mir", 21.18], ["folgen,", 21.26]),
  c(undefined, 22.44, ["weil", 21.82], ["das", 22.12], ["sonst", 22.26]),
  c(undefined, 23.06, ["ziemlich", 22.46], ["schwierig", 22.72]),
  c(undefined, 24.3, ["werden", 23.08], ["könnte.", 23.34]),
];

// Push-ups: Quelle 569–1481 (913 Frames) → Ausgabe ab Frame 335 auf 239 Frames (×3.82).
// Wiederholungen per Bewegungsanalyse erkannt (45 Spitzen, Quelle-Sekunden); Zähler endet bei 40 (seine Aussage).
const REPS_SRC = [25.25, 26.17, 26.79, 28.08, 28.88, 29.67, 30.5, 31.29, 32.08, 32.83, 33.62, 34.38, 35.17, 35.92, 36.71, 37.5, 38.25, 39.04, 39.79, 40.54, 41.29, 42.04, 42.79, 43.58, 44.29, 45.04, 45.83, 46.62, 47.42, 48.21, 49.38, 50.21, 50.83, 51.71, 52.58, 53.46, 54.29, 55.12, 55.96, 56.79, 57.62, 58.46, 59.29, 60.12, 61.0];
export const BROLL_START = 335;
const srcToOut = (s: number) => (BROLL_START + ((s * 24 - 569) * 239) / 913) / 24;
export const REPS = REPS_SRC.map(srcToOut);
export const REP_TARGET = 40;
