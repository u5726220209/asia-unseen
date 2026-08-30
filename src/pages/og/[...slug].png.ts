import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { articlesPublies, guidesPublies } from '@/lib/articles';
import sharp from 'sharp';
import { countries } from '@/data/countries';

/**
 * Image de partage (Open Graph) générée pour chaque page, à la compilation.
 *
 * Une image par page vaut nettement mieux qu'une image générique : sur les
 * réseaux, dans les messageries et dans les aperçus de recherche, c'est le
 * titre de l'article qui s'affiche, pas le nom du site.
 *
 * Rendu par sharp à partir d'un SVG. Space Grotesk n'étant pas installée au
 * niveau système, le texte utilise une grotesque de repli — cohérent avec
 * public/og-default.png, généré de la même façon.
 */

type Props = { titre: string; categorie: string };

export const getStaticPaths = (async () => {
  const guides = await guidesPublies();
  const blog = await articlesPublies();

  return [
    ...countries.map((c) => ({
      params: { slug: c.slug },
      props: {
        titre: `Voyager ${c.article === 'aux' ? 'aux' : c.article} ${c.nom}`,
        categorie: 'Guide pays',
      } satisfies Props,
    })),
    ...guides.map((g) => ({
      params: { slug: g.id },
      props: { titre: g.data.heading ?? g.data.title, categorie: 'Guide pratique' } satisfies Props,
    })),
    ...blog.map((p) => ({
      params: { slug: `blog/${p.id}` },
      props: { titre: p.data.heading ?? p.data.title, categorie: 'Récit de terrain' } satisfies Props,
    })),
  ];
}) satisfies GetStaticPaths;

/** Découpe un titre en lignes tenant dans la largeur disponible. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines) {
    const consumed = lines.join(' ').length;
    if (consumed < text.length - 1) lines[maxLines - 1] = lines[maxLines - 1].replace(/[\s,;:]+$/, '') + '…';
  }
  return lines;
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ props }) => {
  const { titre, categorie } = props as Props;

  const lines = wrap(titre, 26, 3);
  const size = lines.length >= 3 ? 62 : 72;
  const leading = size * 1.16;
  // Le bloc de titre est centré dans la zone libre entre l'en-tête et le filet
  // ambre : un titre d'une ligne ne laisse donc pas un vide de 200 px au milieu.
  const blockTop = 356 - (lines.length * leading) / 2;
  const firstBaseline = blockTop + size * 0.78;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0A0A0A"/>
  <g fill="none" stroke-linecap="round" stroke-width="11" transform="translate(84 74) scale(1.05)">
    <path d="M9 55 28.5 18" stroke="#F9FAFB"/>
    <path d="M35.5 18 55 55" stroke="#F9FAFB"/>
    <path d="M17 41H47" stroke="#F59E0B"/>
  </g>
  <text x="176" y="130" font-family="Helvetica,Arial,sans-serif" font-size="26" font-weight="700" letter-spacing="3.4" fill="#F9FAFB">ASIA UNSEEN</text>
  <text x="176" y="163" font-family="Helvetica,Arial,sans-serif" font-size="20" font-weight="500" letter-spacing="3.4" fill="#0F9384">${escapeXml(categorie.toUpperCase())}</text>
  ${lines
    .map(
      (l, i) =>
        `<text x="84" y="${firstBaseline + i * leading}" font-family="Helvetica,Arial,sans-serif" font-size="${size}" font-weight="700" letter-spacing="-1.4" fill="#F9FAFB">${escapeXml(l)}</text>`,
    )
    .join('\n  ')}
  <rect x="84" y="498" width="72" height="6" fill="#F59E0B"/>
  <text x="84" y="562" font-family="Helvetica,Arial,sans-serif" font-size="25" font-weight="500" letter-spacing="2.4" fill="#9CA3AF">asiaunseen.com</text>
</svg>`;

  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
