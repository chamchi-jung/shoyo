import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "shoyo",
  description: "앨범, 영화, 책, 갤러리, 유튜브, 링크, 태그를 한 장에 쌓아두는 개인 취향 페이지입니다."
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
