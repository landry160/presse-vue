/**
 * Cache d'URL d'objets : une seule URL par Blob, créée à la demande et révoquée quand l'élément disparaît.
 * Une WeakMap évite de garder le Blob en vie si on oublie de révoquer.
 */
const cache = new WeakMap<Blob, string>();

export function urlFor(blob: Blob): string {
  let u = cache.get(blob);
  if (!u) { u = URL.createObjectURL(blob); cache.set(blob, u); }
  return u;
}

export function revoke(...blobs: (Blob | null | undefined)[]) {
  for (const b of blobs) {
    if (!b) continue;
    const u = cache.get(b);
    if (u) { URL.revokeObjectURL(u); cache.delete(b); }
  }
}
