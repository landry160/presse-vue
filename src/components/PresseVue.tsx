"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { HistStatus, HtmlView, Item } from "@/lib/types";
import { KIND, isMac, titleOf, uid } from "@/lib/format";
import { dbAll, dbClear, dbDel, dbPut, openDb } from "@/lib/db";
import { fromDataTransfer, ingest, readClipboardApi, type Clip } from "@/lib/ingest";
import { copyItem, downloadItem } from "@/lib/actions";
import { makeThumb } from "@/lib/media";
import { revoke } from "@/lib/objectUrls";
import type { ViewerApi } from "@/lib/viewerEngine";
import { useTheme } from "@/hooks/useTheme";
import { Background } from "./Background";
import { Header } from "./Header";
import { HistoryPanel, HistoryStrip } from "./History";
import { EmptyState } from "./EmptyState";
import dynamic from "next/dynamic";

// Chargés à la demande : l'écran d'accueil n'a besoin ni de la visionneuse ni des modales.
const Viewer = dynamic(() => import("./Viewer").then((m) => m.Viewer), { loading: () => <ViewerSkeleton /> });
const ResizeDialog = dynamic(() => import("./ResizeDialog").then((m) => m.ResizeDialog));
const ConfirmDialog = dynamic(() => import("./Dialogs").then((m) => m.ConfirmDialog));
const SettingsDialog = dynamic(() => import("./Dialogs").then((m) => m.SettingsDialog));

function ViewerSkeleton() {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-5 lg:px-7 lg:pt-6 flex items-center gap-3 border-b border-white/60 dark:border-white/5">
        <div className="skel w-24 h-8 rounded-xl" /><div className="flex-1 space-y-2"><div className="skel h-4 rounded-full w-1/3" /><div className="skel h-3 rounded-full w-1/4" /></div>
      </div>
      <div className="flex-1 m-5 skel rounded-[28px]" />
    </div>
  );
}
import { ToastProvider, useToast } from "./Toasts";

const MAX_ITEMS = 60;
type Dialog =
  | { type: "settings" }
  | { type: "resize"; viewPct: number }
  | { type: "confirm"; title: string; message: string; confirmLabel: string; onConfirm: () => void }
  | null;

export default function PresseVue() {
  return (
    <ToastProvider>
      <App />
    </ToastProvider>
  );
}

