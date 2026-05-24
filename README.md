# BNS / INUS 뮤직 전자계약 시스템 최종본

전체 배포용 ZIP입니다.

## 포함 기능
- 메인 계약서 선택 UI
- 축가자 계약서
- 사회자 계약서
- 연주자 계약서
- 휴대폰 OTP 인증
- 전자서명
- 통합 동의
- Supabase DB 저장
- 관리자 로그인
- 관리자 목록
- 관리자 문자 알림
- 작성자 제출완료 문자
- Google Drive PDF 자동 백업

## 필수 Vercel 환경변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ADMIN_PASSWORD
- ADMIN_PHONE
- SOLAPI_API_KEY
- SOLAPI_API_SECRET
- SOLAPI_FROM
- DRIVE_WEBHOOK_URL

## 페이지
- / : 메인
- /contract/singer : 축가자 계약서
- /contract/host : 사회자 계약서
- /contract/player : 연주자 계약서
- /admin : 관리자
