import { countries } from './countries';

export const guidesNav = [
  { href: '/visas-asie',            label: 'Visas',                  hint: 'Formalités, coûts, délais — pays par pays' },
  { href: '/budget-voyage-asie',    label: 'Budget',                 hint: 'Calculateur et coûts réels par pays' },
  { href: '/meilleure-saison-asie', label: 'Meilleure saison',       hint: 'Où partir, mois par mois' },
  { href: '/assurances-voyage',     label: 'Assurance voyage',       hint: 'Comparatif et pièges des contrats' },
  { href: '/esim-asie',             label: 'eSIM & data',            hint: 'Rester connecté sans se ruiner' },
  { href: '/hotels-asie',           label: 'Où dormir',              hint: 'Réserver au bon prix, au bon endroit' },
  { href: '/transports-asie',       label: 'Transports',             hint: 'Trains, bus, ferries, vols intérieurs' },
  { href: '/activites-asie',        label: 'Activités & guides',     hint: 'Ce qui vaut le prix, ce qui ne le vaut pas' },
  { href: '/banques-asie',          label: 'Argent & banques',       hint: 'Cartes, retraits, change, frais' },
  { href: '/erreurs-a-eviter',      label: 'Erreurs & arnaques',     hint: 'Les 20 pièges les plus coûteux' },
  { href: '/checklist-depart',      label: 'Checklist de départ',    hint: 'Votre calendrier daté, personnalisé' },
];

export const paysNav = countries.map((c) => ({
  href: `/${c.slug}`,
  label: c.nom,
  hint: `Dès ${c.budget.routard} €/jour · ${c.visa.duree.split(',')[0]}`,
}));

/**
 * L'en-tête. Sept entrées y tenaient déjà juste ; « Signaler » en faisait une
 * huitième, et « À propos » passait à la ligne.
 *
 * « Ressources » en sort plutôt que « Signaler » : c'est une page d'outils et
 * de liens, qu'on cherche quand on en a besoin, tandis qu'une invitation à
 * contribuer ne fonctionne que si elle est vue par quelqu'un qui ne la
 * cherchait pas. Elle reste dans le pied de page et reçoit soixante-dix-neuf
 * liens internes : elle ne devient invisible pour personne.
 */
export const mainNav = [
  { href: '/blog', label: 'Articles' },
  { href: '/mises-a-jour', label: 'Corrections' },
  { href: '/verifier', label: 'Signaler' },
  { href: '/a-propos', label: 'À propos' },
];

/** Le pied de page, lui, a la place — il reprend l'en-tête et l'élargit. */
export const footerNav = [...mainNav, { href: '/ressources', label: 'Ressources' }];

export const footerLegal = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité & cookies' },
  { href: '/affiliation', label: 'Transparence & affiliation' },
  { href: '/donnees', label: 'Données ouvertes' },
  { href: '/contact', label: 'Contact' },
];
