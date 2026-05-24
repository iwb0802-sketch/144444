import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.DRIVE_WEBHOOK_URL || "";
  if (!webhookUrl) {
    return NextResponse.json({ ok: true, skipped: true, message: "DRIVE_WEBHOOK_URL 없음" });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    if (!res.ok) return NextResponse.json({ ok: false, message: text }, { status: 500 });
    return NextResponse.json({ ok: true, result: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "구글드라이브 백업 오류" }, { status: 500 });
  }
}
