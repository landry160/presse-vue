"use client";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import type { Item } from "@/lib/types";
import { KIND, fmtBytes } from "@/lib/format";
import { urlFor } from "@/lib/objectUrls";
import { KindIcon } from "./History";

export function TextView({ text, size, color }: { text: string; size: number; color?: string | null }) {
  return (
    <>
      {color && (
        <div className="px-5 sm:px-8 pt-5">
          <div className="h-24 rounded-[28px] border border-white/70 dark:border-white/10 shadow-inner" style={{ background: color }} />
        </div>
      )}
      <pre className={`absolute ${color ? "top-32" : "top-0"} inset-x-0 bottom-0 overflow-auto thin-scroll p-5 sm:p-8 font-mono whitespace-pre-wrap break-words text-slate-900 dark:text-slate-100`}
        style={{ fontSize: size, lineHeight: 1.6 }}>
        {text}
      </pre>
    </>
  );
}

export function SourceView({ html }: { html: string }) {
  return <pre className="absolute inset-0 overflow-auto thin-scroll p-5 sm:p-8 font-mono text-xs whitespace-pre-wrap break-all text-slate-700 dark:text-slate-300">{html}</pre>;
}

const FRAME_CSS = `<base target="_blank"><style>html{background:#fff}body{font-family:Inter,Calibri,system-ui,sans-serif;color:#0f172a;padding:28px;margin:0;font-size:16px;line-height:1.55}img{max-width:100%;height:auto}table{border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:4px 8px}</style>`;

/** Aperçu du HTML collé dans une iframe isolée (aucun script ne s'exécute). */
export function HtmlPreview({ html, hasImage }: { html: string; hasImage: boolean }) {
  const local = /src=["']?file:/i.test(html);
  return (
    <div className="absolute inset-0 p-3 sm:p-5 flex flex-col gap-3">
      {local && (
        <div className="shrink-0 glass-card rounded-2xl px-4 py-3 text-xs font-bold flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
          Certaines images viennent de fichiers locaux de Word et ne peuvent pas s&apos;afficher ici.
          {hasImage && " Le rendu complet est dans l'onglet « Image »."}
        </div>
      )}
      <iframe sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={FRAME_CSS + html} title="Aperçu du contenu collé"
        className="flex-1 w-full rounded-[24px] bg-white border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.06)]" />
    </div>
  );
}

const TEXT_EXT = /\.(txt|md|csv|json|xml|ya?ml|log|ini|js|ts|py|cs|cpp|c|h|java|html|css|sql)$/i;

function FileText({ blob, size }: { blob: Blob; size: number }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => { let on = true; blob.text().then((t) => on && setText(t)); return () => { on = false; }; }, [blob]);
  return <TextView text={text ?? "Lecture du fichier…"} size={size} />;
}

export function FileView({ it, textSize }: { it: Item; textSize: number }) {
  const m = it.mime || "", blob = it.blob!, url = urlFor(blob);
  if (m.startsWith("video/")) return (
    <div className="absolute inset-0 p-4 flex items-center justify-center bg-black/80"><video src={url} controls className="max-w-full max-h-full rounded-2xl" /></div>
  );
  if (m.startsWith("audio/")) return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      <div className="glass-card rounded-[32px] p-8 w-full max-w-lg"><p className="font-black mb-4 truncate">{it.name}</p><audio src={url} controls className="w-full" /></div>
    </div>
  );
  if (m === "application/pdf") return <iframe src={url} className="absolute inset-0 w-full h-full" title="Aperçu PDF" />;
  if (m.startsWith("text/") || /json|xml|javascript|csv|markdown|yaml/.test(m) || TEXT_EXT.test(it.name || "")) {
    if ((it.size || 0) <= 5e6) return <FileText blob={blob} size={textSize} />;
  }
  return (
    <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-6">
      <div className="tile p-8 sm:p-10 w-full max-w-md text-center" style={{ background: KIND.file.bg, boxShadow: KIND.file.sh }}>
        <div className="grid-pat" /><div className="tile-orb" />
        <div className="relative w-20 h-20 mx-auto rounded-[28px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center anim-float"><KindIcon it={it} className="w-9 h-9" /></div>
        <p className="relative mt-6 text-2xl font-black tracking-tight break-words">{it.name}</p>
        <p className="relative mt-1 text-sm font-bold opacity-90 tabular">{fmtBytes(it.size)} · {m || "type inconnu"}</p>
        <p className="relative mt-4 text-sm font-medium opacity-90">{(it.size || 0) > 5e6 ? "Fichier trop volumineux pour l'aperçu — vous pouvez l'enregistrer." : "Aucun aperçu possible pour ce type — vous pouvez l'enregistrer."}</p>
      </div>
    </div>
  );
}
