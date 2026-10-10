#!/bin/bash
# 4K: PNG-Frames → ProRes HQ → x264 2-Pass 15 Mbit/s + BT.709-Tags (wie starter/render.sh)
set -e
mkdir -p out ../Export
TAG=(-bsf:v h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=1 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range pc)
npx remotion render src/index.ts Pushups out/hq.mov --codec=prores --prores-profile=hq --image-format=png --scale=2 --concurrency=3 --timeout=180000 --log=error
X=(-c:v libx264 -preset slower -tune film -b:v 15M -maxrate 22M -bufsize 30M -pix_fmt yuvj420p -x264-params aq-mode=3:aq-strength=0.9:deblock=-1,-1)
ffmpeg -hide_banner -v error -y -i out/hq.mov "${X[@]}" -pass 1 -passlogfile out/pass -an -f mp4 /dev/null
ffmpeg -hide_banner -v error -y -i out/hq.mov -i out/mix.wav -map 0:v -map 1:a "${X[@]}" -pass 2 -passlogfile out/pass "${TAG[@]}" -c:a aac -b:a 320k -movflags +faststart ../Export/Pushups_fertig_4K.mp4
ffmpeg -hide_banner -v error -y -i ../Export/Pushups_fertig_4K.mp4 -i out/voice.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart ../Export/Pushups_ohne_Musik_4K.mp4
rm -f out/pass* out/hq.mov
ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames,width,height,bit_rate,color_space -of compact ../Export/Pushups_fertig_4K.mp4
echo FERTIG
