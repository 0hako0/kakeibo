import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "月末家計簿",
  description: "口座残高の動きに合わせて月末にまとめて入力する家計簿"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
