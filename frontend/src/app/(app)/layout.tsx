import React from "react";
import Header from "@/components/Header";
import StarField from "@/components/StarField";
import CommandPalette from "@/components/CommandPalette";
import ToastLayer from "@/components/ToastLayer";
import ShortcutsOverlay from "@/components/ShortcutsOverlay";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-200 flex flex-col relative">
      <Header />
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {/* Background decorations - fixed to viewport */}
        <div className="fixed top-0 left-0 w-full h-[500px] bg-linear-to-b from-cyan-900/20 to-transparent pointer-events-none z-[-1]" />
        <div
          className="aurora-blob fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl pointer-events-none z-[-1]"
          style={{ '--aurora-duration': '20s', '--aurora-delay': '0s' } as React.CSSProperties}
        />
        <div
          className="aurora-blob fixed bottom-0 left-1/4 w-[600px] h-[500px] rounded-full bg-purple-500/5 blur-3xl pointer-events-none z-[-1]"
          style={{ '--aurora-duration': '24s', '--aurora-delay': '-8s' } as React.CSSProperties}
        />
        {/* Subtle grid */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-[-1]" />
        <StarField />

        <div className="relative z-10 w-full h-full flex-1 flex flex-col">{children}</div>
      </main>

      <KeyboardShortcuts />
      <CommandPalette />
      <ShortcutsOverlay />
      <ToastLayer />
    </div>
  );
}
