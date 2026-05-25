import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizePhone } from "@/lib/otp-store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone || ""));
  const code = String(body.code || "").trim();

  const cookieStore = await cookies();
  const savedPhone = cookieStore.get("otp_phone")?.value || "";
  const savedCode = cookieStore.get("otp_code")?.value || "";
  const expiresAt = Number(cookieStore.get("otp_expires")?.value || "0");

  if (!phone || !code) {
    return NextResponse.json({ ok: false, message: "연락처와 인증번호를 입력해주세요." }, { status: 400 });
  }

  if (!savedPhone || !savedCode || !expiresAt) {
    return NextResponse.json({ ok: false, message: "인증번호를 먼저 발송해주세요." }, { status: 400 });
  }

  if (Date.now() > expiresAt) {
    const res = NextResponse.json({ ok: false, message: "인증번호가 만료되었습니다. 다시 발송해주세요." }, { status: 400 });
    res.cookies.set("otp_phone", "", { path: "/", maxAge: 0 });
    res.cookies.set("otp_code", "", { path: "/", maxAge: 0 });
    res.cookies.set("otp_expires", "", { path: "/", maxAge: 0 });
    res.cookies.set("otp_verified", "", { path: "/", maxAge: 0 });
    return res;
  }

  if (phone !== savedPhone) {
    return NextResponse.json({ ok: false, message: "인증번호를 발송한 연락처와 현재 연락처가 다릅니다." }, { status: 400 });
  }

  if (code !== savedCode) {
    return NextResponse.json({ ok: false, message: "인증번호가 올바르지 않습니다." }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });

  res.cookies.set("otp_verified", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 15 * 60
  });

  // 인증 완료 후 코드 쿠키는 제거
  res.cookies.set("otp_code", "", { path: "/", maxAge: 0 });
  res.cookies.set("otp_expires", "", { path: "/", maxAge: 0 });

  return res;
}
