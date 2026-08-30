---
name: audit-fraicheur
description: Revérifie sur les portails officiels toutes les données périssables du site Asia Unseen — règles de visa, durées de séjour, coûts, procédures — puis produit un rapport daté des écarts constatés et met à jour les dates de vérification. À lancer chaque mois, et systématiquement dès que l'on parle de vérifier, contrôler, actualiser, rafraîchir ou mettre à jour les visas, les tarifs, les formalités ou les fiches pays — y compris sur une simple question du type "est-ce que les infos sont toujours bonnes ?" ou "ça date de quand ?".
---

# Audit de fraîcheur

Ce site promet en toutes lettres que ses informations sont datées et vérifiables. Chaque fiche pays affiche « Informations vérifiées en … » et ses sources officielles.

Cette promesse se périme toute seule, en silence. Les règles de visa en Asie changent plusieurs fois par an — le dispositif chinois et le K-ETA coréen en particulier — et une page fausse qui affiche fièrement sa date de vérification fait plus de dégâts qu'une page sans date.

**Cet audit protège les 40 pages existantes. C'est plus rentable que d'en ajouter une.**

## Ce que l'audit couvre

Les données périssables vivent à trois endroits :

1. **`src/data/countries.ts`** — le champ `visa` de chaque pays (`resume`, `duree`, `cout`, `procedure`), et `verifieLe`. C'est le cœur de l'audit.
2. **`src/content/guides/visas-asie.md`** — les tableaux récapitulatifs par pays.
3. **Les autres guides** dont le frontmatter contient un bloc `sources`.

## Déroulé

### 1. Établir la liste

Lisez `src/data/countries.ts` et dressez le tableau de ce qui est actuellement affirmé : pour chaque pays, `verifieLe`, le résumé du visa, la durée, le coût, la procédure et les URL de `sourcesVisa`.

Priorisez par ancienneté : la fiche vérifiée il y a le plus longtemps passe en premier. En cas d'égalité, commencez par la **Chine** et la **Corée du Sud** — ce sont les deux formalités les plus instables de la liste.

### 2. Vérifier, pays par pays

Pour chaque pays, avec `WebFetch` sur le portail officiel listé dans `sourcesVisa`, complété par `WebSearch` si la page a bougé :

- La durée de séjour autorisée est-elle toujours celle annoncée ?
- Le coût officiel a-t-il changé ?
- La procédure est-elle toujours valable — le portail existe-t-il encore à cette URL ?
- Une exemption a-t-elle été créée, prolongée ou supprimée ?

**Trois précautions qui font la valeur de cet audit :**

- **Une source primaire, ou rien.** Si le portail gouvernemental est inaccessible, le résultat est « non vérifiable », pas « inchangé ». Un blog qui affirme le contraire ne tranche rien.
- **Ne confondez pas silence et confirmation.** Une page qui ne mentionne pas un tarif ne confirme pas ce tarif.
- **Notez l'URL réellement consultée et la date.** C'est ce qui rend l'audit lui-même vérifiable.

### 3. Classer chaque constat

Trois catégories, et une seule action par catégorie :

| Constat | Action |
| --- | --- |
| **Confirmé** — la source officielle dit la même chose | Mettre à jour `verifieLe` au mois courant |
| **Écart** — la source dit autre chose | Proposer la correction exacte, avec l'ancienne et la nouvelle valeur, **sans l'appliquer** |
| **Non vérifiable** — portail inaccessible, information absente | Ne rien changer, y compris `verifieLe`. Signaler pour vérification manuelle |

**N'appliquez jamais une correction de formalité sans validation humaine.** Une erreur de visa peut coûter un voyage à un lecteur, et l'auteur du site en porte la responsabilité éditoriale. Vous préparez la décision, vous ne la prenez pas.

En revanche, mettre à jour `verifieLe` sur une donnée réellement reconfirmée est exactement ce qu'il faut faire : c'est la date qui donne sa valeur à la page.

### 4. Écrire le rapport

Créez `audits/AAAA-MM-audit-fraicheur.md` :

```markdown
# Audit de fraîcheur — <mois année>

Réalisé le <date>. <N> pays vérifiés, <N> guides contrôlés.

## Résumé

- Confirmés sans changement : <liste>
- Écarts constatés : <liste> — **action requise**
- Non vérifiables : <liste>

## Écarts constatés

### <Pays>
- **Champ :** visa.cout
- **Actuellement sur le site :** « ≈ 25 USD »
- **Source officielle :** « … » — <URL>, consultée le <date>
- **Correction proposée :** « … »
- **Impact :** page /vietnam, guide /visas-asie (tableau des e-visas)

## Non vérifiables

### <Pays>
- **Raison :** portail inaccessible / information absente de la page
- **À faire :** vérification manuelle sur <URL>

## Ce qui a été mis à jour automatiquement

Uniquement les champs `verifieLe` des fiches reconfirmées à l'identique : <liste>
```

### 5. Valider et rendre compte

Lancez `npm run build` — le site doit toujours se compiler.

Puis résumez en clair, en trois lignes maximum : combien de pays confirmés, combien d'écarts nécessitent une décision, et lequel est le plus urgent. Si un écart concerne une règle de visa, dites-le en premier : c'est celui qui peut coûter un voyage à quelqu'un.

## Rythme

Une fois par mois suffit. Deux moments justifient un audit hors calendrier : après une annonce officielle qui touche l'un des neuf pays, et avant toute campagne qui enverrait du trafic vers une fiche pays.
