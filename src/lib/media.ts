/** Traitements d'image côté navigateur (dimensions, miniatures, redimensionnement, conversion PNG). */

export function imageDims(blob: Blob): Promise<{ w: number; h: number } | null> {
  return new Promise((res) => {
    const u = URL.createObjectURL(blob), im = new Image();
    const t = setTimeout(() => { URL.revokeObjectURL(u); res(null); }, 8000);
    im.onload = () => { clearTimeout(t); URL.revokeObjectURL(u); res({ w: im.naturalWidth, h: im.naturalHeight }); };
    im.onerror = () => { clearTimeout(t); URL.revokeObjectURL(u); res(null); };
    im.src = u;
  });
}

const canvasToBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob"))), type, q));

/** Miniature de 160 px max : l'historique ne décode jamais les images complètes. */
export async function makeThumb(blob: Blob, w: number, h: number): Promise<Blob | null> {
  try {
    const k = Math.min(1, 160 / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * k)), th = Math.max(1, Math.round(h * k));
    const bmp = await createImageBitmap(blob, { resizeWidth: tw, resizeHeight: th, resizeQuality: "medium" });
    const c = document.createElement("canvas"); c.width = tw; c.height = th;
    c.getContext("2d")!.drawImage(bmp, 0, 0, tw, th); bmp.close();
    return await canvasToBlob(c, "image/webp", 0.85);
  } catch { return null; }
}

export async function toPng(blob: Blob): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0); bmp.close();
  return canvasToBlob(c, "image/png");
}

export const MAX_SIDE = 12000;

/** Redimensionne en haute qualité ; repli par paliers de 50 % si le navigateur ignore resizeQuality. */
export async function resizeBlob(blob: Blob, w: number, h: number, type: string): Promise<Blob> {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  let done = false;
  try {
    const bmp = await createImageBitmap(blob, { resizeWidth: w, resizeHeight: h, resizeQuality: "high" });
    if (bmp.width === w && bmp.height === h) { g.drawImage(bmp, 0, 0); done = true; }
    bmp.close();
  } catch { /* repli ci-dessous */ }
  if (!done) {
    let cur: CanvasImageSource = await createImageBitmap(blob);
    let cw = (cur as ImageBitmap).width, ch = (cur as ImageBitmap).height;
    while (cw / 2 >= w && ch / 2 >= h) {
      const t = document.createElement("canvas"); cw = Math.round(cw / 2); ch = Math.round(ch / 2);
      t.width = cw; t.height = ch;
      const tg = t.getContext("2d")!; tg.imageSmoothingQuality = "high"; tg.drawImage(cur, 0, 0, cw, ch); cur = t;
    }
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(cur, 0, 0, w, h);
  }
  return canvasToBlob(c, type, 0.92);
}
