/* =========================================================
   Sekreterya Paneli — TÜGVA Üniversite Birimi
   Tek dosyalık uygulama mantığı. Veri: localStorage.
   ========================================================= */

const ANAHTAR = 'sekreterya_v1';
const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
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
      birim: 'TÜGVA Üniversite Birimi',
      toplantiGunu: 3,          // 0=Pazar ... 3=Çarşamba
      toplantiSaat: '19:00',
      toplantiYer: '',
      baslangic: bugunISO(),    // bu tarihten öncesi "geciken" sayılmaz
    },
    isler: [
      { id: yeniId(), ad: 'Toplantı hatırlatma mesajını GM grubuna ilet', kategori: 'İletişim', tip: 'toplanti', ofset: 0, saat: '12:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Katılım mazeretlerini liste halinde ilet', kategori: 'İletişim', tip: 'toplanti', ofset: 0, saat: '17:00', aciklama: 'Toplantı kartındaki Mazeretler alanına yaz → "Mazeret listesi" ile kopyala.', link: '' },
      { id: yeniId(), ad: '3 adet gündem maddesi çıktısı al', kategori: 'Toplantı', tip: 'toplanti', ofset: -1, saat: '20:00', aciklama: 'Toplantı kartındaki "Gündem çıktısı" butonu ile yazdır.', link: '' },
      { id: yeniId(), ad: 'Tutanağı hazırla ve Drive dosyasına ekle', kategori: 'Arşiv', tip: 'toplanti', ofset: 1, saat: '21:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Yoklamayı Drive dosyasında güncelle', kategori: 'Arşiv', tip: 'toplanti', ofset: 1, saat: '21:30', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Ana birime aylık rapor hatırlatması yap', kategori: 'Rapor', tip: 'aylik', ayGunu: 21, saat: '10:00', aciklama: 'Rapor tesliminden 1 hafta önce ana birimi uyar.', link: '' },
      { id: yeniId(), ad: 'Aylık raporu sunum haline getir ve ana birime gönder', kategori: 'Rapor', tip: 'aylik', ayGunu: 28, saat: '18:00', aciklama: '', link: '' },
      { id: yeniId(), ad: 'Ekibe yeni katılan hanımlar listeye eklendi mi? — kontrol et', kategori: 'Liste', tip: 'toplanti', ofset: 1, saat: '21:45', aciklama: 'Drive\'daki güncel listeyi aç, toplantıya yeni gelen hanımları ekle.', link: '' },
      { id: yeniId(), ad: 'Genel merkez görev değişikliğinde güncel listeyi düzenle', kategori: 'Liste', tip: 'surekli', aciklama: 'Görev değişikliği veya ayrılma olduğunda Drive\'daki listeyi güncelle.', link: '' },
    ],
    toplantilar: [],
    linkler: [
      { id: yeniId(), ad: 'Tutanaklar', ikon: '📝', url: '' },
      { id: yeniId(), ad: 'Yoklama Dosyası', ikon: '✅', url: '' },
      { id: yeniId(), ad: 'Aylık Raporlar', ikon: '📊', url: '' },
      { id: yeniId(), ad: 'Güncel Üye Listesi', ikon: '👥', url: '' },
      { id: yeniId(), ad: 'Gündem Arşivi', ikon: '📁', url: '' },
    ],
    yapildi: {},   // "isId#YYYY-MM-DD" -> {t: zaman}
    surekli: {},   // isId -> son yapıldı ISO
    surum: 2,      // veri şeması sürümü (göç için)
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
    console.warn('Veri okunamadı, sıfırdan başlanıyor.', e);
    return varsayilanVeri();
  }
}
function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(state)); }
  catch (e) { toast('⚠️ Kaydedilemedi: depolama dolu olabilir'); }
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
  // Toplantıya bağlı işler
  for (const is of aktifIsler.filter(i => i.tip === 'toplanti')) {
    for (const t of state.toplantilar) {
      const g = gunEkle(t.tarih, Number(is.ofset) || 0);
      if (gunFarki(baslaISO, g) >= 0 && gunFarki(g, bitISO) >= 0) out.push(olusumYap(is, g, t.id));
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

function tekrarMetni(is) {
  switch (is.tip) {
    case 'haftalik': return `Her ${GUN_ADLARI[Number(is.gun)]}`;
    case 'aylik': return `Her ayın ${is.ayGunu}. günü`;
    case 'tekseferlik': return `Tek seferlik — ${kisaTarih(is.tarih)}`;
    case 'surekli': return 'Sürekli takip (tarihsiz)';
    case 'toplanti': {
      const o = Number(is.ofset) || 0;
      if (o === 0) return 'Toplantı günü';
      return o < 0 ? `Toplantıdan ${-o} gün önce` : `Toplantıdan ${o} gün sonra`;
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
function modalAc(baslik, icHTML, altHTML) {
  document.getElementById('modal').innerHTML = `
    <div class="m-bas"><h3>${baslik}</h3><button class="kapat" data-act="modal-kapat">×</button></div>
    <div class="m-ic">${icHTML}</div>
    <div class="m-alt">${altHTML || '<button class="btn gri" data-act="modal-kapat">Kapat</button>'}</div>`;
  document.getElementById('modalKatman').hidden = false;
}
function modalKapat() { document.getElementById('modalKatman').hidden = true; }
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
let aktifGorunum = 'bugun';
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
function git(v) { aktifGorunum = v; window.scrollTo(0, 0); ciz(); }

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
  const hafta = hepsi.filter(o => o.tarih > bg && gunFarki(bg, o.tarih) <= 7);
  const sonra = hepsi.filter(o => gunFarki(bg, o.tarih) > 7 && gunFarki(bg, o.tarih) <= 30);
  const bugunTamam = bugunler.filter(o => o.tamam).length;

  const yaklasanToplanti = state.toplantilar.filter(t => t.tarih >= bg).sort((a, b) => a.tarih.localeCompare(b.tarih))[0];

  let serit = '';
  if (!state.toplantilar.length) {
    serit = `<div class="serit uyari">⚠️ <div>Henüz toplantı tarihi girilmemiş. Toplantıya bağlı işler (hatırlatma, gündem, tutanak, yoklama) ancak toplantı tarihleri girilince listede çıkar.
      <br><button class="btn sm" style="margin-top:8px" data-act="git" data-view="toplanti">Toplantıları oluştur →</button></div></div>`;
  } else if (yaklasanToplanti) {
    const f = gunFarki(bg, yaklasanToplanti.tarih);
    serit = `<div class="serit bilgi">🪑 <div><b>Sıradaki toplantı:</b> ${uzunTarih(yaklasanToplanti.tarih)} — ${kacik(yaklasanToplanti.saat || state.ayar.toplantiSaat)}
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
    <div class="ozet hafta"><div class="buyuk">${hafta.length}</div><div class="etiket-alt">7 gün içinde</div></div>
    <div class="ozet tamam"><div class="buyuk">${bugunTamam}</div><div class="etiket-alt">Bugün biten</div></div>
  </div>

  ${gecen.length ? kartIsler('⏰ Geciken işler', gecen, 'gecmis') : ''}
  ${kartIsler('📋 Bugün yapılacaklar', bugunler, '', `<button class="btn sm" data-act="hizli-is">+ Tek seferlik iş</button>`)}
  ${kartIsler('🔜 Önümüzdeki 7 gün', hafta)}
  ${surekliKart()}
  ${sonra.length ? kartIsler('📅 Bu ay içinde (8–30 gün)', sonra) : ''}
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
      ${list.length ? `<div class="mini">${kacik(list[0].is.ad.slice(0, 22))}${list.length > 1 ? `<br>+${list.length - 1} iş` : ''}</div>` : ''}
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
    `<button class="btn gri" data-act="modal-kapat">Kapat</button>
     <button class="btn" data-act="hizli-is" data-date="${tarih}">+ Bu güne iş ekle</button>`);
}

/* ================================================================
   GÖRÜNÜM: RUTİN İŞLER
   ================================================================ */
function gorunumRutin() {
  const aktif = state.isler.filter(i => !i.arsiv);
  const arsiv = state.isler.filter(i => i.arsiv);
  const satir = (is) => `<tr>
    <td><b>${kacik(is.ad)}</b>${is.aciklama ? `<div class="ipucu">${kacik(is.aciklama)}</div>` : ''}</td>
    <td><span class="etiket ${is.kategori}">${is.kategori}</span></td>
    <td>${tekrarMetni(is)}</td>
    <td>${is.saat || '—'}</td>
    <td class="sag">
      <button class="btn sm gri" data-act="is-duzenle" data-id="${is.id}">Düzenle</button>
      <button class="btn sm ${is.arsiv ? '' : 'gri'}" data-act="is-arsiv" data-id="${is.id}">${is.arsiv ? 'Geri al' : 'Arşivle'}</button>
    </td></tr>`;

  return `
  <div class="serit bilgi">💡 <div><b>Toplantıya bağlı</b> işler, Toplantılar sekmesindeki her toplantı tarihine göre otomatik oluşur — her hafta elle yazmana gerek yok.</div></div>
  <div class="kart">
    <div class="kart-bas"><h2>🔁 Rutin işler <span class="sayi">${aktif.length}</span></h2>
      <button class="btn sm" data-act="is-duzenle" data-id="">+ Yeni iş</button></div>
    <div class="kart-ic sifir">
      <table><thead><tr><th>İş</th><th>Kategori</th><th>Tekrar</th><th>Saat</th><th class="sag">İşlem</th></tr></thead>
      <tbody>${aktif.map(satir).join('') || `<tr><td colspan="5"><div class="bos">Henüz iş yok.</div></td></tr>`}</tbody></table>
    </div></div>
  ${arsiv.length ? `<div class="kart"><div class="kart-bas"><h2>🗄️ Arşivlenmiş <span class="sayi">${arsiv.length}</span></h2></div>
    <div class="kart-ic sifir"><table><tbody>${arsiv.map(satir).join('')}</tbody></table></div></div>` : ''}`;
}

function isFormuAc(id) {
  const is = state.isler.find(i => i.id === id) || { kategori: 'Toplantı', tip: 'toplanti', ofset: 0, saat: '', ayGunu: 1, gun: 3, tarih: bugunISO() };
  const secili = (a, b) => a == b ? 'selected' : '';
  modalAc(id ? 'İşi düzenle' : 'Yeni iş', `
    <div class="form-satir"><div class="alan"><label>İş adı</label>
      <input type="text" id="f_ad" value="${kacik(is.ad || '')}" placeholder="Örn: Tutanağı Drive'a ekle"></div></div>
    <div class="form-satir">
      <div class="alan"><label>Kategori</label><select id="f_kat">
        ${KATEGORILER.map(k => `<option ${secili(k, is.kategori)}>${k}</option>`).join('')}</select></div>
      <div class="alan"><label>Saat (isteğe bağlı)</label><input type="time" id="f_saat" value="${kacik(is.saat || '')}"></div>
    </div>
    <div class="form-satir"><div class="alan"><label>Ne zaman tekrarlanacak?</label><select id="f_tip">
      <option value="toplanti" ${secili('toplanti', is.tip)}>Toplantıya bağlı (her toplantıda)</option>
      <option value="haftalik" ${secili('haftalik', is.tip)}>Her hafta belirli gün</option>
      <option value="aylik" ${secili('aylik', is.tip)}>Her ay belirli gün</option>
      <option value="tekseferlik" ${secili('tekseferlik', is.tip)}>Tek seferlik tarih</option>
      <option value="surekli" ${secili('surekli', is.tip)}>Sürekli takip (tarihsiz)</option>
    </select></div></div>
    <div class="form-satir" id="f_detay"></div>
    <div class="form-satir"><div class="alan"><label>Açıklama / not</label>
      <input type="text" id="f_aciklama" value="${kacik(is.aciklama || '')}" placeholder="Kısa hatırlatma notu"></div></div>
    <div class="form-satir"><div class="alan"><label>Drive linki (boş bırakırsan kategoriye göre otomatik)</label>
      <input type="url" id="f_link" value="${kacik(is.link || '')}" placeholder="https://drive.google.com/..."></div></div>`,
    `<button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="is-kaydet" data-id="${id || ''}">Kaydet</button>`);

  const detayCiz = () => {
    const tip = document.getElementById('f_tip').value;
    const d = document.getElementById('f_detay');
    if (tip === 'toplanti') d.innerHTML = `<div class="alan"><label>Toplantıya göre kaydırma (gün)</label>
      <input type="number" id="f_ofset" value="${is.ofset ?? 0}" step="1">
      <span class="ipucu">-1 = bir gün önce · 0 = toplantı günü · 1 = bir gün sonra</span></div>`;
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
  if (tip === 'toplanti') kayit.ofset = Number(al('f_ofset')) || 0;
  if (tip === 'haftalik') kayit.gun = Number(al('f_gun'));
  if (tip === 'aylik') kayit.ayGunu = Math.min(31, Math.max(1, Number(al('f_ayGunu')) || 1));
  if (tip === 'tekseferlik') kayit.tarih = al('f_tarih') || bugunISO();

  const i = state.isler.findIndex(x => x.id === id);
  if (i >= 0) state.isler[i] = { ...state.isler[i], ...kayit }; else state.isler.push(kayit);
  kaydet(); modalKapat(); ciz(); toast('✔️ Kaydedildi');
}

function hizliIsAc(tarih) {
  modalAc('Tek seferlik iş ekle', `
    <div class="form-satir"><div class="alan"><label>Ne yapılacak?</label>
      <input type="text" id="h_ad" placeholder="Örn: Afiş tasarımını onaya gönder"></div></div>
    <div class="form-satir">
      <div class="alan"><label>Tarih</label><input type="date" id="h_tarih" value="${tarih || bugunISO()}"></div>
      <div class="alan"><label>Saat</label><input type="time" id="h_saat"></div>
      <div class="alan"><label>Kategori</label><select id="h_kat">${KATEGORILER.map(k => `<option>${k}</option>`).join('')}</select></div>
    </div>`,
    `<button class="btn gri" data-act="modal-kapat">Vazgeç</button>
     <button class="btn" data-act="hizli-kaydet">Ekle</button>`);
  setTimeout(() => document.getElementById('h_ad')?.focus(), 50);
}

/* ================================================================
   GÖRÜNÜM: TOPLANTILAR
   ================================================================ */
function gorunumToplanti() {
  const bg = bugunISO();
  const sirali = [...state.toplantilar].sort((a, b) => b.tarih.localeCompare(a.tarih));
  const gelecek = sirali.filter(t => t.tarih >= bg).reverse();
  const gecmis = sirali.filter(t => t.tarih < bg);

  return `
  <div class="kart"><div class="kart-bas">
      <h2>🪑 Toplantılar <span class="sayi">${state.toplantilar.length}</span></h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn sm gri" data-act="donem-olustur">📅 Dönem toplantılarını oluştur</button>
        <button class="btn sm" data-act="toplanti-duzenle" data-id="">+ Toplantı ekle</button>
      </div></div>
    <div class="kart-ic">
      <p class="ipucu">Toplantı tarihlerini girdiğinde; hatırlatma mesajı, gündem çıktısı, mazeret listesi, tutanak ve yoklama işleri <b>otomatik olarak</b> Bugün sekmesine düşer.</p>
    </div></div>

  <div class="bolum-baslik">Yaklaşan (${gelecek.length})</div>
  ${gelecek.length ? gelecek.map(toplantiKarti).join('') : `<div class="kart"><div class="bos">Yaklaşan toplantı yok. <b>Dönem toplantılarını oluştur</b> ile tek seferde ekleyebilirsin.</div></div>`}

  ${gecmis.length ? `<div class="bolum-baslik">Geçmiş (${gecmis.length})</div>${gecmis.slice(0, 20).map(toplantiKarti).join('')}` : ''}`;
}

function toplantiKarti(t) {
  const gundem = (t.gundem || []).filter(Boolean);
  const mazeretSayisi = (t.mazeretler || '').split('\n').filter(s => s.trim()).length;
  return `<div class="kart">
    <div class="kart-bas">
      <h2>${kisaTarih(t.tarih)} · ${GUN_ADLARI[tarihNesnesi(t.tarih).getDay()]} <span class="sayi">${kacik(t.saat || state.ayar.toplantiSaat)}</span></h2>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn sm gri" data-act="gundem-yazdir" data-id="${t.id}">🖨️ Gündem çıktısı</button>
        <button class="btn sm gri" data-act="mazeret-kopya" data-id="${t.id}">📋 Mazeret listesi</button>
        <button class="btn sm gri" data-act="toplanti-duzenle" data-id="${t.id}">Düzenle</button>
      </div></div>
    <div class="kart-ic">
      ${t.yer ? `<p style="margin:0 0 10px"><b>Yer:</b> ${kacik(t.yer)}</p>` : ''}
      <div class="rozet-sira" style="margin-bottom:12px">
        <span>🟡 Mazeret bildiren <b>${mazeretSayisi}</b></span>
        ${t.katilimNot ? `<span>✅ Katılım <b>${kacik(t.katilimNot)}</b></span>` : ''}
      </div>
      <h4 style="font-size:13px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Gündem maddeleri</h4>
      ${gundem.length ? `<ol style="margin:0 0 14px;padding-left:20px">${gundem.map(g => `<li>${kacik(g)}</li>`).join('')}</ol>`
      : `<p class="ipucu" style="margin:0 0 14px">Gündem girilmemiş — Düzenle ile 3 maddeyi yaz.</p>`}
      <h4 style="font-size:13px;color:var(--soluk);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Mazeretler</h4>
      <textarea data-act-input="mazeretler" data-t="${t.id}" style="min-height:78px"
        placeholder="Her satıra bir kişi:&#10;Ayşe Y. — ders programı&#10;Zeynep K. — sınav">${kacik(t.mazeretler || '')}</textarea>
      <p class="ipucu" style="margin:5px 0 0">Yazdıkça kaydedilir. <b>📋 Mazeret listesi</b> butonu bunu tarih başlığıyla kopyalar.</p>
      <div class="form-satir" style="margin-top:14px">
        ${t.tutanakLink ? `<a class="btn sm gri" href="${kacik(t.tutanakLink)}" target="_blank" rel="noopener">📝 Tutanak dosyası</a>` : ''}
        ${driveUrl('Arşiv') ? `<a class="btn sm gri" href="${kacik(driveUrl('Arşiv'))}" target="_blank" rel="noopener">📁 Arşiv klasörü</a>` : ''}
      </div>
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
    <div class="form-satir"><div class="alan"><label>1. gündem maddesi</label><input type="text" id="t_g1" value="${kacik(g[0] || '')}"></div></div>
    <div class="form-satir"><div class="alan"><label>2. gündem maddesi</label><input type="text" id="t_g2" value="${kacik(g[1] || '')}"></div></div>
    <div class="form-satir"><div class="alan"><label>3. gündem maddesi</label><input type="text" id="t_g3" value="${kacik(g[2] || '')}"></div></div>
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
    gundem: [al('t_g1'), al('t_g2'), al('t_g3')], tutanakLink: al('t_tutanak'), notlar: al('t_notlar'),
    katilimNot: al('t_katilimNot'),
  };
  const i = state.toplantilar.findIndex(x => x.id === id);
  if (i >= 0) state.toplantilar[i] = { ...state.toplantilar[i], ...kayit };
  else state.toplantilar.push({ id: yeniId(), mazeretler: '', ...kayit });
  kaydet(); modalKapat(); ciz(); toast('✔️ Toplantı kaydedildi');
}

function donemOlusturAc() {
  const bug = new Date();
  const bit = iso(new Date(bug.getFullYear(), bug.getMonth() + 4, 0));
  modalAc('Dönem toplantılarını oluştur', `
    <p class="ipucu" style="margin-top:0">Seçtiğin gün için, iki tarih arasındaki tüm haftalara toplantı kaydı açılır. Zaten kayıtlı olan tarihler atlanır.</p>
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
    state.toplantilar.push({ id: yeniId(), tarih: g, saat, yer, gundem: ['', '', ''], mazeretler: '', katilimNot: '', notlar: '', tutanakLink: '' });
    n++;
  }
  state.ayar.toplantiGunu = gun; state.ayar.toplantiSaat = saat; state.ayar.toplantiYer = yer;
  kaydet(); modalKapat(); ciz();
  toast(n ? `✔️ ${n} toplantı oluşturuldu` : 'Yeni tarih eklenmedi (hepsi zaten kayıtlı)');
}

// Toplantı kartındaki serbest metni, gruba iletilecek biçime çevirir.
function mazeretMetni(id) {
  const t = state.toplantilar.find(x => x.id === id);
  if (!t) return '';
  const satir = (t.mazeretler || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (!satir.length) return '';
  return `📌 ${kisaTarih(t.tarih)} Toplantısı — Mazeret Bildirenler (${satir.length})\n\n`
    + satir.map((s, i) => `${i + 1}. ${s}`).join('\n')
    + (t.katilimNot ? `\n\n✅ Katılım: ${t.katilimNot}` : '');
}

function gundemYazdir(id) {
  const t = state.toplantilar.find(x => x.id === id);
  if (!t) return;
  const g = (t.gundem || []).filter(Boolean);
  if (!g.length) { toast('⚠️ Önce gündem maddelerini gir'); return; }
  yazdir(`<div class="p-ust">
      <h1>${kacik(state.ayar.birim)}</h1>
      <div>TOPLANTI GÜNDEMİ</div>
      <div>${uzunTarih(t.tarih)} · ${kacik(t.saat || state.ayar.toplantiSaat)}${t.yer ? ' · ' + kacik(t.yer) : ''}</div>
    </div>
    <ol>${g.map(x => `<li>${kacik(x)}</li>`).join('')}</ol>
    <div class="p-alt">Katılan: ............ &nbsp;&nbsp; Mazeret: ............ &nbsp;&nbsp; Sekreterya imza: ............</div>`);
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

// Mazeret metni yazıldıkça kaydet (yeniden çizmeden — imleç kaçmasın)
document.body.addEventListener('input', e => {
  const s = e.target.closest('[data-act-input="mazeretler"]'); if (!s) return;
  const t = state.toplantilar.find(x => x.id === s.dataset.t); if (!t) return;
  t.mazeretler = e.target.value; kaydet();
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
    case 'hizli-kaydet': {
      const ad = document.getElementById('h_ad').value.trim();
      if (!ad) { toast('⚠️ İş adı boş olamaz'); return; }
      state.isler.push({
        id: yeniId(), ad, kategori: document.getElementById('h_kat').value, tip: 'tekseferlik',
        tarih: document.getElementById('h_tarih').value || bugunISO(), saat: document.getElementById('h_saat').value,
        aciklama: '', link: '', arsiv: false
      });
      kaydet(); modalKapat(); ciz(); toast('✔️ İş eklendi'); break;
    }

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
    case 'donem-kaydet': donemKaydet(); break;
    case 'mazeret-kopya': {
      const m = mazeretMetni(id);
      if (m) kopyala(m); else toast('⚠️ Önce Mazeretler alanına yaz');
      break;
    }
    case 'gundem-yazdir': gundemYazdir(id); break;

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
      kaydet(); ciz(); toast('✔️ Ayarlar kaydedildi'); break;
    case 'yedek-indir': yedekIndir(); break;
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
ciz();
if (depoVar) kaydet();   // göç sonucunu hemen sabitle
setInterval(saatKontrol, 60000);
saatKontrol();
