import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// JANGAN pakai Redis.fromEnv() karena Vercel KV menggunakan prefix KV_ 
// bukan UPSTASH_REDIS_. Kita petakan manual agar pasti connect.
const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const FLAG_KEY = "love_letter_status";

async function laporKeDaniel() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  const waktu = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date());

  const pesan = `🚀 *NOTIFIKASI SURAT*\n\n` +
                `Halo Dan! Karina baru aja buka suratnya nih.\n` +
                `🕒 *Waktu:* ${waktu}\n\n` +
                `Semangat, moga lancar urusannya! ❤️`;

  if (token && chatId) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: pesan,
          parse_mode: "Markdown" 
        }),
      });
    } catch (err) {
      console.error("Gagal lapor Telegram:", err);
    }
  }
}

export async function POST() {
  try {
    await redis.set(FLAG_KEY, "read");
    await laporKeDaniel();
    return NextResponse.json({ status: "read", message: "Success!" });
  } catch { 
    // HAPUS (error) agar tidak menyebabkan linting error 'unused vars' lagi
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await redis.get(FLAG_KEY);
    return NextResponse.json({ status: status === "read" ? "read" : "unread" });
  } catch {
    return NextResponse.json({ error: "Redis Connection Error" }, { status: 500 });
  }
}