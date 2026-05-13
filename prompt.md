# 🚀 GarageLedger - Geliştirme ve Görev Takip Dosyası (prompt.md)

**Yapay Zeka Asistanı İçin Sistem Talimatı:**
Bu dosya projenin ana yol haritasıdır. Lütfen bu dosyayı ASLA silme veya yapısını bozma. Aşağıdaki görevleri sırasıyla yerine getir. Her bir alt görevi tamamladığında, ilgili maddenin başındaki `[ ]` işaretini `[x]` olarak değiştirerek dosyayı kaydet ve bir sonraki adıma geç. 

---

## 🛠 Faz 1: Proje Yeniden Adlandırma ve Altyapı
- [x] Başlangıçta "TradeFlow" olarak ayarlanan proje adını tamamen **GarageLedger** olarak değiştir.
- [x] `package.json`, klasör isimleri, Electron yapılandırması ve uygulamanın title bar (başlık çubuğu) dahil her yerdeki isimleri "GarageLedger" olarak güncelle.

## 🌍 Faz 2: Çoklu Dil (i18n) ve Bölgesel Ayarlar
- [x] Sol menüye veya sağ üste şık bir "Ayarlar" (Settings) ikonu/sekmesi ekle.
- [x] `react-i18next` (veya benzeri bir çözüm) kurarak uygulamaya 4 dil desteği ekle: **TR (Türkçe), EN (İngilizce), AZ (Azerbaycan Türkçesi)** ve **RU (Rusça)**.
- [x] Uygulamanın varsayılan (default) dilini **AZ** olarak ayarla.
- [x] Tüm menüler, tablo başlıkları, kâr/zarar durumları ve istatistik kartlarının metinlerini i18n yapısına bağla (dil seçimine göre sayfa yenilenmeden anında değişmeli).

## ✨ Faz 3: UI/UX "Tatlı" ve "Premium" Dokunuşlar
- [x] Envanter ekranına kaliteli ve kullanışlı filtreleme (arama, kategori, stok/satıldı, kâr/zarar, tarih aralığı) ekle.
- [x] "Quiet Luxury" ve "Digital Boutique" tasarım hissiyatını pekiştir.
- [x] Arka planlar için "Deep Whites" (#FAFAFA) ve kartlar/menüler için "Soft Beiges" (#F5F0E8) renk paletini koru.
- [x] Butonlara akıcı hover efektleri ekle.
- [x] Sayfa ve menü geçişlerinde `framer-motion` veya saf CSS ile ufak, göze "tatlı" ve modern görünen yumuşak animasyonlar (fade-in, slide-up vb.) entegre et.

## 🔄 Faz 4: Otomatik Güncelleme (Auto-Update) Sistemi
- [x] Projeye `electron-updater` paketini dahil et.
- [x] `electron-builder` ayarlarını (package.json veya electron-builder.yml) GitHub "publish" provider'ı kullanacak şekilde yapılandır (Repo: `RealMrNovember/GarageLedger` varsayılarak).
- [x] Electron `main.js` (veya background.js) dosyasına `electron-updater` mantığını ekle.
- [x] Güncelleme kontrolü (`checkForUpdates`), indirme ilerlemesi (`download-progress`) ve indirme tamamlandı (`update-downloaded`) olaylarını yakalayacak IPC kanallarını kur.
- [x] React tarafında Ayarlar menüsüne veya sol alta şık bir **"Güncellemeleri Kontrol Et"** butonu ekle.
- [x] Güncelleme UI Mantığı: Tıklanınca "Kontrol ediliyor..." (spinner) -> İndirilirken "Güncelleme indiriliyor... %X" (progress bar) -> Bitince "Güncelleme hazır. Yeniden başlatmak için tıklayın" (Soft Beige kart içinde Lacivert buton) tasarımını uygula.
- [x] Güncel ise "Şu an en güncel sürümü (vX.X.X) kullanıyorsunuz" şeklinde yeşil onay mesajı göster.
- [x] Tüm bu güncelleme bildirim metinlerini `react-i18next` sistemine bağla (4 dilde çalışmalı).
- [x] Uygulama her açıldığında otomatik güncelleme kontrolü yapsın, arkaplanda indirsin ve Splash Screen içinde durum/progress göstersin (Splash en az 3 saniye görünsün).
- [x] Veri kaybını önlemek için otomatik günlük yedekleme ve manuel yedekleme/geri yükleme ekranı ekle (Ayarlar içinde yedek dosyalarını listele ve klasörü aç).

## 💎 Faz 5: Markalaşma (Branding)
- [x] `GarageLedger.svg` dosyasını uygulama logosu ve Windows icon'u (.ico) olarak kullan.
- [x] Footer kısmında merkeze küçük ve zarif bir fontla **"Developed by Mikail | Cicibyte Corp"** yazdır. (Sadece Mikail kullanılacak, soyadı kesinlikle yer almayacak).

## 📦 Faz 6: GitHub Entegrasyonu ve Dökümantasyon
- [x] Proje ana dizinine emojilerle süslenmiş, ekran görüntüsü (placeholder) içeren ve uygulamanın özelliklerini (Multi-language, Local DB, Offline, Multi-currency, Auto-Update) anlatan profesyonel bir İngilizce `README.md` oluştur.
- [x] `README.md` içine geliştiricinin yeni bir versiyon yayınlamak istediğinde terminale yazması gereken komutları (örn: `npm run publish`) adım adım anlatan bir "Yayınlama Kılavuzu" ekle.
- [x] Terminalde `git init` komutuyla Git'i başlat.
- [x] Terminalde `git add .` ve `git commit -m "Initial commit: GarageLedger v1.0 with i18n, multi-currency & auto-update"` komutlarını hazırla/çalıştır.
- [x] Benim için terminal üzerinden GitHub hesabımda "GarageLedger" adında public bir repo oluşturup kodu pushlamak için gerekli GitHub CLI (`gh repo create`) komutlarını adım adım bir metin dosyasına veya README'nin en altına not et.
- [x] Git repo yapısını düzelt: Projenin kök dizini `C:\\Users\\Admin\\Cicibyte Projects\\GarageLedger\\GarageLedger` olacak şekilde repoya pushla (üst dizini değil).
