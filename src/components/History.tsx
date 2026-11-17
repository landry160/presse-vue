"use client";
import { memo } from "react";
import { ClipboardPaste, File, FileArchive, FileCode, FileText, Film, History as HistoryIcon, Image as ImageIcon, Music, RefreshCw, Trash2, TriangleAlert, Type } from "lucide-react";
import type { HistStatus, Item } from "@/lib/types";
import { KIND, fmtAgo, titleOf } from "@/lib/format";
import { urlFor } from "@/lib/objectUrls";
import { PasteZone } from "./PasteZone";

/** Icône du type d'élément (les fichiers ont une icône selon leur type MIME). */
export function KindIcon({ it, className }: { it: Item; className?: string }) {
  const m = it.mime || "";
  if (it.kind === "image") return <ImageIcon className={className} />;
  if (it.kind === "text") return <Type className={className} />;
  if (it.kind === "html" || m.includes("pdf")) return <FileText className={className} />;
  if (m.startsWith("video/")) return <Film className={className} />;
  if (m.startsWith("audio/")) return <Music className={className} />;
  if (/zip|rar|7z|tar|gzip/.test(m)) return <FileArchive className={className} />;
  if (m.startsWith("text/") || /json|xml|javascript/.test(m)) return <FileCode className={className} />;
  return <File className={className} />;
}

function thumbSrc(it: Item): string | null {
  if (it.thumb) return urlFor(it.thumb);
  if (it.kind === "image" && it.blob) return urlFor(it.blob);
  if (it.kind === "html" && it.image) return urlFor(it.image);
  if (it.kind === "file" && it.blob && (it.mime || "").startsWith("image/")) return urlFor(it.blob);
  return null;
}

function Thumb({ it, size }: { it: Item; size: string }) {
  const src = thumbSrc(it);
  if (src) {
    return (
      <div className={`${size} rounded-2xl overflow-hidden checker shrink-0 border border-white/70 dark:border-white/10`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- URL blob locale, next/image n'apporte rien ici */}
        <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-2xl shrink-0 flex items-center justify-center text-white border border-white/30`} style={{ background: KIND[it.kind].bg }}>
      <KindIcon it={it} className="w-5 h-5" />
    </div>
  );
}

/* memo : changer la sélection ne re-rend que les deux lignes concernées */
const Row = memo(function Row({ it, active, onSelect }: { it: Item; active: boolean; onSelect: (id: string) => void; tick: number }) {
  return (
    <button onClick={() => onSelect(it.id)} aria-current={active || undefined}
      className={`w-full text-left flex items-center gap-3 p-2 rounded-[20px] btn-press min-h-[64px] ${active ? "active-item" : "hover:bg-white/60 dark:hover:bg-white/5"}`}>
      <Thumb it={it} size="w-12 h-12" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold truncate">{titleOf(it)}</span>
        <span className="block text-[10px] font-black uppercase tracking-widest opacity-60 mt-0.5 truncate">{KIND[it.kind].label} · {fmtAgo(it.createdAt)}</span>
      </span>
    </button>
  );
});

const Chip = memo(function Chip({ it, active, onSelect }: { it: Item; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button onClick={() => onSelect(it.id)} aria-label={titleOf(it)} aria-current={active || undefined} data-id={it.id}
      className={`btn-press shrink-0 rounded-2xl p-0.5 ${active ? "active-item" : ""}`}>
      <Thumb it={it} size="w-[60px] h-[60px]" />
    </button>
  );
});

type Props = { items: Item[]; activeId: string | null; status: HistStatus; tick: number; onSelect: (id: string) => void; onClear: () => void; onRetry: () => void };

export function HistoryPanel({ items, activeId, status, tick, onSelect, onClear, onRetry }: Props) {
  return (
    <aside className="hidden lg:flex w-80 shrink-0 flex-col glass-panel rounded-[32px] overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex items-center gap-2">
        <HistoryIcon className="w-4 h-4 opacity-60" />
        <span className="text-[11px] font-black uppercase tracking-widest opacity-70">Historique</span>
        <span className="tabular text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-900/5 dark:bg-white/10">{items.length}</span>
        <div className="flex-1" />
        <button onClick={onClear} title="Vider l'historique" aria-label="Vider l'historique" className="btn-glass btn-press w-11 h-11 rounded-2xl flex items-center justify-center">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-4 space-y-1.5">
        {status === "loading" ? (
          Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="skel w-12 h-12 rounded-2xl" />
              <div className="flex-1 space-y-2"><div className="skel h-3 rounded-full w-3/4" /><div className="skel h-2.5 rounded-full w-1/3" /></div>
            </div>
          ))
        ) : status === "error" && !items.length ? (
          <div className="glass-card rounded-[28px] p-5 m-2 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-600 border border-amber-200 dark:bg-amber-500/15 dark:border-amber-500/30 dark:text-amber-300 flex items-center justify-center shadow-inner">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <p className="mt-3 text-sm font-bold">L&apos;historique n&apos;a pas pu être chargé.</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Vous pouvez quand même coller : les éléments resteront le temps de la visite.</p>
            <button onClick={onRetry} className="btn-glass btn-press mt-4 h-11 px-5 rounded-full font-black text-sm inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />Réessayer
            </button>
          </div>
        ) : !items.length ? (
          <div className="text-center px-6 py-10">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center shadow-inner border border-white/70 dark:border-white/10" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
              <HistoryIcon className="w-6 h-6" />
            </div>
            <p className="mt-4 text-sm font-bold">Rien pour l&apos;instant</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Tout ce que vous collez apparaîtra ici pour y revenir plus tard.</p>
          </div>
        ) : (
          items.map((it) => <Row key={it.id} it={it} active={it.id === activeId} onSelect={onSelect} tick={tick} />)
        )}
      </div>
    </aside>
  );
}

export function HistoryStrip({ items, activeId, status, onSelect }: Pick<Props, "items" | "activeId" | "status" | "onSelect">) {
  return (
    <div id="histStrip" className="lg:hidden shrink-0 scroll-x flex gap-2 pb-1">
      <PasteZone className="coarse-only w-16 h-16 shrink-0 rounded-2xl field-zone flex items-center justify-center" label="Zone de collage : touchez puis choisissez Coller">
        <ClipboardPaste className="w-5 h-5 absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
      </PasteZone>
      {status === "loading"
        ? Array.from({ length: 5 }, (_, i) => <div key={i} className="skel w-16 h-16 rounded-2xl shrink-0" />)
        : items.map((it) => <Chip key={it.id} it={it} active={it.id === activeId} onSelect={onSelect} />)}
    </div>
  );
}
