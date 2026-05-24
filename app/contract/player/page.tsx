"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../supabase";

export default function ContractPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    eventDate: "",
    eventTime: "",
    eventPlace: "",
    fee: "",
    bankInfo: "",
    memo: "",
  });

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setDrawing(true);
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const clearSign = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  const sendOtp = async () => {
    setError("");
    if (!form.phone) {
      alert("연락처를 먼저 입력해주세요.");
      return;
    }

    setOtpLoading(true);
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone })
    });
    const data = await res.json().catch(() => ({}));
    setOtpLoading(false);

    if (!res.ok) {
      setError(data.message || "인증번호 발송에 실패했습니다.");
      return;
    }

    setOtpSent(true);
    setOtpVerified(false);
    alert("인증번호를 문자로 발송했습니다.");
  };

  const verifyOtp = async () => {
    setError("");
    if (!otpCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    setOtpLoading(true);
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, code: otpCode })
    });
    const data = await res.json().catch(() => ({}));
    setOtpLoading(false);

    if (!res.ok) {
      setError(data.message || "인증번호 확인에 실패했습니다.");
      return;
    }

    setOtpVerified(true);
    alert("휴대폰 인증이 완료되었습니다.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const c = canvasRef.current;
    const signature = c ? c.toDataURL("image/png") : "";

    if (!form.name || !form.phone || !form.eventDate || !form.eventTime || !form.eventPlace || !form.fee || !agree) {
      alert("성명, 연락처, 행사일, 행사시간, 행사장소, 계약금액, 통합 동의는 필수입니다.");
      return;
    }

    if (!otpVerified) {
      alert("제출 전 휴대폰 인증을 완료해주세요.");
      return;
    }

    setSaving(true);

    const payload = {
      contract_type: "연주자",
      name: form.name,
      phone: form.phone,
      event_date: form.eventDate,
      event_time: form.eventTime,
      event_place: form.eventPlace,
      role_detail: "연주 진행",
      fee: form.fee,
      bank_info: form.bankInfo,
      memo: form.memo,
      signature,
      submit_ip: null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    const { data, error } = await supabase
      .from("contracts")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error(error);
      setSaving(false);
      setError("저장 중 오류가 발생했습니다. Supabase RLS 또는 API 키 설정을 확인해주세요.");
      return;
    }

    const backupPayload = {
      id: data.id,
      name: form.name,
      phone: form.phone,
      contractType: "연주자",
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      eventPlace: form.eventPlace,
      roleDetail: "연주 진행",
      fee: form.fee,
      bankInfo: form.bankInfo || "추후 제출 가능",
      memo: form.memo,
      signature,
      submittedAt: new Date().toLocaleString("ko-KR"),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    };

    fetch("/api/backup-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backupPayload)
    }).catch((err) => console.error("Drive backup request failed", err));

    fetch("/api/notify-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        contractType: "연주자",
        eventDate: form.eventDate,
        fee: form.fee
      })
    }).catch((err) => console.error("Admin SMS request failed", err));

    fetch("/api/notify-user-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        contractType: "연주자",
        eventDate: form.eventDate
      })
    }).catch((err) => console.error("User SMS request failed", err));

    setSaving(false);
    router.push(`/complete?id=${data.id}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:12}}>
          <div>
            <div className="brandPill">BNS / INUS 뮤직</div>
            <h1 className="title">🎻 연주자 계약서</h1>
            <p className="desc">건별 프리랜서 계약 내용을 확인한 뒤 휴대폰 인증, 전자서명, 통합 동의를 완료해주세요.</p>
          </div>
          <Link className="btn2" href="/">메인</Link>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="contractPaper">
          <h2>BNS / INUS 뮤직 연주자 계약서</h2>

          <h3>제1조 (계약 당사자)</h3>
          <p>본 계약은 회사 BNS / INUS 뮤직(이하 “갑”)과 프리랜서 출연자(이하 “을”) 간 체결된다.</p>
          <ul>
            <li>상호명: BNS / INUS 뮤직</li>
            <li>대표자: 신유진</li>
            <li>주소: 서울시 광진구 자양로 165 4층</li>
          </ul>

          <h3>제2조 (계약 목적)</h3>
          <p>본 계약은 갑이 진행하는 웨딩 및 행사에서 을이 연주 진행 업무를 수행함에 있어 필요한 기본 사항을 정함을 목적으로 한다.</p>
          <p>본 계약은 특정 행사 1건에 대한 건별 프리랜서 계약이며, 갑과 을 사이에 근로관계가 성립하는 것으로 해석되지 않는다.</p>

          <h3>제3조 (행사 정보)</h3>
          <p>행사일, 행사시간, 행사장소, 계약금액은 을이 본 전자계약서에 입력한 내용 및 갑과 을이 사전에 협의한 내용을 기준으로 한다.</p>

          <h3>제4조 (업무 내용)</h3>
          <ul>
            <li>웨딩 및 행사 연주 진행</li>
            <li>사전 협의된 곡 및 편성에 따른 연주</li>
            <li>악기 및 연주 준비</li>
          </ul>

          <h3>제5조 (출연 조건)</h3>
          <ol>
            <li>을은 행사 시작 최소 1시간 전 현장에 도착하는 것을 원칙으로 한다.</li>
            <li>을은 사전 협의된 출연 및 진행 내용을 성실히 이행하여야 한다.</li>
            <li>을은 행사 특성에 맞는 복장과 태도를 유지하여야 한다.</li>
            <li>을은 본인의 악기 및 필요한 연주 준비물을 사전에 준비하여야 한다.</li>
            <li>을은 행사 특성에 맞는 복장과 연주 태도를 유지하여야 한다.</li>
          </ol>

          <h3>제6조 (출연료 및 정산)</h3>
          <ol>
            <li>출연료는 본 계약서에 입력된 계약금액 또는 사전 협의 금액을 기준으로 한다.</li>
            <li>행사 종료 후 다음 주 금요일까지 정산을 원칙으로 한다.</li>
            <li>출연료는 을이 제출한 계좌로 지급한다.</li>
            <li>계좌 정보는 계약 체결 시 또는 추후 별도 제출할 수 있다.</li>
          </ol>

          <h3>제7조 (지각 및 불이행)</h3>
          <p>사전 협의 없는 지각 발생 시 아래 기준을 적용한다.</p>
          <ul>
            <li>행사 시작 30분 전 도착: 5,000원 차감</li>
            <li>행사 시작 20분 전 도착: 10,000원 차감</li>
            <li>행사 정시 도착: 20,000원 차감</li>
          </ul>
          <p>단, 천재지변, 회사 요청 또는 지시, 교통사고·사건사고 등 객관적 증빙 가능 사유, 기타 갑이 인정하는 불가피한 사유는 예외로 한다.</p>
          <p>을이 정당한 사유 없이 확정된 출연 또는 진행을 이행하지 않거나 행사 진행에 중대한 차질을 발생시키는 경우, 갑은 향후 배정 제한 또는 계약 해지를 할 수 있다.</p>

          <h3>제8조 (계약 변경 및 취소)</h3>
          <p>행사 일정, 장소, 업무 내용 등에 변경이 필요한 경우 갑과 을은 가능한 한 즉시 상호 협의한다.</p>
          <p>을이 부득이한 사정으로 계약 이행이 어려운 경우 가능한 한 즉시 갑에게 통지하고 협의하여야 한다.</p>

          <h3>제9조 (개인정보 수집 및 이용 동의)</h3>
          <p>갑은 계약 진행 및 출연 관리 목적으로 성명, 연락처, 계좌정보, 전자서명, 접속기록, 인증기록을 수집·이용할 수 있다.</p>
          <p>이 정보는 행사 배정, 계약 관리, 정산, 연락, 분쟁 대응 및 계약 증빙 목적으로 활용된다.</p>

          <h3>제10조 (전자계약 체결)</h3>
          <p>본 계약은 전자 방식으로 체결되며, 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료 시 계약이 성립한 것으로 본다. 전자 기록은 계약 체결 증빙 자료로 활용될 수 있다.</p>
        </section>

        <h2 className="formSectionTitle">계약 정보 입력</h2>

        <div className="grid">
          <label className="field">
            <span>성명 *</span>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="홍길동" />
          </label>

          <label className="field">
            <span>연락처 *</span>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="010-0000-0000" />
          </label>

          <label className="field">
            <span>행사일 *</span>
            <input className="input" type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
          </label>

          <label className="field">
            <span>행사시간 *</span>
            <input className="input" type="time" value={form.eventTime} onChange={(e) => update("eventTime", e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>행사장소 *</span>
          <input className="input" value={form.eventPlace} onChange={(e) => update("eventPlace", e.target.value)} placeholder="웨딩홀/행사장명 또는 주소" />
        </label>

        <label className="field">
          <span>계약금액 *</span>
          <input className="input" value={form.fee} onChange={(e) => update("fee", e.target.value)} placeholder="예: 300,000원" />
        </label>

        <label className="field">
          <span>입금 계좌 (추후 제출 가능)</span>
          <input
            className="input"
            value={form.bankInfo}
            onChange={(e) => update("bankInfo", e.target.value)}
            placeholder="예: 국민은행 홍길동 123456-01-xxxxxx / 추후 제출 가능"
          />
        </label>

        <label className="field">
          <span>특이사항 (선택)</span>
          <textarea className="input" style={{height:90}} value={form.memo} onChange={(e) => update("memo", e.target.value)} placeholder="전달사항이 있다면 입력해주세요." />
        </label>

        <div className="field" style={{background:"#f8fafc", padding:16, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <span>휴대폰 인증 *</span>
          <p style={{margin:"0 0 10px", color:"#666", fontSize:14}}>
            제출 전 입력한 연락처로 인증번호를 발송하고 확인합니다.
          </p>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button type="button" className="btn2" onClick={sendOtp} disabled={otpLoading || saving}>
              {otpSent ? "인증번호 재발송" : "인증번호 발송"}
            </button>
            <input
              className="input"
              style={{maxWidth:180}}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6자리 입력"
              disabled={!otpSent || otpVerified}
            />
            <button type="button" className="btn2" onClick={verifyOtp} disabled={!otpSent || otpVerified || otpLoading || saving}>
              {otpVerified ? "인증 완료" : "인증 확인"}
            </button>
          </div>
          {otpVerified && <div className="success" style={{marginTop:10}}>휴대폰 인증이 완료되었습니다.</div>}
        </div>

        <div className="field">
          <span>전자서명 *</span>
          <div className="canvasBox">
            <canvas
              ref={canvasRef}
              width={760}
              height={180}
              style={{width:"100%", height:180}}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={() => setDrawing(false)}
              onPointerLeave={() => setDrawing(false)}
            />
          </div>
          <button type="button" className="btn2" onClick={clearSign}>서명 지우기</button>
        </div>

        <label style={{display:"flex", gap:10, background:"#f5f5f5", padding:14, borderRadius:12, marginBottom:18}}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>
            본인은 본 계약 내용을 충분히 확인하였으며, 개인정보 수집 및 이용,
            전자계약 체결 방식(휴대폰 인증 및 전자서명 포함)에 동의합니다.
          </span>
        </label>

        <button className="btn" style={{width:"100%"}} disabled={saving}>
          {saving ? "제출 중..." : "연주자 계약서 제출하기"}
        </button>
      </form>
    </main>
  );
}
