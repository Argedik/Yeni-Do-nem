/* =========================================================
   Sekreterya Paneli — TÜGVA Üniversite Birimi
   Tek dosyalık uygulama mantığı. Veri: localStorage.
   ========================================================= */

const ANAHTAR = 'sekreterya_v1';
const KURTARMA_ANAHTAR = ANAHTAR + '_kurtarma'; // okunamayan veri burada saklanır
const KOLEKSIYONLAR = ['toplantilar', 'isler', 'linkler'];   // cihazlar arası kayıt kayıt birleştirilen listeler
let oncekiSnapshot = null;   // son kayıttan bu yana neyin değiştiğini bulmak için
let veriHatasi = '';
const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const GM_HATIRLATMA = 'Toplantı hatırlatma mesajını GM grubuna ilet';

/** Toplantı gününe göre kaydırmanın düştüğü haftanın günü: toplantı Salı, -1 → "Pazartesi" */
function ofsetGunAdi(o, toplantiGunu) {
  const g = Number(toplantiGunu ?? (typeof state !== 'undefined' ? state.ayar.toplantiGunu : 3));
  return GUN_ADLARI[(((g + Number(o)) % 7) + 7) % 7];
}
/** GM hatırlatma işlerinin adındaki gün parantezini toplantı gününe göre yeniler. */
function gmAdlariniGuncelle(v) {
  v.isler.filter(i => i.tip === 'toplanti' && i.ad.startsWith(GM_HATIRLATMA)).forEach(i => {
    const l = Array.isArray(i.ofsetler) && i.ofsetler.length ? i.ofsetler : [i.ofset ?? 0];
    i.ad = `${GM_HATIRLATMA} (${l.map(o => ofsetGunAdi(o, v.ayar.toplantiGunu)).join(' ve ')})`;
  });
}
const GUN_KISA = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']; // takvim başlığı (Pzt başlangıç)
const AY_ADLARI = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz',
  'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const KATEGORILER = ['Toplantı', 'Rapor', 'Liste', 'Arşiv', 'İletişim'];

/* ---------------- Tarih yardımcıları (hepsi yerel saat) ---------------- */
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const bugunISO = () => iso(new Date());
const tarihNesnesi = (s) => { const [y, m, g] = s.split('-').map(Number); return new Date(y, m - 1, g); };
const gunEkle = (s, n) => { const d = tarihNesnesi(s); d.setDate(d.getDate() + n); return iso(d); };
const gunFarki = (a, b) => Math.round((tarihNesnesi(b) - tarihNesnesi(a)) / 86400000);
const ayinSonGunu = (y, m) => new Date(y, m + 1, 0).getDate();

function uzunTarih(s) {
  const d = tarihNesnesi(s);
  return `${d.getDate()} ${AY_ADLARI[d.getMonth()]} ${d.getFullYear()}, ${GUN_ADLARI[d.getDay()]}`;
}
function kisaTarih(s) {
  const d = tarihNesnesi(s);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}
function gunEtiketi(s) {
  const f = gunFarki(bugunISO(), s);
  if (f === 0) return 'Bugün';
  if (f === 1) return 'Yarın';
  if (f === -1) return 'Dün';
  if (f < 0) return `${-f} gün gecikti`;
  if (f < 7) return `${GUN_ADLARI[tarihNesnesi(s).getDay()]} (${f} gün sonra)`;
  return kisaTarih(s);
}
const kacik = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const yeniId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/* ---------------- Başlangıç verisi ---------------- */
function varsayilanVeri() {
  return {
    ayar: {
      birim: 'TÜGVA Genel Merkez Üniversite Hanım Koordinatörlüğü',
      toplantiGunu: 2,          // 0=Pazar ... 2=Salı
      toplantiSaat: '19:00',
      toplantiYer: '',
      baslangic: bugunISO(),    // bu tarihten öncesi "geciken" sayılmaz
    },
    isler: [
      { id: yeniId(), ad: 'Gündem maddesi oluştur ve Kübra başkandan onay iste', kategori: 'Toplantı', tip: 'toplanti', ofsetler: [-2], saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Gündem maddelerini gruba ilet ve anket aç', kategori: 'İletişim', tip: 'toplanti', ofsetler: [-1], saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: `${GM_HATIRLATMA} (${ofsetGunAdi(0, 2)})`, kategori: 'İletişim', tip: 'toplanti', ofsetler: [0], saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: '3 adet gündem maddesi + 1 adet son tutanak çıktısı al', kategori: 'Toplantı', tip: 'toplanti', ofsetler: [0], saat: '17:00', aciklama: 'Toplantı kartında: "Gündem çıktısı" ile 3 madde, "Son tutanak" ile önceki toplantının tutanağı.', link: '' },
      { id: yeniId(), ad: 'Tutanağı hazırla ve Drive dosyasına ekle', kategori: 'Arşiv', tip: 'toplanti', ofsetler: [1], saat: '21:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Yoklamayı Drive dosyasında güncelle', kategori: 'Arşiv', tip: 'toplanti', ofsetler: [1], saat: '21:30', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Ana birime görevleri hatırlat', kategori: 'İletişim', tip: 'haftalik', gun: 5, saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Ana birime "Drive dosyalarınızı güncelleyin" mesajı ilet', kategori: 'İletişim', tip: 'aylik', ayGunu: 10, saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Ana birime aylık rapor hatırlatması yap', kategori: 'Rapor', tip: 'aylik', ayGunu: 21, saat: '10:00', aciklama: 'Rapor tesliminden 1 hafta önce ana birimi uyar.', link: '' },
      { id: yeniId(), ad: 'Aylık raporu sunum haline getir ve ana birime gönder', kategori: 'Rapor', tip: 'aylik', ayGunu: 28, saat: '18:00', aciklama: '', link: '' },
    ],
    toplantilar: [],
    uyeler: [],        // ekip listesi: tam ad (Ayarlar'dan düzenlenir)
    linkler: [
      { id: yeniId(), ad: 'Tutanaklar', ikon: '📝', url: '' },
      { id: yeniId(), ad: 'Yoklama Dosyası', ikon: '✅', url: '' },
      { id: yeniId(), ad: 'Aylık Raporlar', ikon: '📊', url: '' },
      { id: yeniId(), ad: 'Güncel Üye Listesi', ikon: '👥', url: '' },
    ],
    yapildi: {},   // "isId#YYYY-MM-DD" -> {t: zaman}
    surekli: {},   // isId -> son yapıldı ISO
    surum: 19,     // veri şeması sürümü (göç için)
  };
}

/* ---------------- Kalıcılık ---------------- */
// Bazı tarayıcılar dosyadan (file://) açılan sayfada depolamayı kapatır.
// O durumda uygulama çalışır ama veri kalıcı olmaz; kullanıcıyı uyarırız.
const depoVar = (() => {
  try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); return true; }
  catch (e) { return false; }
})();

let state = yukle();

/**
 * Toplantı günü sabittir (Ayarlar). Önümüzde hiç toplantı kaydı yoksa dönem sonuna
 * (30 Haziran) kadar her haftaya toplantı açar; böylece toplantıya bağlı işler hep görünür.
 * Elle silinen tek bir tarih geri gelmez: yalnız ileride HİÇ toplantı kalmamışsa çalışır.
 */
function donemToplantilariniTamamla() {
  const bug = bugunISO();
  if (state.toplantilar.some(t => t.tarih >= bug)) return;
  const d = new Date();
  const bit = iso(new Date(d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear(), 5, 30));
  const gun = Number(state.ayar.toplantiGunu);
  let g = bug;
  while (tarihNesnesi(g).getDay() !== gun) g = gunEkle(g, 1);
  const mevcut = new Set(state.toplantilar.map(t => t.tarih));
  let n = 0;
  for (; gunFarki(g, bit) >= 0; g = gunEkle(g, 7)) {
    if (mevcut.has(g)) continue;
    state.toplantilar.push({ id: yeniId(), tarih: g, saat: state.ayar.toplantiSaat, yer: state.ayar.toplantiYer || '', gundem: ['', '', ''], mazeretListe: [], katilimNot: '', notlar: '', tutanakLink: '' });
    n++;
  }
  // Damgasız kaydet: otomatik açılan boş toplantılar, diğer cihazdaki dolu kayıtları ezmesin.
  if (n) { try { localStorage.setItem(ANAHTAR, JSON.stringify(state)); } catch (e) { } oncekiSnapshot = snapshotAl(); }
}

