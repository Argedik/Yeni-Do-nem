#!/usr/bin/env python3
"""Paneli yerel ağda sunar. Tarayıcı hiçbir dosyayı önbelleğe almaz; her yenileme güncel kodu getirir.
Kullanım: python3 sunucu.py [port]  (varsayılan 8765) -> http://localhost:8765/index.html
"""
import os, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Isleyici(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()
    def log_message(self, *a):  # sessiz
        pass

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"Panel: http://localhost:{port}/index.html")
    ThreadingHTTPServer(("", port), Isleyici).serve_forever()
