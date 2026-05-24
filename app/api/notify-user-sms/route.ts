import { NextResponse } from "next/server";
import { sendSolapiSms } from "@/lib/solapi";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const name = String(body.name || "");
  const phone = String(body.phone || "");
  const eventDate = String(body.eventDate || "");
  const contractType = String(body.contractType || "계약서");

  const prefix = eventDate && eventDate !== "등록계약" ? `${eventDate} ` : "";

  const text =
    `[BNS,INUS 뮤직]\n` +
    `${name}님, ${prefix}${contractType} 계약서 제출이 정상 완료되었습니다.\n` +
    `감사합니다.`;

  const result = await sendSolapiSms(phone, text);

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: "작성자 완료 문자 발송에 실패했습니다.", result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, skipped: result.skipped || false });
}
