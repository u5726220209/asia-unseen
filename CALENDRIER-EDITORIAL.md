# Calendrier éditorial

File d'attente des sujets, classée par priorité. Le skill `nouvel-article` lit ce
fichier quand aucun sujet n'est donné et propose les deux premiers de la file.

**Rythme cible : 2 articles par semaine.** Barrez ce qui est publié, ajoutez en bas.

## Sentinelle de trafic — relevé du 04/10/2026 (issue #22, run du 05/10)

⛔ **Chute de 99 % des impressions, signalée par le script lui-même** : 2
impressions / 0 clic sur 7 jours, contre une moyenne de 338 impr. sur les
4 semaines précédentes. Seulement 2 pages servies par Google sur la
période : `/blog/itineraire-thailande-laos-18-jours` (1 impr., pos. 7,0)
et `/blog/jr-pass-rentable-ou-pas` (1 impr., pos. 3,0). L'historique
(`src/data/trafic-historique.json`) confirme une dégringolade sur 3
relevés consécutifs : 383 impr. (26/09) → 61 impr. (02/10) → 2 impr.
(semaine du 04/10) — ce n'est pas un bruit statistique isolé.

- **a. Requêtes en position ≥30 sans page dédiée** : **pas de donnée
  exploitable cette semaine**. Le relevé ne liste même plus de requêtes
  (la section a disparu, faute de volume) — proposer un sujet sur cette
  base reviendrait à inventer une tendance à partir de 2 impressions.
- **b. Pages en position 11–25** : aucune des 2 pages servies n'est dans
  cette tranche (pos. 7,0 et 3,0) — rien à renforcer sur la seule donnée
  de cette semaine.
