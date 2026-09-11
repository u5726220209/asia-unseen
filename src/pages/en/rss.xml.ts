import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '@/data/site';
import type { APIContext } from 'astro';

/**
 * Le fil anglais.
 *
 * Un fil à part plutôt qu'un fil mêlé : un lecteur anglophone abonné au fil
 * français recevrait vingt titres qu'il ne peut pas lire pour chaque titre
 * qu'il peut, et se désabonnerait avant d'avoir trouvé le second.
 *
 * Il annonce `en` là où le fil français annonce `fr-FR` — c'est ce que lisent
 * les agrégateurs pour décider à qui montrer quoi, et l'oublier revient à
 * publier un fil anglais étiqueté français.
 */
export async function GET(context: APIContext) {
  const aujourdhui = new Date();
  const paru = (e: { data: { draft: boolean; pubDate: Date } }) =>
    !e.data.draft && e.data.pubDate <= aujourdhui;

  const articles = (await getCollection('blogEn')).filter(paru);
  const guides = (await getCollection('guidesEn')).filter(paru);

  const items = [
    ...articles.map((a) => ({
      title: a.data.heading ?? a.data.title,
      description: a.data.accroche,
      pubDate: a.data.pubDate,
      link: `/en/blog/${a.id}`,
      categories: [a.data.categorie, ...a.data.pays],
    })),
    ...guides.map((g) => ({
      title: g.data.heading ?? g.data.title,
      description: g.data.accroche,
      pubDate: g.data.pubDate,
      link: `/en/guides/${g.id}`,
      categories: ['guide', ...g.data.pays],
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: `${site.name} — travelling in Asia, with the sources`,
    description:
      'Entry rules by passport, budgets, transport and accommodation across nine Asian ' +
      'countries. Every rule carries the official source it came from and the month it was read.',
    site: context.site!,
    trailingSlash: false,
    items,
    customData: '<language>en</language>',
  });
}
