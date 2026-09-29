#!/bin/zsh
# Qualitäts-Render: verlustfreie PNG-Frames → ProRes-HQ-Zwischenstufe → x264 (2-Pass, 15 Mbit/s) + korrekte BT.709-Tags.
# Nutzung: ./render.sh <CompositionId> <mix.wav> <ausgabe.mp4>      Voraussetzung: Rohschnitt-Clip in der Composition mit <OffthreadVideo transparent>
set -e
COMP="$1"; MIX="$2"; OUT="$3"
mkdir -p out
# WICHTIG: Remotion kodiert BT.709, taggt es aber als BT.601 → Farbstich. Deshalb beim Muxen neu taggen:
TAG=(-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc)
npx remotion render "$COMP" out/hq.mov --codec=prores --prores-profile=hq --image-format=png --scale=2 --concurrency=6 --log=error
X=(-c:v libx264 -preset slower -tune film -b:v 15M -maxrate 22M -bufsize 30M -pix_fmt yuvj420p -x264-params aq-mode=3:aq-strength=0.9:deblock=-1,-1)
ffmpeg -hide_banner -v error -y -i out/hq.mov $X -pass 1 -passlogfile out/pass -an -f mp4 /dev/null
ffmpeg -hide_banner -v error -y -i out/hq.mov -i "$MIX" -map 0:v -map 1:a $X -pass 2 -passlogfile out/pass $TAG -c:a aac -b:a 320k -movflags +faststart "$OUT"
rm -f out/pass* out/hq.mov
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames,width,height,bit_rate,color_space -of compact "$OUT"
echo "fertig: $OUT"
