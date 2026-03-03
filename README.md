# Notefolio - Portföy Fişi

Notefolio, Borsa İstanbul (BIST) hisselerinizi, maliyetlerinizi ve anlık kâr/zarar durumunuzu "Yazar Kasa Fişi" (Receipt) konseptinde, minimalist ve şık bir arayüzle takip etmenizi sağlayan bir web uygulamasıdır. 

Uygulama **Progressive Web App (PWA)** standartlarına uygun olarak geliştirilmiştir, bu sayede iOS ve Android cihazlarınıza yerel bir uygulama gibi yükleyebilirsiniz.

## Özellikler ✨

- **Fiş Tasarımı:** Klasik finans uygulamalarının karmaşasından uzak, sadece ihtiyacınız olan verileri gösteren monospaced fontlu estetik kasa fişi tasarımı.
- **Canlı Fiyat Takibi:** Google E-Tablolar (Google Sheets) üzerinden güncel borsa verilerini Eşzamanlı Yarış (Promise.any) mantığıyla 3 farklı vekil sunucudan (proxy) en hızlı şekilde çeker. (Veriler 15dk gecikmelidir.)
- **Çoklu Portföy Yönetimi:** Birden fazla portföy oluşturup hisselerinizi ve nakit durumunuzu ayrı ayrı yönetebilirsiniz.
- **Nakit Yönetimi:** Portföyünüze nakit ekleyebilir, çıkarabilir ve hisse satışlarından elde ettiğiniz geliri otomatik olarak nakit bakiyenize ekleyebilirsiniz.
- **Görsel Performans Grafiği (Chart.js):** Sahip olduğunuz hisselerin kâr/zarar durumlarını, Karanlık Mod uyumlu ve yirmi farklı renkten oluşan bir paletle çubuk grafikte görebilirsiniz.
- **Veri Güvenliği (LocalStorage):** Uygulama verilerinizi hiçbir sunucuya göndermeden, tamamen tarayıcınızın veya telefonunuzun kendi yerel hafızasında saklar.
- **Yedekleme (İçe/Dışa Aktar):** Tek tıkla tüm portföy verilerinizi JSON dosyası olarak indirip yedekleyebilir veya başka bir cihaza aktarabilirsiniz.

## Kurulum ve Kullanım 📱

Notefolio statik bir web uygulamasıdır ve herhangi bir arka plan sunucusuna (Node.js, Python vb.) ihtiyaç durmaz.

### iOS Ana Ekrana Ekleme (PWA):
1. Yayınladığınız sitenin bağlantısını (URL) iPhone'unuzda **Safari** üzerinden açın.
2. Safari'nin alt menüsündeki "Paylaş" (kare içinden çıkan ok) ikonuna dokunun.
3. Çıkan menüde **"Ana Ekrana Ekle"** seçeneğini seçin.
4. Artık Notefolio, adres çubuğu olmadan tam ekran ve hızlı bir şekilde ana ekranınızdan çalışacaktır.

### Geliştirme Ortamı (Lokal):
Projenin çalıştığı klasörde herhangi bir lokal sunucu (Live Server) başlatarak test edebilirsiniz. 

## Teknolojiler 🛠️

- **HTML5 & Vanilla CSS:** Çerçeve (framework) kullanılmadan, CSS değişkenleri ve `calc()`, `env(safe-area-inset)` gibi modern fonksiyonlarla hazırlanan tam ekran mobil uyumlu tasarım.
- **Vanilla JavaScript:** Hızlı, bağımlılıksız (dependency-free) mantık mimarisi.
- **Chart.js:** Performans grafikleri için.
- **PWA (Manifest & Service Worker):** Kurulabilirlik, offline önbellekleme yetenekleri.

## Güncelleme Notları
- **v15 (Current):** Kullanıcı renk tercihleri (`#0d0d0d` karanlık mod), PWA stabilite yamaları, Eşzamanlı Proxy (Promise.any) hızlandırması ve Desktop'ta invert-mode yan boşluk düzeltmeleri.

## Yasal Uyarı
Bu uygulama tamamen kişisel portföy takibi ve eğitim amaçlıdır. Uygulama içerisindeki fiyat verileri gecikmeli olabilir ve hiçbir şekilde yatırım tavsiyesi niteliği taşımaz. İşlem yapmadan önce aracı kurumunuzun gerçek zamanlı verilerini teyit ediniz.
