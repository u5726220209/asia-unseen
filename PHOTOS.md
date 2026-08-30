# Ajouter des photographies

Le site fonctionne sans aucune photo : chaque emplacement affiche alors une
illustration « Horizons » générée par le site lui-même. Ajouter des photos est
une **amélioration progressive** — rien ne casse si une photo manque, est
retirée, ou n'a jamais été ajoutée.

Ce document décrit la seule chose que je ne peux pas faire à votre place :
**trouver et déposer les fichiers**.

---

## En trois étapes

```bash
# 1. Déposez vos fichiers
src/photos/vietnam/hanoi-vieux-quartier-matin.jpg

# 2. Déclarez-les dans src/data/photos.ts   (ou demandez-le moi)

# 3. Contrôlez
npm run build && npm run photos
```

---

## 1 · Quelles photos chercher

C'est la partie qui décide de tout. Une photo mal choisie fait plus de mal que
pas de photo : elle contredit ce que le site affirme être.

### Ce qu'on montre

- Une rue à 6 h du matin, un marché, une gare, un quai de ferry
- Des mains qui travaillent : un bol qu'on remplit, un moteur qu'on répare
- Un paysage **sans personne dedans**, ou avec des gens de dos, occupés
- Des tons chauds, un contraste modéré, aucun filtre marqué

### Ce qu'on ne montre pas

| À éviter | Pourquoi |
| --- | --- |
| Coucher de soleil saturé | Le cliché exact que la charte proscrit |
| Temple vide au grand-angle | Photographie de brochure, pas de terrain |
| Sourire posé face à l'objectif | Trahit la promesse « écrit depuis le terrain » |
| Vue de drone décorative | Impressionne, n'informe pas |
| Voyageur de dos, bras écartés | Le poncif le plus répandu du voyage |
| Éléphant monté, tigre câliné | Contredit frontalement le guide des activités |

### Où les trouver

**[Unsplash](https://unsplash.com)** et **[Pexels](https://pexels.com)** couvrent
correctement l'Asie urbaine et les paysages. Cherchez en anglais et de façon
précise : `hanoi street morning`, `bangkok canal boat`, `kyoto backstreet` donnent
de bien meilleurs résultats que `vietnam` ou `asia travel`, qui ne renvoient que
des cartes postales.

**Vos propres photos valent mieux que les deux.** C'est exactement ce que votre
positionnement promet, et c'est la seule chose qu'aucun concurrent ne peut copier.
Une photo moyenne prise par vous à Hanoï bat une photo parfaite prise par
quelqu'un d'autre.

### Licences

Unsplash et Pexels autorisent l'usage commercial sans obligation de crédit. Le
site en met un quand même : un site qui affiche sa transparence sur les liens
partenaires ne va pas taire d'où viennent ses images.

**N'utilisez jamais** une image trouvée dans un moteur de recherche : la quasi-
totalité est protégée, et les sociétés de gestion de droits démarchent
activement les sites qui en publient.

---

## 2 · Déposer les fichiers

```
src/photos/
├── vietnam/
│   ├── hanoi-vieux-quartier-matin.jpg
│   └── ha-giang-col-ma-pi-leng.jpg
├── japon/
│   └── kyoto-ruelle-higashiyama.jpg
└── guides/
    └── train-nuit-couchette.jpg
```

**Nommage :** minuscules, sans accents, mots séparés par des tirets, descriptif.
Le nom du fichier ne sert qu'à s'y retrouver — le texte alternatif est ailleurs.

**Format :** JPEG ou PNG, **entre 2000 et 3000 px de large**, sous 8 Mo.
N'optimisez rien vous-même : le site produit lui-même quatre variantes en WebP,
de 640 à 1920 px, et sert la bonne selon l'écran. Une source trop petite ne
pourra pas être améliorée ; une source énorme ralentit seulement la compilation.

> `src/photos/`, pas `public/`. Ce qui est dans `public/` est servi tel quel,
> sans aucune optimisation.

---

## 3 · Déclarer

Une photo n'est publiée que si elle figure dans `src/data/photos.ts`. Le fichier
seul ne suffit pas : sans texte alternatif ni crédit, une image n'a rien à faire
en ligne.

```ts
{
  fichier: 'vietnam/hanoi-vieux-quartier-matin.jpg',
  alt: "une marchande verse du bouillon dans un bol, sur un trottoir du vieux quartier de Hanoï au lever du jour",
  legende: "Le vieux quartier avant 7 h : la seule heure où l'on y marche vraiment.",
  credit: { auteur: 'Prénom Nom', source: 'Unsplash', url: 'https://unsplash.com/photos/xxxxx' },
  pages: ['/vietnam'],
  position: 'hero',
}
```

| Champ | Rôle |
| --- | --- |
| `fichier` | Chemin relatif à `src/photos/` |
| `alt` | **Obligatoire.** Ce que l'on voit, pas ce que l'on ressent |
| `legende` | Facultative. N'en mettez que si elle apprend quelque chose |
| `credit` | Auteur, source, lien |
| `pages` | Chemins exacts : `/vietnam`, `/blog/ha-giang-moto-4-jours` |
| `position` | `hero` sous l'en-tête · `bande` en respiration de page |

### Écrire un bon texte alternatif

C'est ce que lit une personne aveugle, et ce que lit Google. Décrivez la scène
comme vous la décririez au téléphone à quelqu'un qui prépare son voyage.

> ✗ « Photo du Vietnam »
> ✗ « L'authenticité d'une rue asiatique »
> ✓ « une marchande verse du bouillon dans un bol, sur un trottoir du vieux quartier de Hanoï au lever du jour »

125 caractères maximum, pas de point final, ne commence pas par « image de » ou
« photo de » — le lecteur d'écran l'annonce déjà.

**Vous pouvez me le déléguer.** Déposez les fichiers, dites-le moi : je les
regarde un par un, j'écris les textes alternatifs, je choisis les emplacements
et je remplis le registre.

---

## 4 · Contrôler

```bash
npm run build && npm run photos
```

Le contrôle signale les fichiers déclarés mais absents, les fichiers déposés mais
non déclarés — donc invisibles —, les textes alternatifs manquants ou mal formés,
les crédits absents, les sources trop lourdes et les pages inexistantes.

---

## Ce que le site fait ensuite, tout seul

- **Quatre variantes** en WebP, de 640 à 1920 px, plus le `srcset` correspondant
- **Dimensions inscrites** dans le HTML : aucun décalage de mise en page au chargement
- **Chargement différé** partout, sauf la première image de la page
- **Qualité 78**, le point où la perte cesse d'être visible
- **Repli automatique** sur l'illustration générative si la photo manque

Une photo de 2 à 4 Mo en source finit servie autour de 60 à 150 Ko sur un écran
courant, sans intervention.

---

## Par où commencer

Neuf photos suffisent à transformer le site : **une par fiche pays**, en position
`hero`. Ce sont les pages les plus consultées, et l'effet est immédiat.

Ensuite, dans l'ordre d'utilité : les guides à forte intention d'achat
(`/visas-asie`, `/assurances-voyage`, `/hotels-asie`), puis les récits.

Le reste peut rester en illustrations indéfiniment : c'est un système cohérent,
pas un pis-aller.
