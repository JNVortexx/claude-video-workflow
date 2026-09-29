import { Easing, interpolate } from "remotion";

// Day 193 – Hilfen für Zeit-Rampen und die virtuelle 3D-Kamera.
export const FPS193 = 24000 / 1001;
export const END193 = 469 / FPS193; // 19,56 s = Länge des Rohschnitts
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const expoOut = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const backOut = Easing.bezier(0.34, 1.56, 0.64, 1);

// 0 → 1 zwischen a und b (Sekunden)
export const ramp = (t: number, a: number, b: number, ease: (x: number) => number = inOut) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: ease });
// sichtbar zwischen a und b mit weichem Ein-/Ausblenden
export const win = (t: number, a: number, b: number, fin = 0.25, fout = 0.25) => Math.min(ramp(t, a - 0.001, a + fin, expoOut), 1 - ramp(t, b - fout, b, inOut));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Monotone kubische Interpolation (Fritsch–Carlson): weiche, überschwingfreie Kamerafahrten durch Keyframes.
// Doppelte Werte hintereinander = Kamera steht (Tangente 0), sonst fließt die Bewegung ohne Stopp durch.
export type Key<T extends string> = { t: number } & Record<T, number>;
export function track<T extends string>(keys: Key<T>[], ch: T, t: number, flow = 1): number {
  const n = keys.length;
  if (t <= keys[0].t) return keys[0][ch];
  if (t >= keys[n - 1].t) return keys[n - 1][ch];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((keys[i + 1][ch] - keys[i][ch]) / (keys[i + 1].t - keys[i].t));
  const m: number[] = [0];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (flow * 2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(0);
  let i = 0;
  while (t > keys[i + 1].t) i++;
  const h = keys[i + 1].t - keys[i].t;
  const s = (t - keys[i].t) / h;
  const s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * keys[i][ch] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * keys[i + 1][ch] + (s3 - s2) * h * m[i + 1];
}

export type Cam = { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number };
export const CAM_CH = ["x", "y", "z", "rx", "ry", "rz", "s"] as const;
export const camAt = (keys: Key<keyof Cam>[], t: number): Cam =>
  Object.fromEntries(CAM_CH.map((c) => [c, track(keys, c, t)])) as Cam;
// grobe Kamerageschwindigkeit → Bewegungsunschärfe
export const camSpeed = (keys: Key<keyof Cam>[], t: number, dt = 1 / FPS193) => {
  const a = camAt(keys, t), b = camAt(keys, t - dt);
  return Math.abs(a.x - b.x) / 40 + Math.abs(a.y - b.y) / 40 + Math.abs(a.z - b.z) / 60 + Math.abs(a.rx - b.rx) / 1.5 + Math.abs(a.ry - b.ry) / 1.5 + Math.abs(a.s - b.s) * 12;
};
export const camTransform = (c: Cam) => `translate3d(${c.x}px, ${c.y}px, ${c.z}px) rotateX(${c.rx}deg) rotateY(${c.ry}deg) rotateZ(${c.rz}deg) scale(${c.s})`;

// deterministisches Pseudo-Rauschen
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
