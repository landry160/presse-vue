# Presse-Vue

**Collez n'importe quoi, voyez-le en grand.** Une image copiée dans Word, une capture d'écran, du texte, un fichier : appuyez sur `Ctrl + V` (ou `⌘ + V`) et Presse-Vue l'affiche immédiatement.

👉 **Essayer : https://landry160.github.io/presse-vue/**

![Aperçu de Presse-Vue](docs/apercu.png)

## Pourquoi

Sous Windows, une image copiée (dans Word, un PDF, une page web) reste « coincée » dans le presse-papiers : on ne peut la voir qu'en la collant dans une application qui accepte les images. Presse-Vue est cette application — sans installation, directement dans le navigateur.

## Fonctionnalités

- **Images** : zoom fluide à la molette ou au pincement, déplacement en glissant, poignées de coin pour redimensionner, plein écran, taille réelle.
- **Redimensionner pour de vrai** : nouvelle taille en pixels (curseur, préréglages, proportions verrouillées), puis recopier ou enregistrer l'image.
- **Contenu Word / web** : aperçu avec mise en forme, texte brut, code HTML, et rendu image quand Word le fournit.
- **Texte** : compteur de caractères, mots et lignes, taille du texte ajustable, JSON formaté, aperçu des couleurs (`#0078FF`).
- **Fichiers** : collez ou glissez-déposez — aperçu des vidéos, de l'audio, des PDF et des fichiers texte.
- **Historique** local des 60 derniers éléments (stocké dans votre navigateur uniquement).
- Mode clair / sombre / système, 5 thèmes de couleur, mobile et desktop.

## Raccourcis

| Touche | Action |
|---|---|
| `Ctrl + V` | Coller |
| Molette / pincement | Zoomer |
| `0` / `1` | Ajuster à l'écran / taille réelle |
| `+` / `-` | Zoomer / dézoomer |
| `F` | Plein écran |
| `R` | Redimensionner l'image |
| `↑` / `↓` | Élément précédent / suivant |

## Confidentialité

Tout se passe dans votre navigateur. Rien n'est envoyé sur Internet : l'historique est gardé dans IndexedDB, sur votre appareil.

## Technique

Un seul fichier `index.html` (HTML, CSS, JavaScript), sans build. Tailwind CSS et Lucide via CDN. Publié avec GitHub Pages.

---

Fait par [Landry Tchouela](https://github.com/landry160).
