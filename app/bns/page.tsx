import Link from "next/link";

const contracts = [
  { href: "/bns/contract/singer", icon: "🎤", title: "축가자 계약서", desc: "축가자 등록 및 출연 조건에 관한 전자계약서입니다." },
  { href: "/bns/contract/host", icon: "🎙️", title: "사회자 계약서", desc: "사회자 등록 및 진행 조건에 관한 전자계약서입니다." },
  { href: "/bns/contract/player", icon: "🎻", title: "연주자 계약서", desc: "연주자 등록 및 연주 조건에 관한 전자계약서입니다." }
];

export default function BnsHomePage() {
  return (
    <main className="hero">
      <section className="heroCard">
        <div className="brandPill">BNS / INUS 뮤직 출연자 전자계약</div>
        <h1 className="heroTitle">계약서 유형을 선택해주세요</h1>
        <p className="heroDesc">
          휴대폰 인증과 전자서명을 통해 계약서를 제출할 수 있습니다.
        </p>
        <div className="contractGrid">
          {contracts.map((item) => (
            <Link className="contractCard" href={item.href} key={item.href}>
              <div>
                <div className="contractIcon">{item.icon}</div>
                <h2 className="contractName">{item.title}</h2>
                <p className="contractText">{item.desc}</p>
              </div>
              <div className="contractGo">작성하기 →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
