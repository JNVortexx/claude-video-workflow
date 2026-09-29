// Gemeinsame Mix-Engine für UGC 1 + Pitchvideo.
// Jeder SFX-Einsatz wird nach allen Filtern (Trim, EQ, Pitch, Reverse) einzeln gemessen und dann
// exakt auf seinen Ziel-Peak gesetzt – kein Raten mehr, wie viel ein Tiefpass wegfrisst.
// Die Stimme bekommt nur eine statische Verstärkung + Peak-Limiter (kein Kompressor/EQ).
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const SFX_DIR = process.env.SFX_DIR ?? "./sfx/"; // Ordner mit deinen lizenzierten Sounds
export const MIXKIT_DIR = process.env.SFX_DIR2 ?? "./sfx2/"; // optional: zweite Sound-Quelle

// event: { file, at (Sek. im Video, wo der Peak liegen soll), peak (Ziel-dBFS), peakT (Peak in der Datei),
//          offset?, len?, fx?, rate? (Tonhöhe, 1 = original), reverse?, fade? (Ausblenden in s) }
const chain = (e) => {
  const parts = ["aformat=sample_rates=48000:channel_layouts=stereo"];
  if (e.rate && e.rate !== 1) parts.push(`asetrate=${Math.round(48000 * e.rate)},aresample=48000`);
  if (e.reverse) parts.push("areverse");
  if (e.fx) parts.push(e.fx);
  if (e.len) {
    const dur = e.len / (e.rate ?? 1);
    const fo = Math.min(e.fade ?? dur * 0.45, dur); // Ausblendlänge (Riser, die auf dem Peak enden: kurz)
    parts.push(`afade=t=in:st=0:d=0.004,afade=t=out:st=${(dur - fo).toFixed(3)}:d=${fo.toFixed(3)}`);
  }
  return parts.join(",");
};
const inputArgs = (e) => [...(e.offset ? ["-ss", String(e.offset)] : []), ...(e.len ? ["-t", String(e.len)] : []), "-i", e.file];

// Peak-Position im bearbeiteten Clip (Sekunden) – verschiebt sich bei Pitch/Reverse
const peakIn = (e) => {
  let t = e.peakT - (e.offset ?? 0);
  if (e.rate && e.rate !== 1) t /= e.rate;
  if (e.reverse) t = (e.len ?? 0) / (e.rate ?? 1) - t;
  return Math.max(0, t);
};

const peakDb = (e) => {
  const r = spawnSync("ffmpeg", ["-hide_banner", ...inputArgs(e), "-af", `${chain(e)},astats=metadata=0`, "-f", "null", "-"], { encoding: "utf8" });
  const m = [...r.stderr.matchAll(/Peak level dB: (-?[\d.]+|-inf)/g)].pop();
  if (!m || m[1] === "-inf") throw new Error(`kein Signal: ${e.file}`);
  return parseFloat(m[1]);
};

export function mix({ events, voice, voiceGain, end, sfxOut, mixOut, music }) {
  const ready = events.map((e) => ({ ...e, measured: peakDb(e) }));
  const inputs = [], filters = [];
  ready.forEach((e, i) => {
    const start = e.at - peakIn(e);
    const trim = start < 0 ? `,atrim=start=${(-start).toFixed(3)},asetpts=PTS-STARTPTS` : "";
    inputs.push(...inputArgs(e));
    filters.push(`[${i}:a]${chain(e)}${trim},volume=${(e.peak - e.measured).toFixed(2)}dB,adelay=${Math.max(0, Math.round(start * 1000))}:all=1[s${i}]`);
  });
  const sfx = `${filters.join(";")};${ready.map((_, i) => `[s${i}]`).join("")}amix=inputs=${ready.length}:normalize=0,apad=whole_dur=${end},atrim=0:${end}`;
  for (const f of [sfxOut, mixOut]) mkdirSync(dirname(f), { recursive: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-filter_complex", `${sfx}[out]`, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s24le", sfxOut], { stdio: "inherit" });
  const v = ready.length;
  // optionales Musikbett: leise, mit Sidechain-Ducking unter der Stimme, Fade-in/out
  const mIn = music ? ["-ss", String(music.offset ?? 0), "-t", String(end + 1), "-i", music.file] : [];
  const musicChain = music
    ? `;[${v + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${music.gain}dB,afade=t=in:st=0:d=${music.fadeIn ?? 1.5},afade=t=out:st=${(end - (music.fadeOut ?? 2)).toFixed(2)}:d=${music.fadeOut ?? 2}[mu0];` +
      `[vk]aformat=sample_rates=48000:channel_layouts=stereo[key];[mu0][key]sidechaincompress=threshold=0.03:ratio=5:attack=20:release=350:makeup=1[mu]`
    : "";
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", ...inputs, "-i", voice, ...mIn,
    "-filter_complex",
    `${sfx}[sfx];[${v}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${voiceGain}dB${music ? ",asplit=2[vo][vk]" : "[vo]"}${musicChain};` +
      `[vo][sfx]${music ? "[mu]" : ""}amix=inputs=${music ? 3 : 2}:normalize=0,alimiter=limit=0.89:attack=1:release=60:level=disabled,atrim=0:${end}[out]`,
    "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s24le", mixOut,
  ], { stdio: "inherit" });
  ready.forEach((e) => console.log(`${e.at.toFixed(2).padStart(6)} s  ${e.peak} dBFS  ${e.file.split("/").pop().slice(0, 60)}`));
  console.log(`ok, ${ready.length} SFX → ${mixOut}`);
}
