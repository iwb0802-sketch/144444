
# contract-nextjs-admin-sms

Supabase DB + 관리자 로그인 + 관리자 SMS 알림 버전입니다.

## 기존 Vercel 환경변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## 추가 Vercel 환경변수
- ADMIN_PASSWORD : 관리자 로그인 비밀번호
- ADMIN_PHONE : 문자 알림 받을 관리자 번호. 예: 01012345678
- SOLAPI_API_KEY : SOLAPI API Key
- SOLAPI_API_SECRET : SOLAPI API Secret
- SOLAPI_FROM : SOLAPI에 등록된 발신번호. 예: 01012345678

## 페이지
- /contract 계약서 작성
- /complete 제출 완료 및 PDF 저장/인쇄
- /admin 관리자 목록
- /admin/login 관리자 로그인
