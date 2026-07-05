#!/usr/bin/env bash
# crop-bars.sh — strip iMovie black bars (pillarbox/letterbox) from videos,
# web-encode, and emit a poster frame. Audio is retained automatically.
#
# Why this exists: iMovie exports portrait phone recordings onto a 1920x1080
# canvas, adding black bars on the sides (pillarbox). `cropdetect` finds the
# horizontal bars reliably, but it OVER-crops the vertical axis because a dark
# app UI (near-black navy) reads as "black." The fix baked in here: detect the
# crop, then keep the FULL dimension on whichever axis has the smaller border,
# and only crop the axis with the real bars. That's provably correct for a
# pillarbox (portrait content always fills full height) and a letterbox alike.
#
# Requires: ffmpeg + ffprobe on PATH. The bridge has neither; run this on echo
# (`ssh nick@echo`) or any box with ffmpeg 5+. Portable, no repo deps.
#
# Usage:
#   scripts/crop-bars.sh [options] <input.mp4|dir> [more inputs...]
#
# Options:
#   -o, --out DIR     output directory (default: ./cropped)
#       --webm        also emit a VP9/WebM alongside the MP4
#       --crf N       x264 CRF quality, lower = better (default: 23)
#       --limit N     cropdetect black threshold, lower = stricter (default: 24)
#       --axis MODE   auto | h | v | none  (default: auto)
#       --no-poster   skip the poster JPG
#   -h, --help        this help
#
# Examples:
#   scripts/crop-bars.sh ~/vidwork/*.mp4
#   scripts/crop-bars.sh --webm -o videos/ turn-mobile.mp4
set -euo pipefail

OUT="cropped"
WEBM=0
CRF=23
LIMIT=24
AXIS="auto"
POSTER=1
INPUTS=()

die() { echo "✗ $*" >&2; exit 1; }

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

while [ $# -gt 0 ]; do
  case "$1" in
    -o|--out) OUT="$2"; shift 2 ;;
    --webm) WEBM=1; shift ;;
    --crf) CRF="$2"; shift 2 ;;
    --limit) LIMIT="$2"; shift 2 ;;
    --axis) AXIS="$2"; shift 2 ;;
    --no-poster) POSTER=0; shift ;;
    -h|--help) usage 0 ;;
    -*) die "unknown option: $1 (try --help)" ;;
    *) INPUTS+=("$1"); shift ;;
  esac
done

command -v ffmpeg  >/dev/null || die "ffmpeg not found on PATH (run this on echo, not the bridge)"
command -v ffprobe >/dev/null || die "ffprobe not found on PATH"
[ ${#INPUTS[@]} -gt 0 ] || usage 1

# Expand any directory inputs into their video files.
FILES=()
for i in "${INPUTS[@]}"; do
  if [ -d "$i" ]; then
    while IFS= read -r -d '' f; do FILES+=("$f"); done \
      < <(find "$i" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.m4v' \) -print0)
  elif [ -f "$i" ]; then
    FILES+=("$i")
  else
    die "no such file or dir: $i"
  fi
done
[ ${#FILES[@]} -gt 0 ] || die "no video files found in inputs"

mkdir -p "$OUT"

probe() { ffprobe -v error -select_streams "$1" -show_entries stream="$2" -of csv=p=0 "$3" 2>/dev/null; }

for src in "${FILES[@]}"; do
  base=$(basename "$src"); name="${base%.*}"
  W=$(probe v:0 width  "$src"); H=$(probe v:0 height "$src")
  [ -n "$W" ] && [ -n "$H" ] || { echo "! skip (no video stream): $base"; continue; }
  HAS_AUDIO=$(probe a:0 codec_name "$src")

  # --- decide the crop filter ---
  if [ "$AXIS" = "none" ]; then
    CROP=""
  else
    # cropdetect over a 4s window a couple seconds in (skip intro fades).
    det=$(ffmpeg -hide_banner -ss 2 -t 4 -i "$src" -vf "cropdetect=${LIMIT}:2:0" -f null - 2>&1 \
          | grep -o 'crop=[0-9]*:[0-9]*:[0-9]*:[0-9]*' | tail -1 | cut -d= -f2)
    if [ -z "$det" ]; then
      CROP=""
    else
      IFS=: read -r cw ch cx cy <<<"$det"
      dw=$((W - cw)); dh=$((H - ch))   # border thickness per axis
      case "$AXIS" in
        h) CROP="crop=${cw}:${H}:${cx}:0" ;;                 # force pillarbox
        v) CROP="crop=${W}:${ch}:0:${cy}" ;;                 # force letterbox
        auto)
          if [ "$dw" -le 2 ] && [ "$dh" -le 2 ]; then
            CROP=""                                          # no real bars
          elif [ "$dw" -ge "$dh" ]; then
            CROP="crop=${cw}:${H}:${cx}:0"                   # pillarbox: keep full height
          else
            CROP="crop=${W}:${ch}:0:${cy}"                   # letterbox: keep full width
          fi ;;
        *) die "bad --axis: $AXIS (auto|h|v|none)" ;;
      esac
    fi
  fi

  vf_mp4="$CROP"; [ -n "$vf_mp4" ] && vf_mp4="-vf $vf_mp4"
  aflags=(-an); [ -n "$HAS_AUDIO" ] && aflags=(-c:a copy)   # retain audio untouched
  outmp4="$OUT/$name.mp4"

  echo "→ $base  (${W}x${H}${HAS_AUDIO:+, audio}${CROP:+  ${CROP})}"
  # shellcheck disable=SC2086
  ffmpeg -hide_banner -y -i "$src" $vf_mp4 \
    -c:v libx264 -crf "$CRF" -preset slow -pix_fmt yuv420p \
    "${aflags[@]}" -movflags +faststart "$outmp4" 2>/dev/null

  if [ "$WEBM" = 1 ]; then
    webmflags=(-an); [ -n "$HAS_AUDIO" ] && webmflags=(-c:a libopus -b:a 96k)
    # shellcheck disable=SC2086
    ffmpeg -hide_banner -y -i "$src" $vf_mp4 \
      -c:v libvpx-vp9 -crf 32 -b:v 0 -row-mt 1 -pix_fmt yuv420p \
      "${webmflags[@]}" "$OUT/$name.webm" 2>/dev/null
  fi

  [ "$POSTER" = 1 ] && ffmpeg -hide_banner -y -ss 3 -i "$outmp4" -frames:v 1 "$OUT/$name-poster.jpg" 2>/dev/null

  # verify: cropdetect on the OUTPUT should report the full frame (no bars left).
  chk=$(ffmpeg -hide_banner -ss 2 -t 2 -i "$outmp4" -vf "cropdetect=${LIMIT}:2:0" -f null - 2>&1 \
        | grep -o 'crop=[0-9]*:[0-9]*:[0-9]*:[0-9]*' | tail -1 | cut -d= -f2)
  ow=$(probe v:0 width "$outmp4"); oh=$(probe v:0 height "$outmp4")
  sz=$(du -h "$outmp4" | cut -f1)
  echo "  ✓ $outmp4  ${ow}x${oh}  ${sz}  (residual bars check: ${chk:-none})"
done

echo "✓ done → $OUT/"
