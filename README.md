# Asia Unseen

Site de guides de voyage en Asie — Astro 5, Tailwind 4, sortie statique.
9 fiches pays, 10 guides pratiques, un blog, deux outils interactifs, et l'infrastructure
de monétisation (AdSense + affiliation) déjà câblée mais désactivée tant qu'aucun
identifiant n'est renseigné.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview  # sert dist/ localement
npm run brand    # régénère favicons, icônes et image OG depuis public/brand/
npm run build:preview <url>   # build pour un domaine temporaire, en noindex
```

---

## ⚠️ Avant de publier — à faire, dans l'ordre

Le site se construit et fonctionne tel quel. Ces six points sont ceux qui vous
exposent juridiquement ou commercialement si vous les sautez.

1. **Vérifier toutes les formalités et tous les tarifs.**
   Les fiches pays (`src/data/countries.ts`) et le guide des visas portent la date
   `2026-08`. Les règles de visa en Asie changent plusieurs fois par an — le dispositif
   chinois et le K-ETA coréen tout particulièrement. Revérifiez sur les portails
   officiels listés dans chaque fiche, puis mettez `verifieLe` à jour.
   **Rien de ce qui est publié ici ne doit être considéré comme vérifié à votre place.**

2. **Relire les récits à la première personne.**
   Les six articles de `src/content/blog/` sont rédigés à la première personne, dans
   la voix du fondateur. Ce sont des textes de départ : relisez-les et alignez-les sur
   votre expérience réelle avant de les signer. Les itinéraires, les ordres de visite
   et les coûts sont plausibles et cohérents, mais ce sont vos souvenirs qui doivent
   les remplir.

3. **Compléter les mentions légales.**
   `src/pages/mentions-legales.astro` contient des champs entre crochets — identité de
   l'éditeur, SIRET, directeur de publication, hébergeur. L'article 6 III de la LCEN
   les rend obligatoires.

4. **Le bandeau de consentement est déjà en place** — rien à installer.
   Il s'active tout seul dès que `PUBLIC_GA4_ID` ou `PUBLIC_ADSENSE_CLIENT` est
   renseigné, et reste invisible tant qu'aucun cookie n'est déposé. Vérifiez
   simplement, après activation, qu'aucun script tiers ne se charge avant un clic —
   la procédure de test est décrite dans « Consentement » plus bas.

5. **Remplir `public/ads.txt`.**
   Décommentez la ligne et remplacez l'identifiant éditeur une fois AdSense approuvé.
   Sans ads.txt valide, Google réduit fortement les revenus display.

6. **Ne publier aucun faux témoignage.**
   `src/data/testimonials.ts` est vide, volontairement, et le bloc correspondant de la
   page d'accueil ne s'affiche pas tant qu'il l'est. Un avis inventé est interdit
   (directive Omnibus, article L.121-4 du Code de la consommation) et sanctionné par
   Google. Remplissez-le avec de vrais retours, avec l'accord de leurs auteurs.

---

## Structure

```
src/
├── content.config.ts        Schémas des collections (guides, blog)
├── content/
│   ├── guides/              10 guides pratiques — les pages qui monétisent
│   └── blog/                Récits et retours de terrain
├── data/
│   ├── site.ts              Identité, analytics, AdSense, newsletter
│   ├── countries.ts         Les 9 fiches pays — source unique de vérité
│   ├── affiliates.ts        Partenaires, identifiants, commissions
│   ├── nav.ts               Navigation
│   └── testimonials.ts      Vide par défaut (voir point 6 ci-dessus)
├── components/              Composants d'interface et de monétisation
├── layouts/BaseLayout.astro SEO, JSON-LD, scripts tiers, en-tête et pied de page
├── pages/
│   ├── index.astro          Accueil, structurée en AIDA
│   ├── [...slug].astro      Pages pays (/vietnam) ET guides (/visas-asie)
│   ├── blog/                Index et articles
│   └── …                    Pages statiques et légales
├── plugins/
│   ├── remark-reading-time.mjs      Temps de lecture
│   └── rehype-affiliate-links.mjs   Traitement automatique des liens sortants
└── styles/global.css        Design system complet (@theme Tailwind 4)
```

**Une seule route couvre `/vietnam` et `/visas-asie`.** Les deux vivent à la racine —
c'est la structure d'URL la plus courte pour le référencement — donc `[...slug].astro`
génère les deux depuis leurs sources respectives. Les routes statiques restent prioritaires.

---

## Ajouter du contenu

### Un article

Créez `src/content/blog/mon-article.md`. Le nom du fichier devient l'URL.

```yaml
---
title: "Titre optimisé pour le SERP (70 caractères max)"
heading: "Titre affiché en H1, si différent"      # optionnel
description: "Meta description, 80 à 170 caractères."
accroche: "Une phrase, affichée sous le H1 et dans les listes."
pubDate: 2026-09-01
categorie: recit                                   # recit | pratique | itineraire | argent
pays: [vietnam, laos]                              # génère les liens croisés
faq:
  - q: "Une question telle qu'elle est tapée dans Google"
    r: "Une réponse qui commence par la réponse."
