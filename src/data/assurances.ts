/**
 * Grilles tarifaires des assurances voyage, relevées à la main.
 *
 * ⚠️ Ces montants sont des tarifs commerciaux : ils changent sans préavis.
 * `releveLe` porte la date du relevé, et chaque assureur porte l'adresse de la
 * page consultée. Avant toute mise à jour du site, revérifiez les deux grilles
 * et remontez la date — un comparateur périmé est pire qu'aucun comparateur.
 *
 * Le point de ce jeu de données : les deux assureurs ne classent pas l'Asie
 * dans les mêmes zones. Le moins cher des deux change donc selon la
 * destination, ce qu'aucun comparatif rédigé ne montre.
 */

export const releveLe = '2026-08-30';

export type Devis = { prix: number; plafond: number; zone: string } | null;

/* ── Chapka, Cap Assistance 24/24 ───────────────────────────────
 * Tarif par tranche de durée, quel que soit l'âge (majoration de 10 %
 * au-delà de 65 ans, non appliquée ici). Séjour de 90 jours maximum.
 * https://www.chapkadirect.fr/index.php?action=produit&id=924
 */
const CHAPKA_TRANCHES = [8, 12, 16, 24, 32, 61, 90] as const;

const CHAPKA = {
  url: 'https://www.chapkadirect.fr',
  nom: 'Chapka — Cap Assistance 24/24',
  dureeMax: 90,
  zones: {
    // Zone 2 : monde entier, sauf la liste ci-dessous.
    2: { plafond: 500_000, prix: [32, 49, 64, 97, 130, 174, 234], label: 'zone 2' },
    // Zone 3 : USA, Canada, Cambodge, Colombie, Costa Rica, Inde, Indonésie,
    // Jordanie, Mexique, Thaïlande.
    3: { plafond: 1_000_000, prix: [38, 57, 75, 120, 157, 212, 282], label: 'zone 3' },
  },
  /** Les seuls pays du site classés en zone 3, la plus chère. */
  zone3: ['thailande', 'cambodge', 'indonesie'],
} as const;

/* ── AVI International, Routard ─────────────────────────────────
 * Tarif à la semaine entière, par tranche d'âge. Séjour de 8 semaines
 * maximum, renouvelable une fois.
 * https://www.avi-international.com/assurance-voyage/assurance-routard
 */
const AVI = {
  url: 'https://www.avi-international.com',
  nom: 'AVI International — Routard',
  semainesMax: 8,
  zones: {
    // Zone A : monde entier, USA, Canada, Chine, Japon, Australie, Singapour.
    A: { plafond: 1_250_000, prix: { '0-18': 33.9, '19-35': 33.9, '36-60': 37.02, '61+': 50.2 }, label: 'zone A' },
    // Zone B : monde, hors les pays de la zone A.
    B: { plafond: 500_000, prix: { '0-18': 28.82, '19-35': 28.82, '36-60': 31.47, '61+': 42.68 }, label: 'zone B' },
  },
  /** Les seuls pays du site classés en zone A, la plus chère. */
  zoneA: ['chine', 'japon'],
} as const;

export const TRANCHES_AGE = [
  { cle: '0-18', label: 'Moins de 19 ans' },
  { cle: '19-35', label: '19 à 35 ans' },
  { cle: '36-60', label: '36 à 60 ans' },
  { cle: '61+', label: '61 ans et plus' },
] as const;

export type TrancheAge = (typeof TRANCHES_AGE)[number]['cle'];

/** Devis Chapka pour un pays et une durée en jours. */
export function devisChapka(pays: string, jours: number): Devis {
  if (jours < 1 || jours > CHAPKA.dureeMax) return null;
  const z = CHAPKA.zone3.includes(pays as never) ? CHAPKA.zones[3] : CHAPKA.zones[2];
  const i = CHAPKA_TRANCHES.findIndex((t) => jours <= t);
  if (i === -1) return null;
  return { prix: z.prix[i], plafond: z.plafond, zone: z.label };
}

/** Devis AVI pour un pays, une durée en jours et une tranche d'âge. */
export function devisAvi(pays: string, jours: number, age: TrancheAge): Devis {
  const semaines = Math.ceil(jours / 7);
  if (semaines < 1 || semaines > AVI.semainesMax) return null;
  const z = AVI.zoneA.includes(pays as never) ? AVI.zones.A : AVI.zones.B;
  return { prix: Math.round(z.prix[age] * semaines * 100) / 100, plafond: z.plafond, zone: z.label };
}

export const assureurs = { chapka: CHAPKA, avi: AVI };

/**
 * Les pages exactes que la sentinelle doit surveiller.
 *
 * Ce sont les grilles tarifaires, pas les pages d'accueil : une page d'accueil
 * change tous les jours sans que rien de tarifaire ne bouge, et une sentinelle
 * qui crie tous les jours finit par n'être plus lue.
 */
export const sourcesTarifaires = [
  { label: 'Chapka — grille Cap Assistance 24/24', url: 'https://www.chapkadirect.fr/index.php?action=produit&id=924' },
  { label: 'AVI — grille Routard', url: 'https://www.avi-international.com/assurance-voyage/assurance-routard' },
];
