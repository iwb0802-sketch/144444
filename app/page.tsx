
import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="card">
        <h1 className="title">계약서 테스트 프로그램</h1>
        <p className="desc">
          연주자/사회자가 계약 정보를 작성하고 서명 후 제출하는 테스트 버전입니다.
        </p>
        <div style={{display:"flex", gap:12}}>
          <Link className="btn" href="/contract">계약서 작성</Link>
          <Link className="btn2" href="/admin">관리자 확인</Link>
        </div>
      </div>
    </main>
  );
}