function App() {
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hist, setHist] = useState<HistStatus>("loading");
  const [view, setView] = useState<HtmlView>("preview");
  const [textSize, setTextSize] = useState(16);
  const [jsonPretty, setJsonPretty] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mac, setMac] = useState(false);
  const [tick, setTick] = useState(0);
  const apiRef = useRef<ViewerApi | null>(null);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const active = items.find((i) => i.id === activeId) || null;

  const select = useCallback((id: string | null) => {
    setActiveId(id); setView("preview"); setJsonPretty(false);
  }, []);

  /* ---------- Historique (IndexedDB) ---------- */
  const loadHistory = useCallback(async () => {
    setHist("loading");
    try {
      await openDb();
      const all = (await dbAll()) || [];
      setItems((prev) => {
        const map = new Map<string, Item>();
        [...prev, ...all].forEach((i) => map.set(i.id, i));
        return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
      });
      setHist("ready");
      setActiveId((cur) => cur ?? (all.sort((a, b) => b.createdAt - a.createdAt)[0]?.id || null));
    } catch {
      setHist("error");
    }
  }, []);

  useEffect(() => {
    // Chargement initial de l'historique local, impossible pendant le rendu statique.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
    setMac(isMac());
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, [loadHistory]);

  const addItems = useCallback(async (list: Item[], pick: string) => {
    for (const it of list) { try { await dbPut(it); } catch { /* reste en mémoire */ } }
    const next = [...list.slice().reverse(), ...itemsRef.current];
    const removed = next.splice(MAX_ITEMS);
    itemsRef.current = next;
    setItems(next);
    removed.forEach((o) => { revoke(o.blob, o.image, o.thumb); dbDel(o.id).catch(() => {}); });
    setHist((h) => (h === "loading" ? h : "ready"));
    select(pick);
  }, [select]);

  /* ---------- Collage ---------- */
  const handleClip = useCallback(async (clip: Clip | null) => {
    if (!clip) return;
    const res = await ingest(clip, itemsRef.current[0]);
    if (res.type === "empty") return toast("Le presse-papiers semble vide ou son contenu n'est pas lisible par le navigateur.", "error");
    if (res.type === "duplicate") {
      select(res.id);
      return toast(res.kind === "image" ? "Déjà affichée — c'est la même image" : "Déjà affiché — c'est le même contenu", "info");
    }
    // l'élément choisi passe en dernier pour finir en haut de l'historique
    const ordered = res.items.slice().sort((a, b) => Number(a.id === res.pick) - Number(b.id === res.pick));
    await addItems(ordered, res.pick);
    const sel = res.items.find((c) => c.id === res.pick)!;
    const extra = res.items.length - 1;
    toast(`${KIND[sel.kind].label} collé${sel.kind === "image" ? "e" : ""}${extra ? ` (+${extra} autre${extra > 1 ? "s" : ""})` : ""}`);
  }, [addItems, select, toast]);

  const pasteViaApi = useCallback(async () => {
    try { await handleClip(await readClipboardApi()); }
    catch {
      const coarse = matchMedia("(pointer: coarse)").matches;
      toast(`Le navigateur bloque le bouton ici — appuyez simplement sur ${isMac() ? "⌘ + V" : "Ctrl + V"}${coarse ? ", ou touchez la zone de collage puis « Coller »" : ""}.`, "info");
    }
  }, [handleClip, toast]);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && /INPUT|TEXTAREA/.test(t.tagName)) return; // laisse coller dans les champs de saisie
      e.preventDefault();
      handleClip(fromDataTransfer(e.clipboardData));
      document.querySelectorAll<HTMLElement>("[data-pastezone]").forEach((z) => { z.textContent = ""; z.blur(); });
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleClip]);

  /* ---------- Glisser-déposer ---------- */
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; setDragOver(true); };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = (e: DragEvent) => { if (!hasFiles(e)) return; if (--depth <= 0) { depth = 0; setDragOver(false); } };
    const drop = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; setDragOver(false); handleClip(fromDataTransfer(e.dataTransfer)); };
    window.addEventListener("dragenter", enter); window.addEventListener("dragover", over);
    window.addEventListener("dragleave", leave); window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter); window.removeEventListener("dragover", over);
      window.removeEventListener("dragleave", leave); window.removeEventListener("drop", drop);
    };
  }, [handleClip]);

  /* ---------- Actions ---------- */
  const removeItem = useCallback((it: Item) => {
    setDialog({
      type: "confirm", title: "Supprimer cet élément ?", confirmLabel: "Supprimer",
      message: `« ${titleOf(it)} » sera retiré de l'historique. Votre presse-papiers n'est pas touché.`,
      onConfirm: () => {
        const list = itemsRef.current, idx = list.findIndex((x) => x.id === it.id);
        const next = list.filter((x) => x.id !== it.id);
        setItems(next);
        revoke(it.blob, it.image, it.thumb);
        dbDel(it.id).catch(() => {});
        setActiveId((cur) => (cur === it.id ? (next[idx] || next[idx - 1])?.id || null : cur));
        toast("Élément supprimé");
      },
    });
  }, [toast]);

  const clearAll = useCallback(() => {
    const n = itemsRef.current.length;
    if (!n) return toast("L'historique est déjà vide", "info");
    setDialog({
      type: "confirm", title: "Vider l'historique ?", confirmLabel: "Tout effacer",
      message: `Les ${n} éléments collés seront effacés de Presse-Vue. Votre presse-papiers n'est pas touché.`,
      onConfirm: () => {
        itemsRef.current.forEach((i) => revoke(i.blob, i.image, i.thumb));
        setItems([]); setActiveId(null);
        dbClear().catch(() => {});
        toast("Historique vidé");
      },
    });
  }, [toast]);

  const onCopy = useCallback(async () => {
    if (!active) return;
    try { toast(await copyItem(active, view, jsonPretty)); }
    catch { toast(active.kind === "file" ? "Un fichier ne peut pas être recopié dans le presse-papiers." : "La copie est bloquée par le navigateur. Utilisez « Enregistrer » à la place.", "error"); }
  }, [active, view, jsonPretty, toast]);

  const onDownload = useCallback(() => {
    if (!active) return;
    toast(`Enregistrement de « ${downloadItem(active, view, jsonPretty)} »`);
  }, [active, view, jsonPretty, toast]);

  const openResize = useCallback(() => {
    if (active && (active.kind === "image" || (active.kind === "html" && active.image))) setDialog({ type: "resize", viewPct: Math.round((apiRef.current?.scale() ?? 1) * 100) });
  }, [active]);

  const onResizedAdd = useCallback(async (blob: Blob, w: number, h: number, type: string) => {
    const it: Item = { id: uid(), createdAt: Date.now(), kind: "image", blob, mime: type, size: blob.size, w, h, name: `Image ${w} × ${h} (redimensionnée)` };
    it.thumb = await makeThumb(blob, w, h);
    setDialog(null);
    await addItems([it], it.id);
    toast("Image redimensionnée ajoutée à l'historique");
  }, [addItems, toast]);

  /* ---------- Clavier ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      if (e.key === "Escape") {
        if (dialog) return setDialog(null);
        if (apiRef.current?.isFs()) { apiRef.current.toggleFs(); return; }
      }
      if (dialog || e.ctrlKey || e.metaKey || e.altKey) return;
      const api = apiRef.current;
      if (api) {
        if (e.key === "+" || e.key === "=") { api.zoomCenter(1.25); e.preventDefault(); }
        else if (e.key === "-") { api.zoomCenter(0.8); e.preventDefault(); }
        else if (e.key === "0") api.fit();
        else if (e.key === "1") api.one();
        else if (e.key === "f" || e.key === "F") api.toggleFs();
        else if (e.key === "r" || e.key === "R") openResize();
      }
      if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
        const i = items.findIndex((x) => x.id === activeId);
        const n = items[Math.min(items.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))];
        if (n && n.id !== activeId) { e.preventDefault(); select(n.id); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dialog, items, activeId, select, openResize]);

  /* Le fond s'immobilise quand un élément est affiché : le verre n'est plus recalculé à chaque image */
  useEffect(() => { document.body.classList.toggle("viewing", !!active); }, [active]);

  /* La puce active reste visible dans la bande mobile */
  useEffect(() => {
    document.querySelector(`#histStrip [data-id="${activeId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  const resizeSrc = active ? (active.kind === "image" ? active.blob : active.image) : undefined;

  return (
    <>
      <Background />
      <div className="h-[100dvh] flex flex-col">
        <Header showPaste={!!active} onPaste={pasteViaApi} onSettings={() => setDialog({ type: "settings" })} />
        <div className="flex-1 min-h-0 flex gap-5 p-3 sm:p-4 lg:p-6 safe-x">
          <HistoryPanel items={items} activeId={activeId} status={hist} tick={tick} onSelect={select} onClear={clearAll} onRetry={loadHistory} />
          <main className="flex-1 min-w-0 flex flex-col gap-3">
            <HistoryStrip items={items} activeId={activeId} status={hist} onSelect={select} />
            <section className="flex-1 min-h-0 flex flex-col glass-panel rounded-[28px] lg:rounded-[40px] overflow-hidden" aria-label="Contenu collé">
              {active ? (
                <Viewer key={active.id} it={active} view={view} setView={setView} textSize={textSize} setTextSize={setTextSize}
                  jsonPretty={jsonPretty} setJsonPretty={setJsonPretty} apiRef={apiRef}
                  onCopy={onCopy} onDownload={onDownload} onDelete={() => removeItem(active)} onResize={openResize} />
              ) : (
                <EmptyState mac={mac} onPaste={pasteViaApi} />
              )}
            </section>
          </main>
        </div>
      </div>

      {dragOver && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm pointer-events-none">
          <div className="glass-panel rounded-[40px] p-10 text-center anim-pop max-w-md w-full">
            <div className="w-20 h-20 mx-auto rounded-[28px] btn-primary flex items-center justify-center anim-float"><Upload className="w-9 h-9" /></div>
            <p className="mt-6 text-3xl font-black tracking-tighter">Déposez pour afficher</p>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">Images, vidéos, PDF, texte… tout fichier.</p>
          </div>
        </div>
      )}

      {dialog?.type === "settings" && <SettingsDialog theme={theme} setTheme={setTheme} onClose={() => setDialog(null)} />}
      {dialog?.type === "confirm" && (
        <ConfirmDialog title={dialog.title} message={dialog.message} confirmLabel={dialog.confirmLabel}
          onCancel={() => setDialog(null)} onConfirm={() => { dialog.onConfirm(); setDialog(null); }} />
      )}
      {dialog?.type === "resize" && active && resizeSrc && (
        <ResizeDialog src={resizeSrc} ow={(active.kind === "image" ? active.w : active.iw) || 1} oh={(active.kind === "image" ? active.h : active.ih) || 1}
          viewPct={dialog.viewPct} onClose={() => setDialog(null)} onAdd={onResizedAdd} toast={toast} />
      )}
    </>
  );
}
