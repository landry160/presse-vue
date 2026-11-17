import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Presse-Vue",
  description: "Collez n'importe quoi (image, texte, contenu Word, fichier) et voyez-le en grand.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f18" },
  ],
};

// Exécuté avant le premier rendu : applique le thème sauvegardé pour éviter le flash de mauvais thème.
const themeScript = `(function(){try{var s=JSON.parse(localStorage.getItem('ui_theme')||'{}');var d=s.mode==='dark'||((s.mode||'system')==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');document.documentElement.dataset.preset=s.preset||'ocean';}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CA" data-preset="ocean" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans text-slate-900 dark:text-white antialiased overflow-hidden">{children}</body>
    </html>
  );
}
