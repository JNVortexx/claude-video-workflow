// Pitchvideo – zentrale Config. Der Tageszähler wird NIE hart codiert (Bug-Historie: 186 statt 190 Tage).
// Tag 1 = 21.03.2026 (Europe/Berlin). Veröffentlichungsdatum: Prop `publishDate` (YYYY-MM-DD) –
// ohne Angabe gilt das heutige Datum in Berlin zum Zeitpunkt des Renderns.
export const CHALLENGE_START = "2026-01-01"; // <- DEIN Starttag (nur nötig, wenn du einen Tageszähler im Video brauchst)
export const TIMEZONE = "Europe/Berlin";

const berlinToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const utcDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};

// Kalendertage in Berlin → Sommerzeit spielt keine Rolle, weil nur Datumsteile verglichen werden
export const challengeDay = (publishDate?: string) => utcDay(publishDate || berlinToday()) - utcDay(CHALLENGE_START) + 1;

export const START_LABEL = "01.01.2026";
