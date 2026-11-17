import type { HtmlView, Item } from "./types";
import { extFor, jsonOf, prettyJson, stamp } from "./format";
import { toPng } from "./media";

export async function writeText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; }
  catch {
    const ta = document.createElement("textarea");
    ta.value = t; ta.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { /* rien */ }
    ta.remove(); return ok;
  }
}

export async function copyImageBlob(src: Blob) {
  const png = src.type === "image/png" ? src : await toPng(src);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}

/** Recopie l'élément dans le presse-papiers ; renvoie le message de confirmation ou lève une erreur. */
export async function copyItem(it: Item, view: HtmlView, jsonPretty: boolean): Promise<string> {
  if (it.kind === "image" || (it.kind === "html" && view === "image" && it.image)) {
    await copyImageBlob((it.kind === "image" ? it.blob : it.image)!);
    return "Image recopiée dans le presse-papiers";
  }
  if (it.kind === "file") throw new Error("file");
  if (it.kind === "html" && it.html && typeof ClipboardItem !== "undefined") {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/html": new Blob([it.html], { type: "text/html" }),
        "text/plain": new Blob([it.text || ""], { type: "text/plain" }),
      })]);
      return "Contenu recopié avec sa mise en forme";
    } catch { /* repli texte */ }
  }
  const t = it.kind === "text" && jsonPretty ? prettyJson(it.text || "") : it.text || "";
  if (await writeText(t)) return "Texte recopié";
  throw new Error("copy");
}

export function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/** Choisit le bon contenu et le bon nom de fichier selon le type et la vue affichée. */
export function downloadItem(it: Item, view: HtmlView, jsonPretty: boolean): string {
  let blob: Blob, name: string;
  if (it.kind === "image") { blob = it.blob!; name = it.name || `presse-vue-${stamp()}.${extFor(it.mime)}`; }
  else if (it.kind === "file") { blob = it.blob!; name = it.name || `presse-vue-${stamp()}`; }
  else if (it.kind === "html" && view === "image" && it.image) { blob = it.image; name = `presse-vue-${stamp()}.${extFor(it.image.type)}`; }
  else if (it.kind === "html" && view !== "text") { blob = new Blob([it.html || ""], { type: "text/html" }); name = `presse-vue-${stamp()}.html`; }
  else {
    const t = jsonPretty ? prettyJson(it.text || "") : it.text || "";
    const isJson = jsonPretty || jsonOf(it.text) != null;
    blob = new Blob([t], { type: "text/plain;charset=utf-8" });
    name = `presse-vue-${stamp()}.${isJson ? "json" : "txt"}`;
  }
  downloadBlob(blob, name);
  return name;
}
