// Ortak veri: GET okur, POST yazar. Netlify Blobs'ta tek kayıt ("panel") tutulur.
// Erişim için x-panel-anahtar başlığı PANEL_ANAHTAR ortam değişkeniyle eşleşmeli.
import { getStore } from "@netlify/blobs";

const store = () => getStore({ name: "sekreterya", consistency: "strong" });

export default async (req) => {
  const beklenen = process.env.PANEL_ANAHTAR || "";
  const gelen = req.headers.get("x-panel-anahtar") || "";
  if (!beklenen || gelen !== beklenen) return new Response("Yetkisiz", { status: 401 });

  if (req.method === "GET") {
    const veri = await store().get("panel");
    if (veri == null) return new Response("Yok", { status: 404 });
    return new Response(veri, { status: 200, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
  }
  if (req.method === "POST") {
    const govde = await req.text();
    try { JSON.parse(govde); } catch { return new Response("Geçersiz JSON", { status: 400 }); }
    const s = store();
    const onceki = await s.get("panel");
    if (onceki != null) await s.set("yedek-" + new Date().toISOString(), onceki);   // yazımdan önceki hal saklanır
    await s.set("panel", govde);
    return new Response(null, { status: 204 });
  }
  return new Response("Yöntem yok", { status: 405 });
};

export const config = { path: "/veri" };
