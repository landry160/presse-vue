import type { Item } from "./types";
import { extFor, uid } from "./format";
import { imageDims, makeThumb } from "./media";

export type Clip = { files: File[]; html: string; text: string };

export type IngestResult =
  | { type: "empty" }
  | { type: "duplicate"; id: string; kind: "text" | "image" }
  | { type: "created"; items: Item[]; pick: string };

/**
 * Transforme le contenu du presse-papiers en éléments d'historique.
 * Règles : texte → Texte ; HTML + texte → Contenu riche (avec l'image jointe si Word/Excel en fournit une) ;
 * images → Image ; autres fichiers → Fichier. Un doublon du dernier élément le resélectionne simplement.
 */
export async function ingest({ files, html, text }: Clip, latest?: Item): Promise<IngestResult> {
  const hasText = text.trim().length > 0;
  let imgFiles = files.filter((f) => f.type.startsWith("image/"));
  const otherFiles = files.filter((f) => !f.type.startsWith("image/"));
  const created: Item[] = [];
  let pick: string | null = null;
  const now = Date.now();

  // 1) Texte / contenu riche (un fichier copié depuis l'explorateur arrive souvent avec son nom en texte : on l'ignore)
  if (hasText && !(files.length && !html)) {
    if (latest && (latest.kind === "text" || latest.kind === "html") && latest.text === text && (latest.html || "") === html && !imgFiles.length) {
      return { type: "duplicate", id: latest.id, kind: "text" };
    }
    const it: Item = { id: uid(), createdAt: now, kind: html ? "html" : "text", text, html: html || null };
    if (html && imgFiles.length === 1 && !otherFiles.length) {
      const d = await imageDims(imgFiles[0]);
      if (d) {
        it.image = imgFiles[0]; it.iw = d.w; it.ih = d.h;
        it.thumb = await makeThumb(imgFiles[0], d.w, d.h);
        imgFiles = [];
      }
    }
    created.push(it); pick = it.id;
  } else if (!hasText && html && !files.length) {
    const it: Item = { id: uid(), createdAt: now, kind: "html", text: "", html };
    created.push(it); pick = it.id;
  }

  // 2) Images
  for (const f of imgFiles) {
    const d = await imageDims(f);
    if (d && latest && latest.kind === "image" && latest.size === f.size && latest.w === d.w && latest.h === d.h && !created.length) {
      return { type: "duplicate", id: latest.id, kind: "image" };
    }
    const it: Item = d
      ? { id: uid(), createdAt: now, kind: "image", blob: f, mime: f.type, size: f.size, w: d.w, h: d.h, name: f.name && f.name !== "image.png" && !f.name.startsWith("image.") ? f.name : null }
      : { id: uid(), createdAt: now, kind: "file", blob: f, mime: f.type, size: f.size, name: f.name || "image" };
    if (d) it.thumb = await makeThumb(f, d.w, d.h);
    created.push(it); if (!pick) pick = it.id;
  }

  // 3) Autres fichiers
  for (const f of otherFiles) {
    const it: Item = { id: uid(), createdAt: now, kind: "file", blob: f, mime: f.type || "application/octet-stream", size: f.size, name: f.name || "fichier" };
    created.push(it); if (!pick) pick = it.id;
  }

  if (!created.length || !pick) return { type: "empty" };
  return { type: "created", items: created, pick };
}

export function fromDataTransfer(dt: DataTransfer | null): Clip | null {
  if (!dt) return null;
  const files = [...(dt.files || [])];
  if (!files.length && dt.items) for (const it of dt.items) if (it.kind === "file") { const f = it.getAsFile(); if (f) files.push(f); }
  return { files, html: dt.getData("text/html") || "", text: dt.getData("text/plain") || "" };
}

/** Lecture via l'API asynchrone (bouton « Coller ») ; lève une erreur si le navigateur la bloque. */
export async function readClipboardApi(): Promise<Clip> {
  if (!navigator.clipboard?.read) throw new Error("unsupported");
  const items = await navigator.clipboard.read();
  const files: File[] = []; let html = "", text = "";
  for (const ci of items) for (const type of ci.types) {
    const blob = await ci.getType(type);
    if (type === "text/html") html = await blob.text();
    else if (type === "text/plain") text = await blob.text();
    else if (type.startsWith("image/")) files.push(new File([blob], "image." + extFor(type), { type }));
  }
  return { files, html, text };
}
