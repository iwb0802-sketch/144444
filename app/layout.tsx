
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이너스 계약서 테스트",
  description: "연주자/사회자 계약서 작성 테스트",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
