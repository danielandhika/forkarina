import { NextResponse } from "next/server";
// Kita tetap import Redis kalau sewaktu-waktu kamu mau log jumlah akses
import { Redis } from "@upstash/redis";

export const dynamic = 'force-dynamic';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

async function laporKeDaniel() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  const waktu = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  }).format(new Date());

  const pesan = `🚀 *NOTIFIKASI SURAT*\n\n` +
                `Halo Dan! Karina baru aja masuk ke web nih.\n` +
                `🕒 *Waktu:* ${waktu}\n\n` +
                `Siap-siap, dia lagi baca animasinya sekarang! ❤️`;

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
    // Kita panggil notifikasi segera
    await laporKeDaniel();
    
    // (Opsional) Kamu bisa tetap simpan log akses di Redis kalau mau tau berapa kali dibuka
    await redis.incr("total_akses_karina");

    return NextResponse.json({ status: "success", message: "Notif terkirim!" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// GET sekarang nggak wajib dipakai buat nge-skip animasi lagi
export async function GET() {
  return NextResponse.json({ status: "always_unread" });
}