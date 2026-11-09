#!/usr/bin/env node
// Panjangkan token long-lived Threads (sah 60 hari). Jalankan sekurang-kurangnya sebulan sekali.
//
//   THREADS_ACCESS_TOKEN=xxx node deezack/scripts/refresh-token.mjs
//
// Dalam GitHub Actions (--ci): token baru TIDAK dicetak. Jika Meta pulangkan token
// yang berbeza, job akan gagal supaya anda kemas kini secret secara manual.

const token = process.env.THREADS_ACCESS_TOKEN;
if (!token) {
  console.error("THREADS_ACCESS_TOKEN tiada.");
  process.exit(1);
}
const ci = process.argv.includes("--ci");

const url = new URL("https://graph.threads.net/refresh_access_token");
url.search = new URLSearchParams({ grant_type: "th_refresh_token", access_token: token });

const res = await fetch(url);
const json = await res.json().catch(() => ({}));
if (!res.ok || json.error || !json.access_token) {
  console.error(`Refresh gagal (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  console.error("Token mungkin dah tamat. Jana token baru di Meta Developer dan kemas kini secret THREADS_ACCESS_TOKEN.");
  process.exit(1);
}

const days = Math.floor((json.expires_in ?? 0) / 86400);
if (ci) {
  if (json.access_token !== token) {
    console.error(`Meta beri token BARU (sah ${days} hari). Jalankan skrip ini secara lokal dan kemas kini secret THREADS_ACCESS_TOKEN.`);
    process.exit(1);
  }
  console.log(`✅ Token dipanjangkan. Sah lagi ~${days} hari.`);
} else {
  console.log(`✅ Token sah ~${days} hari.`);
  if (json.access_token !== token) console.log(`Token baru (simpan dalam GitHub Secrets):\n${json.access_token}`);
  else console.log("Token sama — tiada perubahan pada secret diperlukan.");
}
