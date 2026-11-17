import { clamp, fmtNum } from "./format";

/**
 * Moteur de la visionneuse d'image, volontairement hors de React.
 * Tout ce qui bouge à chaque image (zoom, déplacement, pincement, poignées) écrit directement
 * style.transform dans une boucle requestAnimationFrame : aucun re-rendu React pendant un geste.
 */
export type ViewerEls = {
  stage: HTMLDivElement;
  img: HTMLImageElement;
  frame: HTMLDivElement;
  tag: HTMLDivElement;
  zlabel: HTMLSpanElement;
  fsClose: HTMLButtonElement;
};

export type ViewerApi = {
  fit: () => void;
  one: () => void;
  zoomCenter: (f: number) => void;
  toggleFs: () => boolean;
  isFs: () => boolean;
  scale: () => number;
};

const S_MIN = 0.02, S_MAX = 40;
type Anim = { type: "anchor"; ls: number; cx: number; cy: number } | { type: "free"; s: number; tx: number; ty: number } | null;
type Resize = { dir: string; ax: number; ay: number } | null;

export function createViewer(els: ViewerEls, iw: number, ih: number): { api: ViewerApi; destroy: () => void } {
  const { stage, img, frame, tag, zlabel, fsClose } = els;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let s = 1, tx = 0, ty = 0, fitS = 1, mode: "fit" | "free" = "fit", fs = false;
  let anim: Anim = null, rz: Resize = null, raf = 0, last = 0, alive = true;
  let settleT: ReturnType<typeof setTimeout> | undefined, tagT: ReturnType<typeof setTimeout> | undefined;
  const ptrs = new Map<number, { x: number; y: number }>();
  let pinch: { d: number; mx: number; my: number } | null = null;

  img.style.width = iw + "px";
  img.style.height = ih + "px";

  const rect = () => stage.getBoundingClientRect();
  const computeFit = () => {
    const r = rect(), pad = r.width < 600 ? 16 : 40;
    return Math.max(0.01, Math.min((r.width - pad * 2) / iw, (r.height - pad * 2 - 64) / ih, 3));
  };
  const centered = (sc: number) => {
    const r = rect();
    return { s: sc, tx: (r.width - iw * sc) / 2, ty: (r.height - ih * sc) / 2 - (r.width < 600 ? 24 : 20) };
  };
  const setScaleAt = (ns: number, cx: number, cy: number) => {
    tx = cx - ((cx - tx) * ns) / s; ty = cy - ((cy - ty) * ns) / s; s = ns;
  };

  function apply() {
    const W = iw * s, H = ih * s;
    img.style.transform = `translate3d(${tx}px,${ty}px,0) scale(${s})`;
    img.style.imageRendering = s >= 3 ? "pixelated" : "auto";
    frame.style.transform = `translate3d(${tx}px,${ty}px,0)`;
    frame.style.width = W + "px"; frame.style.height = H + "px";
    zlabel.textContent = Math.round(s * 100) + " %";
    if (rz) tag.textContent = `${fmtNum(Math.round(W))} × ${fmtNum(Math.round(H))} px · ${Math.round(s * 100)} %`;
  }

  function step(t: number) {
    raf = 0; if (!alive) return;
    const dt = last ? Math.min(64, t - last) : 16.7; last = t;
    const k = 1 - Math.pow(0.78, dt / 16.7); // ~22 % du chemin par image à 60 i/s, quel que soit l'écran
    const a = anim;
    if (a && a.type === "anchor") {
      const ls = Math.log(s), d = a.ls - ls;
      const nls = Math.abs(d) < 0.0015 ? a.ls : ls + d * k;
      setScaleAt(Math.exp(nls), a.cx, a.cy);
      if (nls === a.ls) anim = null;
    } else if (a) {
      const ls = Math.log(s), tl = Math.log(a.s);
      if (Math.abs(tl - ls) < 0.0015 && Math.abs(a.tx - tx) < 0.4 && Math.abs(a.ty - ty) < 0.4) {
        s = a.s; tx = a.tx; ty = a.ty; anim = null;
      } else {
        s = Math.exp(ls + (tl - ls) * k); tx += (a.tx - tx) * k; ty += (a.ty - ty) * k;
      }
    }
    apply();
    if (anim) kick();
    else {
      last = 0; clearTimeout(settleT);
      settleT = setTimeout(() => img.classList.remove("moving"), 160); // re-rastérise net une fois immobile
    }
  }
  function kick() {
    if (!raf && alive) { img.classList.add("moving"); raf = requestAnimationFrame(step); }
  }

  function goTo(t: { s: number; tx: number; ty: number }, instant = false) {
    if (instant || reduceMotion) { anim = null; s = t.s; tx = t.tx; ty = t.ty; kick(); return; }
    anim = { type: "free", ...t }; kick();
  }
  function fit(instant = false) { fitS = computeFit(); mode = "fit"; goTo(centered(fitS), instant); }
  function one() { mode = "free"; goTo(centered(1)); }
  function zoomBy(f: number, cx: number, cy: number, instant = false) {
    const base = anim && anim.type === "anchor" ? Math.exp(anim.ls) : s;
    const ns = clamp(base * f, S_MIN, S_MAX); mode = "free";
    if (instant || reduceMotion) { anim = null; setScaleAt(ns, cx, cy); kick(); return; }
    anim = { type: "anchor", ls: Math.log(ns), cx, cy }; kick();
  }
  function zoomCenter(f: number) { const r = rect(); zoomBy(f, r.width / 2, r.height / 2); }
  function showTag(on: boolean) {
    clearTimeout(tagT);
    if (on) tag.classList.add("on"); else tagT = setTimeout(() => tag.classList.remove("on"), 900);
  }
  function toggleFs() {
    fs = !fs;
    stage.classList.toggle("is-fs", fs);
    fsClose.classList.toggle("hidden", !fs); fsClose.classList.toggle("flex", fs);
    document.body.style.overflow = fs ? "hidden" : "";
    requestAnimationFrame(() => fit());
    return fs;
  }

  /* ---------- Événements ---------- */
  const ac = new AbortController();
  const o = { signal: ac.signal };

  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = rect();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const pad = e.ctrlKey; // pincement sur pavé tactile = wheel + ctrlKey
    zoomBy(Math.exp(-dy * (pad ? 0.012 : 0.0022)), e.clientX - r.left, e.clientY - r.top, pad);
  }, { passive: false, signal: ac.signal });

  frame.querySelectorAll<HTMLElement>(".rz-h").forEach((h) => {
    h.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); e.preventDefault(); h.setPointerCapture(e.pointerId);
      const W = iw * s, H = ih * s, dir = h.dataset.h || "se";
      rz = { dir, ax: dir.includes("w") ? tx + W : tx, ay: dir.includes("n") ? ty + H : ty };
      anim = null; mode = "free"; h.classList.add("on"); frame.classList.add("active"); showTag(true); kick();
    }, o);
    h.addEventListener("pointermove", (e) => {
      if (!rz || !h.hasPointerCapture(e.pointerId)) return;
      const r = rect(), px = e.clientX - r.left, py = e.clientY - r.top, z = rz;
      const dx = Math.max(0, z.dir.includes("w") ? z.ax - px : px - z.ax);
      const dy = Math.max(0, z.dir.includes("n") ? z.ay - py : py - z.ay);
      // projection sur la diagonale : pas d'à-coup quand on passe de la largeur à la hauteur
      const ns = clamp((dx * iw + dy * ih) / (iw * iw + ih * ih), S_MIN, S_MAX);
      s = ns;
      tx = z.dir.includes("w") ? z.ax - iw * ns : z.ax;
      ty = z.dir.includes("n") ? z.ay - ih * ns : z.ay;
      kick();
    }, o);
    const end = () => { if (!rz) return; rz = null; h.classList.remove("on"); frame.classList.remove("active"); showTag(false); };
    h.addEventListener("pointerup", end, o);
    h.addEventListener("pointercancel", end, o);
  });

  const isCtrl = (e: Event) => !!(e.target as HTMLElement).closest("button, .rz-h");
  stage.addEventListener("pointerdown", (e) => {
    if (isCtrl(e)) return;
    stage.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    stage.classList.add("dragging"); anim = null;
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    }
  }, o);
  stage.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId) || rz) return;
    const prev = ptrs.get(e.pointerId)!; ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2 && pinch) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, r = rect();
      tx += mx - pinch.mx; ty += my - pinch.my;
      setScaleAt(clamp((s * d) / pinch.d, S_MIN, S_MAX), mx - r.left, my - r.top);
      pinch = { d, mx, my };
    } else if (ptrs.size === 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; }
    mode = "free"; kick();
  }, o);
  const up = (e: PointerEvent) => {
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) stage.classList.remove("dragging");
  };
  stage.addEventListener("pointerup", up, o);
  stage.addEventListener("pointercancel", up, o);
  stage.addEventListener("dblclick", (e) => {
    if (isCtrl(e)) return;
    const r = rect();
    if (Math.abs(s - fitS) < 0.01) zoomBy(Math.max(1, fitS * 2) / s, e.clientX - r.left, e.clientY - r.top);
    else fit();
  }, o);
  fsClose.addEventListener("click", (e) => { e.stopPropagation(); toggleFs(); }, o);

  let rzT: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(rzT); rzT = setTimeout(() => { if (mode === "fit") fit(true); }, 120);
  }, o);

  // Ajuste et affiche l'image une fois décodée (pas de saut visuel)
  const show = () => { if (!alive) return; fit(true); img.style.opacity = "1"; };
  (img.decode ? img.decode() : Promise.resolve()).then(show, show);

  return {
    api: { fit: () => fit(), one, zoomCenter, toggleFs, isFs: () => fs, scale: () => s },
    destroy() {
      alive = false; ac.abort(); cancelAnimationFrame(raf);
      clearTimeout(settleT); clearTimeout(tagT); clearTimeout(rzT);
      if (fs) document.body.style.overflow = "";
    },
  };
}
