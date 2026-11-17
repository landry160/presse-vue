"use client";
import { AArrowDown, AArrowUp, Braces, Code, Copy, Download, ExternalLink, Eye, Image as ImageIcon, Maximize2, Scaling, Trash2, Type, type LucideIcon } from "lucide-react";
import type { HtmlView, Item } from "@/lib/types";
import { KIND, fmtAgo, isColor, isUrl, jsonOf, metaOf, prettyJson, titleOf } from "@/lib/format";
import { urlFor } from "@/lib/objectUrls";
import type { ViewerApi } from "@/lib/viewerEngine";
import { KindIcon } from "./History";
import { ImageStage } from "./ImageStage";
import { FileView, HtmlPreview, SourceView, TextView } from "./ContentViews";

type Props = {
  it: Item;
  view: HtmlView; setView: (v: HtmlView) => void;
  textSize: number; setTextSize: (n: number) => void;
  jsonPretty: boolean; setJsonPretty: (b: boolean) => void;
  apiRef: React.RefObject<ViewerApi | null>;
  onCopy: () => void; onDownload: () => void; onDelete: () => void; onResize: () => void;
};

function ToolButton({ I, label, onClick, active = false }: { I: LucideIcon; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} aria-pressed={active || undefined}
      className={`btn-press h-11 min-w-[44px] px-3 rounded-2xl inline-flex items-center justify-center gap-2 font-black text-xs ${active ? "active-item text-primary" : "btn-glass"}`}>
      <I className="w-4 h-4" /><span className="hidden xl:inline">{label}</span>
    </button>
  );
}

const VIEWS: { id: HtmlView; label: string; I: LucideIcon }[] = [
  { id: "preview", label: "Aperçu", I: Eye },
  { id: "image", label: "Image", I: ImageIcon },
  { id: "text", label: "Texte", I: Type },
  { id: "source", label: "Code", I: Code },
];

export function Viewer({ it, view, setView, textSize, setTextSize, jsonPretty, setJsonPretty, apiRef, onCopy, onDownload, onDelete, onResize }: Props) {
  const k = KIND[it.kind];
  const text = it.text || "";
  const json = it.kind === "text" && jsonOf(text) != null;
  const url = it.kind === "text" && isUrl(text) ? text.trim() : null;
  const color = it.kind === "text" && isColor(text) ? text.trim() : null;
  const imageView = it.kind === "image" || (it.kind === "html" && view === "image" && !!it.image);
  const textView = it.kind === "text" || (it.kind === "html" && view === "text");

  let content: React.ReactNode;
  if (imageView) {
    const blob = it.kind === "image" ? it.blob! : it.image!;
    content = <ImageStage src={urlFor(blob)} w={(it.kind === "image" ? it.w : it.iw) || 1} h={(it.kind === "image" ? it.h : it.ih) || 1} apiRef={apiRef} />;
  } else if (textView) {
    content = <TextView text={jsonPretty && it.kind === "text" ? prettyJson(text) : text || "(aucun texte brut — voir l'aperçu)"} size={textSize} color={color} />;
  } else if (it.kind === "html" && view === "source") {
    content = <SourceView html={it.html || ""} />;
  } else if (it.kind === "html") {
    content = <HtmlPreview html={it.html || ""} hasImage={!!it.image} />;
  } else {
    content = <FileView it={it} textSize={textSize} />;
  }

  return (
    <>
      <div className="shrink-0 p-4 sm:p-5 lg:px-7 lg:pt-6 flex flex-wrap items-center gap-3 border-b border-white/60 dark:border-white/5">
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-64">
          <span className="px-3 py-1.5 text-white text-[10px] font-black rounded-xl uppercase tracking-widest border border-white/20 inline-flex items-center gap-1.5 shrink-0" style={{ background: k.bg, boxShadow: k.sh }}>
            <KindIcon it={it} className="w-3.5 h-3.5" />{k.label}
          </span>
          <div className="min-w-0">
            <p className="font-black tracking-tight truncate text-base sm:text-lg">{titleOf(it)}</p>
            <p className="tabular text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{metaOf(it)} · {fmtAgo(it.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {it.kind === "html" && (
            <div className="flex bg-slate-900/5 dark:bg-white/5 rounded-2xl p-1 gap-1" role="tablist" aria-label="Vue du contenu">
              {VIEWS.filter((v) => v.id !== "image" || it.image).map(({ id, label, I }) => (
                <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
                  className={`btn-press h-9 px-3 rounded-xl inline-flex items-center gap-1.5 text-xs font-black ${view === id ? "bg-white dark:bg-slate-700 shadow-sm text-primary" : "opacity-70 hover:opacity-100"}`}>
                  <I className="w-3.5 h-3.5" /><span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          )}
          {textView && <>
            <ToolButton I={AArrowDown} label="Texte plus petit" onClick={() => setTextSize(Math.max(10, textSize - 2))} />
            <ToolButton I={AArrowUp} label="Texte plus grand" onClick={() => setTextSize(Math.min(48, textSize + 2))} />
          </>}
          {json && <ToolButton I={Braces} label="JSON" active={jsonPretty} onClick={() => setJsonPretty(!jsonPretty)} />}
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-glass btn-press h-11 px-3 rounded-2xl inline-flex items-center gap-2 font-black text-xs">
              <ExternalLink className="w-4 h-4" />Ouvrir le lien
            </a>
          )}
          {imageView && <>
            <ToolButton I={Scaling} label="Redimensionner" onClick={onResize} />
            <ToolButton I={Maximize2} label="Plein écran" onClick={() => apiRef.current?.toggleFs()} />
          </>}
          {it.kind !== "file" && <ToolButton I={Copy} label="Recopier" onClick={onCopy} />}
          <ToolButton I={Download} label="Enregistrer" onClick={onDownload} />
          <ToolButton I={Trash2} label="Supprimer" onClick={onDelete} />
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">{content}</div>
    </>
  );
}
