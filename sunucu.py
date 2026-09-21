#!/usr/bin/env python3
"""Paneli yerel ağda sunar ve veriyi ortak tutar.
- Tarayıcı hiçbir dosyayı önbelleğe almaz; her yenileme güncel kodu getirir.
- GET /veri  -> veri.json (yoksa 404)     POST /veri -> gövdeyi veri.json'a yazar
  Böylece Mac ve telefon aynı veriyi görür (veri.json kişisel bilgi içerir, git'e girmez).
Kullanım: python3 sunucu.py [port]  (varsayılan 8765) -> http://localhost:8765/index.html
"""
import json, os, sys, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

VERI = "veri.json"
KILIT = threading.Lock()

class Isleyici(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, *a):  # sessiz
        pass

    def _yolu(self):
        return self.path.split("?")[0]

    def do_GET(self):
        if self._yolu() != "/veri":
            return super().do_GET()
        with KILIT:
            if not os.path.exists(VERI):
                self.send_response(404); self.end_headers(); return
            govde = open(VERI, "rb").read()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(govde)))
        self.end_headers(); self.wfile.write(govde)

    def do_POST(self):
        if self._yolu() != "/veri":
            self.send_response(404); self.end_headers(); return
        n = int(self.headers.get("Content-Length") or 0)
        govde = self.rfile.read(n)
        try:
            json.loads(govde)  # geçersiz JSON yazılmasın
        except Exception:
            self.send_response(400); self.end_headers(); return
        with KILIT:
            gecici = VERI + ".tmp"
            open(gecici, "wb").write(govde)
            os.replace(gecici, VERI)  # yarım dosya kalmaz
        self.send_response(204); self.end_headers()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"Panel: http://localhost:{port}/index.html")
    ThreadingHTTPServer(("", port), Isleyici).serve_forever()
