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
    bankInfo: "",
    memo: "",
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
    if (!form.phone) return alert("연락처를 먼저 입력해주세요.");
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone })
    });
    if (res.ok) {
      setOtpSent(true);
      setOtpVerified(false);
      alert("인증번호를 문자로 발송했습니다.");
    }
  };

  const verifyOtp = async () => {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone, code: otpCode })
    });
    if (res.ok) {
      setOtpVerified(true);
      alert("휴대폰 인증 완료");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const signature = canvasRef.current?.toDataURL("image/png") || "";

    if (!form.name || !form.phone || !agree) {
      return alert("성명, 연락처, 동의는 필수입니다.");
    }
    if (!otpVerified) {
      return alert("휴대폰 인증을 완료해주세요.");
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        contract_type: "사회자",
        name: form.name,
        phone: form.phone,
        event_date: new Date().toISOString().slice(0,10),
        event_time: "",
        event_place: "개별 협의",
        role_detail: "사회 진행",
        fee: "개별 협의",
        bank_info: form.bankInfo,
        memo: form.memo,
        signature
      })
      .select("id")
      .single();

    if (error) {
      setSaving(false);
      return alert("저장 오류");
    }

    fetch("/api/notify-sms", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        contractType: "사회자",
        eventDate: "등록계약",
        fee: "개별 협의"
      })
    });

    fetch("/api/notify-user-sms", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        contractType: "사회자",
        eventDate: "등록계약"
      })
    });

    router.push(`/complete?id=${data.id}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div className="brandPill">BNS / INUS 뮤직</div>
            <h1 className="title">🎙️ 사회자 계약서</h1>
          </div>
          <Link className="btn2" href="/">메인</Link>
        </div>

        <section className="contractPaper">
          <h2>BNS / INUS 뮤직 사회자 계약서</h2>
          <h3>제2조 (계약 목적)</h3>
          <p>본 계약은 갑이 진행하는 웨딩 및 각종 행사 공연에 있어 을을 사회 진행 인력으로 등록하고, 향후 개별 출연 요청 시 상호 협의 하에 진행하기 위한 기본 사항을 정함을 목적으로 한다.</p>
          <p>을은 갑의 요청에 대하여 자유롭게 수락 또는 거절할 수 있다.</p>

          <h3>제4조 (업무 내용)</h3>
          <ul>
            <li>웨딩 및 행사 사회 진행</li>
            <li>사전 대본 협의 및 진행 순서 확인</li>
          </ul>

          <h3>제5조 (출연 조건)</h3>
          <ol>
            <li>행사 시작 최소 1시간 전 현장 도착</li>
            <li>사전 협의된 대본 숙지</li>
            <li>행사 분위기에 맞는 진행</li>
          </ol>
        </section>

        <div className="grid">
          <label className="field">
            <span>성명 *</span>
            <input className="input" value={form.name} onChange={(e)=>update("name", e.target.value)} />
          </label>
          <label className="field">
            <span>연락처 *</span>
            <input className="input" value={form.phone} onChange={(e)=>update("phone", e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>입금 계좌 (추후 제출 가능)</span>
          <input className="input" value={form.bankInfo} onChange={(e)=>update("bankInfo", e.target.value)} />
        </label>

        <label className="field">
          <span>특이사항</span>
          <textarea className="input" value={form.memo} onChange={(e)=>update("memo", e.target.value)} />
        </label>

        <div className="field">
          <button type="button" className="btn2" onClick={sendOtp}>인증번호 발송</button>
          <input className="input" value={otpCode} onChange={(e)=>setOtpCode(e.target.value)} placeholder="인증번호" />
          <button type="button" className="btn2" onClick={verifyOtp}>인증 확인</button>
        </div>

        <div className="field">
          <span>전자서명</span>
          <div className="canvasBox">
            <canvas ref={canvasRef} width={760} height={180}
              style={{width:"100%", height:180}}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={()=>setDrawing(false)}
              onPointerLeave={()=>setDrawing(false)}
            />
          </div>
          <button type="button" className="btn2" onClick={clearSign}>지우기</button>
        </div>

        <label style={{display:"flex", gap:10}}>
          <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
          <span>본인은 계약 내용 및 개인정보 활용, 전자계약 방식에 동의합니다.</span>
        </label>

        <button className="btn" disabled={saving}>
          {saving ? "제출 중..." : "사회자 계약서 제출"}
        </button>
      </form>
    </main>
  );
}
