#!/bin/zsh
# Schritt 0 für JEDES neue Video: Rohschnitt prüfen. Nutzung: ./tools/probe.sh Chest.mp4 [Chest.wav]
V="$1"; A="${2:-}"
echo "== Format"; ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_frames,pix_fmt,color_space -show_entries format=duration -of compact "$V"
echo "== Lautheit (Ziel Endmix ≈ -16 LUFS)"; ffmpeg -hide_banner -i "$V" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated" | head -2
echo "== Schnitte (scdet)"; ffmpeg -hide_banner -i "$V" -vf "scdet=threshold=6" -an -f null - 2>&1 | grep -o "lavfi.scd.time: [0-9.]*" | sort -u
echo "== Kontaktbogen -> ./contact.jpg (1 Bild/Sek.)"; ffmpeg -v error -y -i "$V" -vf "fps=1,scale=270:480,tile=10x2" -frames:v 1 contact.jpg
[ -n "$A" ] && node "$(dirname "$0")/sync-check.mjs" "$V" "$A"
