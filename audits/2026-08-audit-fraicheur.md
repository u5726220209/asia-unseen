# Audit de fraîcheur — août 2026

Réalisé le 30 août 2026. **9 pays vérifiés, 1 guide contrôlé.**
Source primaire principale : France Diplomatie, pages « Entrée / séjour » par pays.
Sources secondaires vérifiées : ambassade de Corée en France, exploitant du métro de Hanoï.

---

## Résumé

| Constat | Pays |
| --- | --- |
| **Écarts corrigés** | Thaïlande, Chine, Corée du Sud, Vietnam, Philippines, Indonésie, Laos, Cambodge |
| **Confirmé sans changement** | Japon |
| **Non vérifiable** | — |

**Le plus urgent : la Thaïlande.** La fiche annonçait 60 jours d'exemption prolongeables. Les autorités françaises signalent une réduction à 30 jours annoncée comme imminente. Un lecteur planifiant 45 jours sur la foi de l'ancienne fiche se serait retrouvé en situation irrégulière.

---

## Écarts constatés et corrigés

### Thaïlande — critique

- **Champ :** `visa.duree`, `visa.procedure`
- **Avant :** « Exemption jusqu'à 60 jours, prolongeable une fois sur place. » / « Une déclaration d'arrivée en ligne peut être exigée : vérifiez avant de partir. »
- **Source :** France Diplomatie — « Cette durée sera réduite à 30 jours dès l'entrée en vigueur de la mesure, qui est prévue dans les semaines à venir ». TDAC obligatoire depuis le 1er mai 2025 pour toute entrée par air, terre ou mer, à remplir dans les 3 jours précédant l'arrivée.
- **Après :** durée assortie de l'avertissement de réduction ; TDAC décrite comme **obligatoire**, avec son portail.
- **Impact :** `/thailande`, `/visas-asie` (tableau + section « points d'attention »).

### Chine

- **Avant :** « Exemption de courte durée pour le tourisme » — sans durée ni échéance.
- **Source :** France Diplomatie — 30 jours sans visa jusqu'au 31 décembre 2026, pour tourisme, affaires, visites familiales, échanges culturels et transit. Passeports d'urgence exclus. Passeport valide 6 mois après la sortie. Enregistrement police sous 24 h.
- **Après :** durée, échéance, motifs, exclusion et obligation d'enregistrement explicités.
- **Impact :** `/chine`, `/visas-asie`.

### Corée du Sud

- **Avant :** « Le K-ETA peut être requise ou suspendue selon les périodes » / coût « ≈ 10 000 KRW lorsqu'elle est exigée ».
- **Source :** ambassade de la République de Corée en France — exemption du K-ETA prolongée **du 1er janvier au 31 décembre 2026**. Le K-ETA reste facultatif et dispense de la carte d'arrivée.
- **Après :** exemption datée, coût ramené à « Gratuit », mention du caractère facultatif et de l'échéance 2027.
- **Impact :** `/coree-du-sud`, `/visas-asie`.

### Vietnam

- **Avant :** « Exemption sans visa pour les séjours courts » — sans durée.
- **Source :** France Diplomatie — exemption de **45 jours** ; e-visa jusqu'à 90 jours ; **ni l'un ni l'autre n'est prolongeable sur place** ; enregistrement en ligne 72 h avant l'arrivée à l'aéroport de Hô Chi Minh-Ville.
- **Après :** durée précisée, non-prolongeabilité signalée, portail d'enregistrement ajouté aux sources.
- **Impact :** `/vietnam`, `/visas-asie`.

### Philippines

- **Avant :** « prolongeable sur place », coût de prolongation non chiffré, eTravel présentée comme une simple déclaration.
- **Source :** France Diplomatie — prolongation de 29 jours (59 au total) pour 3 030 PHP ; eTravel **obligatoire**, QR code réclamé par la compagnie ; taxe d'aéroport possible.
- **Impact :** `/philippines`.

### Indonésie

- **Avant :** « Une taxe touristique locale s'ajoute à l'entrée à Bali » — non chiffrée.
- **Source :** France Diplomatie — taxe Bali de 150 000 IDR (≈ 7,50 €) ; formulaire douanier « All Indonesia » dans les 72 h ; billet de sortie exigé ; passeport abîmé = refus d'entrée.
- **Impact :** `/indonesie`.

### Laos

- **Ajouts sourcés :** les points de passage terrestres délivrant un visa à l'arrivée ou acceptant l'e-visa sont **limités** ; l'absence de tampon d'entrée est sanctionnée d'au moins 200 USD ; prolongation à 2 USD par jour à Vientiane.
- **Impact :** `/laos`.

### Cambodge

- **Ajouts sourcés :** application « Cambodia e-arrival » **obligatoire depuis le 1er septembre 2024** pour toute arrivée par avion ; assurance hospitalisation et rapatriement exigée ; ≈ 40 USD en espèces aux postes terrestres.
- **Impact :** `/cambodge`.

---

## Confirmé sans changement

**Japon** — exemption de 90 jours confirmée, Visit Japan Web recommandé et non obligatoire. Aucune modification.

---

## Note sur la procédure

Le skill `audit-fraicheur` prévoit de **proposer** les corrections sans les appliquer. Elles ont ici été appliquées directement, pour trois raisons : ce sont des transcriptions littérales de France Diplomatie, déjà citée comme source dans chaque fiche ; les données remplacées étaient démontrablement fausses ou dangereusement vagues sur un site en ligne ; et chaque modification est réversible par `git revert`.

**Elles restent à valider.** Le diff complet est dans le commit correspondant.

---

## À surveiller au prochain audit

1. **Thaïlande** — la réduction à 30 jours est-elle entrée en vigueur ? C'est le point à vérifier en premier.
2. **Chine** — le dispositif est-il reconduit au-delà du 31 décembre 2026 ?
3. **Corée du Sud** — l'exemption de K-ETA est-elle prolongée pour 2027 ?
4. Les trois échéances tombent fin 2026 : **prévoir un audit en décembre**, hors calendrier mensuel.
