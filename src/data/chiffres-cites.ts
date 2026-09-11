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
  /**
   * Les formes fausses que ce chiffre remplace, et qui ne doivent plus
   * apparaître nulle part.
   *
   * Vérifier qu'un montant est présent là où on l'attend ne dit rien de ce qui
   * se dit ailleurs. Un chiffre corrigé dans deux guides et oublié dans les
   * données d'un pays laisse le site se contredire lui-même, et la présence du
   * bon chiffre sur les bonnes pages ne le signale pas — elle le masque.
   *
   * Ce champ inverse la question : cette valeur-là ne doit plus exister sur le
   * site. Le journal des corrections en est exclu, puisque son travail est
   * précisément de citer ce qui était écrit avant.
   */
  contredit?: string[];
  /**
   * Pourquoi ce montant n'est pas un tarif officiel relevé, mais une
   * estimation assumée — une conversion de devise, un total qui inclut des
   * frais de service dont la grille n'est pas publique.
   *
   * Le distinguer n'est pas un détail de classement. Un tarif consulaire est
   * faux ou vrai ; une conversion en euros est périmée dès que le change
   * bouge, et la surveiller à la source n'aurait aucun sens. Les mélanger
   * ferait crier la sentinelle tous les matins sur des écarts normaux, et une
   * sentinelle qui crie pour rien finit ignorée.
   *
   * Ce qui compte : tout montant publié comme une règle d'entrée doit être
   * ici, dans l'une des deux catégories. Aucun ne doit manquer.
   */
  estimation?: string;
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
const EN_COMPARATIF_ESIM = '/en/blog/esim-asia-price-comparison';
const GUIDE_TRANSPORTS = '/transports-asie';
const GUIDE_ERREURS = '/erreurs-a-eviter';
const ARTICLE_EVISA_VN = '/blog/visa-vietnam-e-visa-2026';
const EN_VIETNAM_10J = '/en/blog/vietnam-in-10-days';
const AOT_TAXI = 'https://suvarnabhumi.airportthai.co.th/service/transportation/detail/834';
const ARTICLE_TAXI_AEROPORT = '/blog/taxi-aeroport-asie-tarifs';

/* Les pages anglaises qui citent les mêmes montants officiels. Un chiffre
   publié sans être inscrit est un chiffre que personne ne relira — et la
   version anglaise n'y échappe pas. */
const EN_TRAIN_VIETNAM = '/en/blog/hanoi-saigon-train';
const EN_TAXI_AEROPORT = '/en/blog/taxi-from-the-airport';
const EN_AEROPORT_HANOI = '/en/blog/hanoi-airport-to-city';
const CHAM_MUSEUM = 'https://chammuseum.vn/view.aspx?ID=654';
const ARTICLE_HOI_AN_PLUIE = '/blog/hoi-an-pluie-que-faire';
const EN_HOI_AN_PLUIE = '/en/blog/hoi-an-when-it-rains';

/* Portails officiels des formalités d'entrée. Ce sont les tarifs les plus
   lourds du site : ceux sur lesquels un voyageur fait son budget. */
const EVISA_VN = 'https://evisa.gov.vn/';
const IMMIGRATION_TH = 'https://www.immigration.go.th/';
const AMBASSADE_CN = 'https://fr.china-embassy.gov.cn/fra/zgzfg/zgsg/lsb/202512/t20251226_11788011.htm';
const EVISA_LA = 'https://laoevisa.gov.la/';
const EVISA_KH = 'https://www.evisa.gov.kh/';
const EVISA_ID = 'https://evisa.imigrasi.go.id/';
const IMMIGRATION_PH = 'https://immigration.gov.ph/';

