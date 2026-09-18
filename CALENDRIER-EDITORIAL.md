# Calendrier éditorial

File d'attente des sujets, classée par priorité. Le skill `nouvel-article` lit ce
fichier quand aucun sujet n'est donné et propose les deux premiers de la file.

**Rythme cible : 2 articles par semaine.** Barrez ce qui est publié, ajoutez en bas.

## Sentinelle de trafic — relevé du 14/09/2026 (issue #8)

Site jeune : 486 impressions sur 7 jours, 5 clics. Trois angles vérifiés :

- **a. Requêtes en position ≥30 sans page dédiée** : aucun sujet ajouté cette
  semaine. Les deux seules requêtes de ce type avec un volume notable —
  « assurance asia » (15 impr., pos. 56,3) et « assurance voyage asie du sud
  est » (7 impr., pos. 37,1) — relèvent du thème assurance, déjà couvert par
  deux pages (`/blog/assurance-voyage-asie-comparatif` et
  `/assurances-voyage`) : pas de troisième page, par la règle « jamais une
  page de plus sur un sujet que deux pages traitent déjà ». Le reste
  (« budget japon 15 jours », « 15 jours au japon budget », « budget 2
  semaines en corée du sud », « budget thailand ») ne dépasse pas 2
  impressions chacune : trop mince pour en tirer un sujet, ce n'est pas une
  tendance.
- **b. Pages en position 11–25** : `/guides/visas-asie` (78 impr./7 j, pos.
  moyenne 23,4) est le seul cas solide — à un cheveu de la première page.
  Ce n'est pas un nouvel article mais un renforcement (voir note ci-dessous
  et l'issue de suivi). `/blog/itineraire-thailande-laos-18-jours` est aussi
  en position 11,0 mais avec 1 seule impression : à surveiller, pas à agir.
- **c. Cannibalisation** : `scripts/cannibalisation.mjs` n'a pas pu tourner
  (`GSC_CLE_JSON` absent). Sans le croisement requête↔page qu'il produit,
  impossible de confirmer un partage de signal — seule une hypothèse tirée
  des volumes : `/blog/assurance-voyage-asie-comparatif` (100 impr., pos.
  26,9) et `/assurances-voyage` (19 impr., pos. 36,2) visent des requêtes
  proches. À vérifier quand l'accès GSC sera disponible.

**Aucun sujet n'est retiré ou déplacé cette semaine** : rien dans la file
actuelle n'entre en conflit avec ce relevé.

**À faire par l'éditeur, hors file** : renforcer le maillage interne vers
`/guides/visas-asie` depuis les fiches pays et les articles visa (78
impr./7 j, pos. 23,4).

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
- [ ] **Prendre le train au Vietnam : classes, prix, réservation** — reporté le 18/09/2026 : le sujet dépend de faits officiels (grille tarifaire, fenêtre de réservation, pièce d'identité exigée) qui ne peuvent venir que de dsvn.vn. Ce jour-là, l'outil `WebFetch` était bloqué par la politique réseau de la session pour tout domaine, y compris des sites non asiatiques testés en contrôle (google.com, wikipedia.org) — pas seulement dsvn.vn. Impossible de sourcer ce sujet dans ces conditions sans s'appuyer sur des agrégateurs tiers, ce que la charte du site interdit. À reprendre dès qu'une session dispose d'un accès WebFetch fonctionnel.
- [x] **Réserver un train en Chine : la fenêtre des 15 jours** — programmé le 11/09/2026. Angle : un itinéraire ferroviaire chinois ne se verrouille pas à plus de 15 jours.
- [x] **Négocier en Asie : où c'est attendu, où c'est déplacé** — programmé le 21/09/2026. Angle : marchander est attendu sur les marchés d'Asie du Sud-Est et déplacé au Japon/Corée du Sud ; méthode et erreurs à éviter plutôt que faits chiffrés officiels, faute de portail dédié à ce sujet.

## Priorité 3 — itinéraires

- [ ] **Corée du Sud en 12 jours** — Séoul, Gyeongju, Busan, Jeju.
- [ ] **Japon en 21 jours : au-delà du triangle classique** — Tohoku ou mer de Seto.
- [ ] **Indonésie en 3 semaines : Java et Bali sans le sud de Bali**
- [ ] **Philippines en 2 semaines : Palawan et Siargao**
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
