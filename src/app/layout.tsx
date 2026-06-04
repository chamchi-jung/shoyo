import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "해즈세요",
  description: "글, 댓글, 사진, 유튜브를 올릴 수 있는 단순 커뮤니티입니다."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
