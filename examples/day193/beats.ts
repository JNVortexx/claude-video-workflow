// Day 193 – Untertitel (Zeiten = SRT = Videozeit, per Hüllkurven-Korrelation geprüft: Versatz 0 ms).
// Während der Bühnen-Szenen (6,26–12,51 s) stehen die Captions unten, damit das App-Fenster frei bleibt.
import { type Beat, L, w } from "../captions/Captions3";

export const BEATS193: Beat[] = [
  { t0: 0.0, t1: 2.2, mode: "stack", pos: "mid", lines: [L("s", w("Ich", 0.0), w("weiß,", 0.411), w("das", 0.721), w("ist", 0.831), w("jetzt", 0.961), w("alles", 1.15)), L("m", w("schwer", 1.371)), L("l", w("vorstellbar,", 1.581, "script"))] },
  { t0: 2.23, t1: 3.23, mode: "flow", pos: "low", lines: [L("m", w("aber", 2.23), w("alles,", 2.411), w("was", 2.65), w("du", 2.811), w("jetzt", 2.951), w("gerade", 3.1))] },
  { t0: 3.25, t1: 4.33, mode: "stack", pos: "low", lines: [L("s", w("auf", 3.25), w("dem", 3.38)), L("l", w("Screen", 3.54, "gold")), L("s", w("siehst,", 3.75))] },
  { t0: 4.361, t1: 5.49, mode: "flow", pos: "mid", lines: [L("m", w("habe", 4.361), w("nicht", 4.551), w("ich", 4.781, "strike"), w("editiert,", 4.991))] },
  { t0: 5.511, t1: 6.04, mode: "stack", pos: "mid", lines: [L("s", w("sondern", 5.511)), L("l", w("Claude.", 5.741, "serif"))] },
  { t0: 6.06, t1: 7.53, mode: "flow", pos: "low", lines: [L("m", w("Ich", 6.06), w("selber", 6.541), w("habe", 6.861), w("Claude", 7.141), w("nur", 7.441))] },
  { t0: 7.551, t1: 8.49, mode: "flow", pos: "low", lines: [L("m", w("die", 7.551), w("Rohaufnahmen", 7.661, "gold"), w("gesendet", 8.109))] },
  { t0: 8.51, t1: 10.0, mode: "flow", pos: "low", lines: [L("m", w("und", 8.51), w("alles,", 8.73), w("was", 8.971), w("es", 9.141), w("über", 9.28, "gold"), w("mich", 9.43, "gold"), w("wissen", 9.631), w("muss,", 9.881))] },
  { t0: 10.02, t1: 11.61, mode: "flow", pos: "low", lines: [L("m", w("und", 10.02), w("den", 10.57), w("Rest", 10.78), w("hat", 11.07), w("Claude", 11.33))] },
  { t0: 11.631, t1: 12.2, mode: "stack", pos: "low", lines: [L("s", w("für", 11.631), w("mich", 11.74)), L("l", w("erstellt.", 11.891, "script"))] },
  { t0: 12.221, t1: 13.56, mode: "flow", pos: "mid", lines: [L("m", w("Wenn", 12.221), w("du", 12.67), w("genau", 12.811), w("wissen", 13.06), w("willst,", 13.35))] },
  { t0: 13.58, t1: 14.3, mode: "flow", pos: "mid", lines: [L("m", w("wie", 13.58), w("das", 13.66), w("funktioniert,", 13.93, "gold"))] },
  { t0: 14.32, t1: 15.36, mode: "flow", pos: "mid", lines: [L("m", w("dann", 14.32), w("schreib", 14.43), w("mir", 14.641), w("eine", 14.77), w("DM.", 15.01, "gold"))] },
  { t0: 15.381, t1: 15.9, mode: "flow", pos: "mid", lines: [L("m", w("Und", 15.381), w("das", 15.67), w("war", 15.83))] },
  // „Tag 193“ zeigt die Tages-Anzeige selbst
  { t0: 17.24, t1: 19.5, mode: "stack", pos: "high", lines: [L("s", w("und", 17.24), w("heute", 17.451), w("machen", 17.681), w("wir", 17.861)), L("l", w("20", 18.071, "gold"), w("Push-ups.", 18.381))] },
];
