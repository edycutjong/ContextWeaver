import React from "react";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-900/20 to-transparent pointer-events-none" />
        <div
          className="aurora-blob absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none"
          style={{ '--aurora-duration': '20s', '--aurora-delay': '0s' } as React.CSSProperties}
        />
        <div
          className="aurora-blob absolute bottom-0 left-1/4 w-[600px] h-[500px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none"
          style={{ '--aurora-duration': '24s', '--aurora-delay': '-8s' } as React.CSSProperties}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative z-10 w-full h-full p-8">{children}</div>
      </main>
    </div>
  );
}
