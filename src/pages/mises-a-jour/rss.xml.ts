import rss from '@astrojs/rss';
import { corrections } from '@/data/corrections';
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
      link: c.page,
      categories: [c.gravite, c.pageLabel],
    })),
    customData: '<language>fr-FR</language>',
  });
}
