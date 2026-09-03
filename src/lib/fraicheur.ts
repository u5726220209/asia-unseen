import { countries } from '@/data/countries';

/**
 * La fraîcheur, calculée plutôt qu'affirmée.
 *
 * Le site annonçait « mis à jour en août 2026 » depuis une constante écrite à
 * la main, `site.lastReview`. Elle était juste ce jour-là. Elle ne le serait
 * plus le jour où quelqu'un vérifierait une fiche sans penser à la modifier —
 * ou pire, la modifierait sans avoir rien vérifié. Une date de fraîcheur qui
 * ne dépend pas du travail réellement fait est une date décorative.
 *
 * Ces deux valeurs se déduisent des dates portées par chaque fiche pays.
 */

const dates = countries.map((c) => c.verifieLe).filter(Boolean).sort();

/**
 * La vérification la plus ANCIENNE, et c'est volontaire.
 *
 * Annoncer la plus récente flatterait le site et tromperait le lecteur : huit
 * fiches de l'an dernier et une d'hier donneraient « mis à jour hier ». La
 * plus ancienne se lit comme une garantie plancher — aucune fiche n'est plus
 * vieille que cette date —, ce qui est exactement l'information dont dispose
 * quelqu'un qui s'apprête à faire confiance à une règle de visa.
 */
export const plusAncienneVerification = dates[0] ?? '';

/** La plus récente, pour les usages où c'est la bonne mesure (flux, versions). */
export const plusRecenteVerification = dates.at(-1) ?? '';

/** « août 2026 » à partir de « 2026-08 ». */
export function moisEnLettres(aaaaMm: string): string {
  if (!/^\d{4}-\d{2}$/.test(aaaaMm)) return '';
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date(`${aaaaMm}-01T00:00:00`));
}

/**
 * « qu'août 2026 », « que mars 2027 ».
 *
 * Trois mois de l'année commencent par une voyelle, et la phrase les traverse
 * une année sur quatre sans prévenir. Une élision oubliée se lit comme une
 * faute de frappe, sur la ligne même qui demande au lecteur de nous croire.
 */
export function queMois(aaaaMm: string): string {
  const mois = moisEnLettres(aaaaMm);
  if (!mois) return '';
  return /^[aeiouyâàéèêîôû]/i.test(mois) ? `qu'${mois}` : `que ${mois}`;
}
