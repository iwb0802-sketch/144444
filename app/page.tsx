import Link from "next/link";

export default function Home() {
  return (
    <main className="hero">
      <section className="heroCard">
        <div className="brandPill">BNS / INUS 뮤직 전자계약</div>
        <h1 className="heroTitle">계약서 유형을 선택해주세요</h1>
        <p className="heroDesc">
          휴대폰 인증과 전자서명을 통해 계약서를 간편하게 제출할 수 있습니다.
          제출 완료 후 문자 알림과 구글드라이브 백업이 자동으로 진행됩니다.
        </p>

        <div className="contractGrid">
          <Link className="contractCard" href="/contract/singer">
            <div>
              <div className="contractIcon">🎤</div>
              <h2 className="contractName">축가자 계약서</h2>
              <p className="contractText">싱어/축가 출연자 등록 및 출연 조건에 관한 전자계약서입니다.</p>
            </div>
            <div className="contractGo">작성하기 →</div>
          </Link>

          <Link className="contractCard" href="/contract/host">
            <div>
              <div className="contractIcon">🎙️</div>
              <h2 className="contractName">사회자 계약서</h2>
              <p className="contractText">본식 사회자 계약서입니다. 세부 양식은 준비 중입니다.</p>
            </div>
            <div className="contractGo">준비중 →</div>
          </Link>

          <Link className="contractCard" href="/contract/player">
            <div>
              <div className="contractIcon">🎻</div>
              <h2 className="contractName">연주자 계약서</h2>
              <p className="contractText">연주자 출연 및 행사 진행 조건에 관한 계약서입니다. 세부 양식은 준비 중입니다.</p>
            </div>
            <div className="contractGo">준비중 →</div>
          </Link>
        </div>
      </section>
    </main>
  );
}
