import type { APIRoute } from 'astro';
import { countries } from '@/data/countries';
import { site, legal } from '@/data/site';
import { corrections } from '@/data/corrections';

/**
 * Jeu de données ouvert : les règles d'entrée des neuf pays couverts.
 *
 * POURQUOI CE FICHIER EXISTE
 * Une part croissante des recherches ne se termine plus sur un site mais dans
 * une réponse générée. Ce qui compte alors n'est pas seulement d'être bien
 * classé : c'est d'être la source que la machine peut lire, dater et citer.
 * Dix articles contradictoires valent moins qu'un fichier propre qui dit
 * quelle est la règle, d'où elle vient, et quand elle a été vérifiée.
 *
 * C'est aussi la forme la plus honnête de la promesse du site : plutôt que de
 * demander qu'on lui fasse confiance, il donne la donnée et sa source.
 */

const derniereCorrectionPour = (slug: string) =>
  corrections
    .filter((c) => c.page === `/${slug}`)
    .map((c) => c.date)
    .sort()
    .at(-1) ?? null;

export const GET: APIRoute = () => {
  const donnees = {
    nom: "Règles d'entrée en Asie pour les voyageurs français",
    description:
      "Formalités d'entrée, durées autorisées, coûts et démarches préalables pour neuf pays d'Asie. " +
      "Chaque fiche porte la date à laquelle elle a été vérifiée et les sources officielles consultées.",
    version: site.lastReview,
    genereLe: new Date().toISOString().slice(0, 10),
    url: `${site.url}/donnees`,
    editeur: {
      nom: site.name,
      url: site.url,
      responsable: legal.editeur,
      enseigne: legal.enseigne,
      siren: legal.siren,
      contact: site.author.email,
    },
    licence: {
      nom: 'Creative Commons Attribution 4.0 International',
      code: 'CC-BY-4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/deed.fr',
      attribution: `Données : ${site.name} (${site.url}), sous licence CC BY 4.0.`,
    },
    avertissement:
      "Ces données sont vérifiées à la main auprès des sources officielles citées, à la date indiquée " +
      "dans chaque fiche. Les règles d'entrée changent sans préavis : avant un départ, vérifiez la " +
      "source officielle. Ce jeu de données ne remplace pas une administration.",
    nombrePays: countries.length,
    pays: countries.map((c) => ({
      slug: c.slug,
      nom: c.nom,
      capitale: c.capitale,
      monnaie: c.monnaie,
      langue: c.langue,
      decalageHoraire: c.decalage,
      visa: {
        resume: c.visa.resume,
        dureeAutorisee: c.visa.duree,
        cout: c.visa.cout,
        procedure: c.visa.procedure,
      },
      demarchesPrealables: c.demarches.map((d) => ({
        joursAvantDepart: d.jours,
        titre: d.titre,
        detail: d.detail,
      })),
      sources: c.sourcesVisa.map((s) => ({ label: s.label, url: s.url })),
      verifieLe: c.verifieLe,
      derniereCorrection: derniereCorrectionPour(c.slug),
      page: `${site.url}/${c.slug}`,
    })),
  };

  return new Response(JSON.stringify(donnees, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Réutilisable depuis n'importe quel site ou outil : c'est le but.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