function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return varsayilanVeri();
    const v = JSON.parse(ham);
    const t = varsayilanVeri();
    return goc({
      ...t, ...v,
      ayar: { ...t.ayar, ...(v.ayar || {}) },
      yapildi: v.yapildi || {},
      surekli: v.surekli || {},
      // Sürüm, varsayılandan DEĞİL kayıtlı veriden okunmalı; yoksa göç hiç çalışmaz.
      surum: v.surum || 1,
    });
  } catch (e) {
    // Sessizce sıfırlamak yerine: bozuk/okunamayan veri ayrı anahtarda saklanır, ekranda uyarı çıkar.
    console.warn('Veri okunamadı.', e);
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (ham) { localStorage.setItem(KURTARMA_ANAHTAR, ham); veriHatasi = String(e && e.message || e); }
    } catch (_) { }
    return varsayilanVeri();
  }
}
function kurtarmaIndir() {
  const ham = localStorage.getItem(KURTARMA_ANAHTAR);
  if (!ham) { toast('Kurtarma verisi yok'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ham], { type: 'application/json' }));
  a.download = `sekreterya-kurtarma-${bugunISO()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  toast('⬇️ Eski veri indirildi — Ayarlar › Yedekten geri yükle ile deneyebilirsin');
}
function kaydet() {
  damgala();
  state.guncelleme = Date.now();
  try { localStorage.setItem(ANAHTAR, JSON.stringify(state)); }
  catch (e) { toast('⚠️ Kaydedilemedi: depolama dolu olabilir'); }
  sunucuyaYaz();
}

/* ---------------- Cihazlar arası ortak veri (sunucu.py) — BİRLEŞTİRME ----------------
   Panel http üzerinden açıldıysa veri Mac'teki sunucuda da tutulur. İki cihazın verisi
   kayıt kayıt birleştirilir: her toplantı/iş/link kendi değişiklik damgasını (g) taşır,
   daha yeni olan kazanır; silinenler mezar taşıyla izlenir; işaretler birleşir.
   Böylece telefonda yazılan Mac'te yazılanı EZMEZ. file:// ile açıldıysa yalnız tarayıcı deposu. */
const SUNUCU_VAR = /^https?:/.test(location.href);
let yazmaZamanlayici = null, sonUzakDamga = '';
// İnternette yayındayken ortak veriye erişim şifresi (x-panel-anahtar). Yerel sunucu bunu istemez.
const SIFRE_ANAHTAR = ANAHTAR + '_sifre';
let sifreSoruluyor = false;
const veriBasliklari = () => { const s = localStorage.getItem(SIFRE_ANAHTAR); return s ? { 'x-panel-anahtar': s } : {}; };
function sifreSor(mesaj) {
  if (sifreSoruluyor) return; sifreSoruluyor = true;
  modalAc('🔐 Panel şifresi', `
    <p class="ipucu" style="margin-top:0">${mesaj || 'Ortak kayda bağlanmak için panel şifresini gir. Bir kez girilir, bu cihazda saklanır.'}</p>
    <div class="form-satir"><div class="alan"><label>Şifre</label><input type="password" id="p_sifre" autocomplete="current-password" data-enter-act="sifre-kaydet"></div></div>`,
    `<button class="btn" data-act="sifre-kaydet">Bağlan</button>`, true);
  setTimeout(() => document.getElementById('p_sifre')?.focus(), 50);
}

// Kayıt anahtarı: toplantı = tarih (aynı güne iki toplantı olmaz), iş/link = ad (cihazlar farklı id üretir)
const kayitAnahtari = (k, r) => k === 'toplantilar' ? String(r.tarih) : String(r.ad || r.id).trim().toLocaleLowerCase('tr');
const kayitImzasi = (r) => { const { g, ...k } = r; return JSON.stringify(k); };
function snapshotAl() {
  const sn = { kayit: {}, uyeler: JSON.stringify(state.uyeler || []), ayar: JSON.stringify(state.ayar), yapildi: new Set(Object.keys(state.yapildi || {})) };
  KOLEKSIYONLAR.forEach(k => (state[k] || []).forEach(r => sn.kayit[k + ':' + kayitAnahtari(k, r)] = kayitImzasi(r)));
  return sn;
}
/** Son kayıttan bu yana değişen kayıtlara damga vurur; silinenleri mezar taşına yazar. */
function damgala() {
  const now = Date.now();
  state.silinen = state.silinen || {}; state.yapildiSilinen = state.yapildiSilinen || {};
  if (!oncekiSnapshot) { oncekiSnapshot = snapshotAl(); return; }
  const o = oncekiSnapshot, mevcut = new Set();
  KOLEKSIYONLAR.forEach(k => (state[k] || []).forEach(r => {
    const a = k + ':' + kayitAnahtari(k, r); mevcut.add(a);
    if (o.kayit[a] !== kayitImzasi(r)) r.g = now;
  }));
  Object.keys(o.kayit).forEach(a => { if (!mevcut.has(a)) state.silinen[a] = now; });
  if (JSON.stringify(state.uyeler || []) !== o.uyeler) state.uyelerG = now;
  if (JSON.stringify(state.ayar) !== o.ayar) state.ayarG = now;
  o.yapildi.forEach(k => { if (!state.yapildi[k]) state.yapildiSilinen[k] = now; });
  oncekiSnapshot = snapshotAl();
}
/** Anahtarları sıralı, guncelleme'siz metin — iki verinin gerçekten aynı olup olmadığını anlamak için. */
function kanonik(v) {
  const sirala = (x) => Array.isArray(x) ? x.map(sirala)
    : (x && typeof x === 'object') ? Object.keys(x).sort().reduce((o, k) => (k === 'guncelleme' ? o : (o[k] = sirala(x[k]), o)), {}) : x;
  return JSON.stringify(sirala(v));
}
/** Aynı toplantının iki kopyası: mazeretler birleşir, dolu gündem korunur. */
function toplantiKaynastir(a, b) {
  const k = (x) => String(x || '').toLocaleLowerCase('tr');
  const silinen = { ...(b.mazeretSilinen || {}), ...(a.mazeretSilinen || {}) };
  Object.entries(b.mazeretSilinen || {}).forEach(([ad, ts]) => silinen[ad] = Math.max(silinen[ad] || 0, ts));
  const l = [];
  [...(a.mazeretListe || []), ...(b.mazeretListe || [])].forEach(m => {
    if (l.some(x => k(x.ad) === k(m.ad))) return;
    if ((silinen[k(m.ad)] || 0) > (m.t || 0)) return;   // daha sonra silinmiş
    l.push(m);
  });
  const gundemMetin = (a.gundemMetin || '').trim() ? a.gundemMetin : (b.gundemMetin || '');
  return { ...b, ...a, mazeretListe: l, mazeretSilinen: silinen, gundemMetin, gundem: gundemMaddeleri(gundemMetin),
    tutanakLink: a.tutanakLink || b.tutanakLink || '', notlar: a.notlar || b.notlar || '' };
}
/** Yerel ve uzak veriyi kayıt kayıt birleştirir. Hiçbir tarafın yazdığı sessizce kaybolmaz. */
function birlestir(yerel, ham) {
  const t = varsayilanVeri();
  const uzak = goc({ ...t, ...ham, ayar: { ...t.ayar, ...(ham.ayar || {}) }, yapildi: ham.yapildi || {}, surekli: ham.surekli || {}, surum: ham.surum || 1 });
  const sonuc = { ...yerel };
  const silinen = { ...(yerel.silinen || {}) };
  Object.entries(uzak.silinen || {}).forEach(([k, v]) => silinen[k] = Math.max(silinen[k] || 0, v));
  const idEsle = {};   // uzak iş id → yerel iş id (işaretleri taşımak için)
  KOLEKSIYONLAR.forEach(k => {
    const m = new Map();
    (yerel[k] || []).forEach(r => m.set(kayitAnahtari(k, r), r));
    (uzak[k] || []).forEach(r => {
      const a = kayitAnahtari(k, r), y = m.get(a);
      if (!y) { m.set(a, r); return; }
      if (k === 'isler' && r.id !== y.id) idEsle[r.id] = y.id;
      if (k === 'toplantilar') m.set(a, (r.g || 0) > (y.g || 0) ? { ...toplantiKaynastir(r, y), id: y.id } : toplantiKaynastir(y, r));
      else if ((r.g || 0) > (y.g || 0)) m.set(a, { ...r, id: y.id });
    });
    sonuc[k] = [...m.values()].filter(r => !((silinen[k + ':' + kayitAnahtari(k, r)] || 0) > (r.g || 0)));
    if (k === 'toplantilar') sonuc[k].sort((x, z) => x.tarih.localeCompare(z.tarih));
  });
  // Üye listesi ve ayarlar: daha yeni damga kazanır; damgasızsa dolu olan tercih edilir.
  // Boş liste dolu listeyi asla ezmez (bir cihaz listeyi hiç girmemiş olabilir); ikisi de doluysa yeni damga kazanır.
  const yU = yerel.uyeler || [], uU = uzak.uyeler || [];
  sonuc.uyeler = !yU.length ? uU : !uU.length ? yU : ((uzak.uyelerG || 0) > (yerel.uyelerG || 0) ? uU : yU);
  sonuc.uyelerG = Math.max(uzak.uyelerG || 0, yerel.uyelerG || 0);
  sonuc.ayar = (uzak.ayarG || 0) > (yerel.ayarG || 0) ? uzak.ayar : yerel.ayar;
  sonuc.ayarG = Math.max(uzak.ayarG || 0, yerel.ayarG || 0);
  // İşaretler: birleşim; kaldırılan işaret mezar taşı daha yeniyse kaldırılmış kalır.
  const ys = { ...(yerel.yapildiSilinen || {}) };
  Object.entries(uzak.yapildiSilinen || {}).forEach(([k, v]) => ys[k] = Math.max(ys[k] || 0, v));
  const yap = { ...(yerel.yapildi || {}) };
  Object.entries(uzak.yapildi || {}).forEach(([k, v]) => {
    const [isId, tarih] = k.split('#'); const ak = (idEsle[isId] || isId) + '#' + tarih;
    if (!yap[ak] || (v.t || 0) > (yap[ak].t || 0)) yap[ak] = v;
  });
  Object.keys(yap).forEach(k => { if ((ys[k] || 0) > (yap[k].t || 0)) delete yap[k]; });
  sonuc.yapildi = yap; sonuc.yapildiSilinen = ys;
  sonuc.surekli = { ...(uzak.surekli || {}), ...(yerel.surekli || {}) };
  Object.entries(uzak.surekli || {}).forEach(([k, v]) => { if (!sonuc.surekli[k] || v > sonuc.surekli[k]) sonuc.surekli[k] = v; });
  sonuc.silinen = silinen;
  sonuc.surum = Math.max(uzak.surum || 1, yerel.surum || 1);
  sonuc.guncelleme = Math.max(uzak.guncelleme || 0, yerel.guncelleme || 0);
  return sonuc;
}
function sunucuyaYaz() {
  if (!SUNUCU_VAR) return;
  clearTimeout(yazmaZamanlayici);
  yazmaZamanlayici = setTimeout(() => {
    const damga = String(state.guncelleme);
    fetch('veri', { method: 'POST', headers: { 'Content-Type': 'application/json', ...veriBasliklari() }, body: JSON.stringify(state) })
      .then(r => { if (r.ok) sonUzakDamga = damga; else if (r.status === 401) sifreSor('Şifre eksik ya da yanlış; yazdıkların yalnız bu cihazda kaldı. Ortak kayda geçmesi için şifreyi gir.'); })
      .catch(() => { });
  }, 400);
}
async function sunucudanCek(ilk) {
  if (!SUNUCU_VAR) return;
  let veri;
  try {
    const r = await fetch('veri', { cache: 'no-store', headers: veriBasliklari() });
    if (r.status === 401) { const vardi = !!localStorage.getItem(SIFRE_ANAHTAR); localStorage.removeItem(SIFRE_ANAHTAR); sifreSor(vardi ? 'Şifre yanlış, tekrar dene.' : ''); return; }
    if (r.status === 404) { if (ilk) sunucuyaYaz(); return; }   // sunucuda henüz veri yok: bizimkini gönder
    if (!r.ok) return;
    veri = await r.json();
  } catch (e) { return; }
  const damga = String(veri.guncelleme || '');
  if (damga === sonUzakDamga) return;                       // sunucuda yeni bir şey yok
  // Kullanıcı bir şey yazıyorsa bekle; bir sonraki kontrolde alınır.
  if (!document.getElementById('modalKatman').hidden || document.activeElement?.tagName === 'TEXTAREA' || gundemDuzenlenen) return;
  const birlesik = birlestir(state, veri);
  sonUzakDamga = damga;
  const yerelDegisti = kanonik(birlesik) !== kanonik(state);
  const uzakEksik = kanonik(birlestir(veri, veri)) !== kanonik(birlesik);   // sunucudaki, birleşikten farklıysa gönder
  if (yerelDegisti) {
    state = birlesik; oncekiSnapshot = snapshotAl();
    try { localStorage.setItem(ANAHTAR, JSON.stringify(state)); } catch (e) { }
    ciz();
    if (!ilk) toast('🔄 Diğer cihazdan gelen değişiklikler alındı');
  }
  if (uzakEksik) { state.guncelleme = Date.now(); try { localStorage.setItem(ANAHTAR, JSON.stringify(state)); } catch (e) { } sunucuyaYaz(); }
}

/**
 * Eski kayıtları yeni şemaya taşır. Mevcut ayar/toplantı/işaret verisine dokunmaz.
 * Sürüm 2: Liste ve Şablonlar sekmeleri kaldırıldı; liste kontrolü rutin işe dönüştü.
 */
function goc(v) {
  if ((v.surum || 1) < 2) {
    const eskiSurekli = v.isler.find(i => i.tip === 'surekli' && i.kategori === 'Liste');
    // Toplantı sonrası "yeni katılan hanımlar eklendi mi" kontrolünü ekle (yoksa).
    if (!v.isler.some(i => i.ad.includes('yeni katılan'))) {
      v.isler.push({
        id: yeniId(), ad: 'Ekibe yeni katılan hanımlar listeye eklendi mi? — kontrol et',
        kategori: 'Liste', tip: 'toplanti', ofset: 1, saat: '21:45',
        aciklama: 'Drive\'daki güncel listeyi aç, toplantıya yeni gelen hanımları ekle.',
        link: '', arsiv: false,
      });
    }
    if (eskiSurekli) {
      eskiSurekli.ad = 'Genel merkez görev değişikliğinde güncel listeyi düzenle';
      eskiSurekli.aciklama = 'Görev değişikliği veya ayrılma olduğunda Drive\'daki listeyi güncelle.';
    }
    // Kişi bazlı katılım verisi artık kullanılmıyor; varsa serbest metne çevir.
    (v.toplantilar || []).forEach(t => {
      if (t.mazeretler == null) t.mazeretler = eskiMazeretMetni(t, v.uyeler || []);
      delete t.katilim; delete t.sebep;
    });
    delete v.uyeler; delete v.sablonlar; delete v.log;
    v.surum = 2;
  }
  if (v.surum < 3) {
    // Birim adı hiç elle değiştirilmemişse yeni resmî adı yaz; özelleştirilmişse dokunma.
    if (!v.ayar.birim || v.ayar.birim === 'TÜGVA Üniversite Birimi') {
      v.ayar.birim = 'TÜGVA Genel Merkez Üniversite Hanım Koordinatörlüğü';
    }
    v.surum = 3;
  }
  if (v.surum < 4) {
    // "Katılım mazeretlerini liste halinde ilet" rutini kaldırıldı (kullanıcı isteği).
    const cikar = v.isler.filter(i => i.ad === 'Katılım mazeretlerini liste halinde ilet');
    if (cikar.length) {
      v.isler = v.isler.filter(i => !cikar.includes(i));
      cikar.forEach(i => Object.keys(v.yapildi)
        .filter(k => k.startsWith(i.id + '#')).forEach(k => delete v.yapildi[k]));
    }
    v.surum = 4;
  }
  if (v.surum < 5) {
    // Gündem çıktısına bir önceki toplantının tutanağı eklendi.
    const g = v.isler.find(i => i.ad === '3 adet gündem maddesi çıktısı al');
    if (g) {
      g.ad = '3 adet gündem maddesi + 1 adet son tutanak çıktısı al';
      g.aciklama = 'Toplantı kartında: "Gündem çıktısı" ile 3 madde, "Son tutanak" ile önceki toplantının tutanağı.';
    }
    v.surum = 5;
  }
  if (v.surum < 6) {
    // Tek kaydırma (ofset) → çoklu kaydırma (ofsetler). GM hatırlatması iki güne çıkarıldı.
    v.isler.filter(i => i.tip === 'toplanti').forEach(i => {
      if (!Array.isArray(i.ofsetler)) i.ofsetler = [Number(i.ofset) || 0];
      delete i.ofset;
    });
    const gm = v.isler.find(i => i.ad === 'Toplantı hatırlatma mesajını GM grubuna ilet');
    if (gm) gm.ofsetler = [-1, 0];
    v.surum = 6;
  }
  if (v.surum < 7) {
    // Gündem/tutanak çıktısı toplantı gününe alındı.
    const g = v.isler.find(i => i.ad === '3 adet gündem maddesi + 1 adet son tutanak çıktısı al');
    if (g) g.ofsetler = [0];
    v.surum = 7;
  }
  if (v.surum < 8) {
    // Çıktı saati toplantı saatinden (19:00) önceye çekildi.
    const g = v.isler.find(i => i.ad === '3 adet gündem maddesi + 1 adet son tutanak çıktısı al');
    if (g && g.saat === '20:00') g.saat = '17:00';
    v.surum = 8;
  }
  if (v.surum < 9) {
    // Toplantı sonrası liste kontrolü kaldırıldı; aynı iş sürekli takip maddesinde yapılıyor.
    const cikar = v.isler.filter(i => i.ad === 'Ekibe yeni katılan hanımlar listeye eklendi mi? — kontrol et');
    if (cikar.length) {
      v.isler = v.isler.filter(i => !cikar.includes(i));
      cikar.forEach(i => Object.keys(v.yapildi)
        .filter(k => k.startsWith(i.id + '#')).forEach(k => delete v.yapildi[k]));
    }
    // Sürekli takip maddesi yeni katılımı da kapsayacak şekilde adlandırıldı.
    const sur = v.isler.find(i => i.ad === 'Genel merkez görev değişikliğinde güncel listeyi düzenle');
    if (sur) {
      sur.ad = 'Güncel listeyi düzenle (yeni katılım / görev değişikliği)';
      sur.aciklama = 'Ekibe yeni katılan hanım, görev değişikliği veya ayrılma olduğunda Drive\'daki listeyi güncelle.';
    }
    v.surum = 9;
  }
  if (v.surum < 10) {
    // GM hatırlatması iki ayrı işe bölündü: bir gün önce ve toplantı günü.
    const gm = v.isler.find(i => i.ad === 'Toplantı hatırlatma mesajını GM grubuna ilet');
    if (gm) {
      gm.ad = 'Toplantı hatırlatma mesajını GM grubuna ilet (1 gün önce)';
      gm.ofsetler = [-1];
      const gunu = { ...gm, id: yeniId(), ad: 'Toplantı hatırlatma mesajını GM grubuna ilet (toplantı günü)', ofsetler: [0] };
      v.isler.splice(v.isler.indexOf(gm) + 1, 0, gunu);
      // Toplantı gününe düşen eski işaretlemeler yeni işe taşınır.
      const toplantiTarihleri = new Set((v.toplantilar || []).map(t => t.tarih));
      Object.keys(v.yapildi || {}).filter(k => k.startsWith(gm.id + '#')).forEach(k => {
        const tarih = k.slice(gm.id.length + 1);
        if (toplantiTarihleri.has(tarih)) { v.yapildi[gunu.id + '#' + tarih] = v.yapildi[k]; delete v.yapildi[k]; }
      });
    }
    v.surum = 10;
  }
  if (v.surum < 11) {
    // "(1 gün önce)" / "(toplantı günü)" yerine haftanın günü yazılıyor: "(Pazartesi)".
    gmAdlariniGuncelle(v);
    v.surum = 11;
  }
  if (v.surum < 12) {
    // "Gündem Arşivi" Drive kısayolu kaldırıldı (link girilmişse dokunulmaz).
    v.linkler = (v.linkler || []).filter(l => !(l.ad === 'Gündem Arşivi' && !l.url));
    v.surum = 12;
  }
  if (v.surum < 13) {
    // Liste güncelleme sürekli takip maddesi kaldırıldı; sürekli takip gerektirmiyor.
    const cikar = v.isler.filter(i => i.tip === 'surekli' && i.ad === 'Güncel listeyi düzenle (yeni katılım / görev değişikliği)');
    v.isler = v.isler.filter(i => !cikar.includes(i));
    cikar.forEach(i => { if (v.surekli) delete v.surekli[i.id]; });
    v.surum = 13;
  }
  if (v.surum < 14) {
    // Toplantıdan bir gün önceki GM işi: gündem maddeleri + anket.
    const gm = v.isler.find(i => i.tip === 'toplanti' && i.ad.startsWith(GM_HATIRLATMA)
      && Array.isArray(i.ofsetler) && i.ofsetler.length === 1 && i.ofsetler[0] === -1);
    if (gm) gm.ad = 'Gündem maddelerini gruba ilet ve anket aç';
    v.surum = 14;
  }
  if (v.surum < 15) {
    // Toplantıdan iki gün önce (Pazar): gündem maddesi hazırla, başkandan onay al.
    if (!v.isler.some(i => i.ad === 'Gündem maddesi oluştur ve Kübra başkandan onay iste')) {
      v.isler.unshift({ id: yeniId(), ad: 'Gündem maddesi oluştur ve Kübra başkandan onay iste', kategori: 'Toplantı', tip: 'toplanti', ofsetler: [-2], saat: '12:00', aciklama: '', link: '' });
    }
    v.surum = 15;
  }
  if (v.surum < 16) {
    // Her Cuma: ana birime görevleri hatırlat.
    if (!v.isler.some(i => i.ad === 'Ana birime görevleri hatırlat')) {
      v.isler.push({ id: yeniId(), ad: 'Ana birime görevleri hatırlat', kategori: 'İletişim', tip: 'haftalik', gun: 5, saat: '12:00', aciklama: '', link: '' });
    }
    v.surum = 16;
  }
  if (v.surum < 17) {
    // Her ayın 10'u: ana birime Drive dosyalarını güncelleme mesajı.
    if (!v.isler.some(i => i.ad === 'Ana birime "Drive dosyalarınızı güncelleyin" mesajı ilet')) {
      v.isler.push({ id: yeniId(), ad: 'Ana birime "Drive dosyalarınızı güncelleyin" mesajı ilet', kategori: 'İletişim', tip: 'aylik', ayGunu: 10, saat: '12:00', aciklama: '', link: '' });
    }
    v.surum = 17;
  }
  if (v.surum < 18) {
    // Olağan toplantı günü Salı oldu. Kayıtlı toplantılar varsa gün onlardan okunur.
    const gunler = [...new Set((v.toplantilar || []).map(t => tarihNesnesi(t.tarih).getDay()))];
    if (gunler.length === 1) v.ayar.toplantiGunu = gunler[0];
    else if (Number(v.ayar.toplantiGunu) === 3) v.ayar.toplantiGunu = 2;
    gmAdlariniGuncelle(v);
    v.surum = 18;
  }
  if (v.surum < 19) {
    // Mazeretler serbest metinden "kişi + sebep" tablosuna geçti. Eski satırlar "Ad — sebep" diye ayrıştırılır.
    if (!Array.isArray(v.uyeler)) v.uyeler = [];
    (v.toplantilar || []).forEach(t => {
      if (Array.isArray(t.mazeretListe)) return;
      t.mazeretListe = String(t.mazeretler || '').split('\n').map(x => x.trim()).filter(Boolean).map(x => {
        const m = x.match(/^(.*?)\s*(?:—|–|-|:)\s*(.*)$/);
        if (m && m[1]) return { ad: m[1].trim(), sebep: m[2].trim() };
        // Ayraç yoksa: ilk iki kelime ad soyad, kalanı mazeret ("Ayşe Yılmaz sınavı var" → Ayşe Yılmaz / sınavı var)
        const k = x.split(/\s+/);
        return k.length > 2 ? { ad: k.slice(0, 2).join(' '), sebep: k.slice(2).join(' ').replace(/\.$/, '') } : { ad: x, sebep: '' };
      });
      delete t.mazeretler;
    });
    v.surum = 19;
  }
  return v;
}

// Sürüm 1'deki işaretli katılımı okunur metne dönüştürür (veri kaybolmasın).
function eskiMazeretMetni(t, uyeler) {
  const k = t.katilim || {}, s = t.sebep || {};
  const satir = uyeler.filter(u => k[u.id] === 'mazeret')
    .map(u => `${u.ad}${s[u.id] ? ' — ' + s[u.id] : ''}`);
  return satir.join('\n');
}

/* ---------------- Görev üretici (tekrar motoru) ---------------- */
/**
 * Verilen aralıktaki tüm iş oluşumlarını döndürür.
 * @returns {{isId,is,tarih,saat,anahtar,tamam,toplantiId?}[]}
 */
function olusumlar(baslaISO, bitISO) {
  const out = [];
  const aktifIsler = state.isler.filter(i => !i.arsiv);

  // Gün gün taranan tipler
  for (let g = baslaISO; gunFarki(g, bitISO) >= 0; g = gunEkle(g, 1)) {
    const d = tarihNesnesi(g);
    for (const is of aktifIsler) {
      let uygun = false;
      if (is.tip === 'haftalik') uygun = d.getDay() === Number(is.gun);
      else if (is.tip === 'aylik') {
        const son = ayinSonGunu(d.getFullYear(), d.getMonth());
        uygun = d.getDate() === Math.min(Number(is.ayGunu) || 1, son);
      } else if (is.tip === 'tekseferlik') uygun = is.tarih === g;
      if (uygun) out.push(olusumYap(is, g));
    }
  }
  // Toplantıya bağlı işler — bir iş birden fazla güne düşebilir (örn. bir gün önce VE toplantı günü)
  for (const is of aktifIsler.filter(i => i.tip === 'toplanti')) {
    for (const t of state.toplantilar) {
      for (const o of ofsetListesi(is)) {
        const g = gunEkle(t.tarih, o);
        if (gunFarki(baslaISO, g) >= 0 && gunFarki(g, bitISO) >= 0) out.push(olusumYap(is, g, t.id));
      }
    }
  }
  out.sort((a, b) => (a.tarih + (a.saat || '99:99')).localeCompare(b.tarih + (b.saat || '99:99')));
  return out;
}
function olusumYap(is, tarih, toplantiId) {
  const anahtar = `${is.id}#${tarih}`;
  return { isId: is.id, is, tarih, saat: is.saat || '', anahtar, tamam: !!state.yapildi[anahtar], toplantiId };
}
function surekliIsler() { return state.isler.filter(i => !i.arsiv && i.tip === 'surekli'); }

