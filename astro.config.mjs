import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';
import { rehypeAffiliateLinks } from './src/plugins/rehype-affiliate-links.mjs';
import { loadEnv } from 'vite';

// Les identifiants d'affiliation sont lus à la compilation pour que le plugin
// rehype puisse les injecter dans les liens écrits en Markdown.
const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_'), ...process.env };
const affiliateIds = {
  booking: env.PUBLIC_AFF_BOOKING, agoda: env.PUBLIC_AFF_AGODA,
  twelvego: env.PUBLIC_AFF_12GO, getyourguide: env.PUBLIC_AFF_GETYOURGUIDE,
  airalo: env.PUBLIC_AFF_AIRALO, holafly: env.PUBLIC_AFF_HOLAFLY,
  chapka: env.PUBLIC_AFF_CHAPKA, wise: env.PUBLIC_AFF_WISE,
};

// https://astro.build/config
export default defineConfig({
  // Domaine de production par défaut ; PUBLIC_SITE_URL le remplace pour les
  // déploiements de préversion (sous-domaine temporaire, environnement de recette).
  site: env.PUBLIC_SITE_URL || 'https://asiaunseen.com',
  trailingSlash: 'never',
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en' } },
      // Les pages légales restent dans le plan du site : ce sont des signaux de
      // confiance que Google cherche activement, et une page d'identité qu'on
      // cache indexe mal l'idée qu'on n'a rien à cacher. Seule la page de
      // remerciement après inscription en est exclue : elle n'a de sens
      // qu'immédiatement après le formulaire.
      filter: (page) => !page.includes('/merci'),
      // Astro produit des URL en /page/ ; les canoniques du site et les hôtes
      // statiques utilisent /page. On aligne le plan du site dessus pour ne pas
      // déclarer à Google une liste d'URL qui redirigent toutes.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, '');
        const path = url.pathname;

        const priority =
          path === '/' ? 1.0
          : /^\/(vietnam|thailande|japon|chine|laos|cambodge|coree-du-sud|indonesie|philippines)$/.test(path) ? 0.9
          : path.startsWith('/blog/') ? 0.6
          : path === '/blog' || path === '/ressources' ? 0.8
          : /^\/[a-z-]+$/.test(path) ? 0.9   // guides thématiques
          : 0.5;

        return { ...item, url: url.href, priority, changefreq: 'weekly' };
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [[rehypeAffiliateLinks, affiliateIds]],
    shikiConfig: { theme: 'github-light', wrap: true },
  },
  vite: { plugins: [tailwindcss()] },
  server: { port: Number(process.env.PORT) || 4321 },
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  image: { responsiveStyles: true },
});
