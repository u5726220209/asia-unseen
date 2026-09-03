import { countries } from '@/data/countries';
import { sourcesTarifaires } from '@/data/assurances';

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

/**
 * Le nombre de pages officielles que la veille relit chaque jour.
 *
 * Il est écrit noir sur blanc sur plusieurs pages du site, et c'est le genre
 * de chiffre qu'on pose une fois à la main puis qu'on oublie. Il doit donc se
 * déduire — mais se déduire de la MÊME chose que scripts/veille.mjs, sans quoi
 * le site annoncerait un nombre et la machine en surveillerait un autre.
 *
 * Un premier calcul ne comptait que `sourcesVisa` et donnait seize au lieu de
 * vingt-cinq : il oubliait les pages « Contacts utiles » de France Diplomatie,
 * déclarées une par pays sous `urgences.source`. La veille, elle, les lit —
 * son extraction ratisse toutes les paires { label, url } du fichier. Les deux
 * gisements sont donc réunis ici, et dédoublonnés par adresse comme là-bas :
 * la source générique de France Diplomatie est partagée par les neuf fiches et
 * ne compte qu'une fois, ses neuf pages « Contacts utiles » comptent chacune.
 */
export const nbSourcesSurveillees = new Set([
  ...countries.flatMap((c) => c.sourcesVisa.filter((s) => s.surveillee !== false).map((s) => s.url)),
  ...countries.map((c) => c.urgences?.source?.url).filter(Boolean),
  ...sourcesTarifaires.map((s) => s.url),
]).size;