/** Toplantıya bağlı işin kaydırma listesi. Eski tek değerli (ofset) kayıtlarla uyumlu. */
function ofsetListesi(is) {
  const ham = Array.isArray(is.ofsetler) && is.ofsetler.length ? is.ofsetler : [is.ofset ?? 0];
  const temiz = [...new Set(ham.map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
  return temiz.length ? temiz : [0];
}

/** Tek kaydırmanın okunur karşılığı: -1 → "Toplantıdan 1 gün önce" */
function ofsetMetni(o, kisa) {
  const gun = ofsetGunAdi(o);
  if (kisa) return gun;
  if (o === 0) return `${gun} (toplantı günü)`;
  const yon = o < 0 ? 'önce' : 'sonra';
  return `${gun} (toplantıdan ${Math.abs(o)} gün ${yon})`;
}

function tekrarMetni(is) {
  switch (is.tip) {
    case 'haftalik': return `Her ${GUN_ADLARI[Number(is.gun)]}`;
    case 'aylik': return `Her ayın ${is.ayGunu}. günü`;
    case 'tekseferlik': return `Tek seferlik — ${kisaTarih(is.tarih)}`;
    case 'surekli': return 'Sürekli takip (tarihsiz)';
    case 'toplanti': {
      const l = ofsetListesi(is);
      return l.map(o => ofsetMetni(o)).join(' ve ');
    }
    default: return '';
  }
}

/* ---------------- Küçük arayüz yardımcıları ---------------- */
let toastZaman;
function toast(m) {
  const el = document.getElementById('toast');
  el.textContent = m; el.hidden = false;
  clearTimeout(toastZaman);
  toastZaman = setTimeout(() => { el.hidden = true; }, 2600);
}
/** zorunlu=true: × yok, dışına tıklayınca kapanmaz; yalnız kendi butonuyla geçilir (şifre penceresi). */
function modalAc(baslik, icHTML, altHTML, zorunlu) {
  document.getElementById('modal').innerHTML = `
    <div class="m-bas"><h3>${baslik}</h3>${zorunlu ? '' : '<button class="kapat" data-act="modal-kapat">×</button>'}</div>
    <div class="m-ic">${icHTML}</div>
    <div class="m-alt">${altHTML || '<button class="btn gri" data-act="modal-kapat">Kapat</button>'}</div>`;
  const k = document.getElementById('modalKatman'); k.hidden = false; k.dataset.zorunlu = zorunlu ? '1' : '';
}
function modalKapat(zorla) {
  const k = document.getElementById('modalKatman');
  if (k.dataset.zorunlu && !zorla) return;   // zorunlu pencere dışarıdan kapatılamaz
  k.hidden = true; k.dataset.zorunlu = '';
}
function kopyala(metin) {
  const bitir = (ok) => toast(ok ? '📋 Kopyalandı' : '⚠️ Kopyalanamadı, elle seçip kopyala');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(metin).then(() => bitir(true)).catch(() => yedekKopya(metin, bitir));
  } else yedekKopya(metin, bitir);
}
function yedekKopya(metin, bitir) {
  const ta = document.createElement('textarea');
  ta.value = metin; ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
  document.body.removeChild(ta); bitir(ok);
}
function yazdir(html) {
  document.getElementById('printArea').innerHTML = html;
  window.print();
}

/* ---------------- Yönlendirme ---------------- */
// Açık sekme hatırlanır: sayfa yenilenince aynı sekmede kalınır.
const GORUNUMLER = ['bugun', 'takvim', 'rutin', 'toplanti', 'drive', 'ayar'];
let aktifGorunum = (() => { try { const v = sessionStorage.getItem(ANAHTAR + '_sekme'); return GORUNUMLER.includes(v) ? v : 'bugun'; } catch (e) { return 'bugun'; } })();
let takvimAy = new Date().getMonth();
let takvimYil = new Date().getFullYear();

const gorunumler = {
  bugun: gorunumBugun, takvim: gorunumTakvim, rutin: gorunumRutin,
  toplanti: gorunumToplanti, drive: gorunumDrive, ayar: gorunumAyar,
};

function ciz() {
  document.getElementById('app').innerHTML = gorunumler[aktifGorunum]();
  document.querySelectorAll('#tabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.view === aktifGorunum));
  const b = new Date();
  document.getElementById('bugunTarih').innerHTML =
    `${b.getDate()} ${AY_ADLARI[b.getMonth()]} ${b.getFullYear()}<br>${GUN_ADLARI[b.getDay()]}`;
  document.getElementById('birimAdi').textContent = state.ayar.birim || 'Üniversite Birimi';
}
function git(v) { aktifGorunum = v; try { sessionStorage.setItem(ANAHTAR + '_sekme', v); } catch (e) { } window.scrollTo(0, 0); ciz(); }

/* ================================================================
   GÖRÜNÜM: BUGÜN
   ================================================================ */
function gorunumBugun() {
  const bg = bugunISO();
  // Panelin kullanılmaya başladığı tarihten öncesi "geciken" sayılmaz.
  const enEski = [gunEkle(bg, -60), state.ayar.baslangic || bg].sort().pop();
  const hepsi = olusumlar(enEski, gunEkle(bg, 30));
  const gecen = hepsi.filter(o => o.tarih < bg && !o.tamam);
  const bugunler = hepsi.filter(o => o.tarih === bg);
  // Hafta Cuma ile biter: "Bu hafta" = yarından bu Cuma'ya kadar; Cumartesi'den itibaren yeni hafta sayılır.
  const haftaSonu = gunEkle(bg, (5 - tarihNesnesi(bg).getDay() + 7) % 7);
  const hafta = hepsi.filter(o => o.tarih > bg && o.tarih <= haftaSonu);
  const sonra = hepsi.filter(o => o.tarih > haftaSonu && gunFarki(bg, o.tarih) <= 30);
  const bugunTamam = bugunler.filter(o => o.tamam).length;

  const yaklasanToplanti = state.toplantilar.filter(t => t.tarih >= bg).sort((a, b) => a.tarih.localeCompare(b.tarih))[0];

  let serit = '';
  if (veriHatasi || localStorage.getItem(KURTARMA_ANAHTAR)) {
    serit += `<div class="serit uyari" style="border-color:#e7bdb7;background:#fdf3f2">🛟 <div><b>Kayıtlı veri okunamadı, panel sıfırdan başladı.</b> Eski veri saklandı; indirip <b>Ayarlar › Yedekten geri yükle</b> ile geri almayı dene.
      ${veriHatasi ? `<br><span class="ipucu">Hata: ${kacik(veriHatasi)}</span>` : ''}
      <br><button class="btn sm" style="margin-top:8px" data-act="kurtarma-indir">⬇️ Eski veriyi indir</button>
      <button class="btn sm gri" style="margin-top:8px" data-act="kurtarma-sil">Gerekmez, sil</button></div></div>`;
  }
  if (!state.toplantilar.length) {
    serit += `<div class="serit uyari">⚠️ <div>Henüz toplantı tarihi girilmemiş. Toplantıya bağlı işler (hatırlatma, gündem, tutanak, yoklama) ancak toplantı tarihleri girilince listede çıkar.
      <br><button class="btn sm" style="margin-top:8px" data-act="git" data-view="toplanti">Toplantıları oluştur →</button></div></div>`;
  } else if (yaklasanToplanti) {
    const f = gunFarki(bg, yaklasanToplanti.tarih);
    serit += `<div class="serit bilgi">🪑 <div><b>Sıradaki toplantı:</b> ${uzunTarih(yaklasanToplanti.tarih)} — ${kacik(yaklasanToplanti.saat || state.ayar.toplantiSaat)}
      ${yaklasanToplanti.yer ? ' · ' + kacik(yaklasanToplanti.yer) : ''} <b>(${f === 0 ? 'bugün' : f + ' gün sonra'})</b></div></div>`;
  }

  const depoUyari = depoVar ? '' : `<div class="serit hata">🚫 <div><b>Bu tarayıcı kayıt yapamıyor.</b>
    Girdiğin bilgiler sayfayı kapatınca kaybolur. Sayfayı <b>Chrome / Brave</b> ile aç
    (klasördeki <b>Paneli-Ac.command</b> dosyasına çift tıkla) — Safari dosyadan açılan sayfaya kayıt izni vermiyor.</div></div>`;

  return `
  ${depoUyari}
  ${serit}
  <div class="ozet-grid">
    <div class="ozet gec"><div class="buyuk">${gecen.length}</div><div class="etiket-alt">Geciken</div></div>
    <div class="ozet bugun"><div class="buyuk">${bugunler.length - bugunTamam}</div><div class="etiket-alt">Bugün kalan</div></div>
    <div class="ozet hafta"><div class="buyuk">${hafta.length}</div><div class="etiket-alt">Bu hafta</div></div>
    <div class="ozet tamam"><div class="buyuk">${bugunTamam}</div><div class="etiket-alt">Bugün biten</div></div>
  </div>

  ${gecen.length ? kartIsler('⏰ Geciken işler', gecen, 'gecmis') : ''}
  ${kartIsler('📋 Bugün yapılacaklar', bugunler, '', `<button class="btn sm" data-act="hizli-is">+ İş ekle</button>`)}
  ${kartIsler('🔜 Bu hafta', hafta)}
  ${surekliKart()}
  ${sonra.length ? kartIsler('📅 Sonraki haftalar (30 güne kadar)', sonra) : ''}
  `;
}

function kartIsler(baslik, liste, sinif, ekBtn) {
  return `<div class="kart">
    <div class="kart-bas"><h2>${baslik} <span class="sayi">${liste.length}</span></h2>${ekBtn || ''}</div>
    <div class="kart-ic sifir">${liste.length
      ? `<ul class="is-liste">${liste.map(o => isSatiri(o, sinif)).join('')}</ul>`
      : `<div class="bos">Bu bölümde iş yok. ✨</div>`}</div></div>`;
}

function isSatiri(o, sinif) {
  const is = o.is;
  const gecikti = o.tarih < bugunISO() && !o.tamam;
  const link = is.link || driveUrl(is.kategori);
  return `<li class="is ${sinif || ''} ${o.tamam ? 'tamam' : ''}">
    <input type="checkbox" class="kutu" data-act="isaretle" data-key="${o.anahtar}" ${o.tamam ? 'checked' : ''} title="Yapıldı olarak işaretle">
    <div class="is-govde">
      <div class="is-ad">${kacik(is.ad)}</div>
      <div class="is-alt">
        <span class="etiket ${is.kategori}">${is.kategori}</span>
        <span class="etiket ${gecikti ? 'gec' : 'saat'}">${gunEtiketi(o.tarih)}${o.saat ? ' · ' + o.saat : ''}</span>
        ${is.aciklama ? `<span>${kacik(is.aciklama)}</span>` : ''}
      </div>
    </div>
    <div class="is-sag">
      ${link ? `<a class="btn sm gri" href="${kacik(link)}" target="_blank" rel="noopener">📁 Drive</a>` : ''}
      ${o.toplantiId ? `<button class="btn sm gri" data-act="toplanti-ac" data-id="${o.toplantiId}">Toplantı</button>` : ''}
    </div></li>`;
}

function surekliKart() {
  const liste = surekliIsler();
  if (!liste.length) return '';
  return `<div class="kart">
    <div class="kart-bas"><h2>♻️ Sürekli takip <span class="sayi">${liste.length}</span></h2></div>
    <div class="kart-ic sifir"><ul class="is-liste">
    ${liste.map(is => {
    const son = state.surekli[is.id];
    const link = is.link || driveUrl(is.kategori);
    return `<li class="is">
        <div class="is-govde">
          <div class="is-ad">${kacik(is.ad)}</div>
          <div class="is-alt">
            <span class="etiket ${is.kategori}">${is.kategori}</span>
            <span>${son ? 'Son yapıldı: ' + kisaTarih(son) + ` (${gunEtiketi(son)})` : 'Henüz işaretlenmedi'}</span>
            ${is.aciklama ? `<span>${kacik(is.aciklama)}</span>` : ''}
          </div>
        </div>
        <div class="is-sag">
          ${link ? `<a class="btn sm gri" href="${kacik(link)}" target="_blank" rel="noopener">📁 Drive</a>` : ''}
          <button class="btn sm" data-act="surekli-yapildi" data-id="${is.id}">Bugün yaptım</button>
        </div></li>`;
  }).join('')}
    </ul></div></div>`;
}

// Kategoriye göre varsayılan Drive linki tahmini
function driveUrl(kategori) {
  const e = { 'Arşiv': ['tutanak', 'yoklama'], 'Rapor': ['rapor'], 'Liste': ['liste'], 'Toplantı': ['gündem', 'gundem'] }[kategori];
  if (!e) return '';
  const l = state.linkler.find(l => l.url && e.some(k => l.ad.toLowerCase().includes(k)));
  return l ? l.url : '';
}

/* ================================================================
   GÖRÜNÜM: TAKVİM
   ================================================================ */
function gorunumTakvim() {
  const ilk = new Date(takvimYil, takvimAy, 1);
  const sonGun = ayinSonGunu(takvimYil, takvimAy);
  const bas = iso(new Date(takvimYil, takvimAy, 1));
  const bit = iso(new Date(takvimYil, takvimAy, sonGun));
  const oc = olusumlar(bas, bit);
  const gunler = {};
  oc.forEach(o => (gunler[o.tarih] = gunler[o.tarih] || []).push(o));
  const toplantiGunleri = new Set(state.toplantilar.map(t => t.tarih));

  // Pazartesi başlangıçlı boşluk
  let bosluk = (ilk.getDay() + 6) % 7;
  let hucreler = '';
  for (let i = 0; i < bosluk; i++) hucreler += `<div class="gun bos-gun"></div>`;
  for (let g = 1; g <= sonGun; g++) {
    const t = iso(new Date(takvimYil, takvimAy, g));
    const list = gunler[t] || [];
    const bugunMu = t === bugunISO();
    hucreler += `<div class="gun ${bugunMu ? 'bugun' : ''} ${toplantiGunleri.has(t) ? 'toplanti-gun' : ''}" data-act="gun-ac" data-date="${t}">
      <div class="no">${g}${toplantiGunleri.has(t) ? ' 🪑' : ''}</div>
      <div class="nokta-sira">${list.slice(0, 8).map(o =>
      `<span class="nokta ${o.tamam ? 'tamam' : (t < bugunISO() ? 'gec' : '')}"></span>`).join('')}</div>
      ${list.length ? `<div class="mini">${list.slice(0, 3).map(o => `<span class="mini-is ${o.tamam ? 'tamam' : ''}">${kacik(o.is.ad)}</span>`).join('')}${list.length > 3 ? `<span class="mini-fazla">+${list.length - 3} iş</span>` : ''}</div>` : ''}
    </div>`;
  }

  return `
  <div class="kart"><div class="kart-ic">
    <div class="takvim-bas">
      <button class="btn gri sm" data-act="ay" data-yon="-1">← Önceki</button>
      <h2 style="font-size:17px">${AY_ADLARI[takvimAy]} ${takvimYil}</h2>
      <div style="display:flex;gap:6px">
        <button class="btn gri sm" data-act="ay-bugun">Bugün</button>
        <button class="btn gri sm" data-act="ay" data-yon="1">Sonraki →</button>
      </div>
    </div>
    <div class="takvim">
      ${GUN_KISA.map(g => `<div class="gun-ad">${g}</div>`).join('')}
      ${hucreler}
    </div>
    <p class="ipucu" style="margin-top:12px">🪑 işaretli günler toplantı günü. Bir güne tıklayınca o günün işleri açılır.</p>
  </div></div>`;
}

function gunModalAc(tarih) {
  const liste = olusumlar(tarih, tarih);
  const toplanti = state.toplantilar.find(t => t.tarih === tarih);
  const ic = `
    ${toplanti ? `<div class="serit bilgi" style="margin-bottom:14px">🪑 <div>Bu gün <b>toplantı günü</b> — ${kacik(toplanti.saat || state.ayar.toplantiSaat)}${toplanti.yer ? ' · ' + kacik(toplanti.yer) : ''}</div></div>` : ''}
    ${liste.length ? `<ul class="is-liste" style="margin:-6px -4px">${liste.map(o => isSatiri(o)).join('')}</ul>`
      : `<div class="bos">Bu güne planlanmış iş yok.</div>`}`;
  modalAc(uzunTarih(tarih), ic,
    `<button class="btn gri" data-act="hizli-is" data-date="${tarih}">+ İş ekle</button>
     <button class="btn yesil" data-act="gun-kaydet">✔ Kaydet</button>`);
}

/* ================================================================
   GÖRÜNÜM: RUTİN İŞLER
   ================================================================ */
// Tekrar kuralının satır sonundaki kısa gösterimi: "Toplantı günü · 12:00" -> "Toplantı günü 12:00"
function kisaZaman(is) {
  const s = is.saat ? ' ' + is.saat : '';
  switch (is.tip) {
    case 'toplanti': {
      const m = ofsetListesi(is).map(o => ofsetMetni(o, true)).join(' + ');
      return m.charAt(0).toLocaleUpperCase('tr') + m.slice(1) + s;
    }
    case 'haftalik': return GUN_ADLARI[Number(is.gun)].slice(0, 3) + s;
    case 'aylik': return `Ayın ${is.ayGunu}'i` + s;
    case 'tekseferlik': return kisaTarih(is.tarih).slice(0, 5) + s;
    default: return 'Tarihsiz';
  }
}

const RUTIN_GRUPLAR = [
  { tip: 'toplanti', ad: '🪑 Toplantıya bağlı', not: 'Her toplantı tarihine göre kendiliğinden oluşur.' },
  { tip: 'haftalik', ad: '🗓️ Haftalık', not: 'Her hafta aynı gün tekrarlanır.' },
  { tip: 'aylik', ad: '📅 Aylık', not: 'Her ay aynı günde çıkar.' },
  { tip: 'tekseferlik', ad: '📌 Tek seferlik', not: 'Sadece belirtilen tarihte çıkar.' },
  { tip: 'surekli', ad: '♻️ Sürekli takip', not: 'Tarihi yok; "Bugün yaptım" ile işaretlenir.' },
];

function gorunumRutin() {
  const aktif = state.isler.filter(i => !i.arsiv);
  const arsiv = state.isler.filter(i => i.arsiv);

  const grup = (g) => {
    const liste = aktif.filter(i => i.tip === g.tip);
    if (!liste.length) return '';
    return `<div class="kart">
      <div class="kart-bas"><h2>${g.ad} <span class="sayi">${liste.length}</span></h2></div>
      <div class="kart-ic sifir">
        <p class="ipucu" style="padding:9px 16px 0;margin:0">${g.not}</p>
        ${liste.map(acilirSatir).join('')}
      </div></div>`;
  };

  return `
  <div class="serit bilgi">💡 <div>Burada işlerin <b>tekrar kuralı</b> durur. Bir işe dokununca ayrıntısı açılır.</div></div>
  <div class="kart"><div class="kart-bas">
    <h2>🔁 Rutin işler <span class="sayi">${aktif.length}</span></h2>
    <button class="btn sm" data-act="is-duzenle" data-id="">+ Yeni iş</button>
  </div></div>
  ${RUTIN_GRUPLAR.map(grup).join('') || `<div class="kart"><div class="bos">Henüz iş yok. <b>+ Yeni iş</b> ile başla.</div></div>`}
  ${arsiv.length ? `<div class="kart">
    <div class="kart-bas"><h2>🗄️ Arşivlenmiş <span class="sayi">${arsiv.length}</span></h2></div>
    <div class="kart-ic sifir">${arsiv.map(acilirSatir).join('')}</div></div>` : ''}`;
}

// Tek satır: kapalıyken tek satır özet, tıklanınca ayrıntı açılır.
function acilirSatir(is) {
  const link = is.link || driveUrl(is.kategori);
  return `<details class="acilir">
    <summary>
      <span class="ok">›</span>
      <span class="ad">${kacik(is.ad)}</span>
      <span class="etiket saat">${kacik(kisaZaman(is))}</span>
    </summary>
    <div class="acilir-ic">
      <div class="is-alt" style="margin:0 0 10px">
        <span class="etiket ${is.kategori}">${is.kategori}</span>
        <span class="etiket saat">${tekrarMetni(is)}${is.saat ? ' · ' + is.saat : ''}</span>
      </div>
      ${is.aciklama ? `<p style="margin:0 0 10px">${kacik(is.aciklama)}</p>`
      : `<p class="ipucu" style="margin:0 0 10px">Açıklama yok.</p>`}
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${link ? `<a class="btn sm gri" href="${kacik(link)}" target="_blank" rel="noopener">📁 Drive</a>` : ''}
        <button class="btn sm gri" data-act="is-duzenle" data-id="${is.id}">Düzenle</button>
        <button class="btn sm gri" data-act="is-arsiv" data-id="${is.id}">${is.arsiv ? '↩️ Geri al' : '🗄️ Arşivle'}</button>
      </div>
    </div></details>`;
}

function isFormuAc(id, varsayilan) {
  const is = state.isler.find(i => i.id === id)
    || { kategori: 'İletişim', tip: 'tekseferlik', ofset: 0, saat: '', ayGunu: 1, gun: Number(state.ayar.toplantiGunu), tarih: bugunISO(), ...(varsayilan || {}) };
  const secili = (a, b) => a == b ? 'selected' : '';
  modalAc(id ? 'İşi düzenle' : 'İş ekle', `
    <div class="form-satir"><div class="alan"><label>Ne yapılacak?</label>
      <input type="text" id="f_ad" value="${kacik(is.ad || '')}" placeholder="Örn: Afiş tasarımını onaya gönder"></div></div>
    <div class="form-satir">
      <div class="alan"><label>Kategori</label><select id="f_kat">
        ${KATEGORILER.map(k => `<option ${secili(k, is.kategori)}>${k}</option>`).join('')}</select></div>
      <div class="alan"><label>Saat (isteğe bağlı)</label><input type="time" id="f_saat" value="${kacik(is.saat || '')}"></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Ne zaman?</label><select id="f_tip">
      <option value="tekseferlik" ${secili('tekseferlik', is.tip)}>Tek seferlik — belirli bir tarihte</option>
      <option value="haftalik" ${secili('haftalik', is.tip)}>Her hafta — belirli gün</option>
      <option value="aylik" ${secili('aylik', is.tip)}>Her ay — belirli gün</option>
      <option value="toplanti" ${secili('toplanti', is.tip)}>Her toplantıda — toplantıya göre</option>
      <option value="surekli" ${secili('surekli', is.tip)}>Sürekli takip — tarihsiz</option>
    </select></div></div>
    <div class="form-satir" id="f_detay"></div>
    <div class="form-satir"><div class="alan"><label>Açıklama / not</label>
      <input type="text" id="f_aciklama" value="${kacik(is.aciklama || '')}" placeholder="Kısa hatırlatma notu"></div></div>
    <div class="form-satir"><div class="alan"><label>Drive linki (boş bırakırsan kategoriye göre otomatik)</label>
      <input type="url" id="f_link" value="${kacik(is.link || '')}" placeholder="https://drive.google.com/..."></div></div>`,
    `<button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="is-kaydet" data-id="${id || ''}">${id ? 'Kaydet' : 'Ekle'}</button>`);
  if (!id) setTimeout(() => document.getElementById('f_ad')?.focus(), 50);

  const detayCiz = () => {
    const tip = document.getElementById('f_tip').value;
    const d = document.getElementById('f_detay');
    if (tip === 'toplanti') d.innerHTML = `<div class="alan"><label>Toplantıya göre kaydırma (gün)</label>
      <input type="text" id="f_ofset" value="${ofsetListesi(is).join(', ')}" placeholder="Örn: -1, 0">
      <span class="ipucu">-1 = bir gün önce · 0 = toplantı günü · 1 = bir gün sonra.
      Birden fazla güne düşsün istersen virgülle yaz: <b>-1, 0</b> → hem bir gün önce hem toplantı günü.</span></div>`;
    else if (tip === 'haftalik') d.innerHTML = `<div class="alan"><label>Hangi gün</label><select id="f_gun">
      ${GUN_ADLARI.map((g, i) => `<option value="${i}" ${secili(i, is.gun ?? 3)}>${g}</option>`).join('')}</select></div>`;
    else if (tip === 'aylik') d.innerHTML = `<div class="alan"><label>Ayın kaçı</label>
      <input type="number" id="f_ayGunu" min="1" max="31" value="${is.ayGunu ?? 1}">
      <span class="ipucu">31 yazarsan kısa aylarda ayın son günü kullanılır.</span></div>`;
    else if (tip === 'tekseferlik') d.innerHTML = `<div class="alan"><label>Tarih</label>
      <input type="date" id="f_tarih" value="${is.tarih || bugunISO()}"></div>`;
    else d.innerHTML = `<div class="alan"><span class="ipucu">Tarihsiz iş: "Bugün yaptım" ile son yapılma tarihi tutulur.</span></div>`;
  };
  detayCiz();
  document.getElementById('f_tip').addEventListener('change', detayCiz);
}

function isKaydet(id) {
  const al = (x) => document.getElementById(x)?.value?.trim() ?? '';
  const ad = al('f_ad');
  if (!ad) { toast('⚠️ İş adı boş olamaz'); return; }
  const tip = al('f_tip');
  const kayit = {
    id: id || yeniId(), ad, kategori: al('f_kat'), tip, saat: al('f_saat'),
    aciklama: al('f_aciklama'), link: al('f_link'), arsiv: false,
  };
  if (tip === 'toplanti') {
    const l = [...new Set(al('f_ofset').split(',').map(x => Number(x.trim())).filter(Number.isFinite))]
      .sort((a, b) => a - b);
    kayit.ofsetler = l.length ? l : [0];
    delete kayit.ofset;
  }
  if (tip === 'haftalik') kayit.gun = Number(al('f_gun'));
  if (tip === 'aylik') kayit.ayGunu = Math.min(31, Math.max(1, Number(al('f_ayGunu')) || 1));
  if (tip === 'tekseferlik') kayit.tarih = al('f_tarih') || bugunISO();

  const i = state.isler.findIndex(x => x.id === id);
  if (i >= 0) {
    state.isler[i] = { ...state.isler[i], ...kayit };
    delete state.isler[i].ofset;   // eski tek değerli alan artık kullanılmıyor
  } else state.isler.push(kayit);
  kaydet(); modalKapat(); ciz(); toast(i >= 0 ? '✔️ Kaydedildi' : '✔️ İş eklendi');
  if (i < 0 && tip !== 'surekli') takvimTeklifi(kayit);
}

/** Yeni eklenen işi telefonun takvimine de eklemeyi teklif eder. */
function takvimTeklifi(is) {
  // Yalnız telefonda ve kullanıcı kapatmadıysa: dosya telefonun takvimi için, bilgisayarda gereksiz.
  const telefon = /iPhone|iPad|iPod|Android/.test(navigator.userAgent);
  if (!telefon || state.ayar.takvimTeklifiKapali) return;
  const adet = icsUret(is.id).split('BEGIN:VEVENT').length - 1;
  if (!adet) return;
  modalAc('📲 Telefon takvimine de eklensin mi?', `
    <p class="ipucu" style="margin-top:0"><b>${kacik(is.ad)}</b> — ${tekrarMetni(is)}${is.saat ? ' · ' + is.saat : ' · saat girilmedi, 09:00 kabul edilir'}</p>
    <p class="ipucu">Panel bildirimleri telefonun takviminden gelir. Bu iş daha önce indirdiğin takvim dosyasında yok; dönem sonuna kadar <b>${adet}</b> olay olarak şimdi ekleyebilirsin.</p>`,
    `<button class="btn gri sm" data-act="takvim-teklifi-kapat">Bir daha sorma</button>
     <button class="btn gri" data-act="modal-kapat">Gerekmez</button>
     <button class="btn" data-act="tek-is-takvim" data-id="${is.id}">📲 Takvime ekle</button>`);
}

function hizliIsAc(tarih) { isFormuAc('', { tarih: tarih || bugunISO() }); }

/* ================================================================
   GÖRÜNÜM: TOPLANTILAR
   ================================================================ */
function gorunumToplanti() {
  const bg = bugunISO();
  const sirali = [...state.toplantilar].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const siradaki = sirali.find(t => t.tarih >= bg);
  const gecmis = sirali.filter(t => t.tarih < bg).reverse();

  return `
  ${siradaki ? toplantiKarti(siradaki) : `<div class="kart"><div class="bos">Yaklaşan toplantı yok.</div></div>`}

  ${gecmis.length ? `<div class="kart"><div class="kart-ic sifir">
    <details class="acilir"><summary><span class="ad">Geçmiş toplantılar</span><span class="etiket saat">${gecmis.length}</span></summary>
      <ul class="is-liste">${gecmis.slice(0, 12).map(t => `<li class="is"><div class="is-govde"><div class="is-ad">${kisaTarih(t.tarih)} · ${GUN_ADLARI[tarihNesnesi(t.tarih).getDay()]}</div>
        <div class="is-alt">${t.tutanakLink ? `<a class="btn sm gri" href="${kacik(t.tutanakLink)}" target="_blank" rel="noopener">📝 Tutanak</a>` : '<span class="etiket saat">Tutanak linki yok</span>'}
        <button class="btn sm gri" data-act="toplanti-duzenle" data-id="${t.id}">Düzenle</button></div></div></li>`).join('')}</ul>
    </details></div></div>` : ''}`;
}

/**
 * Bu toplantıdan önceki, tutanak linki girilmiş en son toplantıyı bulur.
 * Gündem çıktısıyla birlikte alınacak "1 adet son tutanak" için kullanılır.
 */
function sonTutanak(t) {
  return [...state.toplantilar]
    .filter(x => x.tarih < t.tarih && x.tutanakLink)
    .sort((a, b) => b.tarih.localeCompare(a.tarih))[0] || null;
}

function toplantiKarti(t) {
  const gundem = (t.gundem || []).filter(Boolean);
  const onceki = sonTutanak(t);
  return `<div class="kart">
    <div class="kart-bas">
      <h2>${kisaTarih(t.tarih)} · ${GUN_ADLARI[tarihNesnesi(t.tarih).getDay()]} <span class="sayi">${kacik(t.saat || state.ayar.toplantiSaat)}</span></h2>
    </div>
    <div class="kart-ic">
      ${t.yer ? `<p style="margin:0 0 10px"><b>Yer:</b> ${kacik(t.yer)}</p>` : ''}
      <h4 style="font-size:13px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Mazeretler</h4>
      ${katilimOzeti(t)}
      ${mazeretTablosu(t)}
      <div class="form-satir" style="margin-top:10px;align-items:flex-end">
        <div class="alan" style="flex:1"><input type="text" id="mz_ad_${t.id}" list="uyeListesi" placeholder="İsim yaz — listeden tamamlanır" autocomplete="off"></div>
        <div class="alan" style="flex:1"><input type="text" id="mz_sebep_${t.id}" placeholder="Mazereti (isteğe bağlı)" data-enter-act="mazeret-ekle" data-id="${t.id}"></div>
        <button class="btn sm" data-act="mazeret-ekle" data-id="${t.id}">+ Ekle</button>
      </div>
      <datalist id="uyeListesi">${(state.uyeler || []).map(u => `<option value="${kacik(u)}">`).join('')}</datalist>
      <div style="height:14px"></div>
      <h4 style="font-size:13px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Gündem maddeleri</h4>
      ${gundemDuzenlenen === t.id ? `
        <textarea id="gundem_metin_${t.id}" style="min-height:140px" placeholder="Gündem metnini olduğu gibi yapıştır.">${kacik(t.gundemMetin ?? (t.gundem || []).join('\n'))}</textarea>
        <div class="form-satir" style="margin:8px 0 14px">
          <button class="btn gri sm" data-act="gundem-vazgec">Vazgeç</button>
          <button class="btn yesil sm" data-act="gundem-kaydet" data-id="${t.id}">✔ Kaydet</button>
        </div>`
      : gundemMetniHTML(t)}
      ${t.tutanakLink ? `<div class="form-satir" style="margin-top:12px"><a class="btn sm gri" href="${kacik(t.tutanakLink)}" target="_blank" rel="noopener">📝 Tutanak dosyası</a></div>` : ''}
    </div></div>`;
}

function toplantiFormuAc(id) {
  const t = state.toplantilar.find(x => x.id === id) || {
    tarih: bugunISO(), saat: state.ayar.toplantiSaat, yer: state.ayar.toplantiYer, gundem: ['', '', ''], notlar: '', tutanakLink: ''
  };
  const g = t.gundem || ['', '', ''];
  modalAc(id ? 'Toplantıyı düzenle' : 'Yeni toplantı', `
    <div class="form-satir">
      <div class="alan"><label>Tarih</label><input type="date" id="t_tarih" value="${t.tarih}"></div>
      <div class="alan"><label>Saat</label><input type="time" id="t_saat" value="${kacik(t.saat || '')}"></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Yer</label>
      <input type="text" id="t_yer" value="${kacik(t.yer || '')}" placeholder="Örn: Birim ofisi / Kampüs A blok"></div></div>
    <div class="form-satir">
      <div class="alan"><label>Katılım notu (isteğe bağlı)</label>
        <input type="text" id="t_katilimNot" value="${kacik(t.katilimNot || '')}" placeholder="Örn: 14/18"></div>
      <div class="alan"><label>Tutanak dosya linki</label>
        <input type="url" id="t_tutanak" value="${kacik(t.tutanakLink || '')}" placeholder="https://docs.google.com/..."></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Notlar</label><textarea id="t_notlar">${kacik(t.notlar || '')}</textarea></div></div>`,
    `${id ? `<button class="btn tehlike" data-act="toplanti-sil" data-id="${id}">Sil</button>` : ''}
     <button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="toplanti-kaydet" data-id="${id || ''}">Kaydet</button>`);
}

function toplantiKaydet(id) {
  const al = (x) => document.getElementById(x)?.value?.trim() ?? '';
  const kayit = {
    tarih: al('t_tarih') || bugunISO(), saat: al('t_saat'), yer: al('t_yer'),
    tutanakLink: al('t_tutanak'), notlar: al('t_notlar'),
    katilimNot: al('t_katilimNot'),
  };
  const i = state.toplantilar.findIndex(x => x.id === id);
  if (i >= 0) state.toplantilar[i] = { ...state.toplantilar[i], ...kayit };
  else state.toplantilar.push({ id: yeniId(), mazeretListe: [], ...kayit });
  kaydet(); modalKapat(); ciz(); toast('✔️ Toplantı kaydedildi');
}

function donemOlusturAc() {
  const bug = new Date();
  // Varsayılan bitiş: dönem sonu (30 Haziran). Temmuz ve sonrasında bir sonraki yılın Haziran'ı.
  const bit = iso(new Date(bug.getMonth() >= 6 ? bug.getFullYear() + 1 : bug.getFullYear(), 5, 30));
  modalAc('Dönem toplantılarını oluştur', `
    <p class="ipucu" style="margin-top:0">Seçtiğin gün için, iki tarih arasındaki tüm haftalara toplantı kaydı açılır. Zaten kayıtlı olan tarihler atlanır. Bitiş varsayılan olarak dönem sonudur (30 Haziran).</p>
    <div class="form-satir">
      <div class="alan"><label>Toplantı günü</label><select id="d_gun">
        ${GUN_ADLARI.map((g, i) => `<option value="${i}" ${i === Number(state.ayar.toplantiGunu) ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
      <div class="alan"><label>Saat</label><input type="time" id="d_saat" value="${kacik(state.ayar.toplantiSaat)}"></div>
    </div>
    <div class="form-satir">
      <div class="alan"><label>Başlangıç</label><input type="date" id="d_bas" value="${bugunISO()}"></div>
      <div class="alan"><label>Bitiş</label><input type="date" id="d_bit" value="${bit}"></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Yer (hepsine yazılır)</label>
      <input type="text" id="d_yer" value="${kacik(state.ayar.toplantiYer || '')}"></div></div>
    <div class="form-satir"><div class="alan"><label>Aralık</label><select id="d_aralik">
      <option value="1">Her hafta</option><option value="2">İki haftada bir</option></select></div></div>`,
    `<button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="donem-kaydet">Oluştur</button>`);
}

function donemKaydet() {
  const gun = Number(document.getElementById('d_gun').value);
  const saat = document.getElementById('d_saat').value;
  const yer = document.getElementById('d_yer').value.trim();
  const aralik = Number(document.getElementById('d_aralik').value) || 1;
  let bas = document.getElementById('d_bas').value, bit = document.getElementById('d_bit').value;
  if (!bas || !bit || gunFarki(bas, bit) < 0) { toast('⚠️ Tarih aralığı hatalı'); return; }

  // İlk uygun güne kaydır
  while (tarihNesnesi(bas).getDay() !== gun) bas = gunEkle(bas, 1);
  const mevcut = new Set(state.toplantilar.map(t => t.tarih));
  let n = 0;
  for (let g = bas; gunFarki(g, bit) >= 0; g = gunEkle(g, 7 * aralik)) {
    if (mevcut.has(g)) continue;
    state.toplantilar.push({ id: yeniId(), tarih: g, saat, yer, gundem: ['', '', ''], mazeretListe: [], katilimNot: '', notlar: '', tutanakLink: '' });
    n++;
  }
  state.ayar.toplantiGunu = gun; state.ayar.toplantiSaat = saat; state.ayar.toplantiYer = yer;
  gmAdlariniGuncelle(state);
  kaydet(); modalKapat(); ciz();
  toast(n ? `✔️ ${n} toplantı oluşturuldu` : 'Yeni tarih eklenmedi (hepsi zaten kayıtlı)');
}

// Toplantı kartındaki serbest metni, gruba iletilecek biçime çevirir.
/** "Toplam · Mazeretli · Gelecek" satırı. Üye listesi yoksa yalnız mazeretli sayısı. */
function katilimOzeti(t) {
  const m = (t.mazeretListe || []).length, n = (state.uyeler || []).length;
  if (!n) return `<div class="rozet-sira" style="margin-bottom:10px"><span>🟡 Mazeretli <b>${m}</b></span>
    <span class="ipucu">Üye listesini <b>Ayarlar</b>'dan girersen kaç kişinin geleceği de hesaplanır.</span></div>`;
  return `<div class="rozet-sira" style="margin-bottom:10px">
    <span>👥 Toplam <b>${n}</b></span><span>🟡 Mazeretli <b>${m}</b></span><span>✅ Gelecek <b>${Math.max(0, n - m)}</b></span></div>`;
}
function mazeretTablosu(t) {
  const l = t.mazeretListe || [];
  if (!l.length) return `<p class="ipucu" style="margin:0 0 6px">Henüz mazeret yok.</p>`;
  return `<table><thead><tr><th style="width:40%">Ad Soyad</th><th>Mazeret</th><th style="width:44px"></th></tr></thead><tbody>
    ${l.map((m, i) => `<tr><td><b>${kacik(m.ad)}</b></td><td>${kacik(m.sebep) || '<span class="ipucu">—</span>'}</td>
      <td class="sag"><button class="btn sm gri" data-act="mazeret-sil" data-id="${t.id}" data-i="${i}" title="Kaldır">✕</button></td></tr>`).join('')}
  </tbody></table>`;
}
/** Yazılan ismi üye listesinden tamamlar: "hüda" → "Hüdanur Küçük" (tek eşleşme varsa). */
function uyeTamamla(yazilan) {
  const y = yazilan.trim(); if (!y) return '';
  const k = (x) => x.toLocaleLowerCase('tr');
  const tam = (state.uyeler || []).find(u => k(u) === k(y)); if (tam) return tam;
  const adaylar = (state.uyeler || []).filter(u => k(u).startsWith(k(y)) || k(u).split(' ').some(p => p.startsWith(k(y))));
  return adaylar.length === 1 ? adaylar[0] : y;
}
function mazeretEkle(tId) {
  const t = state.toplantilar.find(x => x.id === tId); if (!t) return;
  const adK = document.getElementById('mz_ad_' + tId), sebepK = document.getElementById('mz_sebep_' + tId);
  const ad = uyeTamamla(adK.value); if (!ad) { toast('⚠️ İsim yaz'); adK.focus(); return; }
  t.mazeretListe = t.mazeretListe || [];
  const varolan = t.mazeretListe.find(m => m.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'));
  if (varolan) { varolan.sebep = sebepK.value.trim() || varolan.sebep; varolan.t = Date.now(); }
  else t.mazeretListe.push({ ad, sebep: sebepK.value.trim(), t: Date.now() });
  if (t.mazeretSilinen) delete t.mazeretSilinen[ad.toLocaleLowerCase('tr')];
  kaydet(); ciz();
  setTimeout(() => document.getElementById('mz_ad_' + tId)?.focus(), 30);
}

function mazeretMetni(id) {
  const t = state.toplantilar.find(x => x.id === id);
  if (!t) return '';
  const l = t.mazeretListe || [];
  if (!l.length) return '';
  const n = (state.uyeler || []).length;
  return `📌 ${kisaTarih(t.tarih)} Toplantısı — Mazeret Bildirenler (${l.length})\n\n`
    + l.map((m, i) => `${i + 1}. ${m.ad}${m.sebep ? ' — ' + m.sebep : ''}`).join('\n')
    + (n ? `\n\n✅ Gelecek: ${Math.max(0, n - l.length)} / ${n}` : '')
    + (t.katilimNot ? `\n✅ Katılım: ${t.katilimNot}` : '');
}

function gundemYazdir(id) {
  const t = state.toplantilar.find(x => x.id === id);
  if (!t) return;
  const g = (t.gundem || []).filter(Boolean);
  if (!g.length) { toast('⚠️ Önce gündem maddelerini gir'); return; }
  const onceki = sonTutanak(t);
  yazdir(`<div class="p-ust">
      <h1>${kacik(state.ayar.birim)}</h1>
      <div>TOPLANTI GÜNDEMİ</div>
      <div>${uzunTarih(t.tarih)} · ${kacik(t.saat || state.ayar.toplantiSaat)}${t.yer ? ' · ' + kacik(t.yer) : ''}</div>
    </div>
    <div style="white-space:pre-wrap;line-height:1.8;font-size:15px">${kacik((t.gundemMetin ?? g.join('\n')).trim())}</div>
    <div class="p-alt">Katılan: ............ &nbsp;&nbsp; Mazeret: ............ &nbsp;&nbsp; Sekreterya imza: ............</div>
    ${onceki ? `<div class="p-alt">Ek: ${kisaTarih(onceki.tarih)} tarihli toplantı tutanağı — 1 adet çıktı.</div>` : ''}`);
}

/* ================================================================
   GÖRÜNÜM: DRIVE
   ================================================================ */
function gorunumDrive() {
  return `
  <div class="serit bilgi">📁 <div>Klasör/dosya linklerini bir kez yapıştır; sonra ilgili işin yanındaki <b>Drive</b> butonu doğrudan o dosyayı açar.</div></div>
  <div class="kart"><div class="kart-bas"><h2>📁 Drive bağlantıları <span class="sayi">${state.linkler.length}</span></h2>
    <button class="btn sm" data-act="link-duzenle" data-id="">+ Yeni bağlantı</button></div>
    <div class="kart-ic">
      <div class="link-grid">${state.linkler.map(l => `<div class="link-kutu">
        <div class="ad">${l.ikon || '📁'} ${kacik(l.ad)}</div>
        <div class="url">${l.url ? kacik(l.url.slice(0, 70)) + (l.url.length > 70 ? '…' : '') : '— link girilmedi —'}</div>
        <div class="satir">
          ${l.url ? `<a class="btn sm blok" href="${kacik(l.url)}" target="_blank" rel="noopener">Aç ↗</a>` : ''}
          <button class="btn sm gri ${l.url ? '' : 'blok'}" data-act="link-duzenle" data-id="${l.id}">${l.url ? 'Düzenle' : 'Link ekle'}</button>
        </div></div>`).join('')}</div>
    </div></div>`;
}

function linkFormuAc(id) {
  const l = state.linkler.find(x => x.id === id) || { ad: '', url: '', ikon: '📁' };
  modalAc(id ? 'Bağlantıyı düzenle' : 'Yeni bağlantı', `
    <div class="form-satir">
      <div class="alan" style="max-width:90px"><label>İkon</label><input type="text" id="l_ikon" value="${kacik(l.ikon || '📁')}" maxlength="2"></div>
      <div class="alan"><label>Ad</label><input type="text" id="l_ad" value="${kacik(l.ad)}" placeholder="Örn: Tutanaklar"></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Drive linki</label>
      <input type="url" id="l_url" value="${kacik(l.url)}" placeholder="https://drive.google.com/drive/folders/...">
      <span class="ipucu">Drive'da klasöre gir → adres çubuğundaki adresi kopyala → buraya yapıştır.</span></div></div>`,
    `${id ? `<button class="btn tehlike" data-act="link-sil" data-id="${id}">Sil</button>` : ''}
     <button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="link-kaydet" data-id="${id || ''}">Kaydet</button>`);
}

/* ================================================================
   GÖRÜNÜM: AYARLAR
   ================================================================ */
function gorunumAyar() {
  const a = state.ayar;
  return `
  <div class="kart"><div class="kart-bas"><h2>⚙️ Birim bilgileri</h2></div>
    <div class="kart-ic">
      <div class="form-satir"><div class="alan"><label>Birim adı</label>
        <input type="text" id="a_birim" value="${kacik(a.birim)}"></div></div>
      <div class="form-satir">
        <div class="alan"><label>Olağan toplantı günü</label><select id="a_gun">
          ${GUN_ADLARI.map((g, i) => `<option value="${i}" ${i === Number(a.toplantiGunu) ? 'selected' : ''}>${g}</option>`).join('')}</select></div>
        <div class="alan"><label>Toplantı saati</label><input type="time" id="a_saat" value="${kacik(a.toplantiSaat)}"></div>
        <div class="alan"><label>Toplantı yeri</label><input type="text" id="a_yer" value="${kacik(a.toplantiYer || '')}"></div>
      </div>
      <button class="btn" data-act="ayar-kaydet">Kaydet</button>
    </div></div>

  <div class="kart"><div class="kart-bas"><h2>👥 Üye listesi <span class="sayi">${(state.uyeler || []).length}</span></h2></div>
    <div class="kart-ic">
      <p class="ipucu" style="margin-top:0">Her satıra bir kişi, ad soyad. Toplantı kartında isim yazarken buradan tamamlanır; gelecek sayısı buna göre hesaplanır.</p>
      <textarea id="a_uyeler" style="min-height:140px" placeholder="Ayşe Yılmaz&#10;Zeynep Kaya">${kacik((state.uyeler || []).join('\n'))}</textarea>
      <div class="form-satir" style="margin-top:10px"><button class="btn" data-act="uyeler-kaydet">Listeyi kaydet</button></div>
    </div></div>

  <div class="kart"><div class="kart-bas"><h2>📲 Telefona bildirim</h2></div>
    <div class="kart-ic">
      <p class="ipucu" style="margin-top:0">Tarayıcı bildirimi yalnız sayfa açıkken çalışır. Telefonda bildirim için işleri <b>telefonun takvimine</b> aktar: dönem sonuna kadar tüm işler ve toplantılar, her biri saatinde alarm verecek şekilde eklenir. İşler değişince dosyayı yeniden indirip ekle; aynı işler güncellenir, çoğalmaz.</p>
      <button class="btn" data-act="takvime-aktar">📲 Takvime aktar (.ics)</button>
    </div></div>

  <div class="kart"><div class="kart-bas"><h2>💾 Yedek</h2></div>
    <div class="kart-ic">
      <p class="ipucu" style="margin-top:0">Veriler yalnızca bu bilgisayarın tarayıcısında durur. Tarayıcı verisi silinirse kaybolur — <b>ayda bir yedek indir</b>, dosyayı Drive'a at.</p>
      <div class="form-satir">
        <button class="btn" data-act="yedek-indir">⬇️ Yedek indir (.json)</button>
        <button class="btn gri" data-act="yedek-yukle">⬆️ Yedekten geri yükle</button>
        <button class="btn tehlike" data-act="sifirla">Her şeyi sıfırla</button>
      </div>
      <input type="file" id="yedekDosya" accept=".json" hidden>
    </div></div>

  <div class="kart"><div class="kart-bas"><h2>📊 Durum</h2></div>
    <div class="kart-ic">
      <div class="rozet-sira">
        <span>İş tanımı <b>${state.isler.filter(i => !i.arsiv).length}</b></span>
        <span>Toplantı <b>${state.toplantilar.length}</b></span>
        <span>Drive bağlantısı <b>${state.linkler.filter(l => l.url).length}/${state.linkler.length}</b></span>
        <span>Tamamlanan iş <b>${Object.keys(state.yapildi).length}</b></span>
      </div>
    </div></div>`;
}

/* ---------------- Yedekleme ---------------- */
function yedekIndir() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `sekreterya-yedek-${bugunISO()}.json`;
  a.click(); URL.revokeObjectURL(a.href);
  toast('⬇️ Yedek indirildi');
}
/* ---------------- Takvim dışa aktarma (.ics) ----------------
   Telefonun kendi takvimi bildirim verir; sunucu/hesap gerekmez. */
function icsMetin(t) { return String(t || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => '\\' + m); }
function icsZaman(tarih, saat) {
  const [h, m] = (saat || '09:00').split(':').map(Number);
  return tarih.replace(/-/g, '') + 'T' + String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00';
}
function icsUret(sadeceIsId) {
  const bug = bugunISO();
  const d = new Date();
  const bit = iso(new Date(d.getMonth() >= 6 ? d.getFullYear() + 1 : d.getFullYear(), 5, 30));
  const damga = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  // Panelin adresi: bildirimden olaya, olaydan tek dokunuşla panele geçilsin (file:// ise eklenmez).
  const panelUrl = /^https?:/.test(location.href) ? location.origin + location.pathname : '';
  const olay = (uid, baslik, tarih, saat, dakika, aciklama) => [
    'BEGIN:VEVENT', `UID:${uid}@sekreterya`, `DTSTAMP:${damga}`,
    `DTSTART:${icsZaman(tarih, saat)}`, `DURATION:PT${dakika}M`,
    `SUMMARY:${icsMetin(baslik)}`,
    `DESCRIPTION:${icsMetin([aciklama, panelUrl ? 'Panel: ' + panelUrl : ''].filter(Boolean).join('\n'))}`,
    panelUrl ? `URL:${panelUrl}` : '',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', `DESCRIPTION:${icsMetin(baslik)}`, 'END:VALARM',
    'END:VEVENT'].filter(Boolean);
  const satirlar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sekreterya Paneli//TR', 'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Sekreterya', 'X-WR-TIMEZONE:Europe/Istanbul'];
  olusumlar(bug, bit).filter(o => !o.tamam && (!sadeceIsId || o.isId === sadeceIsId)).forEach(o =>
    satirlar.push(...olay(o.anahtar, o.is.ad, o.tarih, o.saat || '09:00', 30, o.is.aciklama)));
  if (!sadeceIsId) state.toplantilar.filter(t => t.tarih >= bug).forEach(t =>
    satirlar.push(...olay('toplanti-' + t.id, '🪑 Birim toplantısı', t.tarih, t.saat || state.ayar.toplantiSaat, 90, t.yer)));
  satirlar.push('END:VCALENDAR');
  return satirlar.join('\r\n');
}
function icsIndir(icerik, ad) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([icerik], { type: 'text/calendar;charset=utf-8' }));
  a.download = ad; a.click(); URL.revokeObjectURL(a.href);
}
/** Tek bir işi telefon takvimine ekler (yeni eklenen tek seferlik iş için). */
function tekIsiTakvimeAktar(isId) {
  const is = state.isler.find(i => i.id === isId);
  if (!is) return;
  icsIndir(icsUret(isId), `sekreterya-is-${is.tarih || bugunISO()}.ics`);
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  toast(iphone ? '📲 İndi — sağ üstteki ⬇︎ okuna dokun, dosyayı aç, "Ekle" de' : '📲 Dosya indi — açıp takvime ekle');
}
function takvimeAktar() {
  icsIndir(icsUret(), `sekreterya-${bugunISO()}.ics`);
  const iphone = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const android = /Android/.test(navigator.userAgent);
  const adimlar = iphone ? [
    'Safari\'de sağ üstteki <b>indirme okuna (⬇︎)</b> dokun.',
    '<b>sekreterya-…ics</b> dosyasına dokun; Takvim önizlemesi açılır.',
    'Sağ üstte <b>Tümünü Ekle</b> de, hangi takvime ekleneceğini seç.',
    'Takvim uygulamasını aç; bugünden itibaren işler saatinde alarmlı olarak durur.'
  ] : android ? [
    'Bildirim çubuğundan veya <b>Dosyalar › İndirilenler</b>\'den <b>sekreterya-…ics</b> dosyasını aç.',
    'Google Takvim ile aç, <b>Tümünü ekle</b> / <b>Kaydet</b> de.',
    'Takvim uygulamasını aç; işler saatinde bildirimli olarak durur.'
  ] : [
    'İndirilenler klasöründeki <b>sekreterya-…ics</b> dosyasına çift tıkla.',
    'Takvim uygulaması açılır; hangi takvime ekleneceğini seç, <b>Tamam</b> de.',
    'iCloud takvimi seçersen aynı olaylar iPhone\'una da düşer ve orada bildirim verir.'
  ];
  modalAc('📲 Takvim dosyası indi — şimdi ekle', `
    <p class="ipucu" style="margin-top:0">Dosya indirildi ama takvime <b>kendiliğinden eklenmez</b>. Şu adımları izle:</p>
    <ol style="margin:0;padding-left:22px;line-height:1.7">${adimlar.map(x => `<li>${x}</li>`).join('')}</ol>
    <p class="ipucu">Dosyada bugünden dönem sonuna kadar <b>${icsUret().split('BEGIN:VEVENT').length - 1}</b> olay var. Yapıldı işaretlenen işler dahil edilmez.</p>`,
    `<button class="btn" data-act="modal-kapat">Anladım</button>`);
}

function yedekYukle(dosya) {
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const v = JSON.parse(fr.result);
      if (!v.isler) throw new Error('geçersiz');
      state = { ...varsayilanVeri(), ...v, ayar: { ...varsayilanVeri().ayar, ...(v.ayar || {}) } };
      kaydet(); ciz(); toast('✔️ Yedek geri yüklendi');
    } catch (e) { toast('⚠️ Dosya okunamadı'); }
  };
  fr.readAsText(dosya);
}

