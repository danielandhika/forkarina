import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const FLAG_KEY = "love_letter_status";

// Fungsi Helper Notifikasi (Gaya Laravel Notification)
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
    // 1. Simpan di Redis (agar tidak muncul animasi lagi nanti)
    await redis.set(FLAG_KEY, "read");
    
    // 2. Kirim notif real-time ke Daniel
    await laporKeDaniel();

    return NextResponse.json({ status: "read", message: "Success!" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET & DELETE tetap seperti sebelumnya
export async function GET() {
  const status = await redis.get(FLAG_KEY);
  return NextResponse.json({ status: status === "read" ? "read" : "unread" });
}