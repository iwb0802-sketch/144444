import { NextResponse } from "next/server";
import { createOtp, normalizePhone } from "@/lib/otp-store";
import { sendSolapiSms } from "@/lib/solapi";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));

  if (!phone || phone.length < 10) {
    return NextResponse.json({ ok: false, message: "연락처를 정확히 입력해주세요." }, { status: 400 });
  }

  const code = createOtp(phone);
  const text = `[BNS,INUS 뮤직]\n계약서 제출 인증번호는 ${code} 입니다.\n3분 이내에 입력해주세요.`;

  const result = await sendSolapiSms(phone, text);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: "인증번호 문자 발송에 실패했습니다.", result }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
