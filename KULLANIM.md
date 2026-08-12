# Sekreterya Paneli — Kullanım

## Nasıl açılır
**`Paneli-Ac.command`** dosyasına çift tıkla — paneli doğru tarayıcıda açar.
(`index.html`e çift tıklamak işe yaramayabilir: bilgisayarda `.html` dosyaları VS Code ile açılacak
şekilde ayarlıysa site değil kod görünür.)

Tarayıcıda açıkken **Cmd+D** ile yer imlerine ekle — sonraki günler tek tıkla açılır.

### Başka bir bilgisayara / Windows PC'ye taşıma
Sadece **`Sekreterya.html`** dosyasını kopyala (USB, Drive, WhatsApp Web — nasıl olursa).
Tek başına çalışır, yanına başka dosya gerekmez. Windows'ta çift tıkla; Chrome/Edge ile açılır.
⚠️ Her bilgisayarın verisi ayrıdır. Taşımak için: eski bilgisayarda **Ayarlar → Yedek indir**,
yeni bilgisayarda **Ayarlar → Yedekten geri yükle**.

### Safari uyarısı
Safari, dosyadan açılan sayfaya kayıt izni vermez; panel açılır ama veriler kaybolur.
Chrome veya Brave kullan (`Paneli-Ac.command` bunu zaten kendisi seçer).

### Kodu değiştirirsem
`app.js`/`styles.css` değişince **`tek-dosya-olustur.command`**'a çift tıkla —
`Sekreterya.html` yeniden üretilir.

## İlk 10 dakika (sırayla yap)
1. **Ayarlar** → birim adı, olağan toplantı günü, saat, yer → Kaydet.
2. **Toplantılar** → *Dönem toplantılarını oluştur* → dönem başı/sonu tarihini ver → tüm haftalar tek seferde eklenir.
3. **Drive** → her kutuya ilgili klasör/dosya linkini yapıştır (Drive'da klasöre gir, adres çubuğundaki adresi kopyala). Üye listesi Drive'da tutulur, panelde ayrı liste yok.
4. **Bugün** → bundan sonra her gün buradan başla.

## Mantık
- **Toplantıya bağlı** işler her toplantı tarihine göre kendiliğinden oluşur; her hafta elle yazmıyorsun.
  Bir iş birden fazla güne düşebilir: Düzenle → kaydırma alanına `-1, 0` yazarsan hem bir gün önce
  hem toplantı günü listeye gelir (her gün ayrı ayrı işaretlenir).
  - Toplantı günü → 3 adet gündem çıktısı + 1 adet son tutanak çıktısı
  - Toplantıdan 1 gün önce **ve** toplantı günü, 12:00 → GM grubuna hatırlatma (iki gün de çıkar)
  - Toplantıdan 1 gün sonra → tutanak + yoklama güncelleme + **yeni katılan hanımlar listeye eklendi mi kontrolü**
- **Aylık** işler ayın belirli gününde çıkar (ana birim hatırlatması ayın 21'i, rapor teslimi 28'i).
- **Sürekli takip** işleri tarihsizdir (genel merkez görev değişikliğinde liste düzenleme gibi).

## Günlük akış
- Sabah **Bugün** sekmesini aç → geciken + bugünkü işleri gör.
- İşi yapınca soldaki kutuyu işaretle.
- İşin yanındaki **📁 Drive** butonu ilgili klasörü doğrudan açar.
- Toplantı günü **Toplantılar** → kartın **Mazeretler** alanına her satıra bir kişi yaz → **📋 Mazeret listesi**
  ile tarih başlıklı hazır metni kopyala, gruba yapıştır.
- Toplantı öncesi **Gündem çıktısı** → yazıcıya/PDF'e gönderir (3 madde + imza satırı).
- Yanındaki **📝 Son tutanak** → bir önceki toplantının tutanak dosyasını açar; oradan 1 adet
  yazdırırsın. Buton çalışsın diye o toplantının kartında **Düzenle → Tutanak dosya linki**
  dolu olmalı.

## Önemli: yedek
Veriler **yalnızca bu tarayıcıda** durur. Tarayıcı verisi/geçmişi silinirse kaybolur.
Ayda bir: **Ayarlar → Yedek indir** → inen `.json` dosyasını Drive'a at.
Yeni bilgisayarda: **Ayarlar → Yedekten geri yükle**.

## Bildirimler
🔔 Bildirim butonu, tarayıcı sekmesi **açık kaldığı sürece** saati gelen işi bildirir.
Telefon/kapalı bilgisayar hatırlatması için işleri Google Takvim'e de yaz (aşağıdaki fikirlere bak).

## Dosyalar
- `index.html` — sayfa iskeleti
- `styles.css` — görünüm
- `app.js` — tüm mantık (tekrar motoru, toplantı yönetimi, Drive kısayolları, yedekleme)
