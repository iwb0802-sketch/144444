import { NextResponse } from "next/server";

function extractUrl(value: unknown): string {
  if (!value) return "";

  if (typeof value === "object") {
    const obj = value as any;
    if (typeof obj.url === "string") return obj.url;
    if (obj.result) return extractUrl(obj.result);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return extractUrl(parsed);
    } catch {
      const match = value.match(/https:\/\/drive\.google\.com\/[^"\s]+/);
      return match?.[0] || "";
    }
  }

  return "";
}

export async function POST(req: Request) {
  const webhookUrl = process.env.DRIVE_WEBHOOK_URL || "";

  if (!webhookUrl) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "DRIVE_WEBHOOK_URL 환경변수가 없어 구글드라이브 백업은 건너뛰었습니다.",
      url: ""
    });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      redirect: "follow"
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: text, url: "" },
        { status: 500 }
      );
    }

    let result: unknown = text;
    try {
      result = JSON.parse(text);
    } catch {}

    const url = extractUrl(result);

    return NextResponse.json({
      ok: true,
      result,
      url
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "구글드라이브 백업 중 오류가 발생했습니다.",
        url: ""
      },
      { status: 500 }
    );
  }
}
