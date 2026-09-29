# MASTERPROMPT – Kurzvideo-Workflow mit Claude Code (Untertitel, Motion Graphics, 3D, Sounddesign, 4K-Export)

> **Für Claude Code.** Du bekommst diese Datei von einem Creator, der seine Shorts/Reels/TikToks von dir „veredeln“ lassen will.
> Er liefert den **Rohschnitt** (Video + Ton). Du lieferst **Untertitel, Motion Graphics, 3D-Animationen, Sounddesign und den 4K-Export** –
> alles als Code (Remotion/React), reproduzierbar, ohne Videoeditor.
>
> **Vorgehen:** Lies die ganze Datei. Arbeite die Phasen der Reihe nach ab. **Frag nur nach, wenn du wirklich blockiert bist** (siehe „Was du vom Creator brauchst“).
> Antworte dem Creator in **seiner Sprache**, kurz und direkt. Melde dich bei langen Renders mit einem Satz, was du gerade machst.

---

## 0. Ergebnis, das du am Ende lieferst

| Datei | Inhalt |
|---|---|
| `<Name>_fertig_4K.mp4` | 2160×3840, H.264, ~15 Mbit/s, Stimme + Sounddesign, korrekte Farb-Tags |
| `<Name>_SFX.wav` | nur die Soundeffekte (falls der Creator selbst mischen will) |
| Remotion-Projekt | so aufgebaut, dass das nächste Video in Minuten statt Stunden entsteht |

Qualitätsmaßstab: **elegant, smooth, hochwertig, gutes Pacing.** Kein „Iman-Style“, keine Emojis, keine wilden Pops ohne Grund. Wenn der Creator „all out“ sagt: 3D-Kamerafahrten, Glitch-Übergänge, Light Leaks, Live-UI-Nachbauten – aber immer geführt, nie chaotisch.

---

## 1. Was du vom Creator brauchst (einmalig erfragen, danach merken)

1. **Rohschnitt** (`Chest.mp4` o. ä., mit Ton und B-Roll) + optional **SRT** (Wort- oder Satz-Timing). Ohne SRT: selbst transkribieren (Phase 3).
2. **Brand:** 3–5 Farben (Hex), 2–3 Schriften. Fehlt das: Default-Palette aus Phase 2 nehmen und sagen, dass es ein Default ist.
3. **Ordner für Lieferung** (Standard: `<Projektordner>/Export/`). **Keine Mail, kein Cloud-Upload** – nur lokal ablegen, außer der Creator verlangt es ausdrücklich.
4. **Sounds:** eigener Ordner mit **lizenzierten** SFX (Epidemic Sound, Mixkit, Pixabay …). **Lade nie ungefragt Sounds herunter** – nenne Dateiname, Quelle, Größe und frag vorher.
5. **Sonderwünsche** („Zitat entsättigen“, „hier Blitz“, „Zahl hochzählen“ …) – wörtlich übernehmen.

**Harte Regeln, die der Creator nie wieder sagen soll (aus Feedback über viele Videos):**
- **Grafiken decken nie das Gesicht ab.** Auch nicht halbtransparent in Überblendungen. Szenen-Inhalt blendet aus, *bevor* die Bühne verschwindet.
- **Kein Color Grading** am Footage, es sei denn, es wird ausdrücklich verlangt. Farben müssen dem Rohschnitt entsprechen. (Erlaubt: Weichzeichner, Abdunklung, Entsättigung als Effekt an definierten Stellen, RGB-Versatz bei Glitches.)
- **Keine Hintergrundmusik** im gerenderten Video – der Creator legt Musik ggf. selbst dazu. Nur SFX.
- **„Jede Bewegung hat einen Sound, kein Sound ohne Bewegung.“** Keine Riser/Hits nur zur Betonung.
- **Zooms nur weich** (Ease-in-out), nur an Schnitten oder Schlüsselwörtern, nie springend.
- **Rohschnitt-Reihenfolge nie ändern.** Der Creator schneidet selbst.
- **Nichts erfinden.** Zahlen, Namen, Fakten nur aus Material oder Angaben des Creators. Tageszähler nie hart codieren (siehe `pitch.config.ts`).
- **Immer 4K** (2160×3840), nie aus 1080p-Proxys.

