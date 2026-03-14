import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stock Explorer",
  description:
    "TensorWave stock explorer challenge built with Next.js and Alpha Vantage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
