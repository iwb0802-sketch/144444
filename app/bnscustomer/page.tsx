import Link from "next/link";

export default function BrandCustomerHomePage() {
  return (
    <main className="hero">
      <section className="heroCard">
        <div className="brandPill">비엔에스뮤직 전자계약</div>
        <h1 className="heroTitle">비엔에스뮤직 고객 계약서</h1>
        <p className="heroDesc">웨딩 연주 신청 정보를 입력하고 휴대폰 인증, 전자서명을 통해 계약서를 제출할 수 있습니다.</p>

        <div className="contractGrid" style={{gridTemplateColumns:"1fr"}}>
          <Link className="contractCard" href="/bnscustomer/customer">
            <div>
              <div className="contractIcon">🎼</div>
              <h2 className="contractName">웨딩 연주 고객 계약서</h2>
              <p className="contractText">연주일시, 행사장소, 연주편성, 신청곡 및 요청사항을 입력하는 고객용 계약서입니다.</p>
            </div>
            <div className="contractGo">작성하기 →</div>
          </Link>
        </div>
      </section>
    </main>
  );
}
