// Misst pro Sounddatei, WO der lauteste Punkt liegt (peakT) – den brauchst du im Mix, damit der Peak exakt auf der Bewegung sitzt.
// Nutzung: node tools/sfx-peak.mjs sfx/*.mp3
import { execFileSync } from "node:child_process";
for (const f of process.argv.slice(2)) {
  const b = execFileSync("ffmpeg", ["-v", "error", "-i", f, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  let m = 0, mi = 0; const n = b.length / 4;
  for (let i = 0; i < n; i++) { const v = Math.abs(b.readFloatLE(i * 4)); if (v > m) { m = v; mi = i; } }
  console.log(`peakT ${(mi / 48000).toFixed(3)}s  Länge ${(n / 48000).toFixed(2)}s  ${f.split("/").pop()}`);
}
