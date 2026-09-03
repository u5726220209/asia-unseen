import rss from '@astrojs/rss';
import { corrections, lienCorrection } from '@/data/corrections';
import { site } from '@/data/site';
import type { APIContext } from 'astro';

/**
 * Flux dédié aux corrections. Un voyageur qui prépare un départ dans six mois
 * a une vraie raison de s'y abonner : c'est là qu'apparaîtra le changement de
 * règle qui le concerne.
 */
export async function GET(context: APIContext) {
  return rss({
    title: `${site.name} — corrections et mises à jour`,
    description:
      "Chaque changement de règle de visa, de tarif ou de formalité constaté lors des audits mensuels, avec sa source officielle.",
    site: context.site!,
    trailingSlash: false,
    items: corrections.map((c) => ({
      title: `${c.pageLabel} — ${c.titre}`,
      description: `Le site indiquait : « ${c.avant} » — La source officielle indique : « ${c.apres} » (${c.source.label})`,
      pubDate: new Date(`${c.date}T09:00:00Z`),
      // Le lien pointait vers la page corrigée. Un abonné qui reçoit « ce qui a
      // changé » y arrivait sans voir ce qui avait changé : la page affiche la
      // règle actuelle, pas l'écart. L'ancre du journal montre l'avant, l'après
      // et la source — c'est-à-dire ce que le flux annonce.
      link: lienCorrection(c),
      categories: [c.gravite, c.pageLabel],
    })),
    customData: '<language>fr-FR</language>',
  });
}
