"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ToastType } from "@/lib/types";

type Toast = { id: number; msg: string; type: ToastType; leaving?: boolean };
const Ctx = createContext<(msg: string, type?: ToastType) => void>(() => {});
export const useToast = () => useContext(Ctx);

const ICON = {
  success: { I: CircleCheck, color: "#18c480" },
  error: { I: TriangleAlert, color: "#FF2B5E" },
  info: { I: Info, color: "var(--primary)" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const push = useCallback((msg: string, type: ToastType = "success") => {
    const id = ++next.current;
    setToasts((t) => [...t.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x))), 4000);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4300);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed z-[90] left-4 right-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none" style={{ top: "max(1rem, env(safe-area-inset-top))", right: "1rem" }}>
        {toasts.map(({ id, msg, type, leaving }) => {
          const { I, color } = ICON[type];
          return (
            <div key={id} role="status"
              className="pointer-events-auto glass-panel rounded-2xl px-4 py-3 flex items-start gap-3 anim-slide shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
              style={leaving ? { opacity: 0, transform: "translateY(-8px)" } : undefined}>
              <I className="w-5 h-5 shrink-0 mt-0.5" style={{ color }} />
              <p className="text-sm font-bold leading-snug flex-1">{msg}</p>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
