"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getContracts } from "../../storage";
import { ContractData } from "../../types";

export default function AdminPage() {
  const [list, setList] = useState<ContractData[]>([]);

  useEffect(() => {
    setList(getContracts());
  }, []);

  return (
    <main className="container">
      <div className="card">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, marginBottom:20}}>
          <div>
            <h1 className="title">관리자 제출 목록</h1>
            <p className="desc">현재는 같은 브라우저에 임시 저장된 데이터만 보입니다.</p>
          </div>
          <Link className="btn" href="/contract">작성하기</Link>
        </div>

        {list.length === 0 ? (
          <p>제출된 계약서가 없습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>제출시간</th>
                <th>유형</th>
                <th>성명</th>
                <th>연락처</th>
                <th>행사일</th>
                <th>보기</th>
              </tr>
            </thead>
            <tbody>
              {list.map((x) => (
                <tr key={x.id}>
                  <td>{x.submittedAt}</td>
                  <td>{x.contractType}</td>
                  <td>{x.name}</td>
                  <td>{x.phone}</td>
                  <td>{x.eventDate}</td>
                  <td><Link className="btn2" href={`/complete?id=${x.id}`}>보기</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
