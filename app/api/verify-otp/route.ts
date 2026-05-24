import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp-store";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = verifyOtp(String(body.phone || ""), String(body.code || ""));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
