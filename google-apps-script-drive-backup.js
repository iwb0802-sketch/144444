/**
 * 이너스뮤직 계약서 Google Drive PDF 백업용 Apps Script
 *
 * 1) Google Drive에 계약서 백업 폴더 생성
 * 2) 아래 FOLDER_ID에 폴더 ID 입력
 * 3) Apps Script → 배포 → 새 배포 → 웹 앱
 * 4) 실행 사용자: 나
 * 5) 액세스 권한: 모든 사용자
 * 6) 발급된 웹 앱 URL을 Vercel 환경변수 DRIVE_WEBHOOK_URL에 저장
 */

const FOLDER_ID = "여기에_구글드라이브_폴더_ID_입력";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const folder = DriveApp.getFolderById(FOLDER_ID);

    const safeDate = data.eventDate || "date";
    const safeName = sanitizeFileName(data.name || "name");
    const safeType = sanitizeFileName(data.contractType || "contract");
    const fileName = `${safeDate}_${safeName}_${safeType}_계약서.pdf`;

    const doc = DocumentApp.create(`${safeDate}_${safeName}_${safeType}_계약서`);
    const body = doc.getBody();

    body.appendParagraph("이너스뮤직 계약서")
      .setHeading(DocumentApp.ParagraphHeading.HEADING1)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    body.appendParagraph("");

    addRow(body, "계약 유형", data.contractType);
    addRow(body, "성명", data.name);
    addRow(body, "연락처", data.phone);
    addRow(body, "행사일", data.eventDate);
    addRow(body, "행사 시간", data.eventTime);
    addRow(body, "행사 장소", data.eventPlace);
    addRow(body, "역할 상세", data.roleDetail);
    addRow(body, "계약 금액", data.fee);
    addRow(body, "입금 계좌", data.bankInfo);
    addRow(body, "특이사항", data.memo);
    addRow(body, "제출 시간", data.submittedAt);
    addRow(body, "계약 ID", data.id);
    addRow(body, "브라우저 정보", data.userAgent);

    body.appendParagraph("");
    body.appendParagraph("서명").setBold(true);

    if (data.signature && data.signature.indexOf("base64,") > -1) {
      const base64 = data.signature.split("base64,")[1];
      const blob = Utilities.newBlob(
        Utilities.base64Decode(base64),
        "image/png",
        "signature.png"
      );
      const img = body.appendImage(blob);
      img.setWidth(240);
      img.setHeight(90);
    }

    doc.saveAndClose();

    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs(MimeType.PDF).setName(fileName);
    const pdfFile = folder.createFile(pdfBlob);

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

function addRow(body, label, value) {
  const p = body.appendParagraph(`${label}: ${value || "-"}`);
  p.setSpacingAfter(6);
}

function sanitizeFileName(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, "_").trim();
}
