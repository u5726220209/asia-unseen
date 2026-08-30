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

/**
 * Les suggestions de fin d'article, réparties équitablement.
 *
 * La règle évidente — « les trois articles qui partagent le plus de pays, puis
 * les plus récents » — a un défaut qui ne se voit pas à la lecture d'une page :
 * elle est déterministe, donc les mêmes trois articles sont proposés partout.
 * Une poignée récolte tous les liens internes, et le reste n'en reçoit aucun.
 * Ces derniers deviennent alors invisibles pour le lecteur qui navigue de
 * proche en proche, et faibles aux yeux de Google, qui lit les liens internes
 * comme un vote du site sur ses propres pages.
 *
 * On garde donc la pertinence comme premier critère, mais à pertinence égale
 * on propose l'article le moins déjà proposé. Le calcul est global et fait une
 * seule fois : chaque page reçoit ensuite sa liste toute prête.
 */
export async function suggestionsCroisees(): Promise<Map<string, CollectionEntry<'blog'>[]>> {
  const posts = (await articlesPublies()).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const dejaPropose = new Map(posts.map((p) => [p.id, 0]));
  const resultat = new Map<string, CollectionEntry<'blog'>[]>();

  for (const post of posts) {
    const partages = (x: CollectionEntry<'blog'>) =>
      x.data.pays.filter((s) => post.data.pays.includes(s)).length;

    const choisis: CollectionEntry<'blog'>[] = [];
    const restants = posts.filter((p) => p.id !== post.id);

    // Trois passes : à chaque tour on reprend le meilleur candidat au vu des
    // compteurs mis à jour, sinon les trois choix seraient faits d'un bloc et
    // le rééquilibrage n'aurait pas lieu.
    while (choisis.length < 3 && choisis.length < restants.length) {
      const candidat = restants
        .filter((p) => !choisis.includes(p))
        .sort(
          (a, b) =>
            partages(b) - partages(a) ||
            (dejaPropose.get(a.id) ?? 0) - (dejaPropose.get(b.id) ?? 0) ||
            b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
        )[0];
      if (!candidat) break;
      choisis.push(candidat);
      dejaPropose.set(candidat.id, (dejaPropose.get(candidat.id) ?? 0) + 1);
    }

    resultat.set(post.id, choisis);
  }

  return resultat;
}
