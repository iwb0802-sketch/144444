
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function makeAuthorization(apiKey: string, apiSecret: string) {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const apiKey = process.env.SOLAPI_API_KEY || "";
  const apiSecret = process.env.SOLAPI_API_SECRET || "";
  const from = (process.env.SOLAPI_FROM || "").replace(/[^0-9]/g, "");
  const adminPhone = (process.env.ADMIN_PHONE || "").replace(/[^0-9]/g, "");

  if (!apiKey || !apiSecret || !from || !adminPhone) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "SMS 환경변수가 없어 문자 발송은 건너뛰었습니다."
    });
  }

  const name = String(body.name || "-");
  const phone = String(body.phone || "-");
  const contractType = String(body.contractType || "-");
  const eventDate = String(body.eventDate || "-");
  const fee = String(body.fee || "-");

  const text =
    `[이너스뮤직 계약서 제출]\n` +
    `유형: ${contractType}\n` +
    `성명: ${name}\n` +
    `연락처: ${phone}\n` +
    `행사일: ${eventDate}\n` +
    `금액: ${fee}`;

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": makeAuthorization(apiKey, apiSecret)
      },
      body: JSON.stringify({
        message: {
          to: adminPhone,
          from,
          text
        }
      })
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("SMS send failed", result);
      return NextResponse.json({ ok: false, result }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, message: "SMS 발송 중 오류가 발생했습니다." }, { status: 500 });
  }
}
