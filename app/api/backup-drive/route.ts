import { NextResponse } from "next/server";

function extractUrl(value: any): string {
  if (!value) return "";

  if (typeof value === "string") {
    try {
      return extractUrl(JSON.parse(value));
    } catch {
      const normal = value.match(/https:\/\/drive\.google\.com\/[^\s"'<>]+/);
      if (normal?.[0]) return normal[0];

      const escaped = value.match(/https:\\\/\\\/drive\.google\.com\\\/[^\s"'<>]+/);
      if (escaped?.[0]) return escaped[0].replace(/\\\//g, "/");

      return "";
    }
  }

  if (typeof value === "object") {
    if (typeof value.url === "string" && value.url) return value.url;
    if (typeof value.pdfUrl === "string" && value.pdfUrl) return value.pdfUrl;
    if (typeof value.fileUrl === "string" && value.fileUrl) return value.fileUrl;
    if (typeof value.driveUrl === "string" && value.driveUrl) return value.driveUrl;
    if (value.result) return extractUrl(value.result);
    if (value.raw) return extractUrl(value.raw);
    if (value.message) return extractUrl(value.message);

    return extractUrl(JSON.stringify(value));
  }

  return "";
}

export async function POST(req: Request) {
  const webhookUrl = process.env.DRIVE_WEBHOOK_URL || "";

  if (!webhookUrl) {
    return NextResponse.json({
      ok: false,
      message: "DRIVE_WEBHOOK_URL 환경변수가 없습니다.",
      url: ""
    }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
      redirect: "follow"
    });

    const raw = await res.text();

    let result: any = raw;
    try {
      result = JSON.parse(raw);
    } catch {}

    const url = extractUrl(result) || extractUrl(raw);

    return NextResponse.json({
      ok: !!url,
      result,
      raw,
      url,
      pdfUrl: url,
      driveUrl: url,
      message: url ? "" : "Google Drive PDF URL을 찾지 못했습니다."
});
  } catch (error) {
    return NextResponse.json({
      ok: false,
      message: String(error),
      url: ""
    }, { status: 500 });
  }
}
