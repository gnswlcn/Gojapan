import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoJapan - JLPT 단어 마스터",
  description: "빠른 템포로 JLPT 단어를 정복하는 게임형 학습 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950">{children}</body>
    </html>
  );
}
