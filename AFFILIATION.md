# Ouvrir les comptes d'affiliation

Vérifié le 30 août 2026. Ces trois programmes sont les seuls à ouvrir
aujourd'hui : ce sont ceux dont le site parle déjà le plus, et ceux qui
rapportent le plus vite. Les autres (Agoda, Airalo, Chapka, Wise) attendront
d'avoir du trafic — s'inscrire partout d'un coup fait perdre du temps et
multiplie les comptes à surveiller pour rien.

Ce que je ne fais pas à votre place : créer un compte, saisir un mot de passe,
donner votre identité ou vos coordonnées bancaires, accepter des conditions.
Ces quatre gestes vous appartiennent. Tout le reste est prêt.

---

## Les informations à avoir sous la main

Les trois formulaires demandent les mêmes choses. Préparez-les une fois :

| Champ | À saisir |
|---|---|
| Site Internet | `https://asiaunseen.com` |
| Nom / raison sociale | Fabrice Roy — Syllodi Service |
| Statut | Entrepreneur individuel |
| SIRET | 991 954 017 00018 |
| Adresse | 60 rue François 1er, 75008 Paris, France |
| Pays d'audience | France, Belgique, Suisse, Canada |
| Thématique | Voyage — Asie du Sud-Est et Asie de l'Est |

Pour le champ « décrivez votre projet », vous pouvez coller ceci :

> Asia Unseen est un site de guides de voyage en Asie en français : visas,
> budgets détaillés, transports, saisons et itinéraires pour le Vietnam, la
> Thaïlande, le Japon, la Chine, le Laos, le Cambodge, la Corée du Sud,
> l'Indonésie et les Philippines. Chaque page cite ses sources officielles et
> porte une date de dernière vérification. Le trafic vient de la recherche
> Google et d'une newsletter. Aucun contenu sponsorisé déguisé : les liens
> partenaires sont signalés sur chaque page qui en contient.

---

## 1. Booking.com — passe par CJ Affiliate

**Attention, ça a changé.** Booking ne prend plus d'inscription directe. La
page officielle du programme le dit noir sur blanc : « Sélectionnez votre
région et complétez votre inscription avec CJ. » Il y a donc deux étapes.

1. Créer un compte éditeur sur **CJ Affiliate** — https://www.cj.com — région
   Europe. CJ demande votre identité et vos coordonnées de paiement : c'est le
   réseau qui vous paie, pas Booking.
2. Une fois dans CJ, chercher l'annonceur **Booking.com** et candidater au
   programme. La validation est faite par Booking, comptez quelques jours.

Commission annoncée : **4 % du montant de la réservation**.

**Ce que vous me rapportez :** le lien de suivi que CJ génère pour Booking.com
(un lien qui commence par un domaine du réseau, du type `anrdoezrs.net`,
`dpbolvw.net` ou `tkqlhce.net`). Copiez-le tel quel, je m'occupe du reste — le
code sait déjà envelopper une destination dans un lien de réseau.

## 2. 12Go Asia — inscription directe, la plus simple

https://agent.12go.asia — bouton « Rejoignez-nous ».

Le formulaire tient en cinq champs : nom, email, site, description, pays
d'audience. Aucune pièce d'identité ni coordonnée bancaire à ce stade.

Commission : **50 % de la marge**, fenêtre de cookie de 30 jours. C'est de loin
le meilleur taux des trois, et c'est le partenaire le plus utile à nos lecteurs
— les trajets en bus, train et ferry sont le cœur des itinéraires du site.

**Ce que vous me rapportez :** votre identifiant partenaire (le code qui
apparaît dans vos liens sous la forme `?z=XXXXX`).

**État au 30 août 2026 :** candidature envoyée depuis u5726220209@gmail.com,
réponse de 12Go : « Votre candidature a bien été reçue et sera examinée. »
Leur email de confirmation annonce un **examen sous 48 heures** ; en cas
d'accord, un second email apporte les identifiants de connexion. Réponse
attendue au plus tard le 1er septembre 2026. Répondre à affiliate@12go.asia
si rien n'arrive.

Une remarque sur leur formulaire, si vous devez y revenir : les messages
d'erreur rouges sous « Adresse email » et « Site web » ne s'effacent pas quand
on corrige. Ce sont des restes de la tentative précédente, pas un refus des
valeurs saisies — les champs réellement bloquants étaient « Description » et
« pays cibles », qui n'affichent aucune alerte quand ils sont vides.

## 3. GetYourGuide — inscription directe

https://partner.getyourguide.com/fr-fr — bouton « S'inscrire », programme
« Affiliés et créateurs ».

Commission : **8 % ou plus**, payée mensuellement. Validation en quelques jours.

L'inscription se fait en trois étapes. La première crée le compte : email et
mot de passe (au moins 8 caractères, avec une minuscule, une majuscule, un
chiffre et un caractère spécial). Continuer vaut acceptation des « Conditions
générales pour les prestataires » — à lire avant, c'est un contrat.

**Ce que vous me rapportez :** votre `partner_id`, visible dans le tableau de
bord et dans les liens générés.

**État au 30 août 2026 :** les trois étapes sont remplies. Profil « créateur
de contenu », Fabrice Roy / Syllodi Service, France, EUR, Paris, site
https://asiaunseen.com. Aucun compte de réseau social déclaré — il n'y en a
pas, et en inventer un aurait été un mensonge sur la première ligne du
dossier. Compte confirmé et actif le 30 août 2026.
**partner_id : `ECSUCMH`**, relevé dans Outils → Liens, câblé dans `.env` et
en production. Dix pages portent un lien tracké, chacune vers les résultats de
son pays plutôt que vers la page d'accueil.

---

## Où ça atterrit

Les identifiants vont dans `.env`, qui n'est pas versionné :

```
PUBLIC_AFF_BOOKING_TEMPLATE=   # lien CJ, avec {url} à la place de la destination
PUBLIC_AFF_12GO=               # le code après ?z=
PUBLIC_AFF_GETYOURGUIDE=       # le partner_id
```

Tant qu'une variable est vide, le lien correspondant pointe vers le partenaire
sans suivi : le site fonctionne, il ne rapporte simplement rien. Il n'y a donc
aucune urgence à tout remplir d'un coup — donnez-moi ce que vous avez, quand
vous l'avez.

## Une règle à ne pas enfreindre

Ne modifiez jamais un contenu du site pour plaire à un partenaire. La valeur
d'Asia Unseen tient à ce que ses recommandations sont vérifiables et datées ;
un comparatif écrit à l'envers, en partant de la commission, se voit, et coûte
plus cher en confiance qu'il ne rapporte en commission.
