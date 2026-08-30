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
npm run photos   # contrôle du registre photographique (voir PHOTOS.md)
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

### Le maillage se fait tout seul

Le champ `pays` du frontmatter est le seul levier à actionner. Un article ou un guide
qui porte `pays: [vietnam]` apparaît automatiquement :

- dans la section « Tout ce qu'on a écrit sur le Vietnam » de `/vietnam` ;
- dans le bloc « À lire aussi » des guides qui couvrent ce pays ;
- dans les liens de bas d'article.

Sans ce mécanisme, les articles restent orphelins : rien ne pointe vers eux depuis les
pages qui reçoivent le trafic. Renseignez `pays` systématiquement — c'est la ligne de
frontmatter qui rapporte le plus.

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

### Consentement — CMP certifiée de Google + Consent Mode v2

Le site utilisait initialement un bandeau maison : conforme au RGPD, aucun script
tiers avant accord. Techniquement irréprochable, mais **non certifié par Google** —
et Google exige une CMP certifiée pour diffuser des annonces aux visiteurs de l'EEE,
du Royaume-Uni et de Suisse. Sans elle, le revenu publicitaire sur le trafic français
est perdu.

La CMP de Google est donc la source unique du consentement, et le bandeau maison a
été retiré : deux bandeaux auraient produit un état de consentement ambigu.

**Ce que ça change, honnêtement.** Deux scripts Google se chargent désormais à
l'ouverture de page, alors qu'auparavant aucun ne se chargeait avant accord. C'est
le fonctionnement même d'une CMP certifiée : elle est délivrée par le script
publicitaire. En contrepartie, le Consent Mode déclare tout refusé par défaut dans
les régions concernées — **aucun cookie publicitaire ni de mesure n'est écrit avant
acceptation**. C'est le standard de l'industrie, et le seul moyen d'être à la fois
conforme et rémunéré.

Vérifié en production sur `asiaunseen.com` :

| Contrôle | Résultat |
| --- | --- |
| Consent Mode déclaré avant tout script Google | ✅ |
| Défaut « refusé » sur 30 pays (EEE + UK + CH) | ✅ |
| Défaut « accepté » hors de ces régions | ✅ |
| `googlefc` chargé — CMP active | ✅ |
| Cookies publicitaires ou de mesure avant choix | **0** |

La configuration retenue dans AdSense est le message **à trois choix** — accepter,
refuser, gérer les options — le seul conforme aux exigences de la CNIL sur l'égalité
d'effort entre acceptation et refus.

Le lien « Gérer les cookies » du pied de page rouvre la CMP via
`googlefc.showRevocationMessage()`.

## Déploiement

### Cloudflare Pages — recommandé

Build `npm run build`, dossier de sortie `dist`. `public/_headers` applique les
en-têtes de sécurité et le cache. Renseignez les variables d'environnement dans le
tableau de bord Pages.

### Vercel

`vercel.json` est déjà configuré (framework, en-têtes, `cleanUrls`).

### Le site est en production

**https://asiaunseen.com** — Hostinger, plan `hostinger_business`.

```bash
npm run build          # production, indexable
npm run package        # + contrôle des liens + archive prête à téléverser
```

Puis téléversez l'archive dans hPanel → Gestionnaire de fichiers → `asiaunseen.com/public_html`,
ou demandez « déploie l'archive » dans Claude Code.

Redirections en place, vérifiées :

| Depuis | Vers |
| --- | --- |
| `http://asiaunseen.com/*` | `https://asiaunseen.com/*` (301) |
| `https://www.asiaunseen.com/*` | `https://asiaunseen.com/*` (301) |
| l'ancien sous-domaine de préversion | `https://asiaunseen.com/*` (301) |

### Préversion sur un sous-domaine temporaire

Toujours disponible pour tester avant publication, sur n'importe quel domaine :

```bash
npm run package -- https://mon-domaine-de-test.example.com
```

`build:preview` diffère de `build` sur deux points, et les deux comptent :

- les canoniques, le plan du site et le flux RSS pointent vers le domaine de test ;
- **tout le site passe en `noindex, nofollow`** et `robots.txt` bloque tous les robots.

Sans cela, un domaine de test dupliquerait l'intégralité du contenu.

> Sur les domaines en `*.hostingersite.com`, Hostinger sert son propre `robots.txt`
> à la place du vôtre. Sur un domaine personnalisé — donc en production — c'est bien
> `public/robots.txt` qui est servi. Vérifié le 30 août 2026.

