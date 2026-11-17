# Contrat de conversion — Presse-Vue (HTML unique → Next.js)

Chaque point doit exister dans la version Next.js.

## Coller / importer
- [ ] Ctrl+V / ⌘+V n'importe où (événement `paste` global)
- [ ] Bouton « Coller » (en-tête + gros bouton de l'état vide) via `navigator.clipboard.read()`, avec toast de repli si bloqué
- [ ] Zone de collage tactile (`contenteditable`) sur écrans tactiles : état vide + bande d'historique mobile
- [ ] Glisser-déposer de fichiers avec voile « Déposez pour afficher »
- [ ] Règles d'import : texte → Texte ; HTML + texte → Contenu riche ; Word/Excel : image jointe au contenu riche ; images → Image ; autres fichiers → Fichier ; doublon texte/image → resélection + toast
- [ ] Miniatures légères (160 px) générées à l'import

## Visionneuse d'image
- [ ] Ajustement à l'écran après décodage (fondu d'apparition)
- [ ] Zoom molette animé ancré sous le curseur ; pincement pavé tactile (wheel + ctrl) instantané
- [ ] Boutons − / + / Ajuster / 1:1, libellé du zoom en %
- [ ] Déplacement en glissant ; pincement à deux doigts ; double-clic ajuster ↔ zoom ×2
- [ ] 4 poignées de coin (coin opposé fixe, proportions gardées) + étiquette de taille affichée
- [ ] Plein écran (voile sombre + bouton fermer), Échap pour quitter
- [ ] Rendu pixelisé au-delà de 300 %
- [ ] Ré-ajustement au redimensionnement de la fenêtre (si en mode ajusté)
- [ ] Raccourcis : + − 0 1 F R

## Redimensionner (vraie taille en pixels)
- [ ] Curseur 1–400 %, préréglages 25/50/75/150/200 %, « Taille affichée »
- [ ] Largeur/hauteur avec verrou de proportions
- [ ] Recopier (PNG), Enregistrer (format d'origine si JPEG), Ajouter à l'historique

## Contenu riche (HTML)
- [ ] Onglets Aperçu / Image (si jointe) / Texte / Code
- [ ] Aperçu dans une iframe `sandbox` (`srcDoc`), liens dans un nouvel onglet
- [ ] Avis si images locales de Word (`src="file:`)

## Texte
- [ ] Compteurs caractères / mots / lignes
- [ ] Texte plus petit / plus grand (10–48 px)
- [ ] Bouton JSON (formatage) si JSON valide
- [ ] Bouton « Ouvrir le lien » si le texte est une URL
- [ ] Aperçu couleur si le texte est une couleur CSS

## Fichiers
- [ ] Vidéo, audio, PDF, fichiers texte (≤ 5 Mo) ; carte générique sinon

## Actions
- [ ] Recopier (image PNG, HTML riche + texte, texte ; message pour les fichiers)
- [ ] Enregistrer (nom horodaté)
- [ ] Supprimer avec confirmation (nom de l'élément)

## Historique
- [ ] IndexedDB, 60 éléments max, repli en mémoire
- [ ] États chargement (squelettes), vide, erreur + « Réessayer »
- [ ] Liste desktop + bande mobile, élément actif marqué
- [ ] Temps relatif rafraîchi chaque minute
- [ ] Vider l'historique avec confirmation
- [ ] ↑ / ↓ pour naviguer

## Apparence & divers
- [ ] Modale Apparence : Clair / Sombre / Système + 5 couleurs, persistance `ui_theme`, suivi du système en direct
- [ ] Script anti-flash du thème
- [ ] Toasts (succès / erreur / info), auto-fermeture 4 s
- [ ] État vide : titre, explication avec touche Ctrl/⌘ selon l'OS, tuiles des types pris en charge
- [ ] Bouton Coller de l'en-tête masqué sur l'état vide
- [ ] Fond animé en pause quand un élément est affiché ; `prefers-reduced-motion` respecté
- [ ] Échap ferme la modale ouverte
