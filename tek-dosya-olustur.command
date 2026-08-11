#!/bin/bash
# index.html + styles.css + app.js  ->  Sekreterya.html (tek dosya)
# Kullanım: bu dosyaya çift tıkla. Kod değiştiğinde tekrar çalıştır.
cd "$(dirname "$0")" || exit 1

python3 - <<'PY'
from pathlib import Path

klasor = Path(__file__).parent if "__file__" in dir() else Path(".")
html = Path("index.html").read_text(encoding="utf-8")
css  = Path("styles.css").read_text(encoding="utf-8")
js   = Path("app.js").read_text(encoding="utf-8")

html = html.replace('<link rel="stylesheet" href="styles.css">',
                    "<style>\n" + css + "\n</style>")
html = html.replace('<script src="app.js"></script>',
                    "<script>\n" + js + "\n</script>")

if "<style>" not in html or "app.js" in html:
    raise SystemExit("HATA: index.html icindeki css/js baglantilari beklenen bicimde degil.")

Path("Sekreterya.html").write_text(html, encoding="utf-8")
print("Tamam -> Sekreterya.html (%.0f KB)" % (len(html.encode()) / 1024))
PY

echo
echo "Bu pencereyi kapatabilirsin."
