/**
 * Les deux versions du site, et ce qui les relie.
 *
 * Le français reste à la racine — `/vietnam` — et l'anglais vit sous `/en/`.
 * Ce n'est pas un détail de rangement : un sous-dossier partage la notoriété
 * du domaine, là où un sous-domaine repartirait de zéro. Sur un site de douze
 * jours, c'est la différence entre hériter d'une avance et en construire une
 * seconde à côté de la première.
 *
 * Tout ce qui sait qu'il existe deux langues passe par ici. C'est délibéré :
 * la traduction est le genre de chantier où les règles se recopient dans dix
 * fichiers, puis divergent — une balise `hreflang` qui pointe vers une page
 * absente, un sélecteur qui renvoie à la racine, un plan du site qui ignore la
 * moitié des pages. Un seul endroit pour décider, et des contrôles derrière.
 */

export type Langue = 'fr' | 'en';

export const LANGUES: { code: Langue; nom: string; nomLocal: string; etiquette: string }[] = [
  { code: 'fr', nom: 'Français', nomLocal: 'Français', etiquette: 'fr-FR' },
  { code: 'en', nom: 'Anglais', nomLocal: 'English', etiquette: 'en' },
];

export const LANGUE_PAR_DEFAUT: Langue = 'fr';

/** La langue d'un chemin. `/en/vietnam` → en, `/vietnam` → fr. */
export function langueDe(chemin: string): Langue {
  return /^\/en(\/|$)/.test(chemin) ? 'en' : 'fr';
}

/** Le chemin sans son préfixe de langue. `/en/vietnam` → `/vietnam`. */
export function cheminNu(chemin: string): string {
  const nu = chemin.replace(/^\/en(?=\/|$)/, '');
  return nu === '' ? '/' : nu;
}

/**
 * Le même contenu dans l'autre langue.
 *
 * Rend un chemin, jamais une promesse : que la page existe est une question
 * distincte, et c'est `verifier-config.mjs` qui la pose. Une balise `hreflang`
 * vers une page absente est pire que pas de balise — elle dit à Google qu'une
 * traduction existe, et Google va la chercher.
 */
export function cheminEn(chemin: string, langue: Langue): string {
  const nu = cheminNu(chemin);
  if (langue === 'fr') return nu;
  return nu === '/' ? '/en' : `/en${nu}`;
}

/**
 * Les libellés d'interface.
 *
 * Seulement ce qui n'est pas du contenu : navigation, boutons, mentions
 * légères. Le contenu — une règle de visa, un budget, une erreur à éviter —
 * n'est pas ici et ne le sera jamais : il vit dans les données, où il porte sa
 * source et sa date. Mélanger les deux ferait traduire une règle d'entrée
 * comme on traduit un bouton.
 */
const MOTS = {
  fr: {
    'nav.pays': 'Pays',
    'nav.guides': 'Guides',
    'nav.articles': 'Articles',
    'nav.corrections': 'Corrections',
    'nav.signaler': 'Signaler',
    'nav.apropos': 'À propos',
    'nav.rechercher': 'Rechercher',
    'langue.changer': 'English',
    'langue.aria': 'Lire ce site en anglais',
    'commun.verifieEn': 'Vérifié en',
    'commun.source': 'Source officielle',
    'commun.lire': 'Le guide complet',
  },
  en: {
    'nav.pays': 'Countries',
    'nav.guides': 'Guides',
    'nav.articles': 'Articles',
    'nav.corrections': 'Corrections',
    'nav.signaler': 'Report an error',
    'nav.apropos': 'About',
    'nav.rechercher': 'Search',
    'langue.changer': 'Français',
    'langue.aria': 'Read this site in French',
    'commun.verifieEn': 'Checked in',
    'commun.source': 'Official source',
    'commun.lire': 'Read the full guide',
  },
} as const;

export type CleMot = keyof (typeof MOTS)['fr'];

/**
 * Un libellé, dans la langue demandée.
 *
 * Rend la clé elle-même si la traduction manque, plutôt qu'une chaîne vide ou
 * le mot français. Une page anglaise qui affiche « nav.guides » se voit en une
 * seconde ; une page anglaise qui affiche « Guides » en français passe
 * inaperçue et reste en ligne des mois.
 */
export function mot(cle: CleMot, langue: Langue): string {
  return MOTS[langue]?.[cle] ?? cle;
}