---
```

Le schéma est validé à la compilation : un `title` trop long ou une `description` hors
bornes fait échouer le build avec un message explicite. C'est volontaire.

### Un guide

Même principe dans `src/content/guides/`, avec en plus `ordre`, `sources` (affichées
dans le bandeau de vérification) et `outil: budget | saison` pour injecter un outil
interactif après l'introduction.

### Un pays

Ajoutez une entrée dans `src/data/countries.ts`. La page, la carte d'accueil, le
calculateur de budget, le sélecteur de saison, la navigation et le plan du site se
mettent à jour ensemble.

### Les liens d'affiliation

**Écrivez simplement un lien Markdown vers le partenaire.**

```markdown
Réservez sur [Booking](https://www.booking.com/searchresults.html?ss=Hanoi).
```

Le plugin `rehype-affiliate-links` ajoute à la compilation `rel="sponsored nofollow
noopener"`, l'ouverture en nouvel onglet, l'identifiant d'affiliation et le marquage
`data-aff` utilisé pour le suivi des clics. Les liens externes non partenaires reçoivent
`rel="noopener noreferrer"`. Aucun oubli possible.

Dans les composants `.astro`, utilisez `<AffiliateLink partner="booking" />`.

---

## Configuration

Copiez `.env.example` en `.env`. **Toutes les variables sont optionnelles** : tant
qu'une valeur est vide, le bloc correspondant n'est pas rendu — aucun script tiers
n'est chargé, aucun lien n'est cassé.

| Variable | Effet |
| --- | --- |
| `PUBLIC_GA4_ID` | Active Google Analytics 4 et le suivi des clics d'affiliation |
| `PUBLIC_ADSENSE_CLIENT` + les `_SLOT_` | Active les emplacements publicitaires |
| `PUBLIC_AFF_*` | Injecte les identifiants dans les liens partenaires |
| `PUBLIC_NEWSLETTER_ENDPOINT` | Active l'envoi réel des formulaires d'inscription |

### Brancher le formulaire de contact

`src/pages/contact.astro` — ajoutez un attribut `action` sur `<form id="au-contact">`
pointant vers Formspree, Web3Forms ou une fonction Cloudflare Pages. Sans `action`, le
formulaire affiche un message expliquant d'écrire directement, plutôt que d'échouer en
silence. Même logique pour la newsletter.

### Consentement

Le bandeau est **auto-hébergé**, dans `src/components/ConsentBanner.astro` — aucun
prestataire tiers, aucun abonnement, aucune requête externe.

Son comportement :

- tant que `PUBLIC_GA4_ID` et `PUBLIC_ADSENSE_CLIENT` sont vides, **aucun bandeau
  n'apparaît** : il n'y a rien à consentir, puisqu'aucun cookie n'est déposé ;
- dès qu'un identifiant est renseigné, le bandeau s'affiche et **aucun script Google
  n'est chargé avant un clic explicite** ;
- refuser demande exactement le même effort qu'accepter : deux boutons de même taille,
  au même niveau, un seul clic ;
- le choix est conservé 6 mois et révocable par le lien « Gérer les cookies » du pied
  de page.

Pour le tester : renseignez des identifiants factices dans `.env`, relancez le serveur,
puis dans la console du navigateur vérifiez qu'avant tout clic
`[...document.scripts].map(s => s.src)` ne contient ni `googletagmanager` ni
`googlesyndication`.

---

## Déploiement

### Cloudflare Pages — recommandé

Build `npm run build`, dossier de sortie `dist`. `public/_headers` applique les
en-têtes de sécurité et le cache. Renseignez les variables d'environnement dans le
tableau de bord Pages.

### Vercel

`vercel.json` est déjà configuré (framework, en-têtes, `cleanUrls`).

### Préversion sur un sous-domaine temporaire

Le site est actuellement en ligne sur un sous-domaine Hostinger gratuit :

**https://mistyrose-hamster-995694.hostingersite.com**

Pour reconstruire et redéployer cette préversion :

```bash
npm run build:preview https://mistyrose-hamster-995694.hostingersite.com
cd dist && zip -rq ../dist_$(date +%Y%m%d_%H%M%S).zip . && cd ..
# puis téléverser l'archive dans le gestionnaire de fichiers Hostinger
```

`build:preview` diffère de `build` sur deux points, et les deux comptent :

- les canoniques, le plan du site et le flux RSS pointent vers le domaine temporaire ;
- **tout le site passe en `noindex, nofollow`** et `robots.txt` bloque tous les robots.

Sans cela, le sous-domaine dupliquerait l'intégralité du contenu et pénaliserait
`asiaunseen.com` au moment du lancement.

> Sur les domaines en `*.hostingersite.com`, Hostinger sert son propre `robots.txt`
> à la place du vôtre (le fichier est bien déployé, mais il est masqué). Ce n'est pas
> gênant : la balise `noindex` présente sur chaque page reste le signal déterminant,
> et le `robots.txt` de la plateforme bloque déjà Googlebot. Sur un domaine
> personnalisé, c'est `public/robots.txt` qui sera servi.

### Basculer sur le domaine définitif

1. Connecter `asiaunseen.com` à l'hébergement (ou à Cloudflare Pages / Vercel).
2. Reconstruire avec `npm run build` — **sans** `build:preview`, pour retrouver les
   canoniques de production et retirer le `noindex`.
3. Vérifier que `/robots.txt` sert bien le fichier de `public/`, pas celui de la plateforme.
4. Mettre en place une redirection 301 du sous-domaine temporaire vers le domaine définitif.

### Après la mise en ligne

1. Changer `site` dans `astro.config.mjs` et `site.url` dans `src/data/site.ts` si le
   domaine diffère de `asiaunseen.com`.
2. Déclarer le site dans la Search Console, soumettre `/sitemap-index.xml`.
3. Vérifier `/robots.txt`, `/rss.xml` et l'aperçu de partage avec un validateur OG.
4. Lancer un audit Lighthouse sur `dist/` servi par `npm run preview`.

---

## Ce qui est déjà en place

**SEO** — plan du site, canoniques, RSS, JSON-LD (`Organization`, `WebSite`,
`Article`, `BlogPosting`, `FAQPage`, `BreadcrumbList`), maillage interne automatique
entre pays, guides et articles, fils d'Ariane balisés.

**Images de partage** — une image Open Graph **par page**, générée à la compilation
par `src/pages/og/[...slug].png.ts`. Le titre de l'article s'affiche donc dans les
aperçus de partage, pas le nom du site. Rien à maintenir : une nouvelle page produit
automatiquement son image.

**Consentement** — bandeau RGPD auto-hébergé, sans prestataire tiers (voir plus haut).

**Performance** — mesuré sur la préversion en ligne : **137 Ko et 16 requêtes** sur la
page d'accueil, 0 script tiers, DOM prêt en moins d'une seconde. Sortie statique, zéro
framework côté client, polices auto-hébergées en variable, styles critiques intégrés,
préchargement au survol.

**Accessibilité** — lien d'évitement, focus visibles, contrastes AA vérifiés (voir la
charte), navigation au clavier sur les menus et la pop-up, `prefers-reduced-motion`
respecté, structure de titres cohérente.

**Monétisation** — emplacements AdSense (in-article, in-feed, colonne), registre de
partenaires typé, traitement automatique des liens sortants, mention de transparence
sur chaque page concernée, page de charte d'affiliation publique, suivi des clics
partenaires vers GA4.

**Conversion** — page d'accueil structurée en AIDA, quatre points de capture email
(bandeau, en cours d'article, pied de page, intention de sortie), pop-up limitée à une
apparition par visiteur et par tranche de 60 jours, jamais avant 20 secondes de lecture.

Voir `PLAN-CROISSANCE.md` pour la suite — trafic, contenu et revenus.
Voir `BRAND_GUIDELINES.md` pour tout ce qui touche à l'identité visuelle.
