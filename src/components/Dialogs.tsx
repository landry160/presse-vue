"use client";
import { Check, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { CloseButton, Modal } from "./Modal";
import { PRESETS, type Theme } from "@/hooks/useTheme";

export function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }: {
  title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <Modal onClose={onCancel} label={title}>
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 border border-rose-200 dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-300 flex items-center justify-center shadow-inner">
        <Trash2 className="w-6 h-6" />
      </div>
      <h3 className="mt-5 text-2xl font-black tracking-tight">{title}</h3>
      <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3">
        <button onClick={onCancel} className="btn-glass btn-press flex-1 h-12 rounded-full font-black text-sm">Annuler</button>
        <button data-autofocus onClick={onConfirm} className="btn-press flex-1 h-12 rounded-full font-black text-sm text-white"
          style={{ background: "linear-gradient(135deg,#FF2B5E,#FF6B00)", boxShadow: "0 10px 20px rgba(255,43,94,.3)" }}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

const MODES = [
  { id: "light", label: "Clair", I: Sun },
  { id: "dark", label: "Sombre", I: Moon },
  { id: "system", label: "Système", I: Monitor },
] as const;

export function SettingsDialog({ theme, setTheme, onClose }: { theme: Theme; setTheme: (p: Partial<Theme>) => void; onClose: () => void }) {
  return (
    <Modal onClose={onClose} label="Apparence">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight">Apparence</h3>
        <CloseButton onClick={onClose} />
      </div>
      <p className="mt-6 text-[11px] font-black uppercase tracking-widest opacity-70">Mode d&apos;affichage</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {MODES.map(({ id, label, I }) => (
          <button key={id} onClick={() => setTheme({ mode: id })} aria-pressed={theme.mode === id}
            className={`btn-press h-16 rounded-2xl flex flex-col items-center justify-center gap-1 font-black text-xs ${theme.mode === id ? "active-item text-primary" : "btn-glass"}`}>
            <I className="w-5 h-5" />{label}
          </button>
        ))}
      </div>
      <p className="mt-6 text-[11px] font-black uppercase tracking-widest opacity-70">Couleur</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} onClick={() => setTheme({ preset: p.id })} aria-label={p.label} aria-pressed={theme.preset === p.id} className="btn-press flex flex-col items-center gap-1.5">
            <span className={`w-full aspect-square rounded-2xl border-2 flex items-center justify-center text-white ${theme.preset === p.id ? "border-slate-900 dark:border-white" : "border-white/60"}`} style={{ background: p.bg }}>
              {theme.preset === p.id && <Check className="w-5 h-5" />}
            </span>
            <span className="text-[10px] font-black truncate max-w-full">{p.label}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
