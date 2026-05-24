"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getContract } from "../../storage";

function CompleteInner() {
  const id = useSearchParams().get("id") || "";
  const data = getContract(id);

  if (!data) {
    return (
      <main className="container">
        <div className="card">계약서 데이터를 찾을 수 없습니다.</div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="card">
        <div className="noPrint" style={{marginBottom:20}}>
          <h1 className="title">제출 완료</h1>
          <p className="desc">아래 계약서를 확인하고 “PDF 저장/인쇄” 버튼을 누르면 PDF로 저장할 수 있습니다.</p>
          <div style={{display:"flex", gap:10}}>
            <button className="btn" onClick={() => window.print()}>PDF 저장/인쇄</button>
            <Link className="btn2" href="/admin">관리자 확인</Link>
          </div>
        </div>

        <section className="printArea">
          <div className="printTitle">이너스뮤직 {data.contractType} 계약서</div>
          <div className="row"><div className="label">성명</div><div className="value">{data.name}</div></div>
          <div className="row"><div className="label">연락처</div><div className="value">{data.phone}</div></div>
          <div className="row"><div className="label">행사일</div><div className="value">{data.eventDate}</div></div>
          <div className="row"><div className="label">행사 시간</div><div className="value">{data.eventTime}</div></div>
          <div className="row"><div className="label">행사 장소</div><div className="value">{data.eventPlace}</div></div>
          <div className="row"><div className="label">역할 상세</div><div className="value">{data.roleDetail}</div></div>
          <div className="row"><div className="label">계약 금액</div><div className="value">{data.fee}</div></div>
          <div className="row"><div className="label">입금 계좌</div><div className="value">{data.bankInfo}</div></div>
          <div className="row"><div className="label">특이사항</div><div className="value">{data.memo}</div></div>
          <div className="row"><div className="label">제출 시간</div><div className="value">{data.submittedAt}</div></div>
          <div style={{marginTop:30}}>
            <strong>서명</strong><br />
            {data.signature && <img className="signImg" src={data.signature} alt="signature" />}
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
