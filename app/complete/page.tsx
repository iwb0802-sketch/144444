"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../supabase";
import { ContractData } from "../../types";

function CompleteInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("contracts").select("*").eq("id", id).single();
      if (!error && data) setData(data as ContractData);
      setLoading(false);
    }
    if (id) load();
  }, [id]);

  if (loading) return <main className="container"><div className="card">불러오는 중...</div></main>;
  if (!data) return <main className="container"><div className="card">계약서 데이터를 찾을 수 없습니다.</div></main>;


  return (
    <main className="container">
      <div className="card">
        <div className="noPrint" style={{marginBottom:20}}>
          <h1 className="title">제출 완료</h1>
         <p className="desc">
  계약서가 정상 제출되었습니다.
  아래 계약 내용은 제출 기록 기준으로 표시되며,
  원본 계약서는 요청 시 발부됩니다.
</p>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
            <button className="btn" disabled>
  원본 계약서는 요청 시 발부됩니다
</button>
            <button className="btn2" onClick={() => window.print()}>현재 화면 인쇄</button>
            <Link className="btn2" href="/">닫기</Link>
          </div>
        </div>
        <section className="printArea">
          <div className="printTitle">{data.contract_type} 계약서</div>
          <div className="row"><div className="label">성명</div><div className="value">{data.name}</div></div>
          <div className="row"><div className="label">연락처</div><div className="value">{data.phone}</div></div>
          <div className="row"><div className="label">계약유형</div><div className="value">{data.contract_type}</div></div>
          <div className="row"><div className="label">계좌정보</div><div className="value">{data.bank_info || "추후 제출 가능"}</div></div>
          <div className="row"><div className="label">특이사항</div><div className="value">{data.memo || "-"}</div></div>
          <div className="row"><div className="label">제출 시간</div><div className="value">{new Date(data.submitted_at).toLocaleString("ko-KR")}</div></div>
          <div className="row"><div className="label">계약 ID</div><div className="value">{data.id}</div></div>
          
<div style={{ marginTop: 30 }}>
  <strong>전자서명</strong>
  <br />
  {data.signature && (
    <img
      className="signImg"
      src={data.signature}
      alt="signature"
    />
  )}
</div>

<div style={{ marginTop: 20 }}>
  <strong>회사 직인</strong>
  <br />
  <img
    src="/stamp.jpg"
    alt="company stamp"
    style={{
      width: 90,
      height: 90,
      objectFit: "contain"
    }}
  />
</div>
        </section>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return <Suspense fallback={<main className="container"><div className="card">불러오는 중...</div></main>}><CompleteInner /></Suspense>;
}
