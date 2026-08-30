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

export const mainNav = [
  { href: '/blog', label: 'Récits' },
  { href: '/mises-a-jour', label: 'Corrections' },
  { href: '/ressources', label: 'Ressources' },
  { href: '/a-propos', label: 'À propos' },
];

export const footerLegal = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité & cookies' },
  { href: '/affiliation', label: 'Transparence & affiliation' },
  { href: '/donnees', label: 'Données ouvertes' },
  { href: '/contact', label: 'Contact' },
];
