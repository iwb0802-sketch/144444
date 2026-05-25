"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../supabase";

export default function YedoContractPage() {
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
  const [form, setForm] = useState({ name:"", phone:"", address:"", rrn:"", bankInfo:"", memo:"" });

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
      body: JSON.stringify({ phone: form.phone, smsBrand: "웨딩계약서" })
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

    if (!form.name || !form.phone || !form.address || !form.rrn || !agree) {
      alert("성명, 연락처, 주소, 주민등록번호, 통합 동의 체크는 필수입니다.");
      return;
    }

    if (!otpVerified) {
      alert("제출 전 휴대폰 인증을 완료해주세요.");
      return;
    }

    setSaving(true);

    const memo =
      `주소: ${form.address}\n` +
      `주민등록번호: ${form.rrn}\n` +
      `특이사항: ${form.memo || "-"}`;

    const payload = {
      contract_type: "예식도우미",
      name: form.name,
      phone: form.phone,
      event_date: today,
      event_time: "",
      event_place: "사전 스케줄 협의 행사장 및 지정 업장",
      role_detail: "수트맨MC (팀BNS) 예식도우미 관리직원 계약",
      fee: "회사규정에 내규",
      bank_info: form.bankInfo,
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
      name: form.name,
      phone: form.phone,
      contractType: "예식도우미",
      eventDate: today,
      eventTime: "",
      eventPlace: "사전 스케줄 협의 행사장 및 지정 업장",
      roleDetail: "수트맨MC (팀BNS) 예식도우미 관리직원 계약",
      fee: "회사규정에 내규",
      bankInfo: form.bankInfo || "-",
      memo,
      signature,
      submittedAt: new Date().toLocaleString("ko-KR"),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      extraFields: {
        brand: "수트맨MC (팀BNS)",
        smsBrand: "웨딩계약서",
        adminType: "웨딩계약서 제출",
        address: form.address,
        rrn: form.rrn,
        bankInfo: form.bankInfo || "-",
        jobType: "예식도우미"
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
      body: JSON.stringify({ name: form.name, phone: form.phone, contractType: "웨딩계약서 제출" })
    }).catch(console.error);

    fetch("/api/notify-user-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone, contractType: "계약서", smsBrand: "웨딩계약서" })
    }).catch(console.error);

    setSaving(false);
    router.push(`/complete?id=${data.id}${pdfUrl ? `&pdfUrl=${encodeURIComponent(pdfUrl)}` : ""}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:12}}>
          <div>
            <div className="brandPill">수트맨MC (팀BNS)</div>
            <h1 className="title">🤵 예식도우미 계약서</h1>
            <p className="desc">계약 내용을 확인한 뒤 휴대폰 인증, 전자서명, 통합 동의를 완료해주세요.</p>
          </div>
          <Link className="btn2" href="/yedo">예도 메인</Link>
        </div>

        {error && <div className="alert">{error}</div>}

        <section className="contractPaper">
          <h2>수트맨MC (팀BNS) 관리직원 계약서 (용역도급제)</h2>

          <p>수트맨MC (팀BNS)(이하 “고용주”)와 근로자(이하 “고용자”)는 상호 협의 하에 아래 사항에 대하여 성실히 준수할 것을 서약하며 본 계약을 체결한다.</p>

          <h3>1. 근로조건</h3>
          <p><strong>(가) 근무시간</strong></p>
          <p>스케줄 근무</p>
          <p>(주마다 예식 스케줄 별로 상이하며, 배정받은 근무일에 따라 상이함)</p>

          <p><strong>(나) 임금</strong></p>
          <p>① 페이 : 회사규정에 내규</p>
          <p>(모든 수당이 포함된 사전협의된 금액으로, 개별 대면&유선통보 / 3.3% 원천징수)</p>
          <p>② 지급방법 : 근무 후 D+14일 (매주 일요일) 계좌입금</p>

          <h3>2. 취업장소</h3>
          <p>사전 스케줄 협의가 된 수트맨MC (팀BNS)와 계약된 행사장 및 지정 업장</p>
          <p>※ 다만 근무자의 편의를 위하여, 근무자가 원할 시 가급적 고정된 업장으로 배정되도록 노력할 수 있다.</p>

          <h3>3. 직종</h3>
          <p>예식도우미</p>

          <h3>4. 계약기간</h3>
          <p>본 계약은 계약 체결일로부터 효력이 발생하며 계약기간은 별도로 정하지 아니한다.</p>
          <p>계약의 유지, 종료 및 연장에 관한 사항은 제6조에 따른다.</p>

          <h3>5. 계약해지 사유</h3>
          <ol>
            <li>업무를 태만히 하거나 업무수행능력이 부족한 때</li>
            <li>규정 또는 정당한 업무지침을 위반한 때 (구두 포함 경고 및 개선요구에도 시정되지 않을 때)</li>
            <li>사측이 인정하는 정당한 이유 없이 무단결근 및 지각 시</li>
            <li>도박, 음주, 폭행, 파괴, 풍기문란 등을 일으켰을 때</li>
            <li>계약관계에 있는 현지 업장 측의 지속적인 근무 민원이 들어올 때</li>
          </ol>

          <h3>손해배상</h3>
          <p>스케줄 배정이 완료된 이후 갑작스러운 당일 결근(사유불문) 또는 무단결근으로 인해 회사에 금전적인 손해가 발생할 경우 회사는 실제 발생 손해 범위 내에서 손해배상을 청구할 수 있으며 고용자는 이에 동의한다.</p>
          <p>(대체 인원 구할 시 문제 없음)</p>

          <h3>6. 계약 연장</h3>
          <p>고용주와 고용자는 계약 종료 의사에 대한 별도의 서면 통보가 없는 경우 계약은 지속 유지된다.</p>
          <p>고용자가 근무 종료를 원할 경우 반드시 최소 4주 전 통보해야 한다. (필수)</p>
          <p>고용자는 업무 종료 전 새로운 고용자에게 업무 인수인계를 성실히 진행하여야 한다.</p>

          <h3>7. 기타</h3>
          <p>본 계약서에 명시되지 않은 사항은 취업규칙 및 관련 법령을 준용한다.</p>
        </section>

        <h2 className="formSectionTitle">계약 정보 입력</h2>

        <div className="grid">
          <label className="field"><span>성명 *</span><input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="홍길동" /></label>
          <label className="field"><span>연락처 *</span><input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="010-0000-0000" /></label>
        </div>

        <label className="field"><span>주소 *</span><input className="input" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="주소를 입력해주세요." /></label>
        <label className="field"><span>주민등록번호 (13자리 전체 입력 / 원천세 신고 처리에 필요한 필수 정보) *</span><input className="input" value={form.rrn} onChange={(e) => update("rrn", e.target.value)} placeholder="예: 900101-1234567" /></label>
        <label className="field"><span>입금 계좌</span><input className="input" value={form.bankInfo} onChange={(e) => update("bankInfo", e.target.value)} placeholder="예: 국민은행 홍길동 123456-01-xxxxxx" /></label>
        <label className="field"><span>특이사항</span><textarea className="input" style={{height:90}} value={form.memo} onChange={(e) => update("memo", e.target.value)} placeholder="전달사항이 있다면 입력해주세요." /></label>

        <div className="field" style={{background:"#f8fafc", padding:16, borderRadius:12, border:"1px solid #e5e7eb"}}>
          <span>휴대폰 인증 *</span>
          <p style={{margin:"0 0 10px", color:"#666", fontSize:14}}>연락처로 인증번호를 발송하고 확인합니다.</p>
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
          <span>본인은 본 계약 내용을 충분히 확인하였으며, 개인정보 수집 및 이용, 전자계약 체결 방식에 동의합니다.</span>
        </label>

        <button className="btn" style={{width:"100%"}} disabled={saving}>{saving ? "제출 중..." : "예식도우미 계약서 제출하기"}</button>
      </form>
    </main>
  );
}
