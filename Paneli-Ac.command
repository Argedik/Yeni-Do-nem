#!/bin/bash
# Sekreterya Panelini tarayıcıda açar. Bu dosyaya çift tıkla.
cd "$(dirname "$0")" || exit 1

DOSYA="Sekreterya.html"
[ -f "$DOSYA" ] || DOSYA="index.html"

# Sırayla dene: Brave -> Chrome -> Edge -> Firefox -> sistemin varsayılanı
for TARAYICI in "Brave Browser" "Google Chrome" "Microsoft Edge" "Firefox"; do
  if [ -d "/Applications/$TARAYICI.app" ]; then
    open -a "$TARAYICI" "$DOSYA"
    exit 0
  fi
done

open "$DOSYA"