- **c. Cannibalisation** : `cannibalisation.mjs` n'a pas pu tourner
  (`GSC_CLE_JSON` absent de cette session, comme chaque jour depuis le
  22/09 d'après les commentaires de l'issue #22). La seule donnée fiable
  reste la confirmation obtenue en CI il y a 2 semaines (issue #15, run
  35501546048) : `/assurances-voyage` et `/blog/assurance-voyage-asie-comparatif`
  se disputent toujours « assurance voyage asie » et « meilleure assurance
  voyage asie » — **non tranché depuis au moins 3 relevés**.

**Aucun sujet ajouté en tête de file cette semaine** : les données sont
trop minces (2 impressions au total) pour désigner un candidat 2a
fiable. La file reste inchangée sous ce rapport — rien n'est retiré non
plus, rien dans la file n'entrant en conflit avec ce relevé.

**À faire par l'éditeur, hors file — par ordre d'urgence** :
1. **Urgent** — ouvrir Search Console et vérifier les actions manuelles
   et la couverture de l'index avant toute autre décision ; le script
   recommande lui-même de couper la rédaction automatique
   (`active` → `false` dans `src/data/redaction.ts`) devant une chute de
   cette ampleur sans panne du site connue. Cette décision n'a pas été
   prise automatiquement ici — elle relève de l'éditeur.
2. Trancher la cannibalisation assurance (inchangé depuis 3 relevés) :
   décider laquelle de `/assurances-voyage` ou
   `/blog/assurance-voyage-asie-comparatif` doit répondre à « assurance
   voyage asie » / « meilleure assurance voyage asie », et faire pointer
   l'autre vers elle.
3. Configurer `GSC_CLE_JSON` pour les sessions agent (déjà en secret CI,
   absent ici) — sans lui, ni `trafic.mjs` ni `cannibalisation.mjs` ne
   peuvent tourner en session.

## Comment cette file est classée

Toutes les pages ne se valent pas. L'ordre suit celui de `PLAN-CROISSANCE.md` :

1. **Transactionnel** — le lecteur est sur le point d'acheter. Peu de volume, forte conversion.
2. **Longue traîne pays** — peu de concurrence, s'accumule, construit le trafic durable.
3. **Itinéraires** — fort partage, excellente capture d'emails, conversion moyenne.
4. **Récits** — construisent la marque. À écrire par l'auteur, jamais générés.

---

## Priorité 1 — transactionnel

- [x] **Comparatif assurances voyage Asie** — publié le 30/08/2026. Requête « meilleure assurance voyage asie ». Tableau de 5 contrats sur plafond médical, avance de frais, exclusions deux-roues. Lie `/assurances-voyage`.
- [x] **Comparatif eSIM Asie** — publié le 30/08/2026. Requête « meilleure esim asie ». Prix au Go, couverture réelle, routage hors Chine. Lie `/esim-asie`.
- [x] **Quelle carte bancaire pour l'Asie** — publié le 30/08/2026. Comparatif frais de change et retraits. Lie `/banques-asie`.

## Priorité 2 — longue traîne pays

- [x] **Visa Vietnam : l'e-visa étape par étape** — publié le 07/09/2026. Requête « visa vietnam ». Exemption 45 j, tarif officiel, causes de refus.
- [x] **Le taxi depuis l'aéroport** — programmé le 08/09/2026. Bangkok et Hanoï publient leur grille, Bali et Hô Chi Minh non : c'est l'angle.
- [x] **Que faire à Hoi An quand il pleut** — programmé le 15/09/2026. Angle : distinguer l'averse ordinaire de la vraie alerte inondation, après les crues record de novembre 2025.
- [ ] **Prendre le train au Vietnam : classes, prix, réservation** — reporté le 18/09/2026, toujours bloqué le 29/09/2026 : le sujet dépend de faits officiels (grille tarifaire, fenêtre de réservation, pièce d'identité exigée) qui ne peuvent venir que de dsvn.vn. Le 29/09, `WebFetch` refusait encore tout domaine testé (dsvn.vn, diplomatie.gouv.fr, et même google.com en contrôle) — un blocage réseau de session, pas propre à ce site. Impossible de sourcer ce sujet dans ces conditions sans s'appuyer sur des agrégateurs tiers, ce que la charte du site interdit. À reprendre dès qu'une session dispose d'un accès WebFetch fonctionnel.
- [x] **Réserver un train en Chine : la fenêtre des 15 jours** — programmé le 11/09/2026. Angle : un itinéraire ferroviaire chinois ne se verrouille pas à plus de 15 jours.
- [x] **Négocier en Asie : où c'est attendu, où c'est déplacé** — programmé le 21/09/2026. Angle : marchander est attendu sur les marchés d'Asie du Sud-Est et déplacé au Japon/Corée du Sud ; méthode et erreurs à éviter plutôt que faits chiffrés officiels, faute de portail dédié à ce sujet.

## Priorité 3 — itinéraires

- [x] **Corée du Sud en 12 jours** — programmé le 25/09/2026. Séoul, Gyeongju, Busan, Jeju. Le sujet précédent de la file (train Vietnam, priorité 2) reste bloqué : `WebFetch` refusait encore tout domaine ce jour-là (testé sur dsvn.vn, diplomatie.gouv.fr et jusqu'à google.com), pas seulement dsvn.vn. Cet article s'appuie donc largement sur des faits déjà sourcés et publiés ailleurs sur le site (K-ETA, budget, saisons, KTX Séoul–Busan) plutôt que sur une nouvelle vérification primaire ; les durées de vol vers Jeju et le trajet Gyeongju–Busan sont données comme ordre de grandeur, non vérifiées à la source faute d'accès réseau.
- [x] **Japon en 21 jours : au-delà du triangle classique** — programmé le 28/09/2026. Angle : le triangle Tokyo-Kyoto-Osaka résumé en renvoyant vers l'article existant, puis un choix entre Tohoku et mer de Seto — jamais les deux, faute de jours. Le sujet précédent de la file (train Vietnam, priorité 2) reste bloqué : `WebFetch` refusait encore tout domaine ce jour-là (testé sur dsvn.vn, diplomatie.gouv.fr et google.com), comme le 18/09 et le 25/09. Cet article s'appuie sur les données pays déjà sourcées du site (budget, visa, saisons, verifieLe 2026-09) et sur des recherches web générales pour la géographie de l'extension ; la distance et les horaires du Shimanami Kaido n'ont pas pu être vérifiés auprès d'un opérateur officiel et sont donnés comme ordre de grandeur non confirmé.
- [x] **Indonésie en 3 semaines : Java et Bali sans le sud de Bali** — programmé le 02/10/2026. Le sujet précédent de la file (train Vietnam, priorité 2) reste bloqué : `WebFetch` refusait encore tout domaine ce jour-là (testé sur dsvn.vn, diplomatie.gouv.fr et google.com), comme le 18/09, 25/09 et 28/09. Le visa et le budget indonésiens réutilisent les données déjà sourcées du site (article visa, guide budget, guide saisons, fiche pays vérifiée 2026-09) ; les temps de trajet Java (train Yogyakarta-Bromo, ferry Ketapang-Gilimanuk, tarifs Bromo/Ijen) n'ont pas pu être vérifiés auprès des opérateurs officiels (kai.id, exploitant du ferry, parc national) faute d'accès réseau, et sont donnés dans l'article comme ordre de grandeur non confirmé, sans entrée dans le registre des chiffres cités.
- [x] **Philippines en 2 semaines : Palawan et Siargao** — programmé le 06/10/2026. Le sujet précédent de la file (train Vietnam, priorité 2) reste bloqué : l'accès réseau refusait encore ce jour-là tout portail officiel testé (dsvn.vn, diplomatie.gouv.fr, etravel.gov.ph, immigration.gov.ph), ainsi que les sites d'opérateurs (Cebu Pacific, 2GO) — seuls des domaines commerciaux génériques répondaient. L'article s'appuie donc sur les données déjà sourcées du site (visa et prolongation philippins, budget, saisons) plutôt que sur une nouvelle vérification primaire ; les durées de vol Manille-Puerto Princesa, Manille-Siargao et la traversée en bateau El Nido-Coron n'ont pas pu être vérifiées auprès des compagnies ou de l'exploitant du ferry, et sont données dans l'article comme ordre de grandeur non confirmé, sans entrée dans le registre des chiffres cités.
- [ ] **Cambodge en 10 jours : au-delà d'Angkor**

## Priorité 4 — à écrire par l'auteur uniquement

Ces sujets reposent sur une expérience vécue. Le skill `nouvel-article` refuse
volontairement de les rédiger : c'est ce qui rend le site impossible à copier.

- [ ] La fois où mon visa a été refusé à trois jours du départ
- [ ] Dix ans au Vietnam : ce que j'ai fini par comprendre
- [ ] Les cinq adresses que je ne donne à personne, et pourquoi je les donne quand même

---

## Publiés

- [x] Scooter en Asie : ce que couvre vraiment l'assurance — 30/08/2026
- [x] JR Pass : rentable ou pas ? Le calcul, cas par cas — 30/08/2026

- [x] Où dormir à Kyoto : le piège de la gare — 30/08/2026
- [x] Où dormir à Bangkok : le quartier se choisit sur la ligne — 30/08/2026

- [x] Où dormir à Hanoï : quel quartier choisir — 30/08/2026

- [x] Ha Giang à moto : quatre jours — 20/08/2026
- [x] Quinze jours au Japon sans JR Pass — 16/08/2026
- [x] Angkor sous la pluie — 14/08/2026
- [x] Trente jours au Vietnam : le relevé complet — 06/08/2026
- [x] Arriver en Chine : la préparation — 30/07/2026
- [x] Vingt et un jours Vietnam–Cambodge–Thaïlande — 20/07/2026
- [x] Dix jours au Vietnam — 16/07/2026
- [x] Thaïlande–Laos en 18 jours — 12/07/2026
- [x] Santé et vaccins pour l'Asie — 08/07/2026
- [x] Les applications vraiment utiles — 04/07/2026
- [x] Que mettre dans son sac — 30/06/2026
- [x] Voyager en Asie avec des enfants — 26/06/2026

## Publiés hors file — trouvés en veille

- [x] **Train en Corée : ce qui a changé le 1er septembre 2026** — programmé le 14/09/2026. letskorail.com redirige vers korail.com et le lien de réservation des guides est mort ; fusion KTX/SRT annoncée par la presse, non confirmée officiellement.
