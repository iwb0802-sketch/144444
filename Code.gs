/**
 * BNS / INUS 뮤직 전자계약 Google Drive PDF 생성용 Apps Script
 *
 * 목적:
 * - Google Drive에는 관리자 보관용 PDF 저장
 * - 작성자는 제출 직후 본인 계약서 PDF 1개만 링크로 열람 가능
 * - 폴더 전체 공개가 아니라, 생성된 해당 PDF 파일만 "링크가 있는 사용자 보기"로 설정
 *
 * 사용 방법:
 * 1) Google Drive에 계약서 저장 폴더 생성
 * 2) 아래 FOLDER_ID 값을 해당 폴더 ID로 교체
 * 3) Apps Script에 이 코드 전체 붙여넣기
 * 4) 저장
 * 5) 배포 → 배포 관리 → 새 버전 배포
 * 6) 웹 앱 URL을 Vercel 환경변수 DRIVE_WEBHOOK_URL에 입력
 */

const FOLDER_ID = "여기에_구글드라이브_폴더_ID_입력";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const folder = DriveApp.getFolderById(FOLDER_ID);

    const type = data.contractType || "계약서";
    const name = data.name || "계약자";
    const today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
    const fileName = `${today}_${sanitizeFileName(name)}_${sanitizeFileName(type)}_계약서.pdf`;

    const doc = DocumentApp.create(`${today}_${sanitizeFileName(name)}_${sanitizeFileName(type)}_계약서`);
    const body = doc.getBody();

    body.setMarginTop(36);
    body.setMarginBottom(36);
    body.setMarginLeft(42);
    body.setMarginRight(42);

    addTitle(body, `BNS / INUS 뮤직 ${type} 계약서`);

    addInfoTable(body, [
      ["성명", data.name || "-"],
      ["연락처", data.phone || "-"],
      ["계약유형", type],
      ["계좌정보", data.bankInfo || "추후 제출 가능"],
      ["특이사항", data.memo || "-"],
      ["제출시간", data.submittedAt || Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss")],
      ["계약 ID", data.id || "-"]
    ]);

    addContractTerms(body, type);
    addSignature(body, data.signature);

    body.appendParagraph("");
    const notice = body.appendParagraph(
      "본 계약은 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료를 통해 전자 방식으로 체결되었으며, 제출 기록은 계약 체결 증빙 자료로 활용될 수 있습니다."
    );
    notice.setFontSize(9).setForegroundColor("#444444");

    doc.saveAndClose();

    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs(MimeType.PDF).setName(fileName);
    const pdfFile = folder.createFile(pdfBlob);

    // 작성자가 본인 계약서 PDF 1개만 열 수 있게 파일 단위 링크 공개
    // 폴더는 공개하지 않으며, 이 링크를 모르면 접근할 수 없음.
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 중간 Google Docs 원본은 휴지통 이동
    docFile.setTrashed(true);

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        fileId: pdfFile.getId(),
        fileName: fileName,
        url: pdfFile.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        message: String(err)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addTitle(body, text) {
  const p = body.appendParagraph(text);
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  p.setFontSize(18);
  p.setBold(true);
  p.setSpacingAfter(18);
}

function addInfoTable(body, rows) {
  const table = body.appendTable(rows);
  table.setBorderWidth(1);

  for (let i = 0; i < rows.length; i++) {
    const row = table.getRow(i);
    const left = row.getCell(0);
    const right = row.getCell(1);

    left.setBackgroundColor("#f3f4f6");
    left.setWidth(90);
    left.editAsText().setBold(true).setFontSize(10);
    right.editAsText().setFontSize(10);
  }

  body.appendParagraph("").setSpacingAfter(10);
}

function addHeading(body, text) {
  const p = body.appendParagraph(text);
  p.setFontSize(12);
  p.setBold(true);
  p.setSpacingBefore(8);
  p.setSpacingAfter(4);
}

function addPara(body, text) {
  const p = body.appendParagraph(text);
  p.setFontSize(10);
  p.setLineSpacing(1.15);
  p.setSpacingAfter(4);
}

function addBullet(body, text) {
  const p = body.appendListItem(text);
  p.setGlyphType(DocumentApp.GlyphType.BULLET);
  p.setFontSize(10);
  p.setSpacingAfter(2);
}

function addNumber(body, text) {
  const p = body.appendListItem(text);
  p.setGlyphType(DocumentApp.GlyphType.NUMBER);
  p.setFontSize(10);
  p.setSpacingAfter(2);
}

function getRole(type) {
  if (type === "사회자") return "사회 진행";
  if (type === "연주자") return "연주 진행";
  return "축가 진행";
}

function getWorkItems(type) {
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

function getConditionItems(type) {
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

function addContractTerms(body, type) {
  const role = getRole(type);

  addHeading(body, "제1조 (계약 당사자)");
  addPara(body, "본 계약은 회사 BNS / INUS 뮤직(이하 “갑”)과 출연자(이하 “을”) 간 체결된다.");
  addBullet(body, "상호명: BNS / INUS 뮤직");
  addBullet(body, "대표자: 신유진");
  addBullet(body, "주소: 서울시 광진구 자양로 165 4층");

  addHeading(body, "제2조 (계약 목적)");
  addPara(body, `본 계약은 갑이 진행하는 웨딩 및 각종 행사에 있어 을을 ${role} 인력으로 등록하고, 향후 개별 요청 시 상호 협의 하에 진행하기 위한 기본 사항을 정함을 목적으로 한다.`);
  addPara(body, "을은 갑의 요청에 대하여 자유롭게 수락 또는 거절할 수 있다.");
  addPara(body, "다만, 을이 요청을 수락하여 일정이 확정된 이후 부득이한 사정으로 진행이 어려워질 경우, 가능한 한 즉시 갑에게 통지하여야 하며 원칙적으로 행사일 기준 최소 5일 전 사전 협의를 요청하여야 한다.");

  addHeading(body, "제3조 (업무 내용)");
  getWorkItems(type).forEach(item => addBullet(body, item));

  addHeading(body, "제4조 (진행 조건)");
  addNumber(body, "을은 개별 진행 요청을 수락한 경우 행사 시작 최소 1시간 전 현장에 도착하는 것을 원칙으로 한다.");
  addNumber(body, "을은 사전 협의된 내용과 진행 순서를 성실히 이행하여야 한다.");
  addNumber(body, "을은 행사 특성에 맞는 복장과 태도를 유지하여야 한다.");
  getConditionItems(type).forEach(item => addNumber(body, item));

  addHeading(body, "제5조 (계약 기간)");
  addPara(body, "본 계약 기간은 계약 체결일로부터 1년으로 한다.");
  addPara(body, "계약 종료 전 별도 해지 의사 표시가 없는 경우 상호 협의 하에 연장할 수 있다.");

  addHeading(body, "제6조 (수수료 및 정산)");
  addNumber(body, "진행료 또는 출연료는 개별 행사별 별도 협의한다.");
  addNumber(body, "행사 종료 후 다음 주 금요일까지 정산을 원칙으로 한다.");
  addNumber(body, "비용은 을이 제출한 계좌로 지급한다.");
  addNumber(body, "계좌 정보는 계약 체결 시 또는 추후 별도 제출할 수 있다.");

  addHeading(body, "제7조 (지각 및 불이행)");
  addPara(body, "사전 협의 없는 지각 발생 시 아래 기준을 적용한다.");
  addBullet(body, "행사 시작 30분 전 도착: 5,000원 차감");
  addBullet(body, "행사 시작 20분 전 도착: 10,000원 차감");
  addBullet(body, "행사 정시 도착: 20,000원 차감");
  addPara(body, "을이 계약조건대로 이행하지 않아 갑에게 금전적 손해가 발생한 경우, 을은 실제 발생한 손해 범위 내에서 배상 책임을 질 수 있다.");
  addPara(body, "다만, 부득이한 사정이 발생한 경우 예식시간 최소 3시간 전까지 갑에게 통보하고 상호 협의한 경우에는 예외로 한다.");
  addPara(body, "단, 천재지변, 회사 요청 또는 지시, 교통사고·사건사고 등 객관적 증빙 가능 사유, 기타 갑이 인정하는 불가피한 사유는 예외로 한다.");
  addPara(body, "을이 확정된 일정을 정당한 사유 없이 이행하지 않거나 행사 진행에 중대한 차질을 발생시키는 경우, 갑은 향후 배정 제한 또는 계약 해지를 할 수 있다.");

  addHeading(body, "제8조 (계약 해지)");
  addPara(body, "상호 합의, 반복적인 계약 위반, 신뢰 관계 훼손, 확정된 일정의 반복적인 불이행이 발생한 경우 계약 해지가 가능하다.");

  addHeading(body, "제9조 (개인정보 수집 및 이용 동의)");
  addPara(body, "갑은 계약 진행 및 운영 관리를 목적으로 성명, 연락처, 계좌정보, 전자서명, 접속기록, 인증기록을 수집·이용할 수 있다.");
  addPara(body, "이 정보는 행사 요청, 계약 관리, 정산, 연락, 분쟁 대응 및 계약 증빙 목적으로 활용된다.");

  addHeading(body, "제10조 (전자계약 체결)");
  addPara(body, "본 계약은 전자 방식으로 체결되며, 휴대폰 OTP 인증, 전자서명, 계약서 제출 완료 시 계약이 성립한 것으로 본다. 전자 기록은 계약 체결 증빙 자료로 활용될 수 있다.");
}

function addSignature(body, signature) {
  body.appendParagraph("");
  const title = body.appendParagraph("전자서명");
  title.setBold(true).setFontSize(11);

  if (!signature || signature.indexOf("base64,") === -1) {
    addPara(body, "-");
    return;
  }

  try {
    const base64 = signature.split("base64,")[1];
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      "image/png",
      "signature.png"
    );
    const img = body.appendImage(blob);
    img.setWidth(220);
    img.setHeight(80);
  } catch (err) {
    addPara(body, "서명 이미지를 삽입하지 못했습니다.");
  }
}

function sanitizeFileName(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, "_").trim();
}
