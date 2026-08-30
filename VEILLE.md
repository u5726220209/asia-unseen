# Le système de veille

Ce site promet au lecteur que chaque page porte une date, et que cette date
veut dire quelque chose. Sans mécanisme, cette promesse se dégrade en silence :
une fiche vérifiée en août 2026 continuera d'afficher « vérifié en août 2026 »
jusqu'à ce que quelqu'un y repense.

Voici le mécanisme.

## Ce qui est automatisé, et ce qui ne le sera jamais

**La machine surveille. L'humain tranche.**

Lire un texte administratif ambigu et décider de ce que le site doit désormais
affirmer est un travail de jugement. C'est exactement là que naissent les
affirmations fausses, et c'est la seule chose que ce site refuse d'automatiser.

Est automatisé : détecter qu'une source a bougé, savoir quelles fiches sont
dues, vérifier ce qu'une machine sait vérifier, et publier une fois la
correction écrite.

## Les quatre étages

### 1. La sentinelle — tous les matins

`npm run veille`

Elle relève les 26 pages officielles citées par le site — portails de visa,
conseils aux voyageurs, grilles tarifaires — et les compare à leur état
précédent.

Elle n'alerte que sur deux motifs :

- **une valeur chiffrée a changé** : une durée de séjour, un tarif, un plafond ;
- **la page a été réécrite** en profondeur, sous 75 % de similarité.

Tout le reste — accroches, carrousels, fils d'actualité — passe sans bruit.
C'est délibéré : une sentinelle qui crie tous les jours finit ignorée, et une
sentinelle ignorée est pire que pas de sentinelle.

Le rapport donne les valeurs apparues et disparues. C'est un indice, pas une
conclusion : il faut ouvrir la page et lire.

**Limite connue.** Certaines pages commerciales font tourner des blocs
éditoriaux numérotés ; elles produiront un faux positif de temps à autre. Le
rapport rend la vérification immédiate — deux nombres qui ne ressemblent pas à
des tarifs se rejettent d'un coup d'œil.

**Cinq sources sont injoignables depuis un script** : elles bloquent tout ce
qui n'est pas un navigateur, ou présentent une chaîne de certificats
incomplète, comme le portail e-visa vietnamien. Elles sont signalées comme
telles, jamais comme mortes, et restent à vérifier à la main.

### 2. Le calendrier de fraîcheur — toutes les semaines

`npm run fraicheur`

Il ne vérifie rien : il dit ce qui est dû. Trois horizons, parce que tout ne
vieillit pas au même rythme.

| Donnée | Échéance |
| --- | --- |
| Formalités d'entrée | 4 mois |
| Grilles tarifaires | 6 mois |
| Budgets et saisons | 12 mois |

### 3. Le contrôle mécanique — à chaque modification

`npm run audit` · `npm run verifier` · `npm run sources`

Le site compile, les titres et descriptions tiennent dans ce que Google
affiche, chaque page a un seul `h1`, une canonique, un balisage, des images
décrites, et aucun lien interne ne pointe dans le vide.

Ce contrôle **bloque la mise en ligne** s'il échoue. C'est le filet qui
empêche qu'une correction faite dans l'urgence en casse une autre.

### 4. La mise en ligne — automatique

Corriger une règle devient : modifier un fichier, pousser. Le contrôle passe,
puis le site part en ligne, puis trois adresses sont rappelées pour vérifier
qu'il répond vraiment.

## Le geste, quand une alerte tombe

1. Ouvrir la source et lire la règle telle qu'elle est écrite.
2. Corriger `src/data/countries.ts`.
3. Ajouter l'entrée dans `src/data/corrections.ts` : l'avant, l'après, la source.
4. Remonter `verifieLe`.
5. Pousser.

L'étape 3 n'est pas une formalité. C'est elle qui transforme une correction
silencieuse en preuve publique, et c'est la seule chose qui distingue ce site
d'un blog qui réécrit son passé.

## Tout lancer d'un coup

```bash
npm run controle
```

Compile, audite, vérifie les liens, liste les échéances, interroge les sources.

## Ce qu'il reste à brancher

Les trois workflows sont écrits et prêts dans `.github/workflows/`. Ils
attendent deux choses :

1. **Le dépôt sur GitHub.** Aujourd'hui l'historique est local.
2. **Les secrets du dépôt** : les identifiants FTP de l'hébergement, et les
   variables `PUBLIC_*` qui vivent aujourd'hui dans `.env`.

Sans ça, tout fonctionne à la main avec les commandes ci-dessus. Avec ça, la
sentinelle passe seule chaque matin et la mise en ligne se fait toute seule.
