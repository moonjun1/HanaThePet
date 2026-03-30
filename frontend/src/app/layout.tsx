import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "하나더펫",
  description: "하나은행 반려동물 금융 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-gray-100 min-h-screen">
        <div className="app-shell">
          <AppHeader />
          <main className="pb-20">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
