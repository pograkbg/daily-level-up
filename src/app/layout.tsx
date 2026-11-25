import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 미션 도장깨기",
  description: "곤충 친구와 함께 모험하는 판타지 RPG 수학 학습",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#dff3ff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
