# DeeZack: Sistem Auto-Posting Threads untuk Dabelz Studio

DeeZack ialah "akaun AI" Dabelz Studio di Threads. Ia keluarkan satu post setiap hari pada masa tetap. Setiap post bagi nilai (tips, contoh kerja, FAQ) dan diakhiri dengan CTA ke WhatsApp supaya bakal client terus berbual dengan kita untuk closing.

```
 Threads (DeeZack)          WhatsApp Dabelz            Dabelz Invoice app
 ─────────────────          ───────────────            ──────────────────
 Post harian 8:23 mlm  ──►  Lead masuk dengan     ──►  Quotation → Invoice
 + CTA wa.me link           mesej "Saya dari            (app sedia ada dalam
                            Threads" (boleh jejak)      repo ini)
```

---

## 1. Strategi

**Sasaran:** owner bisnes kecil / sederhana, peniaga bazaar, usahawan online, penganjur event, terutamanya sekitar Klang Valley (tetapi boleh pos ke seluruh Malaysia).

**Persona DeeZack:** kawan yang pandai design. Santai, bahasa Melayu harian ("korang", "jom"), beri tips ikhlas, tak hard-sell setiap ayat. Setiap post: **hook → nilai → CTA**.

**5 tonggak content (rotate setiap minggu, 7 post/minggu):**

| Hari dalam kitaran | Tonggak | Tujuan |
|---|---|---|
| 1 | Tips | Bina kepercayaan, tunjuk kepakaran |
| 2 | Showcase | Tunjuk servis / hasil kerja |
| 3 | Offer | Dorong tindakan (quote percuma, pakej) |
| 4 | Behind-the-scenes | Telus tentang proses, kurangkan rasa ragu |
| 5 | Engagement | Soalan/poll supaya algoritma tolak post |
| 6 | FAQ | Jawab bantahan biasa sebelum ditanya |
| 7 | Story | Bina hubungan dengan brand |

**CTA:** setiap post ada link `https://wa.me/60108991337?text=Hi%20Dabelz!%20Saya%20dari%20Threads`. Mesej tersebut auto-terisi, jadi anda tahu lead itu datang dari Threads.

**Masa posting:** 8:23 malam (waktu puncak skrol). Boleh tukar dalam `.github/workflows/deezack.yml`.

---

## 2. Apa yang dah siap dalam repo ini

| Fail | Fungsi |
|---|---|
| `deezack/config.json` | Nombor WhatsApp, mesej auto, tarikh mula, had aksara |
| `deezack/content/posts.json` | 28 post siap tulis (4 minggu), ulang semula selepas habis |
| `deezack/scripts/post.mjs` | Pilih post hari ini & publish ke Threads API. Ada `--dry-run`, `--check`, dan halang double post |
| `deezack/scripts/refresh-token.mjs` | Panjangkan token Threads (tamat setiap 60 hari) |
| `.github/workflows/deezack.yml` | Jadual automatik: post harian + semak/panjang token 2x sebulan |

Tiada server, tiada kos bulanan: semuanya jalan di GitHub Actions (percuma).

---

## 3. Setup langkah demi langkah (bahagian anda)

### Langkah 1: Akaun Threads DeeZack
1. Buat / guna akaun **Instagram** bisnes untuk Dabelz Studio (Threads perlukan akaun Instagram). Tukar kepada akaun **Professional → Business**.
2. Log masuk ke app **Threads** menggunakan akaun Instagram itu.
3. Profil Threads:
   - **Nama:** `DeeZack | Dabelz Studio`
   - **Bio (cadangan):**
     ```
     🎨 Design + 🖨️ Cetak bawah satu bumbung
     Logo • Banner • Bunting • Sticker label • Kad nama
     📍 Cheras, KL • Pos seluruh Malaysia
     👇 Quote percuma di WhatsApp
     ```
   - **Link:** `https://wa.me/60108991337?text=Hi%20Dabelz!%20Saya%20dari%20Threads`
   - **Gambar profil:** logo Dabelz Studio.

