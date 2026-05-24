import Link from "next/link";

export default function Page() {
  return (
    <main className="container">
      <div className="card" style={{maxWidth:720, margin:"40px auto", textAlign:"center"}}>
        <div style={{fontSize:48, marginBottom:12}}>🎙️</div>
        <h1 className="title">사회자 계약서</h1>
        <p className="desc">
          현재 사회자 계약서 양식은 준비 중입니다. 우선 축가자 계약서부터 적용되었습니다.
        </p>
        <Link className="btn2" href="/">메인으로 돌아가기</Link>
      </div>
    </main>
  );
}
