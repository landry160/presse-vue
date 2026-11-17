"use client";
import { ClipboardPaste, File, FileText, Image as ImageIcon, Type, Upload } from "lucide-react";
import { PasteZone } from "./PasteZone";

const TILES = [
  { I: ImageIcon, t: "Images", d: "Captures, photos, images de Word ou du web", bg: "var(--gradient-primary)", sh: "var(--shadow-primary)" },
  { I: Type, t: "Texte", d: "Avec compteur, zoom et JSON formaté", bg: "var(--gradient-accent)", sh: "var(--shadow-accent)" },
  { I: FileText, t: "Word & web", d: "Mise en forme conservée", bg: "linear-gradient(135deg,#FFC800,#FF5100)", sh: "0 10px 20px rgba(255,81,0,.28)" },
  { I: File, t: "Fichiers", d: "Vidéo, audio, PDF, et plus", bg: "linear-gradient(135deg,#34e3a0,#0e9f6e)", sh: "0 10px 20px rgba(24,196,128,.3)" },
];

export function EmptyState({ mac, onPaste }: { mac: boolean; onPaste: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto thin-scroll">
      <div className="min-h-full flex flex-col items-center justify-center text-center p-6 sm:p-10 anim-slide">
        <div className="w-24 h-24 rounded-[32px] btn-primary flex items-center justify-center anim-float">
          <ClipboardPaste className="w-11 h-11" />
        </div>
        <h2 className="mt-8 text-4xl sm:text-6xl font-black tracking-tighter leading-[1.02] drop-shadow-sm">Collez n&apos;importe quoi.</h2>
        <p className="mt-4 text-base sm:text-lg font-medium text-slate-600 dark:text-slate-300 max-w-xl">
          Une image copiée dans Word, une capture, du texte ou un fichier : appuyez sur{" "}
          <kbd className="font-sans font-black text-slate-900 dark:text-white bg-white/70 dark:bg-white/10 border border-white/80 dark:border-white/10 rounded-lg px-2 py-0.5 shadow-sm">{mac ? "⌘" : "Ctrl"} + V</kbd>{" "}
          et on l&apos;affiche en grand.
        </p>
        <button onClick={onPaste} className="btn-primary btn-press mt-8 rounded-full px-10 sm:px-12 h-16 font-black text-lg sm:text-xl tracking-wide inline-flex items-center gap-3">
          <ClipboardPaste className="w-6 h-6" />Coller maintenant
        </button>
        <PasteZone className="coarse-only mt-6 w-full max-w-sm" placeholder="Touchez ici, puis « Coller »" label="Zone de collage" />
        <p className="mt-5 text-xs font-bold text-slate-500 dark:text-slate-400 inline-flex items-center gap-2">
          <Upload className="w-4 h-4" />Vous pouvez aussi glisser un fichier n&apos;importe où sur la page.
        </p>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full max-w-4xl text-left">
          {TILES.map(({ I, t, d, bg, sh }) => (
            <div key={t} className="tile p-5 min-h-[132px]" style={{ background: bg, boxShadow: sh }}>
              <div className="grid-pat" /><div className="tile-orb" />
              <div className="relative w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center"><I className="w-5 h-5" /></div>
              <p className="relative mt-4 text-lg font-black tracking-tight">{t}</p>
              <p className="relative text-xs font-bold opacity-90 leading-snug">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
