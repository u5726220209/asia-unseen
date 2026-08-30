# ASIA UNSEEN — Charte de marque

*Version 1.0 — août 2026*

---

## 1. La marque

**Nom :** ASIA UNSEEN
**Domaine :** asiaunseen.com *(vérifié disponible, ainsi que .net, .co et .travel)*
**Signature :** L'Asie, sans filtre
**Baseline longue :** Guides pratiques, conseils de terrain et adresses confidentielles

### Pourquoi ce nom

Trois des cinq noms envisagés au départ étaient indisponibles en .com (`asiareal.com`, `beyondasia.com`) ou trop proches d'acteurs existants. `ASIA UNSEEN` est libre sur toutes les extensions utiles, se prononce identiquement en français et en anglais, tient en quatre syllabes, et porte exactement la promesse éditoriale : ce que les guides ne montrent pas.

### Position

Ni un magazine d'inspiration, ni un comparateur. Un site de **guides de terrain datés et vérifiables**, écrits par quelqu'un qui vit sur place. Ce qui nous distingue tient en trois choses, et toute la communication doit les servir :

1. **Écrit depuis l'Asie**, pas depuis un bureau.
2. **Daté, donc vérifiable** — chaque page de formalités porte sa date de vérification et ses sources.
3. **Transparent sur l'argent** — les liens partenaires sont annoncés avant le premier lien, et on dit aussi ce qui ne vaut pas son prix.

---

## 2. Le symbole

Le mark est un **col de montagne** : deux versants qui montent l'un vers l'autre sans se rejoindre, barrés d'une traverse ambre.

- L'ouverture au sommet est l'élément central : c'est le passage, ce qui reste au-delà, **l'unseen**.
- La forme globale se lit aussi comme un **A** — celui d'Asia — sans jamais être une lettre littérale.
- Aucun cliché du voyage : ni avion, ni valise, ni globe, ni temple, ni dragon.

### Construction

Grille de 64 × 64. Trois traits, épaisseur 7, extrémités arrondies.

```
versant gauche   M 9 55  → 28.5 18     teal   #0F766E
versant droit    M 35.5 18 → 55 55     teal   #0F766E
traverse         M 17 41 → 47 41       amber  #F59E0B
```

L'écart de 7 unités au sommet et la position de la traverse à y = 41 sont exacts : la traverse rejoint les deux versants pile à leur intersection. **Ne les modifiez pas.**

### Fichiers

| Fichier | Usage |
| --- | --- |
| `public/brand/logo-primary.svg` | Logo horizontal, usage par défaut |
| `public/brand/logo-stacked.svg` | Version verticale + signature, formats carrés |
| `public/brand/mark.svg` | Symbole seul, en couleur |
| `public/brand/mark-mono.svg` | Symbole seul, hérite de `currentColor` |
| `public/brand/icon-badge.svg` | Symbole en pastille noire — app icon, avatar social |
| `public/brand/logo-mono-black.svg` / `-white.svg` | Monochromes, impression et fonds contraints |
| `public/favicon.svg`, `favicon.ico`, `icon-192/512.png`, `apple-touch-icon.png` | Générés par `npm run brand` |

> **Sur le site, le logo n'est pas une image.** Le composant `src/components/Logo.astro` compose le symbole SVG inline et le wordmark en HTML, avec la vraie police. C'est net à toute taille, sélectionnable, et lisible par les lecteurs d'écran. Les SVG de wordmark ci-dessus référencent Space Grotesk : pour un usage hors web (impression, prestataire externe), vectorisez le texte au préalable.

### Ce qu'on ne fait jamais

- Déformer les proportions, incliner ou faire pivoter le symbole.
- Refermer le sommet du col : c'est l'idée même de la marque.
- Recolorer les versants en ambre ou la traverse en teal.
- Ajouter contour, ombre portée, dégradé ou effet.
- Poser le logo couleur sur un fond photographique chargé — utilisez le monochrome.
- Descendre sous **20 px de hauteur** pour le symbole seul, **110 px de largeur** pour le lockup horizontal.

**Zone de respiration :** au moins la hauteur du symbole, sur les quatre côtés.

---

## 3. Couleurs

Palette « Teal & Amber ». Deux couleurs de marque, trois neutres. Pas davantage.

