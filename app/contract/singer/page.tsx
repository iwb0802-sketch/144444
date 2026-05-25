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
  const [otpError, setOtpError] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", bankInfo: "", memo: "" });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

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
    setOtpError("");
    if (!form.phone) {
      setOtpError("연락처를 먼저 입력해주세요.");
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
      setOtpError(data.message || "인증번호 발송에 실패했습니다.");
      return;
    }

    setOtpSent(true);
    setOtpVerified(false);
    alert("인증번호를 문자로 발송했습니다.");
  };

  const verifyOtp = async () => {
    setError("");
    setOtpError("");
    if (!otpCode) {
      setOtpError("인증번호를 입력해주세요.");
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
      setOtpError(data.message || "인증번호 확인에 실패했습니다.");
      return;
    }

    setOtpVerified(true);
    alert("휴대폰 인증이 완료되었습니다.");
  };

  const extractDriveUrl = (backupResponse: any) => {
    if (!backupResponse) return "";
    if (backupResponse.url) return backupResponse.url;
    if (backupResponse.result?.url) return backupResponse.result.url;

    const raw = backupResponse.result;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parsed.url || "";
      } catch {
        return "";
      }
    }

    return "";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const signature = canvasRef.current?.toDataURL("image/png") || "";
    const today = new Date().toISOString().slice(0, 10);

    if (!form.name || !form.phone || !agree) {
      alert("성명, 연락처, 통합 동의 체크는 필수입니다.");
      return;
    }

    if (!otpVerified) {
      alert("제출 전 휴대폰 인증을 완료해주세요.");
      return;
    }

    setSaving(true);

    const payload = {
      contract_type: "축가자",
      name: form.name,
      phone: form.phone,
      event_date: today,
      event_time: "",
      event_place: "개별 진행 행사별 별도 협의",
      role_detail: "BNS / INUS 뮤직 축가자 등록 계약",
      fee: "개별 행사별 별도 협의",
      bank_info: form.bankInfo,
      memo: form.memo,
      signature,
      submit_ip: null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    };

    const { data, error } = await supabase.from("contracts").insert(payload).select("id").single();

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
      contractType: "축가자",
      eventDate: today,
      eventTime: "",
      eventPlace: "개별 진행 행사별 별도 협의",
      roleDetail: "BNS / INUS 뮤직 축가자 등록 계약",
      fee: "개별 행사별 별도 협의",
      bankInfo: form.bankInfo || "추후 제출 가능",
      memo: form.memo,
      signature,
      submittedAt: new Date().toLocaleString("ko-KR"),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : ""
    };

    let pdfUrl = "";
    try {
      const backupRes = await fetch("/api/backup-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupPayload)
      });
      const backupJson = await backupRes.json().catch(() => null);
      pdfUrl = extractDriveUrl(backupJson);
    } catch (err) {
      console.error("Drive backup request failed", err);
    }

    fetch("/api/notify-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, phone: form.phone, contractType: "축가자" }) }).catch(console.error);
    fetch("/api/notify-user-sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, phone: form.phone, contractType: "축가자" }) }).catch(console.error);

    setSaving(false);
    router.push(`/complete?id=${data.id}${pdfUrl ? `&pdfUrl=${encodeURIComponent(pdfUrl)}` : ""}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:12}}>
          <div>
            <div className="brandPill">BNS / INUS 뮤직</div>
            <h1 className="title">🎤 축가자 계약서</h1>
            <p className="desc">계약 내용을 확인한 뒤 휴대폰 인증, 전자서명, 통합 동의를 완료해주세요.</p>
          </div>
          <Link className="btn2" href="/">메인</Link>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="contractPaper">
          <h2>BNS / INUS 뮤직 축가자 계약서</h2>

          <h3>제1조 (계약 당사자)</h3>
          <p>본 계약은 회사 BNS / INUS 뮤직(이하 “갑”)과 출연자(이하 “을”) 간 체결된다.</p>
          <ul>
            <li>상호명: BNS / INUS 뮤직</li>
            <li>대표자: 신유진</li>
            <li>주소: 서울시 광진구 자양로 165 4층</li>
          </ul>

          <h3>제2조 (계약 목적)</h3>
          <p>본 계약은 갑이 진행하는 웨딩 및 각종 행사에 있어 을을 축가 진행 인력으로 등록하고, 향후 개별 요청 시 상호 협의 하에 진행하기 위한 기본 사항을 정함을 목적으로 한다.</p>
          <p>을은 갑의 요청에 대하여 자유롭게 수락 또는 거절할 수 있다.</p>
          <p>다만, 을이 요청을 수락하여 일정이 확정된 이후 부득이한 사정으로 진행이 어려워질 경우, 가능한 한 즉시 갑에게 통지하여야 하며 원칙적으로 행사일 기준 최소 5일 전 사전 협의를 요청하여야 한다.</p>

          <h3>제3조 (업무 내용)</h3>
          <ul>
            <li>웨딩 및 행사 축가 진행</li>
            <li>사전 협의된 곡 및 진행 내용 이행</li>
            <li>행사 진행에 필요한 사전 협의 및 준비</li>
          </ul>

          <h3>제4조 (진행 조건)</h3>
          <ol>
            <li>을은 개별 진행 요청을 수락한 경우 행사 시작 최소 1시간 전 현장에 도착하는 것을 원칙으로 한다.</li>
            <li>을은 사전 협의된 내용과 진행 순서를 성실히 이행하여야 한다.</li>
            <li>을은 행사 특성에 맞는 복장과 태도를 유지하여야 한다.</li>
            <li>을은 사전 협의된 축가곡 및 진행 순서를 준수하여야 한다.</li>
          </ol>

          <h3>제5조 (계약 기간)</h3>
          <p>본 계약 기간은 계약 체결일로부터 1년으로 한다.</p>
          <p>계약 종료 전 별도 해지 의사 표시가 없는 경우 상호 협의 하에 연장할 수 있다.</p>

          <h3>제6조 (수수료 및 정산)</h3>
          <ol>
            <li>진행료 또는 출연료는 개별 행사별 별도 협의한다.</li>
            <li>행사 종료 후 다음 주 금요일까지 정산을 원칙으로 한다.</li>
            <li>비용은 을이 제출한 계좌로 지급한다.</li>
            <li>계좌 정보는 계약 체결 시 또는 추후 별도 제출할 수 있다.</li>
          </ol>

          <h3>제7조 (지각 및 불이행)</h3>
          <p>사전 협의 없는 지각 발생 시 아래 기준을 적용한다.</p>
          <ul>
            <li>행사 시작 30분 전 도착: 5,000원 차감</li>
            <li>행사 시작 20분 전 도착: 10,000원 차감</li>
            <li>행사 정시 도착: 20,000원 차감</li>
          </ul>
          <p>을이 계약조건대로 이행하지 않아 갑에게 금전적 손해가 발생한 경우, 을은 실제 발생한 손해 범위 내에서 배상 책임을 질 수 있다.</p>
          <p>다만, 부득이한 사정이 발생한 경우 예식시간 최소 3시간 전까지 갑에게 통보하고 상호 협의한 경우에는 예외로 한다.</p>
          <p>단, 천재지변, 회사 요청 또는 지시, 교통사고·사건사고 등 객관적 증빙 가능 사유, 기타 갑이 인정하는 불가피한 사유는 예외로 한다.</p>
          <p>을이 확정된 일정을 정당한 사유 없이 이행하지 않거나 행사 진행에 중대한 차질을 발생시키는 경우, 갑은 향후 배정 제한 또는 계약 해지를 할 수 있다.</p>

          <h3>제8조 (계약 해지)</h3>
          <p>상호 합의, 반복적인 계약 위반, 신뢰 관계 훼손, 확정된 일정의 반복적인 불이행이 발생한 경우 계약 해지가 가능하다.</p>

          <h3>제9조 (개인정보 수집 및 이용 동의)</h3>
          <p>갑은 계약 진행 및 운영 관리를 목적으로 성명, 연락처, 계좌정보, 전자서명, 접속기록, 인증기록을 수집·이용할 수 있다.</p>
          <p>이 정보는 행사 요청, 계약 관리, 정산, 연락, 분쟁 대응 및 계약 증빙 목적으로 활용된다.</p>

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
        </div>

        <label className="field">
          <span>입금 계좌 (추후 제출 가능)</span>
          <input className="input" value={form.bankInfo} onChange={(e) => update("bankInfo", e.target.value)} placeholder="예: 국민은행 홍길동 123456-01-xxxxxx / 추후 제출 가능" />
        </label>

        <label className="field">
          <span>특이사항 (선택)</span>
          <textarea className="input" style={{height:90}} value={form.memo} onChange={(e) => update("memo", e.target.value)} placeholder="전달사항이 있다면 입력해주세요." />
        </label>

        <div className="field" style={{background:"#f8fafc", padding:16, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <span>휴대폰 인증 *</span>
          <p style={{margin:"0 0 10px", color:"#666", fontSize:14}}>제출 전 입력한 연락처로 인증번호를 발송하고 확인합니다.</p>
          {otpError && <div className="alert" style={{marginTop:0, marginBottom:10}}>{otpError}</div>}
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            <button type="button" className="btn2" onClick={sendOtp} disabled={otpLoading || saving}>{otpSent ? "인증번호 재발송" : "인증번호 발송"}</button>
            <input className="input" style={{maxWidth:180}} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6자리 입력" disabled={!otpSent || otpVerified} />
            <button type="button" className="btn2" onClick={verifyOtp} disabled={!otpSent || otpVerified || otpLoading || saving}>{otpVerified ? "인증 완료" : "인증 확인"}</button>
          </div>
          {otpVerified && <div className="success" style={{marginTop:10}}>휴대폰 인증이 완료되었습니다.</div>}
        </div>

        <div className="field">
          <span>전자서명 *</span>
          <div className="canvasBox">
            <canvas ref={canvasRef} width={760} height={180} style={{width:"100%", height:180}} onPointerDown={start} onPointerMove={move} onPointerUp={() => setDrawing(false)} onPointerLeave={() => setDrawing(false)} />
          </div>
          <button type="button" className="btn2" onClick={clearSign}>서명 지우기</button>
        </div>

        <label style={{display:"flex", gap:10, background:"#f5f5f5", padding:14, borderRadius:12, marginBottom:18}}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>본인은 본 계약 내용을 충분히 확인하였으며, 개인정보 수집 및 이용, 전자계약 체결 방식(휴대폰 인증 및 전자서명 포함)에 동의합니다.</span>
        </label>

        <button className="btn" style={{width:"100%"}} disabled={saving}>{saving ? "제출 중..." : "축가자 계약서 제출하기"}</button>
      </form>
    </main>
  );
}
