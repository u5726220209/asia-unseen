/**
 * Registre des chiffres publiés.
 *
 * Le site affirme des montants précis — un tarif d'assurance, un prix d'eSIM,
 * un plafond de garantie. Ces chiffres vivent dans de la prose, où rien ne les
 * relie à leur source. Le jour où un assureur augmente ses tarifs, la
 * sentinelle sait que la page a bougé, mais elle ne sait pas que trois de nos
 * phrases viennent de devenir fausses.
 *
 * Ce registre fait le lien. Il permet à `scripts/verifier-chiffres.mjs` de
 * poser deux questions à chaque passage :
 *
 *   1. le chiffre figure-t-il encore sur la page source ?
 *   2. figure-t-il encore, à l'identique, sur nos pages ?
 *
 * La première détecte une hausse de tarif. La seconde détecte une correction
 * faite à moitié — un montant mis à jour dans un article et oublié dans un
 * autre, ce qui est la façon la plus courante de se contredire soi-même.
 *
 * ⚠️ Ce registre n'a de valeur que s'il est tenu. Un chiffre publié sans y
 * être inscrit est un chiffre que personne ne surveillera.
 */

export type ChiffreCite = {
  /** Le montant tel qu'il est écrit dans les pages, à la virgule près. */
  affiche: string;
  /** Ce qu'il désigne, en une ligne — pour comprendre l'alerte sans rouvrir l'article. */
  designe: string;
  /** La page officielle où il a été relevé. */
  source: string;
  releveLe: string;
  /** Les pages du site qui l'affichent. */
  pages: string[];
  /**
   * Une valeur peut disparaître d'une page source sans être fausse : un tarif
   * affiché dans une image, un montant calculé côté client. On ne vérifie
   * alors que la cohérence interne du site.
   */
  sourceIntrouvableAttendue?: boolean;
};

const AVI = 'https://www.avi-international.com/assurance-voyage/assurance-routard';
const CHAPKA = 'https://www.chapkadirect.fr/index.php?action=produit&id=924';
const AIRALO_ASIE = 'https://www.airalo.com/fr/asia-esim';
const AIRALO_VN = 'https://www.airalo.com/fr/vietnam-esim';
const HOLAFLY = 'https://esim.holafly.com/fr/esim-asie/';
const KETA = 'https://www.k-eta.go.kr/portal/apply/index.do';
const AIS = 'https://www.ais.th/en/consumers/package/international/tourist-plan';

const FD_INDONESIE = 'https://www.diplomatie.gouv.fr/fr/information-par-pays/indonesie/conseils-aux-voyageurs-entree-sejour';
const FD_PHILIPPINES = 'https://www.diplomatie.gouv.fr/fr/information-par-pays/philippines/conseils-aux-voyageurs-entree-sejour';
const ARTICLE_INDONESIE = '/blog/visa-indonesie-prolongation';
const ARTICLE_PHILIPPINES = '/blog/etravel-philippines';
const DSVN_TARIFS = 'https://giotaugiave.dsvn.vn/giave/thongnhat.aspx';
const NOIBAI_TRANSPORT = 'https://noibaiairport.vn/vi/phuong-tien-van-chuyen-cong-cong-nid1.html';
const ARTICLE_TRAIN_VIETNAM = '/blog/train-hanoi-saigon';
const ARTICLE_AEROPORT_HANOI = '/blog/aeroport-noi-bai-hanoi';
const ARTICLE_KETA = '/blog/k-eta-coree-2026';
const COMPARATIF_ASSURANCE = '/blog/assurance-voyage-asie-comparatif';
const COMPARATIF_ESIM = '/blog/esim-asie-comparatif-prix';