| Rôle | Nom | HEX | RGB | Usage |
| --- | --- | --- | --- | --- |
| Texte, fonds sombres | **Ink** | `#0A0A0A` | 10, 10, 10 | Titres, corps de texte, sections sombres |
| Primaire | **Deep Teal** | `#0F766E` | 15, 118, 110 | Symbole, liens, étiquettes de section |
| Accent | **Warm Amber** | `#F59E0B` | 245, 158, 11 | Boutons d'action, traverse du symbole, soulignages |
| Fond | **Cloud Cream** | `#F9FAFB` | 249, 250, 251 | Fond général du site |
| Fond secondaire | **Cream Warm** | `#F5F3EF` | 245, 243, 239 | Sections alternées, en-têtes de page |
| Texte secondaire | **Warm Gray** | `#6B7280` | 107, 114, 128 | Chapôs, légendes, texte de soutien |
| Filets | **Line** | `#E5E7EB` | 229, 231, 235 | Bordures, séparateurs |

Nuances de travail dérivées (fonds d'encart, survols) : `teal-50 #EEFBF8`, `teal-100 #D3F4EE`, `teal-400 #34B3A3`, `teal-700 #0B5B55`, `amber-50 #FFFAEB`, `amber-100 #FEF0C7`, `amber-300 #FCD34D`, `amber-700 #B45309`.

### La règle 60 / 30 / 10

- **60 %** fond clair (Cloud Cream, Cream Warm, blanc)
- **30 %** texte (Ink, Warm Gray)
- **10 %** accent — et l'ambre est **réservé à ce qui alerte ou appelle à l'action**

Conséquence directe : **un seul bouton ambre par écran**. Les actions secondaires sont en contour ou en noir. Un encart positif (« ce que ça vous économise ») utilise le traitement teal, pas l'ambre — c'est le libellé qui le distingue, pas la couleur.

**Jamais plus de trois couleurs visibles dans une même section.**

### Accessibilité

Les paires suivantes sont validées AA :

| Texte sur fond | Ratio |
| --- | --- |
| Ink sur Cloud Cream | 19,4 : 1 |
| Deep Teal sur Cloud Cream | 5,1 : 1 |
| Warm Gray sur Cloud Cream | 4,8 : 1 |
| Ink sur Warm Amber | 12,1 : 1 |
| Cloud Cream sur Ink | 19,4 : 1 |

**Ne jamais** poser du texte ambre sur fond clair, ni du blanc sur ambre : les deux échouent au contraste. L'ambre porte du texte Ink, ou rien.

Source de vérité : le bloc `@theme` de `src/styles/global.css`. Toute couleur ajoutée au site doit y être déclarée d'abord.

---

## 4. Typographie

Trois familles, toutes en licence libre (SIL OFL), auto-hébergées via Fontsource — aucune requête vers un CDN tiers.

### Space Grotesk — *Display*

Titres, logo, boutons, étiquettes, chiffres. Graisses 600 et 700.
Interlettrage **−0,02 em** sur les grands titres. Ses formes légèrement techniques donnent le caractère ; c'est la police qui fait reconnaître la marque.

### Inter — *Corps*

Paragraphes, listes, tableaux, formulaires. Graisses 400, 500, 600.
Corps de base **17 px**, interligne **1,65**. Choisie pour sa lisibilité aux petites tailles et sur les longs guides de 2 000 mots.

### Cormorant Garamond — *Accent*

Citations et prises de parole en première personne, **uniquement**. Graisses 400 et 600, corps 24 à 32 px.
C'est la voix humaine du site. Trois usages par page au maximum ; au-delà, l'effet s'annule.

### Échelle

| Niveau | Desktop | Mobile | Famille / graisse |
| --- | --- | --- | --- |
| Hero (H1) | 64 px | 36 px | Space Grotesk 700 |
| Display (H2 de section) | 48 px | 30 px | Space Grotesk 700 |
| Title (H2 d'article) | 34 px | 24 px | Space Grotesk 700 |
| H3 | 24 px | 20 px | Space Grotesk 700 |
| Corps | 17 px | 16 px | Inter 400 |
| Chapô | 19 px | 18 px | Inter 400, Warm Gray |
| Étiquette (*eyebrow*) | 11 px | 11 px | Space Grotesk 600, +0,18 em, Deep Teal |
| Légende | 13 px | 13 px | Inter 400, Warm Gray |

Les tailles sont fluides (`clamp`) entre ces deux bornes — pas de palier brutal.

**Signature typographique :** chaque H2 d'article porte un filet ambre de 48 × 3 px sous le titre. C'est le détail qui rend une page reconnaissable au premier coup d'œil.

---

## 5. Iconographie

- **Style :** trait ouvert, épaisseur 1,6 à 1,8 px, extrémités et jonctions arrondies, grille de 16, 20 ou 24.
- **Couleur :** Deep Teal, ou Ink. L'ambre uniquement pour les coches de validation et les puces de liste.
- **Dessinées à la main, en SVG inline** dans les composants. Pas de bibliothèque d'icônes générique, pas d'emoji — nulle part, y compris dans les titres d'articles et les réseaux sociaux.
- Toute icône décorative porte `aria-hidden="true"`. Toute icône porteuse de sens est accompagnée d'un texte alternatif.

---

## 6. Images

**Sujet.** L'Asie du quotidien : une rue à 6 h du matin, un marché, une gare, des mains qui travaillent, un paysage sans personne dedans. Des lieux réels, à des heures réelles.

**Interdit.** Le coucher de soleil saturé, le temple vide au grand-angle, le sourire posé face à l'objectif, la vue de drone décorative, le voyageur de dos bras écartés.

**Traitement.** Tons chauds, contraste modéré, aucun filtre marqué. De l'espace négatif à gauche ou en bas quand l'image doit porter du texte.

**Formats.** 16:9 pour les bandeaux, 4:3 pour les articles, 1:1 pour les cartes. WebP à 80 % de qualité, chargement différé sous la ligne de flottaison, texte alternatif descriptif systématique.

---

## 7. Ton éditorial

### Les quatre règles

1. **La phrase qui répond d'abord.** Un paragraphe commence par la réponse, puis l'explique. C'est ce que lisent les extraits enrichis, et c'est ce dont un lecteur pressé a besoin.
2. **Un chiffre plutôt qu'un adjectif.** Pas « c'est cher » mais « 65 € par jour ». Pas « c'est loin » mais « sept heures de route de montagne ».
3. **Dire le défaut.** Un service partenaire qui se dégrade est décrit comme tel. Une alternative gratuite qui ne rapporte rien est citée quand même. Sans ça, tout le reste perd sa valeur.
4. **La première personne, avec parcimonie.** Le « je » sert à raconter une erreur ou une expérience vécue, jamais à donner de l'autorité à une information vérifiable.

### Ce qu'on n'écrit jamais

- « Incontournable », « paradis sur terre », « joyau caché », « pépite »
- Une promesse chiffrée qu'on ne peut pas tenir (« économisez 800 € »)
- Un superlatif sans comparaison explicite
- Un faux témoignage, un faux avis, une fausse urgence

### Voix de référence

> « Je vis au Vietnam depuis 2016. J'ai fait toutes les erreurs possibles : visa refusé à trois jours du départ, hôtel réservé dans le mauvais quartier, train de nuit raté, arnaque au change. Ce site, c'est tout ce que j'aurais voulu lire avant de partir. »

---

## 8. Applications

| Support | Format | Fichier de départ |
| --- | --- | --- |
| Avatar réseaux sociaux | 512 × 512 | `public/brand/icon-badge.svg` |
| Post Instagram | 1080 × 1080 | `brand-kit/social/post-1080.svg` |
| Story / Reel | 1080 × 1920 | `brand-kit/social/story-1080x1920.svg` |
| Aperçu de partage (OG) | 1200 × 630 | `public/og-default.png` — régénéré par `npm run brand` |
| Signature email | HTML | `brand-kit/email-signature.html` |
| Icône d'application | 192 / 512 | générés par `npm run brand` |

**Régénérer tous les dérivés bitmap :**

```bash
npm run brand
```

> Les gabarits sociaux et l'image OG utilisent une grotesque système en repli, Space Grotesk n'étant pas installée au niveau du système. Pour un rendu strictement conforme, installez la police sur la machine de production ou exportez depuis un outil de design.

---

## 9. Résumé en dix lignes

1. Le col ne se referme jamais.
2. Deux couleurs de marque, trois neutres, pas une de plus.
3. L'ambre appelle à l'action — un seul bouton ambre par écran.
4. Jamais de texte ambre sur fond clair.
5. Space Grotesk pour les titres, Inter pour le corps, Cormorant pour la voix.
6. Un filet ambre de 48 px sous chaque H2 d'article.
7. Des icônes dessinées, jamais d'emoji.
8. Des photos prises à des heures réelles, pas des cartes postales.
9. Répondre à la première phrase, chiffrer plutôt que qualifier.
10. Dire ce qui ne vaut pas son prix, même quand ça rapporte.
