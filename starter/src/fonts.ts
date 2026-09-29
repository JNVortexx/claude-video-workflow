import { staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// ---- Schriften (lokal aus public/fonts) ----------------------------------
const fontFiles: [string, string, string, string][] = [
  ["Switzer", "Switzer-Medium.otf", "500", "normal"],
  ["Switzer", "Switzer-Semibold.otf", "600", "normal"],
  ["Switzer", "Switzer-Bold.otf", "700", "normal"],
  ["Athelas", "Athelas-Bold.ttf", "700", "normal"],
  ["Athelas", "Athelas-Italic.ttf", "400", "italic"],
  ["Tempting", "Tempting.ttf", "400", "normal"],
  ["Times New Roman", "TimesNewRoman.ttf", "400", "normal"],
  ["Times New Roman", "TimesNewRoman-Italic.ttf", "400", "italic"],
  ["Times New Roman", "TimesNewRoman-Bold.ttf", "700", "normal"],
];
fontFiles.forEach(([family, file, weight, style]) =>
  loadFont({ family, url: staticFile(`fonts/${file}`), weight, style }),
);

export const SANS = "Switzer";
export const SERIF = "Athelas";
export const SCRIPT = "Tempting";
export const TIMES = "'Times New Roman'";
