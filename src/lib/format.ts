import type { Item, Kind } from "./types";

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const fmtNum = (n: number) => n.toLocaleString("fr-CA");

export function fmtBytes(b?: number): string {
  if (b == null) return "";
  const u = ["o", "Ko", "Mo", "Go"];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return (i ? b.toFixed(b < 10 ? 1 : 0) : String(b)) + " " + u[i];
}

export function fmtAgo(t: number): string {
  const s = (Date.now() - t) / 1000;
  if (s < 45) return "à l'instant";
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return new Date(t).toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

export function stamp(): string {
  const d = new Date(), p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const EXT: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp",
  "image/svg+xml": "svg", "image/bmp": "bmp", "image/avif": "avif",
};
export const extFor = (mime = "") => EXT[mime] || (mime.split("/")[1] || "bin").split("+")[0];

export const KIND: Record<Kind, { label: string; bg: string; sh: string }> = {
  image: { label: "Image", bg: "var(--gradient-primary)", sh: "var(--shadow-primary)" },
  text: { label: "Texte", bg: "var(--gradient-accent)", sh: "var(--shadow-accent)" },
  html: { label: "Contenu riche", bg: "linear-gradient(135deg,#FFC800 0%,#FF5100 100%)", sh: "0 10px 20px rgba(255,81,0,.28)" },
  file: { label: "Fichier", bg: "linear-gradient(135deg,#34e3a0 0%,#0e9f6e 100%)", sh: "0 10px 20px rgba(24,196,128,.3)" },
};

export function titleOf(it: Item): string {
  if (it.kind === "image") return it.name || `Image ${it.w} × ${it.h}`;
  if (it.kind === "file") return it.name || "Fichier";
  const t = (it.text || "").trim().replace(/\s+/g, " ");
  return t ? (t.length > 60 ? t.slice(0, 60) + "…" : t) : "Contenu HTML";
}

export function textStats(t: string) {
  return {
    chars: t.length,
    words: (t.match(/\S+/g) || []).length,
    lines: t ? t.split(/\r\n|\r|\n/).length : 0,
  };
}

export function metaOf(it: Item): string {
  if (it.kind === "image") return `${it.w} × ${it.h} px · ${fmtBytes(it.size)} · ${extFor(it.mime).toUpperCase()}`;
  if (it.kind === "file") return `${fmtBytes(it.size)} · ${it.mime || "type inconnu"}`;
  const s = textStats(it.text || "");
  return `${fmtNum(s.chars)} caractères · ${fmtNum(s.words)} mots · ${fmtNum(s.lines)} lignes`;
}

export function jsonOf(t?: string): unknown {
  const s = (t || "").trim();
  if (!/^[\[{]/.test(s) || s.length > 5e6) return null;
  try { return JSON.parse(s); } catch { return null; }
}
export const prettyJson = (t: string) => { const j = jsonOf(t); return j == null ? t : JSON.stringify(j, null, 2); };

export const isUrl = (t: string) => /^https?:\/\/\S+$/.test(t.trim());
export const isColor = (t: string) => /^(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([^)]+\)|hsla?\([^)]+\))$/i.test(t.trim());

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
