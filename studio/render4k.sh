#!/bin/bash
# 4K: Text-Ebene (ProRes 4444 mit Alpha, PNG-Frames, scale 2) → ffmpeg legt sie auf das Lanczos-hochskalierte Video
# → x264 2-Pass 15 Mbit/s + BT.709-Tags (wie starter/render.sh)
set -e
mkdir -p out ../Export
TAG=(-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc)
# In Abschnitten à 96 Frames rendern, jeder Abschnitt mit bis zu 4 Versuchen
# (Headless-Tabs hängen hier sporadisch beim Schriftladen nach ~200 Frames)
npx remotion bundle src/index.ts --out-dir=out/bundle --log=error
rm -f out/seg_*.mov out/segs.txt
for s in $(seq 0 96 573); do
  e=$((s+95)); [ $e -gt 573 ] && e=573
  seg=$(printf "out/seg_%03d.mov" $s)
  for try in 1 2 3 4; do
    if npx remotion render out/bundle PushupsOverlay "$seg" --frames=$s-$e --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le --image-format=png --scale=2 --concurrency=3 --timeout=20000 --log=error; then break; fi
    echo "Abschnitt $s-$e Versuch $try fehlgeschlagen"; [ $try = 4 ] && exit 1
  done
  echo "file '$(basename $seg)'" >> out/segs.txt
done
ffmpeg -hide_banner -v error -y -f concat -safe 0 -i out/segs.txt -c copy out/overlay.mov
ffmpeg -hide_banner -v error -y -i public/plate.mp4 -i out/overlay.mov -filter_complex "[0:v][1:v]overlay=format=auto,format=yuv422p10le" -c:v prores_ks -profile:v 3 out/hq.mov
X=(-c:v libx264 -preset slower -tune film -b:v 15M -maxrate 22M -bufsize 30M -pix_fmt yuvj420p -x264-params aq-mode=3:aq-strength=0.9:deblock=-1,-1)
ffmpeg -hide_banner -v error -y -i out/hq.mov "${X[@]}" -pass 1 -passlogfile out/pass -an -f mp4 /dev/null
ffmpeg -hide_banner -v error -y -i out/hq.mov -i out/mix.wav -map 0:v -map 1:a "${X[@]}" -pass 2 -passlogfile out/pass "${TAG[@]}" -c:a aac -b:a 320k -movflags +faststart ../Export/Pushups_fertig_4K.mp4
ffmpeg -hide_banner -v error -y -i ../Export/Pushups_fertig_4K.mp4 -i out/voice.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart ../Export/Pushups_ohne_Musik_4K.mp4
rm -rf out/pass* out/hq.mov out/seg_*.mov out/overlay.mov out/bundle
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames,width,height,bit_rate,color_space -of compact ../Export/Pushups_fertig_4K.mp4
echo FERTIG
