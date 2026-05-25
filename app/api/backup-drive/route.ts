import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const webhookUrl = process.env.DRIVE_WEBHOOK_URL || "";

  if (!webhookUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "DRIVE_WEBHOOK_URL 환경변수가 없습니다.",
        url: ""
      },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      redirect: "follow"
    });

    const text = await res.text();

    const match = text.match(/https:\/\/drive\.google\.com\/[^\s"'<>]+/);
    const url = match?.[0] || "";

    return NextResponse.json({
       ok: !!url,
       url,
       pdfUrl: url,
       raw: text,
       message: url ? "" : "PDF URL을 찾지 못했습니다."
});
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: String(error),
        url: ""
      },
      { status: 500 }
    );
  }
}
