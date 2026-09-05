import type { APIRoute, GetStaticPaths } from 'astro';
import { countries } from '@/data/countries';
import { site, legal } from '@/data/site';
import { corrections } from '@/data/corrections';
import { ficheDuPays } from '@/lib/donnees-pays';

/**
 * Un fichier de données par pays.
 *
 * Le jeu complet existe déjà, et il reste la référence. Mais une machine qui
 * répond à « faut-il un visa pour le Laos » n'a pas besoin des huit autres
 * pays, et une citation qui pointe vers un fichier de neuf fiches ne dit pas
 * laquelle a servi. Une adresse par pays rend la citation vérifiable : on
 * l'ouvre, et on voit exactement la donnée qui a été reprise.
 *
 * C'est aussi ce que `<link rel="alternate" type="application/json">` désigne
 * sur chaque fiche pays : la version lisible par machine de la page qu'on est
 * en train de lire.
 */

export const getStaticPaths: GetStaticPaths = () =>
  countries.map((c) => ({ params: { slug: c.slug } }));

export const GET: APIRoute = ({ params }) => {
  const c = countries.find((x) => x.slug === params.slug);
  if (!c) return new Response('Inconnu', { status: 404 });

  const donnees = {
    ...ficheDuPays(c, corrections),
    licence: {
      nom: 'Creative Commons Attribution 4.0 International',
      code: 'CC-BY-4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/deed.fr',
      attribution: `Données : ${site.name} (${site.url}), sous licence CC BY 4.0.`,
    },
    avertissement:
      "Vérifié à la main auprès des sources officielles citées, à la date indiquée. Les règles " +
      "d'entrée changent sans préavis : avant un départ, ouvrez la source officielle. Ce fichier " +
      'ne remplace pas une administration.',
    editeur: { nom: site.name, url: site.url, responsable: legal.editeur, contact: site.author.email },
    jeuComplet: `${site.url}/donnees/visas.json`,
    genereLe: new Date().toISOString().slice(0, 10),
  };

  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