export const chiffresCites: ChiffreCite[] = [
  /* ── Assurance ──────────────────────────────────────────────── */
  { affiche: '28,82', designe: 'AVI Routard, zone B, 19-35 ans, la semaine', source: AVI, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '33,90', designe: 'AVI Routard, zone A, 19-35 ans, la semaine', source: AVI, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '42,68', designe: 'AVI Routard, zone B, 61 ans et plus, la semaine', source: AVI, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '97', designe: 'Chapka, zone 2, 17 à 24 jours', source: CHAPKA, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '120', designe: 'Chapka, zone 3, 17 à 24 jours', source: CHAPKA, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '174', designe: 'Chapka, zone 2, 33 à 61 jours', source: CHAPKA, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '500 000', designe: 'Plafond frais médicaux, AVI zone B et Chapka zone 2', source: CHAPKA, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '1 000 000', designe: 'Plafond frais médicaux, Chapka zone 3', source: CHAPKA, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },
  { affiche: '1 250 000', designe: 'Plafond frais médicaux, AVI zone A', source: AVI, releveLe: '2026-08-30', pages: [COMPARATIF_ASSURANCE] },

  /* ── eSIM ───────────────────────────────────────────────────── */
  { affiche: '22,50', designe: 'Airalo Asie, 10 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '65,50', designe: 'Airalo Asie, illimité 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '13,50', designe: 'Airalo Asie, 5 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '52,50', designe: 'Airalo Asie, 50 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '43,50', designe: 'Airalo Asie, illimité 15 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '16,00', designe: 'Airalo Vietnam, 10 Go sur 30 jours', source: AIRALO_VN, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '61,50', designe: 'Airalo Vietnam, illimité 30 jours', source: AIRALO_VN, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '46,90', designe: 'Holafly Asie, 15 jours', source: HOLAFLY, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '68,90', designe: 'Holafly Asie, 30 jours', source: HOLAFLY, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '699', designe: 'SIM touriste AIS, 15 jours, en THB', source: AIS, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '1 199', designe: 'SIM touriste AIS, 30 jours, en THB', source: AIS, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM] },
  { affiche: '10 000', designe: 'K-ETA facultatif, frais de demande en wons', source: KETA, releveLe: '2026-08-31', pages: [ARTICLE_KETA] },
  { affiche: '150 000', designe: 'taxe touristique de Bali, en roupies, à chaque entrée', source: FD_INDONESIE, releveLe: '2026-08-31', pages: [ARTICLE_INDONESIE] },
  { affiche: '3 030', designe: 'prolongation de séjour aux Philippines, en pesos', source: FD_PHILIPPINES, releveLe: '2026-08-31', pages: [ARTICLE_PHILIPPINES] },

  /* ── Train Hanoï-Saigon ─────────────────────────────────────── */
  { affiche: '1 726', designe: 'distance ferroviaire Hanoï-Saigon, en km', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '1 122 000', designe: 'train SE1 Hanoï-Saigon, siège inclinable climatisé', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '1 516 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage haut', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '1 664 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage milieu', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '1 894 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage bas', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '1 884 000', designe: 'train SE1 Hanoï-Saigon, couchette molle climatisée 4 places, étage haut', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '2 051 000', designe: 'train SE1 Hanoï-Saigon, couchette molle climatisée 4 places, étage bas', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '3 077 000', designe: 'train SE1 Hanoï-Saigon, compartiment privé 2 couchettes', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '4 510 000', designe: 'train SE1 Hanoï-Saigon, compartiment privé VIP 2 couchettes', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM] },
  { affiche: '378 000', designe: "écart de prix entre étage bas et étage haut, couchette molle 6 places", source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },

  /* ── Aéroport de Hanoï (Noi Bai) ────────────────────────────── */
  { affiche: '12 000', designe: 'bus Noi Bai, lignes 07 et 109, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
  { affiche: '15 000', designe: 'bus Noi Bai, lignes 17 et 90, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
  { affiche: '20 000', designe: 'bus Noi Bai, ligne E10, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
  { affiche: '50 000', designe: 'bus Noi Bai, ligne 86 vers la gare de Hanoï, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
  { affiche: '55 000', designe: 'bus Noi Bai, ligne 68 vers Hà Đông, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
  { affiche: '90 000', designe: 'navette Hải Vân, lignes NB01/NB02, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI] },
];
