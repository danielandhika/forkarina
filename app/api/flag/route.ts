import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// SENJATA PAMUNGKAS: Paksa Vercel jangan nge-cache API ini!
export const dynamic = 'force-dynamic'; 
export const revalidate = 0;

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
    await laporKeDaniel(); // Telegram dipanggil DI SINI, gak pengaruh ke animasi
    return NextResponse.json({ status: "read" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await redis.get(FLAG_KEY);
    // Tambahkan header anti-cache manual buat jaga-jaga
    return NextResponse.json(
      { status: status === "read" ? "read" : "unread" },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch {
    return NextResponse.json({ status: "unread" });
  }
}

export async function DELETE() {
  try {
    await redis.del(FLAG_KEY);
    return NextResponse.json({ message: "Reset Berhasil" });
  } catch {
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}