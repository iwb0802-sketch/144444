"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "로그인 실패");
      return;
    }
    router.push("/admin");
  };

  return (
    <main className="container">
      <form className="card" onSubmit={submit} style={{maxWidth:480, margin:"60px auto"}}>
        <h1 className="title">관리자 로그인</h1>
        <p className="desc">계약서 제출 목록 확인을 위해 관리자 비밀번호를 입력하세요.</p>
        {error && <div className="alert">{error}</div>}
        <label className="field">
          <span>관리자 비밀번호</span>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        <button className="btn" style={{width:"100%"}} disabled={loading}>{loading ? "확인 중..." : "로그인"}</button>
      </form>
    </main>
  );
}
