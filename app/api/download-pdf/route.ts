import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeFileName(name: string) {
  return String(name || "contract").replace(/[\\/:*?"<>|]/g, "_");
}

function esc(value: unknown) {
  return String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRole(type: string) {
  if (type === "사회자") return "사회 진행";
  if (type === "연주자") return "연주 진행";
  return "축가 진행";
}

function getWorkItems(type: string) {
  if (type === "사회자") {
    return [
      "웨딩 및 행사 사회 진행",
      "사전 대본 협의 및 진행 순서 확인",
      "행사 진행에 필요한 사전 커뮤니케이션"
    ];
  }
  if (type === "연주자") {
    return [
      "웨딩 및 행사 연주 진행",
      "사전 협의된 곡 및 편성에 따른 연주",
      "악기 및 연주 준비"
    ];
  }
  return [
    "웨딩 및 행사 축가 진행",
    "사전 협의된 곡 및 진행 내용 이행",
    "행사 진행에 필요한 사전 협의 및 준비"
  ];
}

function getConditionItems(type: string) {
  if (type === "사회자") {
    return [
      "을은 사전 협의된 대본과 진행 순서를 숙지하여야 한다.",
      "을은 행사 분위기에 맞는 진행 태도와 발성을 유지하여야 한다."
    ];
  }
  if (type === "연주자") {
    return [
      "을은 본인의 악기 및 필요한 연주 준비물을 사전에 준비하여야 한다.",
      "을은 행사 특성에 맞는 복장과 연주 태도를 유지하여야 한다."
    ];
  }
  return [
    "을은 사전 협의된 축가곡 및 진행 순서를 준수하여야 한다."
  ];
}

function li(items: string[]) {
  return items.map((x) => `<li>${esc(x)}</li>`).join("");
}

function html(data: any) {
  const type = String(data.contract_type || "계약서");
  const role = getRole(type);
  const workItems = getWorkItems(type);
  const conditionItems = getConditionItems(type);
  const submitted = data.submitted_at ? new Date(data.submitted_at).toLocaleString("ko-KR") : "-";

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 36px;
    font-family: 'Noto Sans KR', Arial, sans-serif;
    color: #111;
    font-size: 13px;
    line-height: 1.72;
    background: white;
  }
  .title {
    text-align: center;
    font-size: 24px;
    font-weight: 900;
    margin: 0 0 28px;
  }
  .info {
    border: 1px solid #ddd;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 28px;
  }
  .row {
    display: flex;
    border-bottom: 1px solid #eee;
  }
  .row:last-child { border-bottom: 0; }
  .label {
    width: 145px;
    background: #f8fafc;
    padding: 9px 12px;
    font-weight: 800;
  }
  .value {
    flex: 1;
    padding: 9px 12px;
    word-break: break-all;
  }
  h2 {
    font-size: 16px;
    margin: 22px 0 8px;
    font-weight: 900;
  }
  p { margin: 0 0 7px; }
  ul, ol { margin: 6px 0 10px 20px; padding: 0; }
  li { margin-bottom: 4px; }
  .signature {
    margin-top: 32px;
    page-break-inside: avoid;
  }
  .signature img {
    display: block;
    max-width: 280px;
    max-height: 120px;
    border: 1px solid #ddd;
    margin-top: 8px;
  }
  .notice {
    margin-top: 28px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 10px;
    font-size: 12px;
    color: #333;
  }
</style>
</head>
<body>
  <div class="title">BNS / INUS 뮤직 ${esc(type)} 계약서</div>

  <div class="info">
    <div class="row"><div class="label">성명</div><div class="value">${esc(data.name)}</div></div>
    <div class="row"><div class="label">연락처</div><div class="value">${esc(data.phone)}</div></div>
    <div class="row"><div class="label">계약유형</div><div class="value">${esc(type)}</div></div>
    <div class="row"><div class="label">계좌정보</div><div class="value">${esc(data.bank_info || "추후 제출 가능")}</div></div>
    <div class="row"><div class="label">특이사항</div><div class="value">${esc(data.memo || "-")}</div></div>
    <div class="row"><div class="label">제출시간</div><div class="value">${esc(submitted)}</div></div>
    <div class="row"><div class="label">계약 ID</div><div class="value">${esc(data.id)}</div></div>
  </div>

  <h2>제1조 (계약 당사자)</h2>
  <p>본 계약은 회사 BNS / INUS 뮤직(이하 “갑”)과 출연자(이하 “을”) 간 체결된다.</p>
  <ul>
    <li>상호명: BNS / INUS 뮤직</li>
    <li>대표자: 신유진</li>
    <li>주소: 서울시 광진구 자양로 165 4층</li>
  </ul>

  <h2>제2조 (계약 목적)</h2>
  <p>본 계약은 갑이 진행하는 웨딩 및 각종 행사에 있어 을을 ${esc(role)} 인력으로 등록하고, 향후 개별 요청 시 상호 협의 하에 진행하기 위한 기본 사항을 정함을 목적으로 한다.</p>
  <p>을은 갑의 요청에 대하여 자유롭게 수락 또는 거절할 수 있다.</p>
  <p>다만, 을이 요청을 수락하여 일정이 확정된 이후 부득이한 사정으로 진행이 어려워질 경우, 가능한 한 즉시 갑에게 통지하여야 하며 원칙적으로 행사일 기준 최소 5일 전 사전 협의를 요청하여야 한다.</p>

  <h2>제3조 (업무 내용)</h2>
  <ul>${li(workItems)}</ul>

  <h2>제4조 (진행 조건)</h2>
  <ol>
    <li>을은 개별 진행 요청을 수락한 경우 행사 시작 최소 1시간 전 현장에 도착하는 것을 원칙으로 한다.</li>
    <li>을은 사전 협의된 내용과 진행 순서를 성실히 이행하여야 한다.</li>
    <li>을은 행사 특성에 맞는 복장과 태도를 유지하여야 한다.</li>
    ${li(conditionItems)}
  </ol>

  <h2>제5조 (계약 기간)</h2>
  <p>본 계약 기간은 계약 체결일로부터 1년으로 한다.</p>
  <p>계약 종료 전 별도 해지 의사 표시가 없는 경우 상호 협의 하에 연장할 수 있다.</p>

  <h2>제6조 (수수료 및 정산)</h2>
  <ol>
    <li>진행료 또는 출연료는 개별 행사별 별도 협의한다.</li>
    <li>행사 종료 후 다음 주 금요일까지 정산을 원칙으로 한다.</li>
    <li>비용은 을이 제출한 계좌로 지급한다.</li>
    <li>계좌 정보는 계약 체결 시 또는 추후 별도 제출할 수 있다.</li>
  </ol>

  <h2>제7조 (지각 및 불이행)</h2>
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

  <h2>제8조 (계약 해지)</h2>
  <p>상호 합의, 반복적인 계약 위반, 신뢰 관계 훼손, 확정된 일정의 반복적인 불이행이 발생한 경우 계약 해지가 가능하다.</p>

  <h2>제9조 (개인정보 수집 및 이용 동의)</h2>
  <p>갑은 계약 진행 및 운영 관리를 목적으로 성명, 연락처, 계좌정보, 전자서명, 접속기록, 인증기록을 수집·이용할 수 있다.</p>
  <p>이 정보는 행사 요청, 계약 관리, 정산, 연락, 분쟁 대응 및 계약 증빙 목적으로 활용된다.</p>

  <h2>제10조 (전자계약 체결)</h2>
  <p>본 계약은 전자 방식으로 체결되며, 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료 시 계약이 성립한 것으로 본다. 전자 기록은 계약 체결 증빙 자료로 활용될 수 있다.</p>

  <div class="signature">
    <strong>전자서명</strong>
    ${data.signature ? `<img src="${esc(data.signature)}" />` : `<p>-</p>`}
  </div>

  <div class="notice">
    본 계약은 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료를 통해 전자 방식으로 체결되었으며, 제출 기록은 계약 체결 증빙 자료로 활용될 수 있습니다.
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";

  if (!id) {
    return NextResponse.json({ ok: false, message: "id가 없습니다." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, message: "Supabase 환경변수가 없습니다." }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ ok: false, message: "계약서 데이터를 찾을 수 없습니다." }, { status: 404 });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setContent(html(data), { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm"
      }
    });

    const fileName = `${safeFileName(data.name)}_${safeFileName(data.contract_type)}_contract.pdf`;

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, message: "PDF 생성 중 오류가 발생했습니다." }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
