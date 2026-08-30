import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '@/data/site';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  return rss({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    site: context.site!,
    trailingSlash: false,
    items: posts.map((post) => ({
      title: post.data.heading ?? post.data.title,
      description: post.data.accroche,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}`,
      categories: [post.data.categorie, ...post.data.pays],
    })),
    customData: '<language>fr-FR</language>',
  });
}
