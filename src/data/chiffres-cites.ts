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
const AIS = 'https://www.ais.th/en/consumers/package/international/tourist-plan';

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
];
