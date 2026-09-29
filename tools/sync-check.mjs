// Prüft, ob Ton des Rohschnitts und eine externe WAV/SRT-Quelle synchron sind (Hüllkurven-Korrelation, ±300 ms).
// Nutzung: node tools/sync-check.mjs Chest.mp4 Timeline.wav   → "lag ms 0" = synchron.
// lag ≠ 0 oder auffällig andere Länge = Rohschnitt wurde gestrafft → SRT-Zeiten umrechnen, bevor du Untertitel baust!
import { execFileSync } from "node:child_process";
const env = (f) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", f, "-ac", "1", "-ar", "1000", "-f", "f32le", "-"], { maxBuffer: 1 << 28 }); return Float32Array.from({ length: b.length / 4 }, (_, i) => Math.abs(b.readFloatLE(i * 4))); };
const [a, b] = [env(process.argv[2]), env(process.argv[3])]; const n = Math.min(a.length, b.length);
let best = [0, -1];
for (let l = -300; l < 300; l++) { let s = 0; for (let i = Math.max(0, -l); i < n - Math.max(0, l); i++) s += a[i + l] * b[i]; if (s > best[1]) best = [l, s]; }
console.log("lag ms", best[0], "| Längen (ms):", a.length, b.length);
