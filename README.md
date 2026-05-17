# GarageLedger

![GarageLedger](./GarageLedger.svg)

GarageLedger, **Cicibyte Corp** tarafından geliştirilen; galeriler ve araç alım-satım ekipleri için tasarlanmış **offline çalışan masaüstü ERP/CRM** uygulamasıdır. Envanterinizi, alım-satım akışlarınızı ve finansal görünümünüzü tek yerde yönetmenizi sağlar.

“Garage” günlük envanter gerçeğini, “Ledger” ise her işlem arkasındaki finansal muhasebe gerçeğini temsil eder.

## Tasarım Dili (Quiet Luxury)

GarageLedger, “Quiet Luxury / Digital Boutique” tasarım yaklaşımını hedefler:

- “Deep Whites / Soft Beiges” ile sakin, güven veren arayüz
- Minimal çizgiler, yumuşak gölgeler, cam efekti (glassmorphism)
- Odak: netlik ve güven; “numbers first, noise last”

## Teknik Stack

- Electron + electron-builder (Windows NSIS installer)
- React + TypeScript + Vite
- Tailwind CSS v4
- **Local JSON DB** (offline, Windows `%APPDATA%/GarageLedger/db.json`)
- Recharts (analitik grafikler)
- i18next / react-i18next (**AZ varsayılan** + TR/EN/RU)
- jsPDF + jspdf-autotable (profesyonel PDF raporlama + export seçenekleri)

## Ana Modüller & Özellikler

- **Envanter (Inventory)**: araç kayıtları, durumlar (stok / rezerve / satıldı), filtreleme ve hızlı düzenleme
- **VIN Decoder (NHTSA)**: şasi no (VIN) ile araç bilgilerini otomatik doldurma (Marka/Model/Yıl/Motor)
- **Finans & Analitik**: yatırım, ciro, net kâr; dashboard özetleri ve grafikler
- **Cari CRM (Müşteriler/Rehber)**: kişi kaydı, rol (alıcı/satıcı), cari profil ve işlem geçmişi
- **Şirket Profili (White‑Label)**: şirket adı/logo/adres/iletişim bilgileri ile kişiselleştirilmiş raporlar
- **PDF Raporlama**: antet + tablo + özet + sabit footer; dil/para birimi/tarih formatı/A4-Letter/tema seçenekleriyle premium PDF export
- **Uygulama Kilidi**: parola ile giriş kilidi (unutma durumunda destek yönlendirmesi)
- **Otomatik Güncelleme**: GitHub Releases üzerinden auto-update + uygulama içi güncelleme bildirimi
- **Dark Mode**: yüksek kontrast, okunabilirlik odaklı “Midnight Onyx”
- **Çoklu Dil**: AZ (default), TR, EN, RU
- **Çoklu Para Birimi**: AZN, USD, EUR, TRY (+ online/offline kur cache)
- **Yedekleme**: günlük otomatik yedek + Ayarlar’dan manuel yedek/geri yükleme

## Kurulum (Windows)

1) Open the GitHub Releases page and download the latest Windows installer:
   - `GarageLedger.Setup.x.y.z.exe`
2) Run the installer wizard.
3) If Windows asks for admin permission, allow it (per-machine install).
4) Launch GarageLedger from Start Menu.

Important:

- Your data is stored locally on the same Windows user profile and is not uploaded anywhere.
- Updates do not wipe your data. Daily automatic backups add extra safety.

## Veri Depolama & Yedekler

GarageLedger veriyi offline olarak Windows kullanıcı profilinde saklar:

- Main DB file: `%APPDATA%/GarageLedger/db.json`
- Backups folder: `%APPDATA%/GarageLedger/backups/` (date-stamped JSON backups)

You can manage backups inside the app:

- Settings → Backups: Create / Refresh / Open Folder / Restore

## Geliştirme

```bash
npm install
npm run dev
```

## Build (Installer)

```bash
npm run dist
```

## Release (Auto GitHub Release / Auto-Update)

Yayın akışı otomatikleştirilmiştir:

1) Ensure the working tree is clean (commit your changes first).
2) Ensure a GitHub token is available for electron-builder publishing:

```powershell
$env:GH_TOKEN="YOUR_GITHUB_TOKEN"
```

3) Run:

```bash
npm run release
```

Bu komut:

- minor sürüm artırır (`npm version minor`)
- push commits and tags (`git push --follow-tags`)
- build and publish NSIS installer to GitHub Releases (`electron-builder --publish always`)

## İletişim

- Mikail | Cicibyte Corp
- E-posta: mozkarci1991@gmail.com
- WhatsApp: +90 535 489 50 50
