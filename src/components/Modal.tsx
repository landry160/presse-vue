"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/** Modale en verre : panneau centré sur desktop, feuille glissée depuis le bas sur mobile. */
export function Modal({ onClose, children, label }: { onClose: () => void; children: React.ReactNode; label: string }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => prev?.focus?.();
  }, []);
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={label}
        className="glass-panel w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 anim-pop safe-b max-h-[92dvh] overflow-y-auto thin-scroll">
        {children}
      </div>
    </div>
  );
}

export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="btn-glass btn-press w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" aria-label="Fermer">
      <X className="w-5 h-5" />
    </button>
  );
}
