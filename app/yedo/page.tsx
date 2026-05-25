import Link from "next/link";

export default function YedoHomePage() {
  return (
    <main className="hero">
      <section className="heroCard">
        <div className="brandPill">수트맨MC (팀BNS) 전자계약</div>
        <h1 className="heroTitle">예식도우미 계약서</h1>
        <p className="heroDesc">예식도우미 관리직원 계약서를 휴대폰 인증과 전자서명으로 제출할 수 있습니다.</p>
        <div className="contractGrid" style={{ gridTemplateColumns: "1fr" }}>
          <Link className="contractCard" href="/yedo/contract">
            <div>
              <div className="contractIcon">🤵</div>
              <h2 className="contractName">수트맨MC (팀BNS) 관리직원 계약서</h2>
              <p className="contractText">예식도우미 용역도급제 계약서입니다.</p>
            </div>
            <div className="contractGo">작성하기 →</div>
          </Link>
        </div>
      </section>
    </main>
  );
}