export const chiffresCites: ChiffreCite[] = [
  /* ── Formalités d'entrée ────────────────────────────────────────
     Les tarifs de visa des neuf fiches pays. Ils étaient publiés sans être
     inscrits ici : la veille relisait chaque nuit vingt-quatre portails
     officiels, mais aucun des montants que ces portails fixent. Les 45 €
     chinois ont été corrigés à la main le 2 septembre, et rien ne les
     surveillait. `verifier-config.mjs` refuse désormais un tarif de visa
     absent de cette liste. */
  { affiche: '25', designe: 'e-visa vietnamien, entrée simple (USD)', source: EVISA_VN, releveLe: '2026-09-04', pages: ['/vietnam', ARTICLE_EVISA_VN, EN_VIETNAM_10J], sourceIntrouvableAttendue: true },
  { affiche: '50', designe: 'e-visa vietnamien, entrées multiples (USD)', source: EVISA_VN, releveLe: '2026-09-04', pages: ['/vietnam', ARTICLE_EVISA_VN], sourceIntrouvableAttendue: true },
  { affiche: '1 900', designe: "prolongation de séjour en Thaïlande, sur place (THB)", source: IMMIGRATION_TH, releveLe: '2026-09-04', pages: ['/thailande'], sourceIntrouvableAttendue: true },
  { affiche: '45', designe: 'visa L chinois, entrée simple — frais consulaires, tarif réduit jusqu\'au 31/12/2026', source: AMBASSADE_CN, releveLe: '2026-09-02', pages: ['/chine'] },
  { affiche: '110', designe: 'visa chinois, total constaté frais de service inclus', source: AMBASSADE_CN, releveLe: '2026-09-02', pages: ['/chine'], estimation: "la grille tarifaire du centre de dépôt parisien n'est pas publique : ce total est un ordre de grandeur, et la page le dit" },
  { affiche: '30', designe: "visa à l'arrivée au Laos, borne basse selon nationalité (USD)", source: EVISA_LA, releveLe: '2026-09-04', pages: ['/laos'], sourceIntrouvableAttendue: true },
  { affiche: '50', designe: "visa à l'arrivée au Laos, borne haute selon nationalité (USD)", source: EVISA_LA, releveLe: '2026-09-04', pages: ['/laos'], sourceIntrouvableAttendue: true },
  { affiche: '2', designe: 'prolongation de séjour au Laos, par jour à Vientiane (USD)', source: EVISA_LA, releveLe: '2026-09-04', pages: ['/laos'], sourceIntrouvableAttendue: true },
  { affiche: '36', designe: 'e-visa cambodgien, frais de service inclus (USD)', source: EVISA_KH, releveLe: '2026-09-04', pages: ['/cambodge'], sourceIntrouvableAttendue: true },
  { affiche: '40', designe: 'visa cambodgien aux postes-frontières terrestres, en espèces (USD)', source: EVISA_KH, releveLe: '2026-09-04', pages: ['/cambodge'], sourceIntrouvableAttendue: true },
  { affiche: '10 000', designe: 'K-ETA coréen demandé volontairement, non remboursable (wons)', source: KETA, releveLe: '2026-09-04', pages: ['/coree-du-sud'], sourceIntrouvableAttendue: true },
  { affiche: '500 000', designe: "visa à l'arrivée en Indonésie (IDR)", source: EVISA_ID, releveLe: '2026-09-04', pages: ['/indonesie'], sourceIntrouvableAttendue: true },
  { affiche: '150 000', designe: 'taxe touristique de Bali (IDR)', source: EVISA_ID, releveLe: '2026-09-04', pages: ['/indonesie'], sourceIntrouvableAttendue: true },
  { affiche: '30', designe: "visa à l'arrivée en Indonésie, converti en euros", source: EVISA_ID, releveLe: '2026-09-04', pages: ['/indonesie'], estimation: 'conversion de 500 000 IDR : elle bouge avec le change, pas avec la règle' },
  { affiche: '7,50', designe: 'taxe touristique de Bali, convertie en euros', source: EVISA_ID, releveLe: '2026-09-04', pages: ['/indonesie'], estimation: 'conversion de 150 000 IDR : elle bouge avec le change, pas avec la règle' },
  { affiche: '3 030', designe: 'prolongation de séjour aux Philippines, sur place (PHP)', source: IMMIGRATION_PH, releveLe: '2026-09-04', pages: ['/philippines'], sourceIntrouvableAttendue: true },

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
  { affiche: '22,50', designe: 'Airalo Asie, 10 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '65,50', designe: 'Airalo Asie, illimité 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '13,50', designe: 'Airalo Asie, 5 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '52,50', designe: 'Airalo Asie, 50 Go sur 30 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '43,50', designe: 'Airalo Asie, illimité 15 jours', source: AIRALO_ASIE, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '16,00', designe: 'Airalo Vietnam, 10 Go sur 30 jours', source: AIRALO_VN, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '61,50', designe: 'Airalo Vietnam, illimité 30 jours', source: AIRALO_VN, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '46,90', designe: 'Holafly Asie, 15 jours', source: HOLAFLY, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '68,90', designe: 'Holafly Asie, 30 jours', source: HOLAFLY, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM], sourceIntrouvableAttendue: true },
  { affiche: '699', designe: 'SIM touriste AIS, 15 jours, en THB', source: AIS, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM] },
  { affiche: '1 199', designe: 'SIM touriste AIS, 30 jours, en THB', source: AIS, releveLe: '2026-08-30', pages: [COMPARATIF_ESIM, EN_COMPARATIF_ESIM] },
  { affiche: '10 000', designe: 'K-ETA facultatif, frais de demande en wons', source: KETA, releveLe: '2026-08-31', pages: [ARTICLE_KETA] },
  { affiche: '150 000', designe: 'taxe touristique de Bali, en roupies, à chaque entrée', source: FD_INDONESIE, releveLe: '2026-08-31', pages: [ARTICLE_INDONESIE] },
  { affiche: '3 030', designe: 'prolongation de séjour aux Philippines, en pesos', source: FD_PHILIPPINES, releveLe: '2026-08-31', pages: [ARTICLE_PHILIPPINES] },

  /* ── Train Hanoï-Saigon ─────────────────────────────────────── */
  { affiche: '1 726', designe: 'distance ferroviaire Hanoï-Saigon, en km', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, GUIDE_TRANSPORTS, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  // Deux guides annonçaient « 33 heures » là où l'article, horaires officiels à
  // l'appui, écrit 32 h 45. Un écart d'un quart d'heure n'a blessé personne,
  // mais il prouvait que rien ne reliait ces trois pages entre elles. La durée
  // est désormais au registre : la sentinelle refuse la mise en ligne si l'une
  // d'elles se met à dire autre chose.
  { affiche: '32 h 45', designe: 'durée du train SE1, Hanoï-Saigon', source: DSVN_TARIFS, releveLe: '2026-09-04', pages: [ARTICLE_TRAIN_VIETNAM, GUIDE_TRANSPORTS, GUIDE_ERREURS, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true, contredit: ['33 heures', '33 h de train'] },
  { affiche: '1 122 000', designe: 'train SE1 Hanoï-Saigon, siège inclinable climatisé', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '1 516 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage haut', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '1 664 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage milieu', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '1 894 000', designe: 'train SE1 Hanoï-Saigon, couchette molle 6 places, étage bas', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '1 884 000', designe: 'train SE1 Hanoï-Saigon, couchette molle climatisée 4 places, étage haut', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '2 051 000', designe: 'train SE1 Hanoï-Saigon, couchette molle climatisée 4 places, étage bas', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '3 077 000', designe: 'train SE1 Hanoï-Saigon, compartiment privé 2 couchettes', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '4 510 000', designe: 'train SE1 Hanoï-Saigon, compartiment privé VIP 2 couchettes', source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },
  { affiche: '378 000', designe: "écart de prix entre étage bas et étage haut, couchette molle 6 places", source: DSVN_TARIFS, releveLe: '2026-08-31', pages: [ARTICLE_TRAIN_VIETNAM, EN_TRAIN_VIETNAM], sourceIntrouvableAttendue: true },

  /* ── Taxi depuis l'aéroport de Bangkok ──────────────────────────
     Les seuls montants de cet article qui viennent d'un exploitant
     d'aéroport. Les bornes du barème — la prise en charge, la première
     tranche et la dernière — suffisent : si la grille bouge, elles bougent.
     Inscrire les six tranches ferait surveiller « 7 » et « 8 », qu'on
     retrouverait dans n'importe quelle page. */
  { affiche: '35', designe: 'taxi Bangkok, prise en charge du premier kilomètre (THB)', source: AOT_TAXI, releveLe: '2026-09-07', pages: [ARTICLE_TAXI_AEROPORT, EN_TAXI_AEROPORT] },
  { affiche: '6,50', designe: 'taxi Bangkok, tarif de 1 à 10 km (THB/km)', source: AOT_TAXI, releveLe: '2026-09-07', pages: [ARTICLE_TAXI_AEROPORT, EN_TAXI_AEROPORT] },
  { affiche: '10,50', designe: 'taxi Bangkok, tarif au-delà de 80 km (THB/km)', source: AOT_TAXI, releveLe: '2026-09-07', pages: [ARTICLE_TAXI_AEROPORT, EN_TAXI_AEROPORT] },

  /* ── Aéroport de Hanoï (Noi Bai) ────────────────────────────── */
  { affiche: '12 000', designe: 'bus Noi Bai, lignes 07 et 109, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },
  { affiche: '15 000', designe: 'bus Noi Bai, lignes 17 et 90, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },
  { affiche: '20 000', designe: 'bus Noi Bai, ligne E10, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },
  { affiche: '50 000', designe: 'bus Noi Bai, ligne 86 vers la gare de Hanoï, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },
  { affiche: '55 000', designe: 'bus Noi Bai, ligne 68 vers Hà Đông, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },
  { affiche: '90 000', designe: 'navette Hải Vân, lignes NB01/NB02, le trajet', source: NOIBAI_TRANSPORT, releveLe: '2026-08-31', pages: [ARTICLE_AEROPORT_HANOI, EN_AEROPORT_HANOI] },

  /* ── Musée Cham de Da Nang ────────────────────────────────────
     Tarif annoncé par le musée en 2023, retrouvé via une recherche sur son
     propre site — pas revérifié sur une page à date récente. L'article le
     dit explicitement au lecteur ; ce champ garde le même montant surveillé
     s'il venait à disparaître de la page d'origine. */
  { affiche: '50 000', designe: "entrée musée de sculpture Cham, Da Nang, annoncée en 2023 (VND)", source: CHAM_MUSEUM, releveLe: '2026-09-11', pages: [ARTICLE_HOI_AN_PLUIE, EN_HOI_AN_PLUIE], sourceIntrouvableAttendue: true },
];
