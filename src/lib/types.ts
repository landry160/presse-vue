export type Kind = "image" | "text" | "html" | "file";

/** Un élément collé, tel qu'il est gardé dans l'historique (IndexedDB accepte les Blob directement). */
export type Item = {
  id: string;
  createdAt: number;
  kind: Kind;
  /** Image ou fichier */
  blob?: Blob;
  mime?: string;
  size?: number;
  name?: string | null;
  /** Dimensions d'une image */
  w?: number;
  h?: number;
  /** Texte brut et HTML */
  text?: string;
  html?: string | null;
  /** Rendu image joint à un contenu riche (copie depuis Word ou Excel) */
  image?: Blob;
  iw?: number;
  ih?: number;
  /** Miniature légère pour l'historique */
  thumb?: Blob | null;
};

export type HtmlView = "preview" | "image" | "text" | "source";
export type HistStatus = "loading" | "ready" | "error";
export type ToastType = "success" | "error" | "info";
