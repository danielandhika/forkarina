import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Otomatis mengambil kredensial dari Environment Variables
const redis = Redis.fromEnv();
const FLAG_KEY = "love_letter_status";

export async function GET() {
  try {
    const status = await redis.get(FLAG_KEY);
    
    if (status === "read") {
      return NextResponse.json({ status: "read", message: "Surat sudah dibaca." });
    }
    return NextResponse.json({ status: "unread", message: "Surat belum dibaca." });
  } catch (error) {
    console.error("Redis Error:", error);
    return NextResponse.json({ error: "Gagal mengambil status" }, { status: 500 });
  }
}

export async function POST() {
  await redis.set(FLAG_KEY, "read");
  return NextResponse.json({ status: "read", message: "Status diperbarui: sudah dibaca." });
}

export async function DELETE() {
  await redis.del(FLAG_KEY);
  return NextResponse.json({ status: "unread", message: "Status telah di-reset." });
}