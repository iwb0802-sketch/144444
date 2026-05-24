"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";

export default function ContractPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    contractType: "연주자",
    name: "",
    phone: "",
    eventDate: "",
    eventTime: "",
    eventPlace: "",
    roleDetail: "",
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const c = canvasRef.current;
    const signature = c ? c.toDataURL("image/png") : "";

    if (!form.name || !form.phone || !form.eventDate || !agree) {
      alert("성명, 연락처, 행사일, 동의 체크는 필수입니다.");
      return;
    }

    setSaving(true);

    const payload = {
      contract_type: form.contractType,
      name: form.name,
      phone: form.phone,
      event_date: form.eventDate,
      event_time: form.eventTime,
      event_place: form.eventPlace,
      role_detail: form.roleDetail,
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

    fetch("/api/notify-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        contractType: form.contractType,
        eventDate: form.eventDate,
        fee: form.fee
      })
    }).catch((err) => console.error("SMS request failed", err));

    setSaving(false);
    router.push(`/complete?id=${data.id}`);
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit}>
        <h1 className="title">이너스뮤직 계약서 작성</h1>
        <p className="desc">제출하면 Supabase DB에 저장되고 관리자에게 문자 알림이 발송됩니다.</p>

        {error && <div className="alert">{error}</div>}

        <div className="grid">
          <label className="field">
            <span>계약 유형</span>
            <select className="input" value={form.contractType} onChange={(e) => update("contractType", e.target.value)}>
              <option>연주자</option>
              <option>사회자</option>
            </select>
          </label>
          <label className="field">
            <span>성명 *</span>
            <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label className="field">
            <span>연락처 *</span>
            <input className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
          <label className="field">
            <span>행사일 *</span>
            <input className="input" type="date" value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
          </label>
          <label className="field">
            <span>행사 시간</span>
            <input className="input" type="time" value={form.eventTime} onChange={(e) => update("eventTime", e.target.value)} />
          </label>
          <label className="field">
            <span>계약 금액</span>
            <input className="input" value={form.fee} onChange={(e) => update("fee", e.target.value)} placeholder="300,000원" />
          </label>
        </div>

        <label className="field">
          <span>행사 장소</span>
          <input className="input" value={form.eventPlace} onChange={(e) => update("eventPlace", e.target.value)} />
        </label>

        <label className="field">
          <span>역할 상세</span>
          <input className="input" value={form.roleDetail} onChange={(e) => update("roleDetail", e.target.value)} placeholder="예: 4중주 바이올린 / 본식 사회" />
        </label>

        <label className="field">
          <span>입금 계좌</span>
          <input className="input" value={form.bankInfo} onChange={(e) => update("bankInfo", e.target.value)} />
        </label>

        <label className="field">
          <span>특이사항</span>
          <textarea className="input" style={{height:100}} value={form.memo} onChange={(e) => update("memo", e.target.value)} />
        </label>

        <div className="field">
          <span>서명</span>
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
          <span>본인은 위 계약 내용을 확인하였으며, 본인의 의사로 제출함에 동의합니다.</span>
        </label>

        <button className="btn" style={{width:"100%"}} disabled={saving}>
          {saving ? "저장 중..." : "계약서 제출하기"}
        </button>
      </form>
    </main>
  );
}
