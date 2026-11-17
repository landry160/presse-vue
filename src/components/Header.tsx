"use client";
import { ClipboardPaste, Palette } from "lucide-react";

export function Header({ showPaste, onPaste, onSettings }: { showPaste: boolean; onPaste: () => void; onSettings: () => void }) {
  return (
    <header className="glass-nav shrink-0 safe-x" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="h-16 lg:h-20 flex items-center gap-3 lg:px-2">
        <div className="w-11 h-11 rounded-2xl btn-primary flex items-center justify-center shrink-0">
          <ClipboardPaste className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-black tracking-tighter leading-none">Presse-Vue</h1>
          <p className="hidden sm:block text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Visionneuse de presse-papiers</p>
        </div>
        {showPaste && (
          <button onClick={onPaste} aria-label="Coller depuis le presse-papiers"
            className="btn-primary btn-press rounded-full h-11 px-4 sm:px-6 font-black text-sm tracking-wide flex items-center gap-2">
            <ClipboardPaste className="w-4 h-4" />
            <span className="hidden sm:inline">Coller</span>
            <kbd className="font-sans hidden lg:inline text-[10px] font-black bg-white/20 rounded-lg px-1.5 py-0.5">Ctrl V</kbd>
          </button>
        )}
        <button onClick={onSettings} aria-label="Apparence" className="btn-glass btn-press w-11 h-11 rounded-2xl flex items-center justify-center">
          <Palette className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