---

## 2. Phase A – Rechner einrichten (macOS; einmalig)

```bash
# Homebrew (falls nicht vorhanden): https://brew.sh
brew install node ffmpeg imagemagick yt-dlp gh
brew install whisper-cpp                 # lokale Transkription, kein Upload
brew install --cask blender              # optional: nur für 3D-Produktmodelle / Geräte-Renders
npm install -g @anthropic-ai/claude-code # Claude Code CLI (falls noch nicht da)
```

Whisper-Modell (einmalig, ~1,6 GB, läuft lokal):
```bash
mkdir -p ~/.local/share/whisper-models && cd ~/.local/share/whisper-models
curl -L -O https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

**Prüfen:** `node -v` (≥ 20), `ffmpeg -version`, `whisper-cli --help`. Fehlt etwas → nachinstallieren, nicht raten.

### Skills (Claude Code liest sie automatisch, wenn sie in `~/.claude/skills/` liegen)

| Skill | Wofür | Installation |
|---|---|---|
| **remotion-best-practices** (offiziell von Remotion) | API-Wissen: `interpolate`, `spring`, Sequencing, Captions, Audio, Rendering | `npx skills add remotion-dev/skills` (oder in Claude Code: Plugin-/Skill-Suche „remotion“) |
| **shorts-toolkit** (optional, eigener Skill) | ffmpeg-Rezepte: 9:16 zuschneiden, Untertitel einbrennen, komprimieren, Thumbnails | Ordner `~/.claude/skills/shorts-toolkit/SKILL.md` selbst anlegen: Sammlung deiner ffmpeg-/whisper-Befehle |
| **videodb** (optional) | Analyse/Suche in Videos, Layout-Fehler-Check. Braucht eigenen API-Key | `~/.claude/skills/videodb/` + Key in `.env` (**nie** ins Repo/Zip!) |

> Wenn ein Skill fehlt, funktioniert der Workflow trotzdem – er macht Remotion-Code nur zuverlässiger. **Konsultiere den Remotion-Skill, bevor du eine Remotion-API benutzt** (Komponenten und Props ändern sich).

### MCP-Server (optional, alles läuft auch ohne)

| MCP | Nutzen im Workflow |
|---|---|
| **Claude Browser / Chrome-Erweiterung** | Live-Website als Screen-Recording (z. B. Partner-/Landingpage) via Headless-Chrome/CDP aufnehmen und ins Video einbauen |
| **Figma** | Nur, wenn die Brand aus Figma kommt (Farben/Fonts auslesen) |
| **Notion/Drive/Mail** | **Nicht** für Lieferung nutzen (Regel oben) |

Hinzufügen z. B. mit `claude mcp add …` bzw. über die Connector-Einstellungen der Claude-App. Ohne MCP: Screen-Recordings mit dem Skript aus Phase 6 (Puppeteer/CDP) oder der Creator liefert Aufnahmen.

---

## 3. Phase B – Projekt anlegen

```bash
npx create-video@latest --blank    # Name z. B. "video-studio", TypeScript, Tailwind: ja (oder nein – wir nutzen Inline-Styles)
cd video-studio
npm i @remotion/fonts @remotion/three three @react-three/fiber @react-three/drei
```

1. Aus diesem Paket kopieren:
   - `starter/src/*` → `src/` (Brand-Config, Fonts, Captions, Zoom, Motion-Helfer, Tageszähler)
   - `starter/sound/mixlib.mjs` → `sound/`
   - `starter/render.sh` → Projektwurzel, `tools/*` → `tools/`
   - `starter/remotion.config.ts` → ersetzt die Standard-Config
2. `src/brand.config.ts` **auf die Brand des Creators umstellen** (Farben, Font-Namen). Nirgends Hex-Werte in Komponenten hartcodieren – immer `BRAND.*`.
3. Schriftdateien in `public/fonts/` legen (**nicht Teil dieses Pakets**, Lizenz beachten) und in `src/fonts.ts` registrieren.
   - Default-Empfehlung: **Switzer** (kostenlos: fontshare.com) für Text, **Times New Roman** (macOS-System, für Zahlen/Namen), ein **Script-Font** (z. B. „Tempting“ – Lizenz selbst prüfen) *nur* für emotionale Schlüsselwörter.
4. Rohschnitt nach `public/<video>/Chest.mp4` kopieren (**echte Kopie, kein Symlink** – Remotion kopiert Symlinks in `public/` nicht mit).
5. `npx tsc --noEmit` muss ohne Fehler laufen.

### Brand-System (Default, wenn der Creator keins hat)

| Token | Hex | Verwendung |
|---|---|---|
| `bg` | `#0A0D14` | Hintergründe, Text-Cards (70–80 % Deckkraft) |
| `primary` | `#822323` | nur Grafik/Balken/Rahmen, **immer mit 1-px-Kontur in `secondary`** |
| `secondary` | `#DFDFE6` | Text, Konturen |
| `accent1` | `#D8B878` | Zahlen & Schlüsselwörter (Gold) |
| `accent2` | `#5C6479` | Linien, inaktive Elemente – **nie als Text über Video** |

Regeln: Text über Video nur mit weichem Schatten/Scrim (Verlauf, keine Box). Script-Font sparsam. Zahlen in Serif, zählen hoch.

---

## 4. Phase C – Rohschnitt analysieren (NIE überspringen)

```bash
./tools/probe.sh public/<video>/Chest.mp4 [externe.wav]
```

Das liefert: fps, Auflösung, Länge, Lautheit, Schnittzeiten, Kontaktbogen (`contact.jpg`, **ansehen!**).

**Immer prüfen und dem Creator kurz melden:**
1. **fps des Rohschnitts** (oft 23,976 statt 30) → Composition genau darauf einstellen (`fps={24000/1001}`, `durationInFrames = nb_frames`).
2. **Ist Video = SRT/WAV synchron?** `node tools/sync-check.mjs Video.mp4 Ton.wav` → `lag ms 0` und gleiche Länge. Wurde der Rohschnitt gestrafft (Pausen raus), stimmen die SRT-Zeiten nicht mehr → per Hüllkurven-Korrelation umrechnen, **bevor** Untertitel gebaut werden.
3. **Einblendungen im Bild** (Screenshots, Strava, Apps): Captions dort umplatzieren, nichts überdecken.
4. **Tonpegel:** Rohton oft −24 bis −37 LUFS → im Mix statisch anheben auf ≈ −16 LUFS (+ Limiter), *kein* Kompressor/EQ. Bei mehreren Tonquellen den besten Rauschabstand nehmen.
5. **Beschleunigte/besondere Szenen** (z. B. Push-ups im Zeitraffer) *analysieren* statt schätzen: z. B. Bewegungs-Schwerpunkt pro Frame → echte Wiederholungen zählen → Zähler/Klicks daran synchronisieren (Day 193: 20 Reps aus dem Bild erkannt).

Kein SRT vorhanden → transkribieren:
```bash
ffmpeg -i Chest.mp4 -ar 16000 -ac 1 audio.wav
whisper-cli -m ~/.local/share/whisper-models/ggml-large-v3-turbo.bin -f audio.wav -l de -ml 1 -osrt   # Wort-genau
```
Wort-SRTs: Groß-/Kleinschreibung glätten, gesplittete Zahlen („20“+„26“) zusammenführen, Eigennamen prüfen.

---

## 5. Phase D – Untertitel („Captions v3“)

`src/captions/Captions3.tsx` (aus `starter/`). Modi pro Beat:
- **flow** – eine Aussage, Wörter steigen aus einer Maske auf
- **stack** – Kernaussage gestapelt in Hierarchie (klein / groß / klein)
- **headline** – ein großer ruhiger Satz (Serif)
- **quote** – fremde Stimme (Serif kursiv, „Anführungszeichen“)

Highlights (`hl`): `gold` (Zahlen/Schlüsselbegriffe, gezogene Unterstreichung), `script` (emotionales Schlüsselwort, „geschrieben“, max. 1–2 pro Video), `warn`, `muted`, `serif`, `strike` (Durchstreichen, roter Balken).

Beats schreibst du in `src/<video>/beats.ts` mit den Helfern `L(size, ...w(text, startSek, hl?))`. **Zeiten = Wort-Startzeiten aus der SRT (Videozeit).**

Design-Regeln:
- Position: `mid` Standard; `low` wenn die Bildmitte frei bleiben muss; `high` bei Zählern/Badges. Nie aufs Gesicht.
- Lesbarkeit über weichen Scrim (radialer Verlauf), nie Kasten.
- Ein Beat = ein Gedanke. Pausen im Ton = Beat-Wechsel.
- Schlüsselwörter zeigen, nicht alles hervorheben (≤ 25 % der Wörter).

---

## 6. Phase E – Motion Graphics & 3D (die „Leistungsschau“)

Bausteine, die sich bewährt haben (Beispiele in `examples/day193/`):

**Kamera-Rig ohne WebGL:** CSS-3D. Ein Container mit `perspective: 2200` und `transformStyle: "preserve-3d"`; die Kamera ist ein Transform des Containers (`translate3d/rotateX/rotateY/rotateZ/scale`), gesteuert über **Keyframes mit monotoner kubischer Interpolation** (`src/lib/motion.ts` → `camAt(keys, t)`; doppelte Werte = Kamera steht, sonst fließt die Bewegung ohne Stopp). Geschwindigkeit → leichte Bewegungsunschärfe (`camSpeed`).
> ⚠ **Auf Eltern von `preserve-3d` nie `opacity`/`filter` setzen** – das plättet die 3D-Szene. Ein-/Ausblenden auf den Kind-Ebenen oder über einen Wrapper *außerhalb*.

**Wiederverwendbare Szenen/Effekte:**
| Baustein | Idee |
|---|---|
| **Kamera-HUD im Hook** | REC-Punkt, Timecode, Eckklammern, „4K · 23,976 FPS“ – Bild startet leicht eingezoomt + unscharf und „findet Fokus“ |
| **Video → Handy → Ebenen** | Clip schrumpft in ein 3D-Handy (live weiterlaufend), dahinter fächern Glas-Ebenen auf („Untertitel“, „Motion Graphics“, „Sound Design“ …), Kamera orbitet, fliegt zurück ins Vollbild |
| **Live-UI-Nachbau** (z. B. Claude-Fenster) | Prompt tippt sich, Datei-Chips fliegen ins Eingabefeld, Cursor klickt Senden, Dokument klappt auf, Karten poppen heraus, Timeline klappt hoch, Render-Balken läuft |
| **Ergebnis fliegt ins Bild** | fertiges Video schwebt aus dem Fenster und füllt exakt auf einem Schnitt das Vollbild (Rahmen/Radius blenden aus) |
| **Whip-Pan an Schnitten** | vertikale Bewegungsunschärfe (`feGaussianBlur` mit `stdDeviation="0 N"`) + Versatz, RGB-Split (`feColorMatrix` + `feOffset`) |
| **Light Leaks** | `mixBlendMode: "screen"`, radiale Verläufe, wandern über den Übergang |
| **Walzen-Zähler / Ring-Zähler** | Ziffern rollen mit Blur; Ring füllt sich segmentweise **synchron zu echten Ereignissen** |
| **Stimm-Wellenform** | echte Hüllkurve: `node tools/voice-envelope.mjs Video.mp4 23.976 src/data.ts` |
| **Weiche Zooms** | `src/lib/zoom.tsx` – Keyframes, nie springend |
| **Echte Produkt-3D-Modelle** | Blender → transparente PNG-Sequenz + Ankerpunkte, Callouts in Remotion darauf setzen. Nur **kostenlose/CC-Modelle**, Credit in die Videobeschreibung |
| **Website-Recording** | Headless-Chrome via CDP, Mobile-Viewport, Frames → Remotion. Zahlen im Video **live von der Seite** lesen, nicht abtippen |

**Bühne:** Für Aufzählungen/Stats/Angebot eine Vollbild-Bühne mit animiertem Brand-Hintergrund (Blobs + Punktraster + Vignette); Ein-/Ausstieg immer auf Schnitten oder Satzanfängen. Hinter Bühnen-Verläufen **statisches Dither-Rauschen** (Overlay, ~7 %) gegen Banding.

**Pacing:** Jede Sekunde braucht eine Bewegung, aber nie zwei Dinge gleichzeitig um Aufmerksamkeit. Kamerafahrten 0,5–1 s, Ruhepunkte auf Kernaussagen. Einstiege `expoOut` (`cubic-bezier(.16,1,.3,1)`), Wechsel `inOut` (`.65,0,.35,1)`, Pops leichter Overshoot (`.34,1.56,.64,1`).

**Die Länge des Videos bleibt unverändert** (469 Frames rein → 469 raus). Prüfen!

**Composition registrieren** (`src/Root.tsx`):
```tsx
<Composition id="MeinVideo" component={MeinVideo} durationInFrames={469} fps={24000/1001} width={1080} height={1920} />
```
Rohschnitt-Clip **immer so einbinden:** `<OffthreadVideo src={staticFile("…/Chest.mp4")} muted transparent />` (`transparent` → Frames verlustfrei als PNG statt JPEG; sonst wird das Bild „pixelig“).

**Vor jedem Voll-Render Stichproben:** `npx remotion render <Id> out/preview.mp4 --scale=0.4` (~40 s), daraus Kontaktbogen (`fps=2,scale=216:384,tile=10x4`) und Einzelbilder an Übergängen ansehen. Erst wenn es stimmt: 4K.

---

## 7. Phase F – Sounddesign (`sound/mixlib.mjs`)

Prinzip: **Jede Bewegung hat einen Sound. Kein Sound ohne Bewegung. Keine Musik.**

Ablauf:
1. Sounds sichten: `node tools/sfx-peak.mjs sfx/*.mp3` → liefert pro Datei den **Peak-Zeitpunkt** (`peakT`).
2. `sound/<video>-mix.mjs` schreiben (Vorlage: `examples/day193/day193-mix.mjs`). Pro Event:
   `{ file, at, peak, peakT, offset?, len?, rate?, reverse?, fx?, fade? }`
   - `at` = Sekunde im Video, in der der **Peak** auf der Bewegung sitzt (Einflug: Ankunft; Zoom: Mitte; Pop: erstes Bild).
   - `peak` = Ziel-dBFS. Typisch: Impacts −22…−25, Whooshes −26…−30, Klicks/Ticks −28…−33. Die Engine **misst jeden Sound nach allen Filtern** und setzt ihn exakt auf den Zielpegel.
   - `rate` (Tonhöhe) leicht variieren bei Wiederholungen (Ticks: `0.95 + i*0.022`), sonst klingt es maschinell.
   - `reverse` für „Saugen“/Aufbauen, `fx: "lowpass=f=1800"` für dumpfe Thuds.
3. Sound-Kategorien: **Whoosh** (Kamerafahrten, Einflüge) · **Pop/Bubble** (erscheinende Karten) · **Click/Tick** (Zähler, Tippen) · **Impact/Thud** (Landungen, Schnitte, sparsam) · **Glitch** (RGB-Split) · **Shutter/Flash** (Hook, Blitz) · **Sparkle/Glitter** (Abschluss, Erfolg) · **Reel** (Walzen).
4. `mix({ events, voice, voiceGain, end, sfxOut, mixOut })`
   - Stimme: nur statisch anheben (`voiceGain`, z. B. +7,5 dB bei −23,8 LUFS Rohton) + Limiter – **kein Kompressor/EQ**.
   - Ziel Endmix: **≈ −16 LUFS, True Peak ≤ −0,9 dBFS.** Prüfen: `ffmpeg -i mix.wav -af ebur128=peak=true -f null -`.
   - SFX-Summe etwa 6–20 LU unter der Stimme (für „Banger“ +3 dB über dem Standard).
5. Nach dem Mix: jedes Event gegen die Bewegung im Bild prüfen (Zeitstempel!). Lieber weniger, dafür exakt.

---

## 8. Phase G – Rendern & Export

```bash
./render.sh MeinVideo out/mix.wav Export/MeinVideo_fertig_4K.mp4
```
Was `render.sh` tut und **warum** (nicht abkürzen):
1. Remotion → **ProRes HQ mit PNG-Frames** (`--image-format=png --scale=2`) – verlustfreie Zwischenstufe.
2. ffmpeg → **x264 2-Pass, `slower`, 15 Mbit/s, `aq-mode=3`** (mehr Bits in dunklen Flächen). Ein einziger Durchgang direkt aus Remotion sieht sichtbar schlechter aus.
3. **Farb-Tag-Falle:** Remotion kodiert BT.709, taggt aber BT.601 → Farbstich („sieht gegradet aus“). Deshalb beim Muxen immer  
   `-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc`
4. Lange Renders: `nohup caffeinate -i ./render.sh … > render.log 2>&1 &` (sonst schläft der Mac ein). ~10 Min. für 20 s in 4K.

**Overlay für DaVinci Resolve statt fertigem Video** (wenn der Creator in Resolve weiterarbeitet): Composition ohne Video-Ebene rendern, `--codec=prores --prores-profile=4444 --image-format=png --scale=2`, danach ggf. `prores_ks -qscale:v 10 -alpha_bits 8` (≈ 1,2 GB statt 6 GB). H.264 kann kein Alpha → **nie** als Overlay anbieten.

---

## 9. Phase H – Qualitätskontrolle (Pflicht, nicht optional)

Prüfe an der **fertigen Datei**, nicht am Code:
- [ ] Frames = Rohschnitt (`ffprobe -count_frames`), Auflösung 2160×3840, Farbtags bt709
- [ ] Tonlänge = Videolänge, −16 LUFS, kein Clipping
- [ ] Einzelbilder an jedem Übergang und bei jedem Text: **nichts über dem Gesicht, nichts abgeschnitten, kein Text auf ungünstigem Hintergrund**
- [ ] 1:1-Ausschnitte (Crop 1080×1080) von Text/Kanten: scharf? Dunkle Verläufe: keine Blöcke? (`eq=brightness=0.15:contrast=1.6` macht Banding sichtbar)
- [ ] Farbvergleich mit Original (`signalstats`: YAVG/UAVG/VAVG innerhalb ~1–2 Punkte)
- [ ] Jeder Sound sitzt auf einer sichtbaren Bewegung
- [ ] Zahlen/Namen/Fakten stimmen mit Material überein

Nichts als „fertig“ melden, was du nicht am Ergebnis gesehen hast. Fehler offen benennen.

---

## 10. Stolperfallen (alle real passiert)

| Problem | Lösung |
|---|---|
| Video wirkt „gegradet“/Farbstich | BT.709-Tags beim Muxen setzen (Phase G) |
| Bild pixelig/blockig | `OffthreadVideo transparent` + PNG → ProRes → 2-Pass-x264; Dither auf Verläufen |
| Untertitel laufen dem Ton davon | Rohschnitt war gestrafft → Sync prüfen (`sync-check.mjs`), Zeiten umrechnen |
| fps stimmt nicht | Immer aus `ffprobe` lesen (23,976 ≠ 24 ≠ 29,97) |
| 3D-Szene wird flach | `opacity`/`filter` auf `preserve-3d`-Elternteil → auf Kinder verlagern |
| Symlink im `public/` fehlt im Render | echte Kopie |
| Schriften laden zu spät | `useFontsReady` mit `delayRender/continueRender` (in `Captions3.tsx`) |
| Script-Font-Oberlängen abgeschnitten | mehr Zeilenabstand (`gapBefore`), Wort per Auto-Fit begrenzen |
| SFX klingen zu leise/unterschiedlich | Peaks mit voller Samplerate messen (bei 8 kHz werden hohe Sounds unterschätzt) – `mixlib` tut das |
| ffmpeg-`drawtext` fehlt | Text nie per ffmpeg, immer in Remotion |
| ffmpeg-`huesaturation` wirkt kaum | eigene LUT statt Filter (nur falls Grading verlangt) |
| Mac schläft beim Rendern ein | `caffeinate -i` + `nohup` |
| Tageszähler falsch | aus Datum berechnen (`challengeDay()`), nie hart codieren |

---

## 11. Pro-Video-Ablauf in 10 Zeilen (Kurzfassung)

1. `./tools/probe.sh` → fps, Sync, Schnitte, Kontaktbogen ansehen
2. SRT holen/erzeugen, Sync prüfen, ggf. Zeiten umrechnen
3. Composition anlegen (Länge/fps = Rohschnitt)
4. `beats.ts` schreiben (Captions v3)
5. Szenen/Kamerafahrten bauen (Phase E), Übergänge auf Schnitte legen
6. Vorschau `--scale=0.4`, Kontaktbogen ansehen, korrigieren
7. `sound/<video>-mix.mjs` → Mix, Lautheit prüfen
8. `./render.sh …` (Hintergrund, `caffeinate`)
9. QA-Checkliste an der fertigen Datei
10. Datei im Finder zeigen (`open -R <datei>`), kurze Zusammenfassung + ehrliche Grenzen

---

## 12. Prompt-Vorlage für den Creator (pro neues Video)

> Im Ordner findest du alles für dieses Video: `Chest.mp4` (Rohschnitt mit Ton), die SRT und (optional) ein Handoff.
> Mach Untertitel nach meinem Brand-System und geh bei den Animationen **all out** – 3D, Kamerafahrten, Sounddesign, alles smooth und fließend. Länge des Videos bleibt gleich.
> Wo ich Rohaufnahmen gezeigt habe, zeig das im Bild. Liefere `<Name>_fertig_4K.mp4` in `Export/`.
> Sonderwünsche: …

*(Für ein ruhigeres Video statt „all out“: „elegant und minimal – nur Captions, weiche Zooms, dezente SFX“.)*

---

## 13. Was in diesem Paket ist – und was bewusst nicht

**Enthalten:** `starter/` (Brand-Config, Fonts-Loader, Captions v3, Zoom, 3D-Kamera-Helfer, Tageszähler, Mix-Engine, Render-Skript), `tools/` (probe, sync-check, voice-envelope, sfx-peak), `examples/day193/` (komplettes Beispiel: 3D-Claude-Szene, Hook-HUD, Handy-Ebenen, DM, Rep-Zähler, Mix – nur Referenz, importiert Pfade des Originalprojekts).

**Nicht enthalten (bewusst):** Schriftdateien und Sounds (Lizenzen), Footage, API-Keys/`.env`, gerenderte Videos. Beschaffe Schriften und lizenzierte SFX selbst und lege sie in `public/fonts/` bzw. `sfx/`.

*Stand: 29.09.2026 · Remotion 4.0.x · ffmpeg 9 · Node 26 · macOS (Apple Silicon)*
