/**
 * Où vivent les contenus, et à quelle adresse ils sortent.
 *
 * Cette table existe parce qu'elle a été écrite quatre fois.
 *
 * `verifier-liens.mjs` déduisait l'adresse du nom du dossier — « s'il contient
 * blog, alors /blog/ ». Il a donc ignoré `blog-en` sans rien dire, et vingt-deux
 * articles anglais programmés n'ont jamais vu leurs liens vérifiés.
 * `verifier-chiffres.mjs` avait sa propre liste, à laquelle il a fallu ajouter
 * `blog-en`, puis `guides-en`. `verifier-config.mjs` avait la sienne. Chaque
 * ajout de collection demandait de se souvenir de trois endroits, et l'oubli ne
 * produisait pas d'erreur : il produisait un contrôle qui passe au vert sur un
 * dossier qu'il ne regarde pas.
 *
 * Une règle qui devine ne se trompe pas bruyamment. Elle se tait — et c'est la
 * seule chose que ce dépôt n'accepte pas d'un contrôle.
 *
 * `traduitDe` désigne, quand il existe, la collection française dont celle-ci
 * est la traduction. C'est ce lien qui permet de vérifier qu'un slug d'origine
 * existe, et que les deux pages se déclarent l'une l'autre.
 */
export const COLLECTIONS = [
  { dossier: 'src/content/blog', prefixe: '/blog/', langue: 'fr' },
  { dossier: 'src/content/guides', prefixe: '/', langue: 'fr' },
  { dossier: 'src/content/blog-en', prefixe: '/en/blog/', langue: 'en', traduitDe: 'src/content/blog' },
  { dossier: 'src/content/guides-en', prefixe: '/en/guides/', langue: 'en', traduitDe: 'src/content/guides' },
];

/** Le préfixe d'URL de chaque dossier, sous la forme attendue par les contrôles. */
export const PREFIXES = Object.fromEntries(COLLECTIONS.map((c) => [c.dossier, c.prefixe]));

/** Les collections anglaises, avec leur original — pour les contrôles de traduction. */
export const TRADUITES = COLLECTIONS.filter((c) => c.traduitDe);