/* ---------------- Bildirim (sekme açıkken) ---------------- */
function bildirimIzin() {
  if (!('Notification' in window)) { toast('⚠️ Bu tarayıcı bildirim desteklemiyor'); return; }
  Notification.requestPermission().then(s =>
    toast(s === 'granted' ? '🔔 Bildirimler açık (sekme açık kaldığı sürece)' : '⚠️ Bildirim izni verilmedi'));
}
let bildirilen = new Set();
function saatKontrol() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const simdi = new Date();
  const ss = `${String(simdi.getHours()).padStart(2, '0')}:${String(simdi.getMinutes()).padStart(2, '0')}`;
  olusumlar(bugunISO(), bugunISO()).forEach(o => {
    if (o.tamam || !o.saat || o.saat > ss || bildirilen.has(o.anahtar)) return;
    bildirilen.add(o.anahtar);
    try { new Notification('Sekreterya hatırlatma', { body: `${o.saat} — ${o.is.ad}` }); } catch (e) { }
  });
}

/* ================================================================
   OLAY YÖNETİMİ (tek yerden delege)
   ================================================================ */
document.getElementById('tabs').addEventListener('click', e => {
  const b = e.target.closest('button[data-view]'); if (b) git(b.dataset.view);
});
document.getElementById('modalKatman').addEventListener('click', e => {
  if (e.target.id === 'modalKatman') modalKapat();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') modalKapat(); });

document.body.addEventListener('change', e => {
  const k = e.target.closest('[data-act="isaretle"]');
  if (k) {
    const key = k.dataset.key;
    if (k.checked) state.yapildi[key] = { t: Date.now() }; else delete state.yapildi[key];
    kaydet();
    if (document.getElementById('modalKatman').hidden) ciz();
    else { const g = key.split('#')[1]; ciz(); gunModalAc(g); }
    return;
  }
  if (e.target.id === 'yedekDosya' && e.target.files[0]) yedekYukle(e.target.files[0]);
});

/** Serbest metni gündem maddelerine ayırır: satır başları ve "1." "2)" "-" "•" gibi işaretler temizlenir;
 *  tek satırda "1. … 2. … 3. …" yazılmışsa oradan da bölünür. */
let gundemDuzenlenen = null;   // şu an gündemi düzenlenen toplantının id'si
const ISARET = /^\s*(?:\d{1,2}\s*[.)-]|[-–—•*·>]|📌|📍|🔹|🔸|✅|➡️|→|[a-zA-ZçğıöşüÇĞİÖŞÜ][.)](?=\s))\s*/u;
/** Metni yapıya çevirir: işaretli satır = madde, işaretsiz satır (madde satırlarının arasında) = başlık. */
function gundemYapisi(metin) {
  let satirlar = String(metin || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (satirlar.length === 1) satirlar = satirlar[0].split(/\s+(?=\d{1,2}\s*[.)-]\s+)/);   // "1. a 2. b" → ["1. a", "2. b"]
  const isaretliVar = satirlar.some(x => ISARET.test(x));
  return satirlar.map(x => {
    const isaretli = ISARET.test(x);
    const temiz = x.replace(ISARET, '').replace(/^[\p{Extended_Pictographic}\uFE0F\s]+/u, '').trim();
    // Hepsi işaretsizse her satır madde; işaretliler varsa işaretsizler başlık sayılır.
    return { tip: isaretliVar && !isaretli ? 'baslik' : 'madde', metin: temiz };
  }).filter(x => x.metin);
}
function gundemMaddeleri(metin) { return gundemYapisi(metin).filter(x => x.tip === 'madde').map(x => x.metin); }
/** Gündem metni yapıştırıldığı gibi gösterilir: numara eklenmez, satırlar korunur. Üzerine dokununca düzenlenir. */
function gundemMetniHTML(t) {
  const m = (t.gundemMetin ?? (t.gundem || []).join('\n')).trim();
  return `<div class="gundem-metin" data-act="gundem-duzenle" data-id="${t.id}" title="Düzenlemek için dokun">${m ? kacik(m) : '<span class="ipucu">Gündem metnini yapıştırmak için dokun…</span>'}</div>`;
}

