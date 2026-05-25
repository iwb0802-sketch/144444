"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../supabase";
import { ContractData } from "../../types";

function CompleteInner() {
  const id = useSearchParams().get("id") || "";
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("contracts").select("*").eq("id", id).single();
      if (!error && data) setData(data as ContractData);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  const downloadPdf = async () => {
    if (!printRef.current || !data) return;

    try {
      setPdfLoading(true);

      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      const safeName = (data.name || "계약자").replace(/[\\/:*?"<>|]/g, "_");
      const safeType = (data.contract_type || "계약서").replace(/[\\/:*?"<>|]/g, "_");
      pdf.save(`${safeName}_${safeType}_계약서.pdf`);
    } catch (err) {
      console.error(err);
      alert("PDF 다운로드 중 오류가 발생했습니다. 인쇄/PDF 저장 버튼을 이용해주세요.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <main className="container"><div className="card">불러오는 중...</div></main>;
  if (!data) return <main className="container"><div className="card">계약서 데이터를 찾을 수 없습니다.</div></main>;

  return (
    <main className="container">
      <div className="card">
        <div className="noPrint" style={{marginBottom:20}}>
          <h1 className="title">제출 완료</h1>
          <p className="desc">
            계약서가 정상 제출되었습니다. 아래 버튼으로 PDF 파일을 다운로드할 수 있습니다.
          </p>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
            <button className="btn" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? "PDF 생성 중..." : "PDF 다운로드"}
            </button>
            <button className="btn2" onClick={() => window.print()}>
              인쇄/PDF 저장
            </button>
            <Link className="btn2" href="/">메인</Link>
          </div>
        </div>

        <section className="printArea" ref={printRef}>
          <div className="printTitle">BNS / INUS 뮤직 {data.contract_type} 계약서</div>
          <div className="row"><div className="label">성명</div><div className="value">{data.name}</div></div>
          <div className="row"><div className="label">연락처</div><div className="value">{data.phone}</div></div>
          <div className="row"><div className="label">계약유형</div><div className="value">{data.contract_type}</div></div>
          <div className="row"><div className="label">계좌정보</div><div className="value">{data.bank_info || "추후 제출 가능"}</div></div>
          <div className="row"><div className="label">특이사항</div><div className="value">{data.memo || "-"}</div></div>
          <div className="row"><div className="label">제출 시간</div><div className="value">{new Date(data.submitted_at).toLocaleString("ko-KR")}</div></div>
          <div className="row"><div className="label">계약 ID</div><div className="value">{data.id}</div></div>
          <div className="row"><div className="label">브라우저 정보</div><div className="value">{data.user_agent}</div></div>

          <div style={{marginTop:30}}>
            <strong>전자서명</strong><br />
            {data.signature && <img className="signImg" src={data.signature} alt="signature" />}
          </div>

          <div style={{marginTop:28, fontSize:13, color:"#333", lineHeight:1.65}}>
            본 계약은 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료를 통해 전자 방식으로 체결되었으며,
            제출 기록은 계약 체결 증빙 자료로 활용될 수 있습니다.
          </div>
        </section>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<main className="container"><div className="card">불러오는 중...</div></main>}>
      <CompleteInner />
    </Suspense>
  );
}