### Search Console — fait le 30 août 2026

Propriété **de domaine** (`sc-domain:asiaunseen.com`), validée par enregistrement DNS.
Elle couvre `http`, `https`, `www` et tous les sous-domaines d'un seul tenant — une
propriété « préfixe d'URL » n'en aurait couvert qu'un quart.

⚠️ **Ne supprimez jamais cet enregistrement TXT de la zone DNS.** Sa disparition
révoque la propriété et vous perdez l'historique de la Search Console.

```
Type  TXT
Nom   @   (asiaunseen.com)
TTL   300
Valeur  google-site-verification=hDs4GjJlgz48DUTzW97xRUfM7A73i4IvVhDVsw06iDk
```

`sitemap-index.xml` soumis et lu — état « Opération effectuée ». Indexation de la
page d'accueil demandée.

`PUBLIC_GSC_TOKEN` reste disponible dans `.env` comme méthode de secours par balise
HTML, mais n'est pas nécessaire tant que le TXT est en place.

### Google Analytics 4 — fait le 30 août 2026

Propriété **Asia Unseen** (`552100380`), compte Syllodi Service.
Flux web « Asia Unseen — site web » sur `https://asiaunseen.com`.

```
PUBLIC_GA4_ID=G-T2KWW5STQL
```

Fuseau France, devise euro. Objectifs déclarés : générer des leads, comprendre le
trafic web.

**Le bandeau de consentement s'est activé automatiquement.** Comportement vérifié
en production, sur le domaine réel :

| Étape | Scripts Google | Cookies |
| --- | --- | --- |
| Avant tout choix | **0** | **0** |
| Après « Tout refuser » | **0** | **0** |
| Après « Tout accepter » | gtag.js chargé | `_ga`, `_ga_T2KWW5STQL` |

Réception confirmée dans le rapport temps réel : page vue et `first_visit`.

Les quatre événements de conversion (`affiliate_click`, `source_click`,
`newsletter_submit`, `tool_use`) remontent désormais réellement. Marquez-les comme
**événements clés** dans l'interface GA4 pour qu'ils servent d'objectifs.

### AdSense — état au 30 août 2026

Inventaire des comptes Google associés :

| Compte Google | AdSense |
| --- | --- |
| `u5726220209@gmail.com` *(porte la Search Console et GA4)* | aucun |
| `fabrice.webprestige@gmail.com` | **`pub-9584472477260397` — désactivé pour inactivité** |
| `syllodivn@gmail.com` | aucun |

⚠️ **Ne créez pas un second compte AdSense.** Le règlement Google impose un seul
compte par personne. En ouvrir un nouveau alors qu'un ancien existe expose les deux
à une fermeture définitive. La voie sûre est la **réactivation** de
`pub-9584472477260397`.

La réactivation demande une validation par téléphone et la soumission du site pour
examen — deux étapes qui ne peuvent être faites que par l'éditeur lui-même.

Une fois le site approuvé :

1. Décommenter la ligne de `public/ads.txt` (l'identifiant y est déjà inscrit).
2. Renseigner `PUBLIC_ADSENSE_CLIENT=ca-pub-9584472477260397` dans `.env`, plus les
   trois identifiants d'emplacement.
3. Republier. Le bandeau de consentement couvre déjà AdSense : aucune modification
   de code n'est nécessaire.

### Ce qu'il reste à faire

1. **Réactiver AdSense** (validation téléphone + soumission du site).
2. **Comptes affiliés.** Le site est en ligne et mesuré : les programmes qui
   exigeaient un domaine actif peuvent être demandés.
3. **Ligne de TVA.** `src/data/site.ts` retient la franchise en base (article 293 B).
   À confirmer ou corriger.

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

**Images** — chaque page porte deux visuels. Par défaut, des illustrations
« Horizons » générées par le site à partir du slug de la page : aucune requête
supplémentaire, +2 Ko compressés. Déposer une photographie dans `src/photos/` et
la déclarer dans `src/data/photos.ts` la substitue automatiquement à
l'illustration, avec redimensionnement, WebP et `srcset`. Mode d'emploi complet :
`PHOTOS.md`.

Voir `PLAN-CROISSANCE.md` pour la suite — trafic, contenu et revenus.
Voir `BRAND_GUIDELINES.md` pour tout ce qui touche à l'identité visuelle.