// Mazeret satırında Enter → ekle
document.body.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.closest('[data-enter-act="sifre-kaydet"]')) { e.preventDefault(); document.querySelector('[data-act="sifre-kaydet"]')?.click(); return; }
  const k = e.target.closest('[data-enter-act="mazeret-ekle"]') || (e.target.id?.startsWith('mz_ad_') ? e.target : null);
  if (!k) return;
  e.preventDefault();
  mazeretEkle(k.dataset.id || k.id.replace('mz_ad_', ''));
});

document.body.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const { act, id } = b.dataset;
  switch (act) {
    case 'git': git(b.dataset.view); break;
    case 'modal-kapat': modalKapat(); break;

    case 'ay': takvimAy += Number(b.dataset.yon);
      if (takvimAy < 0) { takvimAy = 11; takvimYil--; } if (takvimAy > 11) { takvimAy = 0; takvimYil++; } ciz(); break;
    case 'ay-bugun': takvimAy = new Date().getMonth(); takvimYil = new Date().getFullYear(); ciz(); break;
    case 'gun-ac': gunModalAc(b.dataset.date); break;

    case 'hizli-is': hizliIsAc(b.dataset.date); break;

    case 'is-duzenle': isFormuAc(id); break;
    case 'is-kaydet': isKaydet(id); break;
    case 'is-arsiv': {
      const i = state.isler.find(x => x.id === id); if (!i) return;
      i.arsiv = !i.arsiv; kaydet(); ciz(); toast(i.arsiv ? '🗄️ Arşivlendi' : '↩️ Geri alındı'); break;
    }
    case 'surekli-yapildi': state.surekli[id] = bugunISO(); kaydet(); ciz(); toast('✔️ İşaretlendi'); break;

    case 'toplanti-duzenle': toplantiFormuAc(id); break;
    case 'toplanti-kaydet': toplantiKaydet(id); break;
    case 'toplanti-sil':
      if (confirm('Bu toplantı kaydı silinsin mi? Buna bağlı işler de listeden kalkar.')) {
        state.toplantilar = state.toplantilar.filter(x => x.id !== id);
        kaydet(); modalKapat(); ciz(); toast('🗑️ Silindi');
      } break;
    case 'toplanti-ac': git('toplanti'); break;
    case 'donem-olustur': donemOlusturAc(); break;
    case 'gun-kaydet': kaydet(); modalKapat(); ciz(); toast('✔️ Kaydedildi'); break;
    case 'donem-kaydet': donemKaydet(); break;
    case 'mazeret-kopya': {
      const m = mazeretMetni(id);
      if (m) kopyala(m); else toast('⚠️ Önce Mazeretler alanına yaz');
      break;
    }
    case 'gundem-yazdir': gundemYazdir(id); break;
    case 'tutanak-yok':
      toast('⚠️ Önceki toplantının tutanak linki girilmemiş — o toplantıda Düzenle ile ekle');
      break;

    case 'link-duzenle': linkFormuAc(id); break;
    case 'link-kaydet': {
      const ad = document.getElementById('l_ad').value.trim();
      if (!ad) { toast('⚠️ Ad boş olamaz'); return; }
      const kayit = { ad, url: document.getElementById('l_url').value.trim(), ikon: document.getElementById('l_ikon').value.trim() || '📁' };
      const i = state.linkler.findIndex(x => x.id === id);
      if (i >= 0) state.linkler[i] = { ...state.linkler[i], ...kayit }; else state.linkler.push({ id: yeniId(), ...kayit });
      kaydet(); modalKapat(); ciz(); toast('✔️ Kaydedildi'); break;
    }
    case 'link-sil':
      if (confirm('Bağlantı silinsin mi?')) {
        state.linkler = state.linkler.filter(x => x.id !== id);
        kaydet(); modalKapat(); ciz();
      } break;

    case 'ayar-kaydet':
      state.ayar.birim = document.getElementById('a_birim').value.trim() || 'Üniversite Birimi';
      state.ayar.toplantiGunu = Number(document.getElementById('a_gun').value);
      state.ayar.toplantiSaat = document.getElementById('a_saat').value;
      state.ayar.toplantiYer = document.getElementById('a_yer').value.trim();
      gmAdlariniGuncelle(state);
      kaydet(); ciz(); toast('✔️ Ayarlar kaydedildi'); break;
    case 'yedek-indir': yedekIndir(); break;
    case 'kurtarma-indir': kurtarmaIndir(); break;
    case 'kurtarma-sil': if (confirm('Eski veri kalıcı olarak silinecek. Emin misin?')) { localStorage.removeItem(KURTARMA_ANAHTAR); veriHatasi = ''; ciz(); } break;
    case 'takvime-aktar': takvimeAktar(); break;
    case 'mazeret-ekle': mazeretEkle(id); break;
    case 'sifre-kaydet': {
      const v = document.getElementById('p_sifre').value.trim(); if (!v) { toast('⚠️ Şifre boş'); break; }
      localStorage.setItem(SIFRE_ANAHTAR, v); sifreSoruluyor = false; modalKapat(true); sonUzakDamga = '';
      sunucudanCek(true).then(() => { if (!sifreSoruluyor) toast('🔗 Ortak kayda bağlandı'); }); break;
    }
    case 'gundem-duzenle': gundemDuzenlenen = id; ciz(); setTimeout(() => document.getElementById('gundem_metin_' + id)?.focus(), 30); break;
    case 'gundem-vazgec': gundemDuzenlenen = null; ciz(); break;
    case 'gundem-kaydet': {
      const t = state.toplantilar.find(x => x.id === id); if (!t) break;
      t.gundemMetin = document.getElementById('gundem_metin_' + id).value;
      t.gundem = gundemMaddeleri(t.gundemMetin);
      gundemDuzenlenen = null; kaydet(); ciz(); toast(`✔️ ${t.gundem.length} gündem maddesi kaydedildi`); break;
    }
    case 'mazeret-sil': {
      const t = state.toplantilar.find(x => x.id === id); if (!t) break;
      const [m] = t.mazeretListe.splice(Number(b.dataset.i), 1);
      if (m) { t.mazeretSilinen = t.mazeretSilinen || {}; t.mazeretSilinen[m.ad.toLocaleLowerCase('tr')] = Date.now(); }
      kaydet(); ciz(); break;
    }
    case 'uyeler-kaydet': {
      const l = document.getElementById('a_uyeler').value.split('\n').map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean);
      state.uyeler = [...new Set(l)]; kaydet(); ciz(); toast(`✔️ ${state.uyeler.length} üye kaydedildi`); break;
    }
    case 'tek-is-takvim': tekIsiTakvimeAktar(id); modalKapat(); break;
    case 'takvim-teklifi-kapat': state.ayar.takvimTeklifiKapali = true; kaydet(); modalKapat(); toast('Tamam — istersen Ayarlar › Takvime aktar ile toplu eklersin'); break;
    case 'yedek-yukle': document.getElementById('yedekDosya').click(); break;
    case 'sifirla':
      if (confirm('TÜM veriler silinip başlangıç haline dönülecek. Emin misin?') &&
        confirm('Son kez soruyorum: yedek aldın mı? Bu işlem geri alınamaz.')) {
        state = varsayilanVeri(); kaydet(); git('bugun'); toast('Sıfırlandı');
      } break;
  }
});

document.getElementById('bildirimAc').addEventListener('click', bildirimIzin);

/* ---------------- Başlat ---------------- */
oncekiSnapshot = snapshotAl();        // değişiklik takibi için ilk fotoğraf
donemToplantilariniTamamla();       // toplantı yoksa dönem Salı'larını aç
ciz();
if (depoVar) kaydet();   // göç sonucunu hemen sabitle
setInterval(saatKontrol, 60000);
saatKontrol();
sunucudanCek(true);
setInterval(() => sunucudanCek(false), 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) sunucudanCek(false); });
