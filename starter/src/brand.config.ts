// Zentrales Brand-System – HIER deine Farben/Schriften eintragen (Werte unten = Beispiel-Brand, Default falls du keine hast).
// Werte 1:1 aus den Animationsplänen (Stand 28.09.2026). Keine Hex-Werte in Szenen-Komponenten hartcodieren.
import "./fonts";

export const BRAND = {
  primary: "#822323", // Grafiken, Balken, Badges, Rahmen – immer mit Platin-Kontur (1 px), nie Fließtext
  secondary: "#DFDFE6", // Untertitel, Fließtext, Konturen (Platin)
  accent1: "#D8B878", // Gold: Zahlen & Schlüsselwörter
  accent2: "#5C6479", // dezente Badges, Linien, inaktive Elemente – NIE als Text über Video
  bg: "#0A0D14", // Hintergründe, Text-Cards (70–80 % Deckkraft)
  // außerhalb des Systems: neutrale Warnfarbe für „Problem“-Momente („kaputt“)
  warn: "#E4572E",
  // gedämpftes Grau-Rot für die „schlechtere Variante“ (UGC 1: „ohne Mikrofon“)
  muted: "#B59C9C",
} as const;

export const CARD_OPACITY = 0.76; // Text-Cards: 70–80 %
export const cardBg = (o = CARD_OPACITY) => `rgba(10,13,20,${o})`; // = BRAND.bg

export const FONT = {
  body: "Switzer", // alle Kinetic Captions, Spec-Zeilen, UI-Labels
  display: "'Times New Roman'", // ruhig stehende Namens-/Produkt-Reveals, NICHT für Captions
  signature: "Tempting", // Script-Font: sparsam, nur für emotionale Schlüsselwörter/Namen
} as const;

// Primär-Rot immer mit 1 px Platin-Kontur
export const primaryOutline = `0 0 0 1px ${BRAND.secondary}`;
