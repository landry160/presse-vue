"use client";
import { useState } from "react";
import { Copy, Download, Link, LoaderCircle, Plus, Unlink } from "lucide-react";
import { CloseButton, Modal } from "./Modal";
import { clamp, extFor, fmtNum, stamp } from "@/lib/format";
import { MAX_SIDE, resizeBlob } from "@/lib/media";
import { copyImageBlob, downloadBlob } from "@/lib/actions";

type Props = {
  src: Blob; ow: number; oh: number; viewPct: number;
  onClose: () => void;
  onAdd: (blob: Blob, w: number, h: number, type: string) => Promise<void>;
  toast: (msg: string, type?: "success" | "error" | "info") => void;
};

/** Changer la vraie taille de l'image (en pixels), puis la recopier, l'enregistrer ou l'ajouter à l'historique. */
export function ResizeDialog({ src, ow, oh, viewPct, onClose, onAdd, toast }: Props) {
  const [w, setW] = useState(ow);
  const [h, setH] = useState(oh);
  const [lock, setLock] = useState(true);
  const [wTxt, setWTxt] = useState(String(ow));
  const [hTxt, setHTxt] = useState(String(oh));
  const [busy, setBusy] = useState<null | "copy" | "save" | "add">(null);

  const pct = Math.round((w / ow) * 100);
  const range = clamp(pct, 1, 400);
  const keepType = src.type === "image/jpeg" ? "image/jpeg" : "image/png";

  const setSize = (nw: number, nh: number) => { setW(nw); setH(nh); setWTxt(String(nw)); setHTxt(String(nh)); };
  const setPct = (p: number) => setSize(clamp(Math.round((ow * p) / 100), 1, MAX_SIDE), clamp(Math.round((oh * p) / 100), 1, MAX_SIDE));

  const onW = (v: string) => {
    setWTxt(v);
    const n = clamp(Math.round(+v || 0), 0, MAX_SIDE); if (!n) return;
    setW(n);
    if (lock) { const nh = clamp(Math.round((n * oh) / ow), 1, MAX_SIDE); setH(nh); setHTxt(String(nh)); }
  };
  const onH = (v: string) => {
    setHTxt(v);
    const n = clamp(Math.round(+v || 0), 0, MAX_SIDE); if (!n) return;
    setH(n);
    if (lock) { const nw = clamp(Math.round((n * ow) / oh), 1, MAX_SIDE); setW(nw); setWTxt(String(nw)); }
  };
  const toggleLock = () => {
    const next = !lock; setLock(next);
    if (next) { const nh = clamp(Math.round((w * oh) / ow), 1, MAX_SIDE); setH(nh); setHTxt(String(nh)); }
  };

  const run = async (kind: "copy" | "save" | "add", fn: () => Promise<void>) => {
    setBusy(kind);
    try { await fn(); } catch { toast("Le redimensionnement a échoué. Essayez une taille plus petite.", "error"); }
    setBusy(null);
  };
  const copy = () => run("copy", async () => {
    const out = await resizeBlob(src, w, h, "image/png");
    try { await copyImageBlob(out); toast(`Image ${fmtNum(w)} × ${fmtNum(h)} recopiée — collez-la où vous voulez`); }
    catch { toast("La copie est bloquée par le navigateur. Utilisez « Enregistrer » à la place.", "error"); }
  });
  const save = () => run("save", async () => {
    const out = await resizeBlob(src, w, h, keepType);
    const name = `presse-vue-${w}x${h}-${stamp()}.${extFor(keepType)}`;
    downloadBlob(out, name); toast(`Enregistrement de « ${name} »`);
  });
  const add = () => run("add", async () => {
    const out = await resizeBlob(src, w, h, keepType);
    await onAdd(out, w, h, keepType);
  });

  const spinner = <><LoaderCircle className="w-5 h-5 spin" /><span>Redimensionnement…</span></>;
  const presets = [25, 50, 75, 150, 200];

  return (
    <Modal onClose={onClose} label="Redimensionner l'image">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black tracking-tight">Redimensionner l&apos;image</h3>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400 tabular">Originale : {fmtNum(ow)} × {fmtNum(oh)} px</p>
        </div>
        <CloseButton onClick={onClose} />
      </div>
      <div className="mt-6 text-center">
        <p className="text-6xl font-black tracking-tighter tabular">{pct} %</p>
        <p className="mt-1 text-sm font-black tabular text-primary">{fmtNum(w)} × {fmtNum(h)} px</p>
      </div>
      <input type="range" className="rng w-full mt-5" min={1} max={400} step={1} value={range} aria-label="Échelle en pourcentage"
        style={{ ["--p" as string]: ((range - 1) / 399) * 100 + "%" }} onChange={(e) => setPct(+e.target.value)} />
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p} onClick={() => setPct(p)} className="btn-glass btn-press h-11 px-4 rounded-2xl text-xs font-black tabular">{p} %</button>
        ))}
        <button onClick={() => setPct(viewPct)} className="btn-glass btn-press h-11 px-4 rounded-2xl text-xs font-black">Taille affichée ({viewPct} %)</button>
      </div>
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Largeur (px)</span>
          <input type="number" inputMode="numeric" min={1} max={MAX_SIDE} value={wTxt} onChange={(e) => onW(e.target.value)} onBlur={() => setWTxt(String(w))}
            className="num mt-1.5 w-full h-12 rounded-2xl px-4 text-base font-black tabular" />
        </label>
        <button onClick={toggleLock} aria-label="Garder les proportions" aria-pressed={lock}
          className={`btn-press w-12 h-12 rounded-2xl flex items-center justify-center ${lock ? "active-item" : "btn-glass"}`}>
          {lock ? <Link className="w-5 h-5" /> : <Unlink className="w-5 h-5" />}
        </button>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Hauteur (px)</span>
          <input type="number" inputMode="numeric" min={1} max={MAX_SIDE} value={hTxt} onChange={(e) => onH(e.target.value)} onBlur={() => setHTxt(String(h))}
            className="num mt-1.5 w-full h-12 rounded-2xl px-4 text-base font-black tabular" />
        </label>
      </div>
      <button data-autofocus onClick={copy} disabled={!!busy}
        className="btn-primary btn-press mt-7 w-full h-14 rounded-full font-black text-base tracking-wide inline-flex items-center justify-center gap-2 disabled:opacity-80">
        {busy === "copy" ? spinner : <><Copy className="w-5 h-5" /><span>Recopier l&apos;image redimensionnée</span></>}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={save} disabled={!!busy} className="btn-glass btn-press h-12 rounded-full font-black text-sm inline-flex items-center justify-center gap-2">
          {busy === "save" ? spinner : <><Download className="w-4 h-4" />Enregistrer</>}
        </button>
        <button onClick={add} disabled={!!busy} className="btn-glass btn-press h-12 rounded-full font-black text-sm inline-flex items-center justify-center gap-2">
          {busy === "add" ? spinner : <><Plus className="w-4 h-4" />Ajouter à l&apos;historique</>}
        </button>
      </div>
    </Modal>
  );
}
