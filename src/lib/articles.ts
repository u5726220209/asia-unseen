import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * La programmation de publication.
 *
 * Un article dont la `pubDate` est dans le futur est écrit, relu, poussé — et
 * invisible. Il n'entre ni dans le blog, ni dans le fil RSS, ni dans le plan du
 * site ; sa page n'est même pas construite. Le jour venu, la mise en ligne
 * quotidienne le fait apparaître sans qu'on touche à rien.
 *
 * Cela sert deux choses. D'abord écrire quand on a le temps et publier quand
 * c'est pertinent : un guide de la saison sèche gagne à sortir en octobre,
 * pas le jour où il a été rédigé. Ensuite étaler la parution : un site qui
 * publie huit articles d'un coup puis se tait trois mois envoie un signal de
 * qualité moins bon qu'un site qui paraît régulièrement.
 *
 * `draft: true` reste ce qu'il était — un brouillon qu'on ne veut pas voir,
 * sans date de sortie décidée. Une `pubDate` future, c'est un rendez-vous pris.
 */

/**
 * On compare des jours, pas des instants.
 *
 * `pubDate: 2026-08-30` est lu comme minuit UTC, alors que « aujourd'hui »
 * est minuit à Paris — deux heures plus tôt en été. Comparer les deux dates
 * comme des instants ferait disparaître du site, pendant deux heures chaque
 * matin, tous les articles datés du jour. Une date de parution est un jour de
 * calendrier ; on la traite comme tel.
 */
const jour = (d: Date) => d.toISOString().slice(0, 10);

function aujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const estPublie = ({ data }: { data: { draft: boolean; pubDate: Date } }) =>
  !data.draft && jour(data.pubDate) <= aujourdhui();

export const articlesPublies = () =>
  getCollection('blog', estPublie) as Promise<CollectionEntry<'blog'>[]>;

export const guidesPublies = () =>
  getCollection('guides', estPublie) as Promise<CollectionEntry<'guides'>[]>;

/** Ce qui attend son tour — pour le rappel éditorial, jamais pour le site. */
export async function articlesProgrammes(): Promise<CollectionEntry<'blog'>[]> {
  const tous = await getCollection('blog');
  return tous
    .filter((a) => !a.data.draft && jour(a.data.pubDate) > aujourdhui())
    .sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
}
