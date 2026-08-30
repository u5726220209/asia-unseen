---
name: nouvel-article
description: Rédige un nouvel article ou guide pour le blog Asia Unseen, en sourçant les faits sur le web auprès des portails officiels, dans la voix éditoriale du site, avec le frontmatter validé et le maillage interne. À utiliser dès que l'on parle d'écrire, rédiger, produire ou publier un article, un guide, une fiche ou du contenu pour ce site — y compris quand la demande est seulement un sujet ("visa Thaïlande 2026", "budget Bali"), une intention vague ("il faut publier cette semaine"), ou une demande de brouillon. À utiliser aussi pour reprendre ou étoffer un article existant.
---

# Rédiger un article pour Asia Unseen

Ce site vit d'une seule chose : la confiance. Chaque page annonce sa date de vérification et ses sources, et affirme qu'elle est écrite depuis le terrain. Un article qui trahit cette promesse coûte plus cher que dix articles non écrits.

Tout ce qui suit découle de là.

## Ce que ce skill écrit — et ce qu'il n'écrit pas

**Il écrit** les catégories `pratique`, `itineraire` et `argent` : des articles construits sur des faits vérifiables, des chiffres et de la méthode. C'est 80 % du calendrier éditorial et c'est là que se trouve le trafic à intention d'achat.

**Il n'écrit pas** la catégorie `recit`. Un récit repose sur une expérience vécue — une erreur commise, une conversation, une odeur de marché à 6 h. Fabriquer ça, c'est mentir au lecteur sur la seule chose que le site vend. Si le sujet demandé est un récit, proposez-en la structure et les questions à se poser, et laissez l'auteur écrire le corps.

**Il n'invente jamais** un témoignage, un avis de lecteur, un chiffre de fréquentation, ni un souvenir personnel. `src/data/testimonials.ts` est vide pour cette raison ; ne le remplissez pas.

## Étape 1 — Choisir le sujet

Si l'utilisateur n'a pas donné de sujet, lisez `CALENDRIER-EDITORIAL.md` à la racine et proposez les deux premiers de la file, en expliquant pourquoi ils sont prioritaires.

Avant d'écrire, vérifiez que le sujet n'existe pas déjà : listez `src/content/guides/` et `src/content/blog/`. Un doublon de faible qualité fait plus de mal qu'une page absente — si le sujet est déjà couvert, proposez plutôt d'enrichir la page existante.

## Étape 2 — Sourcer les faits

C'est l'étape qui distingue cet article de ce que produit n'importe qui.

Utilisez `WebSearch` et `WebFetch` pour **vérifier chaque fait daté ou chiffré** : règle de visa, tarif officiel, durée de séjour, horaire, condition d'assurance. Cherchez d'abord la source primaire — portail gouvernemental, ambassade, opérateur, compagnie. Un blog qui cite un blog n'est pas une source.

Les portails de référence sont listés dans `references/sources-officielles.md`.

Trois règles qui protègent le site :

- **Un fait non vérifiable ne devient pas une affirmation.** Écrivez « comptez environ », « ordre de grandeur », et dites d'aller vérifier — c'est plus honnête et c'est ce que le lecteur attend d'un site qui affiche ses dates.
- **Notez la source de chaque chiffre au fil de la recherche.** Vous en aurez besoin pour le bloc `sources` du frontmatter et pour le rapport final.
- **Si la recherche web échoue ou revient vide**, ne comblez pas le trou de mémoire. Dites-le, écrivez la partie qui ne dépend pas de ce fait, et signalez ce qui reste à vérifier.

## Étape 3 — Écrire

Lisez `references/voix-editoriale.md` avant de rédiger : le ton du site est précis et il se perd vite.

Les deux réflexes qui comptent le plus :

