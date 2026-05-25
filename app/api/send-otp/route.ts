import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/otp-store";
import { sendSolapiSms } from "@/lib/solapi";

export const runtime = "nodejs";

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));
  const smsBrand = String(body.smsBrand || "웨딩뮤직");

  if (!phone || phone.length < 10) {
    return NextResponse.json({ ok: false, message: "연락처를 정확히 입력해주세요." }, { status: 400 });
  }

  const code = makeOtp();
  const expiresAt = Date.now() + 3 * 60 * 1000;
  const text = `[${smsBrand}]\n계약서 제출 인증번호는 ${code} 입니다.\n3분 이내에 입력해주세요.`;

  const result = await sendSolapiSms(phone, text);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message || "인증번호 문자 발송에 실패했습니다.", detail: result }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("otp_phone", phone, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 180 });
  res.cookies.set("otp_code", code, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 180 });
  res.cookies.set("otp_expires", String(expiresAt), { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 180 });
  res.cookies.set("otp_verified", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  return res;
}
