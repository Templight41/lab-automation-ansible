"use client"

import Image from "next/image";
import WebSocketDemo from "./components/WebSocketDemo";
import ApiTest from "./components/ApiTest";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        
        
        {/* WebSocket Demo Component */}
        <div className="w-full max-w-md">
          <WebSocketDemo />
        </div>

      </main>
    </div>
  );
}
