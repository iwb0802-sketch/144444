import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";

export const runtime = "nodejs";

function safeFileName(name: string) {
  return String(name || "contract").replace(/[\\/:*?"<>|]/g, "_");
}

function clean(value: unknown) {
  return String(value ?? "-");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";

  if (!id) {
    return NextResponse.json({ ok: false, message: "id가 없습니다." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, message: "Supabase 환경변수가 없습니다." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "계약서 데이터를 찾을 수 없습니다." }, { status: 404 });
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // jsPDF 기본 폰트는 한글 폰트 임베딩이 없으므로, 파일 다운로드 안정성을 우선하여 영문 라벨 중심으로 생성
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BNS / INUS MUSIC CONTRACT", 105, 18, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Electronic contract record", 105, 25, { align: "center" });

  let y = 42;

  const line = (label: string, value: unknown) => {
    const text = `${label}: ${clean(value)}`;
    const lines = doc.splitTextToSize(text, 170);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 3;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFontSize(11);
  line("Contract Type", data.contract_type);
  line("Name", data.name);
  line("Phone", data.phone);
  line("Bank Info", data.bank_info || "Can be submitted later");
  line("Memo", data.memo || "-");
  line("Submitted At", data.submitted_at ? new Date(data.submitted_at).toLocaleString("ko-KR") : "-");
  line("Contract ID", data.id);
  line("User Agent", data.user_agent || "-");

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Agreement", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  [
    "This contract was submitted through electronic signature and phone OTP verification.",
    "The submitted record may be used as evidence of contract execution.",
    "Detailed contract terms are displayed on the electronic contract page and stored in the system records."
  ].forEach((t) => {
    const lines = doc.splitTextToSize("- " + t, 170);
    doc.text(lines, 24, y);
    y += lines.length * 6 + 2;
  });

  if (data.signature) {
    try {
      y += 8;
      if (y > 230) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.text("Signature", 20, y);
      y += 5;
      doc.addImage(data.signature, "PNG", 20, y, 70, 35);
    } catch (e) {
      console.error("signature add failed", e);
    }
  }

  const arrayBuffer = doc.output("arraybuffer");
  const fileName = `${safeFileName(data.name)}_${safeFileName(data.contract_type)}_contract.pdf`;

  return new NextResponse(Buffer.from(arrayBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": "no-store"
    }
  });
}
