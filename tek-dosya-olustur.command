#!/bin/bash
# index.html + styles.css + app.js  ->  Sekreterya.html (tek dosya)
# Kullanım: bu dosyaya çift tıkla. Kod değiştiğinde tekrar çalıştır.
cd "$(dirname "$0")" || exit 1

python3 - <<'PYEOF'
import re, time
from pathlib import Path

html = Path("index.html").read_text(encoding="utf-8")
css  = Path("styles.css").read_text(encoding="utf-8")
js   = Path("app.js").read_text(encoding="utf-8")

# index.html: tarayıcı önbelleğini kırmak için sürüm damgası her üretimde yenilenir.
surum = str(int(time.time()))
html = re.sub(r'href="styles\.css(\?v=[^"]*)?"', f'href="styles.css?v={surum}"', html)
html = re.sub(r'src="app\.js(\?v=[^"]*)?"', f'src="app.js?v={surum}"', html)
Path("index.html").write_text(html, encoding="utf-8")

tek = re.sub(r'<link rel="stylesheet" href="styles\.css[^"]*">', lambda m: "<style>\n" + css + "\n</style>", html)
tek = re.sub(r'<script src="app\.js[^"]*"></script>', lambda m: "<script>\n" + js + "\n</script>", tek)

if "<style>" not in tek or 'src="app.js' in tek:
    raise SystemExit("HATA: index.html icindeki css/js baglantilari beklenen bicimde degil.")

Path("Sekreterya.html").write_text(tek, encoding="utf-8")

# Netlify yayın klasörü: yalnız gerekli üç dosya (veri.json gibi kişisel dosyalar dışarıda kalır)
import shutil
Path("yayin").mkdir(exist_ok=True)
for f in ("index.html", "styles.css", "app.js"):
    shutil.copy2(f, Path("yayin") / f)
print("Tamam -> Sekreterya.html (%.0f KB)" % (len(tek.encode()) / 1024))
PYEOF

echo
echo "Bu pencereyi kapatabilirsin."
