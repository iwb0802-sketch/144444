
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BNS / INUS 뮤직 전자계약",
  description: "전자계약 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
