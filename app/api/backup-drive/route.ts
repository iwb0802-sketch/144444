import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.DRIVE_WEBHOOK_URL || "";

  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "DRIVE_WEBHOOK_URL 환경변수가 없어 구글드라이브 백업은 건너뛰었습니다."
    });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("Drive backup failed", text);
      return NextResponse.json({ ok: false, message: text }, { status: 500 });
    }

    let result: unknown = text;
    try {
      result = JSON.parse(text);
    } catch {}

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "구글드라이브 백업 중 오류가 발생했습니다." }, { status: 500 });
  }
}
