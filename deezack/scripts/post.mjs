#!/usr/bin/env node
// DeeZack — auto-poster Threads untuk Dabelz Studio.
//
// Guna:
//   node deezack/scripts/post.mjs                 # post content hari ini (perlu THREADS_ACCESS_TOKEN)
//   node deezack/scripts/post.mjs --dry-run       # tunjuk apa yang akan dipost, tak post
//   node deezack/scripts/post.mjs --date=2026-11-12 --dry-run
//   node deezack/scripts/post.mjs --check         # semak semua post (panjang, placeholder)
//
// Env:
//   THREADS_ACCESS_TOKEN  token long-lived Threads (wajib untuk post sebenar)
//   THREADS_USER_ID       pilihan, default "me"
//   DRY_RUN=1             sama macam --dry-run

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://graph.threads.net/v1.0";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);
const DRY_RUN = Boolean(args["dry-run"]) || process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

const config = JSON.parse(await readFile(path.join(ROOT, "config.json"), "utf8"));
const { posts } = JSON.parse(await readFile(path.join(ROOT, "content", "posts.json"), "utf8"));

function waLink() {
  const text = encodeURIComponent(config.whatsapp_prefill);
  return `https://wa.me/${config.whatsapp_number}?text=${text}`;
}

function render(post) {
  return post.text.replaceAll("{WA}", waLink());
}

// Threads kira panjang ikut aksara (emoji = 1). Guna code point sebagai anggaran selamat.
const charCount = (s) => [...s].length;

// Tarikh tempatan (Malaysia, UTC+8, tiada DST) dalam bentuk YYYY-MM-DD.
function localDate(d = new Date()) {
  return new Date(d.getTime() + config.timezone_offset_hours * 3600_000).toISOString().slice(0, 10);
}

function postForDate(dateStr) {
  const days = Math.round((Date.parse(dateStr) - Date.parse(config.start_date)) / 86_400_000);
  const idx = ((days % posts.length) + posts.length) % posts.length;
  return { idx, days, post: posts[idx] };
}

function check() {
  let ok = true;
  const ids = new Set();
  for (const p of posts) {
    const text = render(p);
    const n = charCount(text);
    const problems = [];
    if (ids.has(p.id)) problems.push("id berulang");
    ids.add(p.id);
    if (!p.text.includes("{WA}")) problems.push("tiada CTA {WA}");
    if (n > config.max_chars) problems.push(`terlalu panjang (${n}/${config.max_chars})`);
    if (p.image_url && !/^https:\/\//.test(p.image_url)) problems.push("image_url mesti https");
    console.log(`${problems.length ? "✗" : "✓"} ${p.id.padEnd(22)} ${String(n).padStart(3)} aksara ${problems.join(", ")}`);
    if (problems.length) ok = false;
  }
  console.log(ok ? `\nSemua ${posts.length} post OK.` : "\nAda masalah — betulkan sebelum jadual berjalan.");
  process.exit(ok ? 0 : 1);
}

async function api(method, pathname, params) {
  const url = new URL(`${API}/${pathname}`);
  const body = new URLSearchParams({ ...params, access_token: process.env.THREADS_ACCESS_TOKEN });
  const res = await fetch(method === "GET" ? `${url}?${body}` : url, {
    method,
    ...(method === "GET" ? {} : { body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    throw new Error(`Threads API ${method} ${pathname} gagal (${res.status}): ${JSON.stringify(json.error ?? json)}`);
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function alreadyPostedToday(userId, text, today) {
  const { data = [] } = await api("GET", `${userId}/threads`, { fields: "id,text,timestamp", limit: "10" });
  return data.some((t) => t.text?.trim() === text.trim() && localDate(new Date(t.timestamp)) === today);
}

async function publish(post, text) {
  const userId = process.env.THREADS_USER_ID || "me";
  const params = post.image_url
    ? { media_type: "IMAGE", image_url: post.image_url, text }
    : { media_type: "TEXT", text };
  if (post.topic_tag) params.topic_tag = post.topic_tag;

  const container = await api("POST", `${userId}/threads`, params);
  // Meta syorkan tunggu sebelum publish, terutama untuk gambar.
  await sleep(post.image_url ? 30_000 : 5_000);
  const published = await api("POST", `${userId}/threads_publish`, { creation_id: container.id });
  return published.id;
}

if (args.check) check();

const date = typeof args.date === "string" ? args.date : localDate();
const { idx, post } = postForDate(date);
const text = render(post);

console.log(`DeeZack • ${date} • post #${idx + 1}/${posts.length} (${post.id}, ${post.pillar}) • ${charCount(text)} aksara`);
console.log("─".repeat(60));
console.log(text);
if (post.image_url) console.log(`[gambar] ${post.image_url}`);
console.log("─".repeat(60));

if (charCount(text) > config.max_chars) {
  console.error(`Post melebihi ${config.max_chars} aksara. Batal.`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log("DRY RUN — tiada apa dipost.");
  process.exit(0);
}

if (!process.env.THREADS_ACCESS_TOKEN) {
  console.error("THREADS_ACCESS_TOKEN tiada. Set dalam GitHub Secrets (lihat deezack/README.md).");
  process.exit(1);
}

const userId = process.env.THREADS_USER_ID || "me";
if (await alreadyPostedToday(userId, text, date)) {
  console.log("Post ini sudah keluar hari ini — skip (elak double post).");
  process.exit(0);
}

const id = await publish(post, text);
console.log(`✅ Berjaya dipost. Threads media id: ${id}`);
