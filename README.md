# contract-nextjs-otp-user-sms

Supabase DB + 관리자 로그인 + Google Drive 백업 + 관리자 문자 + 작성자 완료 문자 + 제출 전 OTP 인증 버전입니다.

## 기존 Vercel 환경변수
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- ADMIN_PASSWORD
- ADMIN_PHONE
- SOLAPI_API_KEY
- SOLAPI_API_SECRET
- SOLAPI_FROM
- DRIVE_WEBHOOK_URL

## 변경된 제출 흐름
1. 계약서 작성
2. 휴대폰 인증번호 발송
3. 인증번호 확인
4. 계약서 제출
5. DB 저장
6. 관리자 문자 발송
7. 작성자 제출완료 문자 발송
8. Google Drive PDF 백업
