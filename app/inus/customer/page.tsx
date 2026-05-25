"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../supabase";

export default function CustomerContractPage() {
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

  const [form, setForm] = useState({
    eventDate: "",
    eventTime: "",
    eventPlace: "",
    eventType: "",
    ensemble: "",
    applicantName: "",
    applicantPhone: "",
    groomName: "",
    groomPhone: "",
    brideName: "",
    bridePhone: "",
    totalAmount: "",
    deposit: "",
    songRequest: "",
    requestMemo: "",
  });

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

    if (!form.applicantPhone) {
      setOtpError("신청자 연락처를 먼저 입력해주세요.");
      return;
    }

    setOtpLoading(true);
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.applicantPhone })
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
      body: JSON.stringify({ phone: form.applicantPhone, code: otpCode })
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

    if (!form.eventDate || !form.eventTime || !form.eventPlace || !form.eventType || !form.ensemble || !form.applicantName || !form.applicantPhone || !agree) {
      alert("필수 항목과 통합 동의 체크를 완료해주세요.");
      return;
    }

    if (!otpVerified) {
      alert("제출 전 휴대폰 인증을 완료해주세요.");
      return;
    }

    setSaving(true);

    const memo =
      `행사종류: ${form.eventType}\n` +
      `신랑: ${form.groomName || "-"} / ${form.groomPhone || "-"}\n` +
      `신부: ${form.brideName || "-"} / ${form.bridePhone || "-"}\n` +
      `신청곡: ${form.songRequest || "-"}\n` +
      `요청사항: ${form.requestMemo || "-"}\n` +
      `연주 총금액: ${form.totalAmount || "-"}\n` +
      `계약금: ${form.deposit || "-"}`;

    const payload = {
      contract_type: "이너스뮤직 고객",
      name: form.applicantName,
      phone: form.applicantPhone,
      event_date: form.eventDate,
      event_time: form.eventTime,
      event_place: form.eventPlace,
      role_detail: form.ensemble,
      fee: form.totalAmount || "-",
      bank_info: "우리은행 1002-052-598548 신유진",
      memo,
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
      name: form.applicantName,
      phone: form.applicantPhone,
      contractType: "이너스뮤직 고객",
      eventDate: form.eventDate,
      eventTime: form.eventTime,
      eventPlace: form.eventPlace,
      roleDetail: form.ensemble,
      fee: form.totalAmount || "-",
      bankInfo: "우리은행 1002-052-598548 신유진",
      memo,
      signature,
      submittedAt: new Date().toLocaleString("ko-KR"),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      extraFields: {
        brand: "이너스뮤직",
        smsBrand: "이너스뮤직",
        adminType: "이너스뮤직 고객 계약서 제출",
        eventType: form.eventType,
        ensemble: form.ensemble,
        applicantName: form.applicantName,
        applicantPhone: form.applicantPhone,
        groomName: form.groomName,
        groomPhone: form.groomPhone,
        brideName: form.brideName,
        bridePhone: form.bridePhone,
        totalAmount: form.totalAmount || "-",
        deposit: form.deposit || "-",
        songRequest: form.songRequest,
        requestMemo: form.requestMemo,
        account: "우리은행 1002-052-598548 신유진"
      }
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

    fetch("/api/notify-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.applicantName, phone: form.applicantPhone, contractType: "이너스뮤직 고객 계약서 제출" })
    }).catch(console.error);

    fetch("/api/notify-user-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.applicantName, phone: form.applicantPhone, contractType: "이너스뮤직 고객", smsBrand: "이너스뮤직" })
    }).catch(console.error);

    setSaving(false);
    router.push(`/complete?id=${data.id}${pdfUrl ? `&pdfUrl=${encodeURIComponent(pdfUrl)}` : ""}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:12}}>
          <div>
            <div className="brandPill">이너스뮤직</div>
            <h1 className="title">🎼 이너스뮤직 고객 계약서</h1>
            <p className="desc">웨딩 연주 계약 정보를 입력한 뒤 휴대폰 인증, 전자서명, 통합 동의를 완료해주세요.</p>
          </div>
          <Link className="btn2" href="/inus">메인</Link>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="contractPaper">
          <h2>이너스뮤직 고객 계약서</h2>

          <h3>제1조 (개요)</h3>
          <p>
            본 계약은 고객의 웨딩 연주를 위해 필요한 제반 사항을 연주업체 이너스뮤직에서 제공함에 있어
            계약 당사자인 고객과 이너스뮤직의 역할과 의무에 관한 법률관계를 규정하여 상호 원활한 웨딩 연주 진행을 목적으로 한다.
          </p>

          <h3>제2조 (계약사항)</h3>
          <p>연주 일시, 행사 장소, 행사 종류, 연주 편성, 신청자 정보, 신랑·신부 정보, 연주 총금액 및 계약금은 본 전자계약서 입력 내용에 따른다.</p>
          <ul>
            <li>연주 주관: 음악 컨설팅 이너스뮤직</li>
            <li>입금 계좌번호: 우리은행 1002-052-598548 신유진</li>
            <li>상담번호: 02-423-2772 / 010-4280-5468</li>
          </ul>

          <h3>제3조 (요청사항)</h3>
          <p>신청곡명 및 기타 요청사항은 본 전자계약서에 입력한 내용을 기준으로 하며, 세부 진행은 상호 협의에 따른다.</p>

          <h3>제4조 (고객약관)</h3>
          <ol>
            <li>기타 계약서에 명시되지 않은 사항은 일반 상관례와 도의에 따른다.</li>
            <li>예약과 동시에 계약의 효력이 인정된다.</li>
            <li>당일 예식 시작 시간 안에 연주자의 미도착으로 인해 연주가 정상적으로 이행되지 못했을 경우, 객관적으로 연주의 품질에 이상이 있을 경우, 기타 중대한 사유로 인해 예식에 차질이 생길 경우 해당 상품의 2배 환불을 원칙으로 한다.</li>
            <li>취소로 인한 환불은 예식 일주일 전까지 가능하며, 이후에는 계약금은 환불되지 않는다.</li>
            <li>고객이 사전 협의 없이 인터넷 사이트 등에 검증되지 않은 악성 게시글을 올려 이너스뮤직에 영업 손실을 줄 경우 보상받을 수 없으며 법적인 제재를 받을 수 있다.</li>
            <li>고객과 이너스뮤직은 이상의 계약내용을 성실히 수행할 것을 상호 약속한다.</li>
          </ol>
        </section>

        <h2 className="formSectionTitle">계약 정보 입력</h2>

        <div className="grid">
          <label className="field"><span>연주일 *</span><input className="input" type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} /></label>
          <label className="field"><span>연주 시간 *</span><input className="input" type="time" value={form.eventTime} onChange={(e) => update("eventTime", e.target.value)} /></label>
        </div>

        <label className="field"><span>행사 장소 *</span><input className="input" value={form.eventPlace} onChange={(e) => update("eventPlace", e.target.value)} placeholder="예식장명 또는 주소" /></label>

        <div className="grid">
          <label className="field"><span>행사 종류 *</span><input className="input" value={form.eventType} onChange={(e) => update("eventType", e.target.value)} placeholder="결혼식, 돌잔치, 기업행사 등" /></label>
          <label className="field"><span>연주 편성 *</span><input className="input" value={form.ensemble} onChange={(e) => update("ensemble", e.target.value)} placeholder="예: 3중주, 4중주, 성악 등" /></label>
        </div>

        <div className="grid">
          <label className="field"><span>신청자 성함 *</span><input className="input" value={form.applicantName} onChange={(e) => update("applicantName", e.target.value)} /></label>
          <label className="field"><span>신청자 연락처 *</span><input className="input" value={form.applicantPhone} onChange={(e) => update("applicantPhone", e.target.value)} placeholder="010-0000-0000" /></label>
        </div>

        <div className="grid">
          <label className="field"><span>신랑님 성함</span><input className="input" value={form.groomName} onChange={(e) => update("groomName", e.target.value)} /></label>
          <label className="field"><span>신랑님 연락처</span><input className="input" value={form.groomPhone} onChange={(e) => update("groomPhone", e.target.value)} /></label>
        </div>

        <div className="grid">
          <label className="field"><span>신부님 성함</span><input className="input" value={form.brideName} onChange={(e) => update("brideName", e.target.value)} /></label>
          <label className="field"><span>신부님 연락처</span><input className="input" value={form.bridePhone} onChange={(e) => update("bridePhone", e.target.value)} /></label>
        </div>

        <div className="grid">
          <label className="field"><span>연주 총금액 (선택)</span><input className="input" value={form.totalAmount} onChange={(e) => update("totalAmount", e.target.value)} placeholder="모르면 비워두세요" /></label>
          <label className="field"><span>계약금 (선택)</span><input className="input" value={form.deposit} onChange={(e) => update("deposit", e.target.value)} placeholder="모르면 비워두세요" /></label>
        </div>

        <label className="field"><span>신청곡명</span><input className="input" value={form.songRequest} onChange={(e) => update("songRequest", e.target.value)} placeholder="원하시는 곡명을 입력해주세요." /></label>
        <label className="field"><span>기타 요청 사항</span><textarea className="input" style={{height:90}} value={form.requestMemo} onChange={(e) => update("requestMemo", e.target.value)} placeholder="기타 특이사항을 입력해주세요." /></label>

        <div className="field" style={{background:"#f8fafc", padding:16, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <span>휴대폰 인증 *</span>
          <p style={{margin:"0 0 10px", color:"#666", fontSize:14}}>신청자 연락처로 인증번호를 발송하고 확인합니다.</p>
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
          <div className="canvasBox"><canvas ref={canvasRef} width={760} height={180} style={{width:"100%", height:180}} onPointerDown={start} onPointerMove={move} onPointerUp={() => setDrawing(false)} onPointerLeave={() => setDrawing(false)} /></div>
          <button type="button" className="btn2" onClick={clearSign}>서명 지우기</button>
        </div>

        <label style={{display:"flex", gap:10, background:"#f5f5f5", padding:14, borderRadius:12, marginBottom:18}}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>본인은 본 계약 내용을 충분히 확인하였으며, 개인정보 수집 및 이용, 전자계약 체결 방식에 동의합니다.</span>
        </label>

        <button className="btn" style={{width:"100%"}} disabled={saving}>{saving ? "제출 중..." : "이너스뮤직 고객 계약서 제출하기"}</button>
      </form>
    </main>
  );
}
