# Sekreterya Paneli

TÜGVA üniversite birimi sekreteryasının yıl boyu kullanabileceği iş takip paneli.
Kurulum, sunucu, hesap gerektirmez — tarayıcıda açılır, veriler o tarayıcıda saklanır.

## Ne yapar
- **Rutin işleri kendisi üretir.** Toplantı tarihlerini bir kez girersin; hatırlatma mesajı,
  gündem çıktısı, mazeret listesi, tutanak ve yoklama işleri her toplantı için otomatik oluşur.
- **Aylık işleri hatırlatır.** Ana birime rapor hatırlatması ve rapor teslimi ayın belirli gününde düşer.
- **Toplantı yönetimi.** 3 gündem maddesi, yazdırılabilir gündem çıktısı, kişi bazlı katılım/mazeret
  takibi ve tek tuşla kopyalanan mazeret listesi.
- **Güncel liste.** Üye kadrosu, görev değişikliği ve yeni katılımların otomatik değişiklik günlüğü.
- **Hazır mesajlar.** Tarih/saat/yer bilgisi otomatik dolan WhatsApp şablonları.
- **Drive kısayolları.** Klasör linklerini bir kez yapıştırırsın; ilgili işin yanındaki buton
  doğrudan o dosyayı açar.

## Kullanım
Ayrıntılı anlatım: [KULLANIM.md](KULLANIM.md)

- `Paneli-Ac.command` → paneli uygun tarayıcıda açar (macOS)
- `Sekreterya.html` → tek dosyalık taşınabilir sürüm (Windows dahil her yerde çift tıkla çalışır)
- `tek-dosya-olustur.command` → kaynak dosyalar değişince `Sekreterya.html`'i yeniden üretir

## Dosyalar
| Dosya | İşlevi |
|---|---|
| `index.html` | Sayfa iskeleti |
| `styles.css` | Görünüm |
| `app.js` | Tüm mantık: tekrar motoru, toplantı/liste/şablon yönetimi, yedekleme |
| `Sekreterya.html` | Yukarıdaki üçünün tek dosyada birleştirilmiş hali (üretilen dosya) |

## Teknik
Bağımlılık yok: düz HTML + CSS + JavaScript. Veri `localStorage`'da tutulur,
JSON olarak yedeklenip geri yüklenebilir. Safari `file://` üzerinden kayıt izni vermediği için
Chrome veya Brave önerilir.

## Uyarı
Panelden indirilen yedek dosyaları isim ve telefon içerir; bu depo herkese açık olduğu için
yedekler `.gitignore` ile dışarıda tutulmuştur.
