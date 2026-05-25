import { NextResponse } from "next/server";
import { sendSolapiSms } from "@/lib/solapi";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const adminPhone = (process.env.ADMIN_PHONE || "").replace(/[^0-9]/g, "");

  const name = String(body.name || "-");
  const phone = String(body.phone || "-");
  const contractType = String(body.contractType || "-");

  const text =
    `[BNS,INUS 뮤직 계약서 제출]\n` +
    `유형: ${contractType}\n` +
    `성명: ${name}\n` +
    `연락처: ${phone}\n` +
    `구분: 등록계약`;

  const result = await sendSolapiSms(adminPhone, text);

  if (!result.ok) {
    return NextResponse.json({ ok: false, result }, { status: 500 });
  }

  return NextResponse.json({ ok: true, result });
}