### Langkah 2: App Meta Developer (untuk dapatkan token)
1. Pergi ke <https://developers.facebook.com/apps> → **Create App** → pilih use case **"Access the Threads API"**.
2. Dalam app: **Use cases → Threads API → Customize**, tandakan permission `threads_basic` dan `threads_content_publish`.
3. **App roles → Roles → Add People → Threads Tester**, masukkan username Threads DeeZack. Kemudian dalam app Threads/Instagram (Settings → Website permissions → Invites) **terima** jemputan itu.
4. Pergi ke **Graph API Explorer** (atau "User Token Generator" dalam tetapan Threads API), pilih app anda dan jana **User Access Token** untuk akaun DeeZack.
5. Tukar kepada **long-lived token (60 hari)**:
   ```
   https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=APP_SECRET&access_token=SHORT_TOKEN
   ```
   (APP_SECRET ada di App settings → Basic. **Jangan kongsi di mana-mana.**)

> Sebab akaun ini milik anda sendiri dan didaftar sebagai Tester, **tak perlu App Review** daripada Meta.

### Langkah 3: Simpan token dalam GitHub
Repo → **Settings → Secrets and variables → Actions → New repository secret**:
- `THREADS_ACCESS_TOKEN` = long-lived token dari Langkah 2.
- (Pilihan) `THREADS_USER_ID` = ID pengguna Threads. Kalau kosong, guna `me`.

### Langkah 4: Uji
1. Repo → **Actions → "DeeZack — Threads auto-post" → Run workflow**, biarkan **Dry run = ✔**. Semak log: post yang keluar betul?
2. Run sekali lagi dengan **Dry run = ✘**. Post pertama patut muncul di Threads.
3. Lepas itu jadual harian berjalan sendiri.

> Nota: jadual GitHub Actions hanya berjalan pada branch utama (default branch). Merge branch ini ke `main` supaya jadual aktif. GitHub juga kadang-kadang lewat beberapa minit pada waktu sibuk.

### Langkah 5: Semak content sebelum go-live
Baca `deezack/content/posts.json` dan pastikan semua janji tepat dengan servis sebenar anda (contoh: pos ke luar KL, cetak kuantiti kecil, die-cut sticker, kalendar/kad ucapan). Buang atau ubah mana-mana yang tak tawarkan. Selepas edit:
```
node deezack/scripts/post.mjs --check
```

---

## 4. Operasi harian

- **Lihat post hari ini / tarikh tertentu:** `node deezack/scripts/post.mjs --dry-run --date=2026-11-15`
- **Tambah gambar pada post:** tambah `"image_url": "https://.../gambar.jpg"` pada post itu. Gambar mesti boleh diakses secara public (contoh: letak dalam folder repo ini yang di-host GitHub Pages). Post bergambar biasanya dapat lebih reach, terutamanya post *showcase*.
- **Tukar masa post:** ubah baris `cron` pertama dalam workflow (masa dalam UTC; MYT = UTC + 8).
- **Token:** workflow cuba panjangkan token pada 1 & 15 haribulan. Jika job `refresh-token` gagal, jalankan `refresh-token.mjs` secara lokal dan kemas kini secret.
- **Jawab komen & DM sendiri.** Lead yang komen "berminat" → balas dan ajak ke WhatsApp.

---

## 5. Roadmap DeeZack (satu demi satu)

| Fasa | Apa | Status |
|---|---|---|
| 1 | Strategi, persona, 28 post, skrip auto-post, jadual harian | ✅ Siap (repo ini) |
| 2 | Setup akaun Threads + token + uji post pertama | ⏳ Langkah 1–4 di atas |
| 3 | Tambah gambar portfolio sebenar pada post showcase/offer | Selepas go-live |
| 4 | Post kedua sehari (12:30 tengah hari) dengan content lebih ringkas | Bila content cukup |
| 5 | Content bank baru dijana AI setiap bulan, disemak anda sebelum masuk jadual | Kemudian |
| 6 | Auto-reply komen (permission `threads_manage_replies`) yang ajak ke WhatsApp | Kemudian |
| 7 | Laporan mingguan: views, likes, replies (permission `threads_manage_insights`) + kiraan lead "Saya dari Threads" di WhatsApp | Kemudian |

**KPI cadangan bulan pertama:** 30 post keluar tanpa gagal, 100+ follower, 10+ lead WhatsApp dengan mesej "Saya dari Threads".
