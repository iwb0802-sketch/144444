import Link from "next/link";

export default function ContractSelectPage() {
  return (
    <main className="container">
      <div className="card" style={{maxWidth:720, margin:"40px auto"}}>
        <h1 className="title">계약서 선택</h1>
        <p className="desc">작성할 계약서 유형을 선택해주세요.</p>
        <div style={{display:"grid", gap:12}}>
          <Link className="btn" href="/contract/singer">축가자 계약서</Link>
          <Link className="btn2" href="/contract/host">사회자 계약서 준비중</Link>
          <Link className="btn2" href="/contract/player">연주자 계약서 준비중</Link>
        </div>
      </div>
    </main>
  );
}
