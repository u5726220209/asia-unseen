# Calendrier éditorial

File d'attente des sujets, classée par priorité. Le skill `nouvel-article` lit ce
fichier quand aucun sujet n'est donné et propose les deux premiers de la file.

**Rythme cible : 2 articles par semaine.** Barrez ce qui est publié, ajoutez en bas.

## Sentinelle de trafic — relevé du 20/09/2026 (log CI, veille run #26)

**Correction du point précédent (14/09, issue #11) :** la recommandation de
renforcer le maillage vers « `/guides/visas-asie` » (78 impr., pos. 23,4)
est retirée. Cette URL n'existe pas — la vraie page est `/visas-asie` — et
le chiffre de 78 impressions n'apparaît nulle part dans le relevé qu'elle
citait (issue #8) : les 12 pages listées plafonnaient à 42 impressions.
Aucun lien n'avait de toute façon été ajouté depuis (vérifié : 0 occurrence
dans `src/content/`). Dans le relevé réel du 20/09, `/visas-asie` est à la
**position 7,9** avec 56 impressions : déjà en première page, elle n'a pas
besoin d'un renforcement de maillage.

Aucune tâche « Point Google » n'a pu lire de nouveau relevé détaillé posté
en ticket depuis le 12/09 : le workflow `veille.yml` ne republie le détail
page/requête dans l'issue que si un seuil d'alerte est franchi ; le 20/09
n'a rien déclenché, donc l'issue #8 a juste reçu « tout est stable » puis
été fermée. Le détail complet existe néanmoins dans le journal du run CI
([run 35501546048](https://github.com/u5726220209/asia-unseen/actions/runs/35501546048)),
d'où vient ce qui suit — à signaler à l'éditeur (voir l'issue de ce point).

Chiffres : 395 impressions / 4 clics sur 7 jours (moyenne des 4 semaines
précédentes : 167 impr. — en hausse, rien d'anormal signalé par le script).

- **a. Requêtes en position ≥30 sans page dédiée** : rien d'ajouté. Seules
  « assurance asia » (pos. 56,2) et « assurance voyage asie du sud est »
  (pos. 33,5) dépassent la position 30 avec un peu de volume, et le thème
  assurance est déjà couvert par deux pages — pas de troisième. « budget
  voyage asie » (pos. 67, 1 impr.) est trop mince pour conclure.
- **b. Pages en position 11–25** : `/assurances-voyage` (35 impr., pos.
  16,2) et `/blog/assurance-voyage-asie-comparatif` (29 impr., pos. 24,3)
  sont les deux cas avec du volume. **Ne pas les renforcer séparément avant
  de lire le point c** : ce sont exactement les deux pages qui se
  cannibalisent.
- **c. Cannibalisation — CONFIRMÉE** (`cannibalisation.mjs` a tourné en CI
  avec `GSC_CLE_JSON` réel, contrairement à ici) : `/assurances-voyage` et
  `/blog/assurance-voyage-asie-comparatif` se disputent 2 requêtes, 54
  impressions cumulées — « meilleure assurance voyage asie » (29 impr.,
  aucune des deux pages sous la position 49) et « assurance voyage asie »
  (25 impr., l'essentiel du volume — 24 impr. — coincé à la position 23,3
  sur l'article de blog). C'était une hypothèse non confirmée au 14/09
  (issue #11) ; les données la confirment maintenant.

**Aucun sujet n'est retiré ou déplacé dans la file de rédaction** : rien
dans la file actuelle n'entre en conflit avec ce relevé.

**À faire par l'éditeur, hors file** : trancher la cannibalisation
assurance avant tout maillage — décider laquelle de `/assurances-voyage` ou
`/blog/assurance-voyage-asie-comparatif` doit répondre aux requêtes
« assurance voyage asie » / « meilleure assurance voyage asie », et faire
pointer l'autre vers elle. Configurer aussi `GSC_CLE_JSON` en local/agent
si l'on veut que ce contrôle puisse tourner en dehors de la CI.

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

- [x] **Corée du Sud en 12 jours** — programmé le 25/09/2026. Séoul, Gyeongju, Busan, Jeju. Le sujet précédent de la file (train Vietnam, priorité 2) reste bloqué : `WebFetch` refusait encore tout domaine ce jour-là (testé sur dsvn.vn, diplomatie.gouv.fr et jusqu'à google.com), pas seulement dsvn.vn. Cet article s'appuie donc largement sur des faits déjà sourcés et publiés ailleurs sur le site (K-ETA, budget, saisons, KTX Séoul–Busan) plutôt que sur une nouvelle vérification primaire ; les durées de vol vers Jeju et le trajet Gyeongju–Busan sont données comme ordre de grandeur, non vérifiées à la source faute d'accès réseau.
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
