import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "PDF 서버 생성 기능은 임시 비활성화되었습니다. Google Drive 자동 백업 PDF를 사용해주세요."
    },
    { status: 503 }
  );
}
