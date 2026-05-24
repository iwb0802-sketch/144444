
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword) {
    return NextResponse.json({ ok: false, message: "ADMIN_PASSWORD 환경변수가 없습니다." }, { status: 500 });
  }

  if (password !== adminPassword) {
    return NextResponse.json({ ok: false, message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return res;
}
