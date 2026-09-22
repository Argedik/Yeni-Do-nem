#!/bin/bash
# Yayındaki panelin ortak verisini (veri.json) bu klasöre çeker; yerel sunucu (sunucu.py) aynı dosyayı kullanır.
# Kullanım: çift tıkla, panel şifresini gir. Mevcut veri.json önce veri-yedek/ klasörüne kopyalanır.
cd "$(dirname "$0")" || exit 1
ADRES="https://panel-production-89d4.up.railway.app/veri"

read -r -s -p "Panel şifresi: " SIFRE; echo
mkdir -p veri-yedek
[ -f veri.json ] && cp veri.json "veri-yedek/veri-$(date +%Y%m%d-%H%M%S)-yerel.json"

KOD=$(curl -s -o veri.indirilen -w "%{http_code}" -H "x-panel-anahtar: $SIFRE" "$ADRES")
if [ "$KOD" = "200" ] && python3 -c "import json; json.load(open('veri.indirilen'))" 2>/dev/null; then
  mv veri.indirilen veri.json
  python3 -c "import json; v=json.load(open('veri.json')); print('Tamam -> veri.json | toplantı:', len(v['toplantilar']), '| iş:', len(v['isler']), '| üye:', len(v.get('uyeler', [])))"
else
  rm -f veri.indirilen
  case "$KOD" in 401) echo "HATA: şifre yanlış.";; 404) echo "HATA: yayında henüz veri yok.";; *) echo "HATA: bağlanılamadı (kod $KOD).";; esac
fi
echo; echo "Bu pencereyi kapatabilirsin."
