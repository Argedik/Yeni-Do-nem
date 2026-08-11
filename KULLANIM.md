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
3. **Liste** → *+ Kişi ekle* ile hanımları gir (ad, görev, telefon).
4. **Drive** → her kutuya ilgili klasör/dosya linkini yapıştır (Drive'da klasöre gir, adres çubuğundaki adresi kopyala).
5. **Bugün** → bundan sonra her gün buradan başla.

## Mantık
- **Toplantıya bağlı** işler her toplantı tarihine göre kendiliğinden oluşur; her hafta elle yazmıyorsun.
  - Toplantıdan 1 gün önce → gündem çıktısı
  - Toplantı günü 12:00 → GM grubuna hatırlatma
  - Toplantı günü 17:00 → mazeret listesi
  - Toplantıdan 1 gün sonra → tutanak + yoklama güncelleme
- **Aylık** işler ayın belirli gününde çıkar (ana birim hatırlatması ayın 21'i, rapor teslimi 28'i).
- **Sürekli takip** işleri tarihsizdir (görev değişikliği / yeni katılımda liste güncelleme gibi).

## Günlük akış
- Sabah **Bugün** sekmesini aç → geciken + bugünkü işleri gör.
- İşi yapınca soldaki kutuyu işaretle.
- İşin yanındaki **📁 Drive** butonu ilgili klasörü doğrudan açar.
- **Şablonlar** → mesajı *Kopyala* → WhatsApp'a yapıştır (tarih/saat/yer otomatik dolar).
- Toplantı akşamı **Toplantılar** → katılımı işaretle → *Mazeret listesi* ile hazır metni kopyala.
- Toplantı öncesi **Gündem çıktısı** → yazıcıya/PDF'e gönderir (3 madde + imza satırı).

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
- `app.js` — tüm mantık (tekrar motoru, toplantı/liste/şablon)
