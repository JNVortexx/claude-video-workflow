// Stimm-Hüllkurve pro Video-Frame → src/data.ts (für Wellenformen, die WIRKLICH zur Stimme passen).
// Nutzung: node tools/voice-envelope.mjs Chest.mp4 23.976 src/data.ts
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const [file, fpsArg = "24", out = "src/data.ts"] = process.argv.slice(2); const fps = parseFloat(fpsArg);
const SR = 24000, b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
const n = b.length / 4, spf = SR / fps, N = Math.floor(n / spf), env = [];
for (let f = 0; f < N; f++) { let s = 0, c = 0; for (let i = Math.floor(f * spf); i < Math.min(n, Math.floor((f + 1) * spf)); i++) { const v = b.readFloatLE(i * 4); s += v * v; c++; } env.push(Math.sqrt(s / Math.max(1, c))); }
const mx = Math.max(...env);
writeFileSync(out, `// automatisch erzeugt von tools/voice-envelope.mjs\nexport const ENV = ${JSON.stringify(env.map((v) => Math.round(Math.pow(v / mx, 0.6) * 100) / 100))};\n`);
console.log(`${N} Frames → ${out}`);