- **La réponse d'abord.** Chaque section commence par la réponse, puis l'explique. C'est ce que reprennent les extraits enrichis de Google, et c'est ce dont un lecteur pressé a besoin.
- **Un chiffre plutôt qu'un adjectif.** Pas « c'est cher » mais « 65 € par jour ». Pas « c'est loin » mais « sept heures de route de montagne ».

**Longueur :** 1 000 à 1 500 mots pour un guide pratique, 800 à 1 200 pour un article. Au-delà, on dilue. En deçà, on ne répond pas vraiment.

**Structure qui fonctionne :** une accroche de deux ou trois phrases qui pose l'enjeu, puis des `##` qui sont des questions réelles du lecteur, au moins un tableau comparatif quand il y a des chiffres à confronter, et une dernière section qui donne la marche à suivre.

## Étape 4 — Le frontmatter

Le schéma est validé à la compilation par `src/content.config.ts` : une erreur fait échouer le build avec un message explicite, c'est voulu. Respectez les bornes.

```yaml
---
title: "Titre optimisé pour Google — 70 caractères maximum"
heading: "Titre affiché en H1, si le title est trop technique"   # optionnel
description: "Meta description, entre 80 et 170 caractères, avec le mot-clé principal."
accroche: "Une phrase affichée sous le H1 et dans les listes."
pubDate: AAAA-MM-JJ
categorie: pratique          # pratique | itineraire | argent  (jamais recit)
pays: [vietnam, thailande]   # slugs de src/data/countries.ts — génère le maillage
faq:
  - q: "Une question telle qu'elle est tapée dans Google"
    r: "Une réponse qui commence par la réponse, puis développe. 40 à 80 mots."
---
```

Pour un **guide** (`src/content/guides/`), ajoutez `ordre` (position dans le hub), `sources` (affichées dans le bandeau de vérification) et éventuellement `outil: budget | saison`.

Le nom du fichier devient l'URL : en minuscules, sans accents, mots séparés par des tirets.

## Étape 5 — Le maillage interne

C'est ce qui fait remonter les pages existantes, et c'est systématiquement bâclé.

Placez **3 à 5 liens internes** vers des pages qui existent réellement, insérés là où ils rendent service au lecteur — jamais dans un bloc « voir aussi » en fin de page.

Les cibles utiles : `/vietnam` et les autres fiches pays, `/visas-asie`, `/budget-voyage-asie`, `/meilleure-saison-asie`, `/assurances-voyage`, `/esim-asie`, `/hotels-asie`, `/transports-asie`, `/banques-asie`, `/erreurs-a-eviter`, et `/blog/<slug>` pour les articles.

**Liens d'affiliation :** écrivez un lien Markdown normal vers le partenaire. Le plugin `rehype-affiliate-links` ajoute automatiquement `rel="sponsored nofollow noopener"` et l'identifiant à la compilation. N'ajoutez jamais ces attributs à la main.

N'en placez que là où c'est réellement pertinent, et dites aussi quand la meilleure option ne rapporte rien — c'est la règle 3 de la charte, et c'est ce qui rend les autres recommandations crédibles.

## Étape 6 — Valider

Lancez `npm run build`. Le build échoue si le frontmatter est invalide, et c'est le filet de sécurité principal.

Puis vérifiez que les liens internes pointent vers des pages réelles :

```bash
node scripts/verifier-liens.mjs
```

## Étape 7 — Rendre compte

Terminez par un compte rendu court, en clair :

1. **Le fichier créé** et son URL une fois en ligne.
2. **Les sources consultées**, avec les liens.
3. **Ce qui reste à valider par l'auteur** — un fait non confirmé, un tarif approximatif, une affirmation qui gagnerait à être vérifiée sur place. Cette liste est la partie la plus utile du compte rendu : c'est elle qui permet une relecture de quinze minutes au lieu d'une réécriture.
4. **Ce que vous avez volontairement laissé de côté**, et pourquoi.

Ne dites jamais qu'un fait est vérifié si la recherche n'a pas abouti.
