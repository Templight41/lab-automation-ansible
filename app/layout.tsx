'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import { WebSocketProvider } from "./context/WebSocketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-200`}
      >
        <WebSocketProvider>
          <Navigation />
          <main className="container mx-auto py-6 px-4">
            {children}
          </main>
        </WebSocketProvider>
      </body>
    </html>
  );
}
