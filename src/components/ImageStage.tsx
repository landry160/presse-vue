"use client";
import { useEffect, useRef } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { createViewer, type ViewerApi } from "@/lib/viewerEngine";

/**
 * Coquille React de la visionneuse : React pose le balisage une fois,
 * puis le moteur (viewerEngine) pilote tout le mouvement sans re-rendu.
 */
export function ImageStage({ src, w, h, apiRef }: { src: string; w: number; h: number; apiRef: React.RefObject<ViewerApi | null> }) {
  const stage = useRef<HTMLDivElement>(null), img = useRef<HTMLImageElement>(null), frame = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null), zlabel = useRef<HTMLSpanElement>(null), fsClose = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const v = createViewer({ stage: stage.current!, img: img.current!, frame: frame.current!, tag: tag.current!, zlabel: zlabel.current!, fsClose: fsClose.current! }, w, h);
    apiRef.current = v.api;
    return () => { v.destroy(); apiRef.current = null; };
  }, [src, w, h, apiRef]);

  const zbtn = "btn-press w-11 h-11 rounded-full flex items-center justify-center hover:bg-white/70 dark:hover:bg-white/10";
  const tbtn = "btn-press h-11 px-3 rounded-full text-xs font-black hover:bg-white/70 dark:hover:bg-white/10";

  return (
    <div ref={stage} className="stage checker absolute inset-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element -- URL blob locale transformée par le moteur */}
      <img key={src} ref={img} src={src} alt="Contenu collé" draggable={false} decoding="async" style={{ opacity: 0 }} />
      <div ref={frame} className="rz-frame">
        {(["nw", "ne", "sw", "se"] as const).map((d) => <span key={d} className="rz-h" data-h={d} aria-hidden="true" />)}
      </div>
      <div ref={tag} className="size-tag absolute left-4 top-4 z-10 glass-panel rounded-2xl px-3 py-2 text-xs font-black tabular" />
      <button ref={fsClose} className="hidden absolute right-4 z-10 btn-glass btn-press w-12 h-12 rounded-2xl items-center justify-center"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }} aria-label="Quitter le plein écran">
        <X className="w-5 h-5" />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 z-10 glass-panel rounded-full p-1.5 flex items-center gap-1 shadow-[0_15px_40px_rgba(0,0,0,0.12)]"
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}>
        <button className={zbtn} aria-label="Dézoomer" onClick={(e) => { e.stopPropagation(); apiRef.current?.zoomCenter(1 / 1.4); }}><ZoomOut className="w-5 h-5" /></button>
        <span ref={zlabel} className="tabular w-16 text-center text-sm font-black">100 %</span>
        <button className={zbtn} aria-label="Zoomer" onClick={(e) => { e.stopPropagation(); apiRef.current?.zoomCenter(1.4); }}><ZoomIn className="w-5 h-5" /></button>
        <span className="w-px h-6 bg-slate-900/10 dark:bg-white/10 mx-1" />
        <button className={tbtn} title="Ajuster à l'écran (0)" onClick={(e) => { e.stopPropagation(); apiRef.current?.fit(); }}>Ajuster</button>
        <button className={tbtn} title="Taille réelle (1)" onClick={(e) => { e.stopPropagation(); apiRef.current?.one(); }}>1:1</button>
      </div>
    </div>
  );
}
