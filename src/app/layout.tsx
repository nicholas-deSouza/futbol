import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Separation Game - Soccer Player Connections",
  description:
    "Find the connection between any two soccer players through their club teammates. Like Six Degrees of Kevin Bacon, but for football.",
  openGraph: {
    title: "The Separation Game",
    description: "Find connections between soccer players through shared teammates",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
