"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../supabase";
import { ContractData } from "../../types";

export default function AdminPage() {
  const router = useRouter();
  const [list, setList] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  async function checkLogin() {
    const res = await fetch("/api/admin-check");
    const data = await res.json().catch(() => ({ ok: false }));
    if (!data.ok) {
      router.push("/admin/login");
      return;
    }
    setChecking(false);
    load();
  }

  async function logout() {
    await fetch("/api/admin-logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function load() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.from("contracts").select("*").order("submitted_at", { ascending: false });
    if (error) setError("목록을 불러오지 못했습니다.");
    else setList((data || []) as ContractData[]);
    setLoading(false);
  }

  useEffect(() => { checkLogin(); }, []);

  if (checking) return <main className="container"><div className="card">관리자 권한 확인 중...</div></main>;

  return (
    <main className="container">
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:20}}>
          <div>
            <h1 className="title">관리자 제출 목록</h1>
            <p className="desc">Supabase DB에 저장된 계약서 목록입니다.</p>
          </div>
          <div style={{display:"flex", gap:8}}>
            <button className="btn2" onClick={load}>새로고침</button>
            <Link className="btn" href="/">메인</Link>
            <button className="btnDanger" onClick={logout}>로그아웃</button>
          </div>
        </div>
        {error && <div className="alert">{error}</div>}
        {loading ? <p>불러오는 중...</p> : list.length === 0 ? <p>제출된 계약서가 없습니다.</p> : (
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr><th>제출시간</th><th>유형</th><th>성명</th><th>연락처</th><th>보기</th></tr></thead>
              <tbody>
                {list.map((x) => (
                  <tr key={x.id}>
                    <td>{new Date(x.submitted_at).toLocaleString("ko-KR")}</td>
                    <td>{x.contract_type}</td>
                    <td>{x.name}</td>
                    <td>{x.phone}</td>
                    <td><Link className="btn2" href={`/complete?id=${x.id}`}>보기</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
