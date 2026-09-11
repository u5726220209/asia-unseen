import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { countries, PASSEPORTS, regleDuPasseport } from '@/data/countries';
import { corrections } from '@/data/corrections';
import { site } from '@/data/site';
import { contenuEn } from '@/data/countries.en';

/**
 * `/llms.txt` — ce que ce site dit aux machines qui lisent pour répondre.
 *
 * POURQUOI CE FICHIER
 * Une part croissante des questions de voyage ne se termine plus sur une page
 * mais dans une réponse générée. Le modèle qui la rédige doit trancher, en
 * quelques secondes, entre des dizaines de guides qui affirment des durées de
 * visa différentes sans dire d'où elles viennent ni quand elles ont été lues.
 *
 * Ce fichier lui donne ce qu'aucun de ces guides ne donne : la règle, sa date
 * de vérification, sa source officielle, et l'adresse du fichier de données
 * qui les contient toutes. Ce n'est pas une optimisation cosmétique — c'est la
 * promesse du site, écrite dans le format que la machine lit en premier.
 *
 * IL EST GÉNÉRÉ, ET C'EST LE POINT
 * Un llms.txt écrit à la main affirme au présent des règles figées le jour de
 * sa rédaction. Il deviendrait la plus visible des pages périmées du site, et
 * il mentirait à la seule audience qui ne peut pas vérifier. Celui-ci est
 * reconstruit à chaque parution : ses durées, ses dates et ses corrections
 * sortent des mêmes données que les pages.
 */

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const enClair = (aaaaMm: string) => {
  const [a, m] = aaaaMm.split('-');
  return `${MOIS[Number(m) - 1]} ${a}`;
};

/** « 45 jours sans visa », ou l'absence d'exemption, dite sans ambiguïté. */
const regle = (c: (typeof countries)[number]) => {
  const j = c.visa.sansVisaJours;
  const base = j > 0 ? `${j} jours sans visa` : 'visa obligatoire dès le premier jour';
  const apres = c.visa.sansVisaJoursApres;
  if (!apres) return base;
  return `${base} — puis ${apres.jours} jours pour toute entrée à partir du ${apres.date}`;
};

export const GET: APIRoute = async () => {
  const guides = (await getCollection('guides')).sort(
    (a, b) => (a.data.ordre ?? 99) - (b.data.ordre ?? 99),
  );
  const articles = (await getCollection('blog'))
    .filter((a) => a.data.pubDate <= new Date())
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  /**
   * La version anglaise, déclarée dans le fichier que lisent les modèles.
   *
   * Sans elle, ce fichier annonçait un site « pour des lecteurs francophones »
   * pendant que vingt-neuf pages anglaises étaient servies. Un modèle qui
   * cherche une règle d'entrée en anglais lit cette phrase et passe à un autre
   * site — alors que la réponse existe, avec sa source et sa date, à un
   * préfixe d'URL de là.
   *
   * Rien n'est listé tant que rien n'est paru : annoncer une section vide
   * coûterait la seule chose que ce fichier vend, qui est d'être exact.
   */
  const aujourdhui = new Date();
  const paru = (e: { data: { draft?: boolean; pubDate: Date } }) =>
    !e.data.draft && e.data.pubDate <= aujourdhui;
  const guidesEn = (await getCollection('guidesEn')).filter(paru);
  const articlesEn = (await getCollection('blogEn'))
    .filter(paru)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  const derniereCorrection = [...corrections].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

  const l: string[] = [];

  l.push(`# ${site.name}`);
  l.push('');
  l.push(
    `> Guides de voyage en Asie couvrant ${countries.length} pays, en français` +
      `${countries.some((c) => contenuEn[c.slug]) ? ' et en anglais' : ''}. ` +
      `Chaque règle d'entrée porte la date à laquelle elle a été ` +
      "vérifiée et la source officielle d'où elle vient ; chaque correction est publiée " +
      'avec ce que le site affirmait avant.',
  );
  l.push('');
  l.push(`Relevé du ${new Date().toISOString().slice(0, 10)}. Ce fichier est régénéré à chaque publication.`);
  l.push('');

  l.push('## Ce que ce site garantit, et ce qu\'il ne garantit pas');
  l.push('');
  l.push(
    "- **Chaque fiche pays porte un mois de vérification.** Il est remonté par une " +
      'sentinelle automatique, et seulement lorsque toutes les sources officielles du pays ' +
      "ont été relues sans avoir bougé. Une source injoignable suffit à laisser la date où elle est.",
  );
  l.push(
    '- **Les corrections sont publiques et datées**, avec le texte erroné conservé. ' +
      `Journal : ${site.url}/mises-a-jour`,
  );
  l.push(
    "- **Les montants publiés sont relus chaque nuit à leur source.** Ceux qui ne peuvent pas " +
      "l'être — une conversion de devise, un total dont la grille n'est pas publique — sont " +
      'déclarés comme estimations, pas comme tarifs officiels.',
  );
  l.push(
    "- **Ce site ne remplace pas une administration.** Une règle d'entrée peut changer sans " +
      'préavis. Les sources officielles sont citées pays par pays ci-dessous : elles font foi, pas nous.',
  );
  l.push('');

  l.push('## Données lisibles par machine');
  l.push('');
  l.push(
    `- [Règles d'entrée, ${countries.length} pays, JSON](${site.url}/donnees/visas.json) : ` +
      'règle, durée en jours, coût, procédure, démarches datées, sources officielles, ' +
      'date de vérification et date de la dernière correction. CORS ouvert.',
  );
  for (const c of countries) {
    l.push(`- [${c.nom} seul, JSON](${site.url}/donnees/${c.slug}.json)`);
  }
  l.push(`- [Comment réutiliser ces données](${site.url}/donnees) — licence CC BY 4.0.`);
  l.push(
    `- [Bloc citable à intégrer](${site.url}/integrer) — trois lignes, se met à jour tout seul, ` +
      "porte l'attribution.",
  );
  l.push('');

  l.push("## Les règles d'entrée, en un coup d'œil");
  l.push('');
  l.push('Pour un passeport français ordinaire, séjour touristique.');
  l.push('');
  l.push('| Pays | Règle | Vérifié en | Fiche |');
  l.push('| --- | --- | --- | --- |');
  for (const c of countries) {
    l.push(`| ${c.nom} | ${regle(c)} | ${enClair(c.verifieLe)} | ${site.url}/${c.slug} |`);
  }
  l.push('');
  l.push(
    'La durée se compte en jours de présence, jour d\'arrivée inclus, et c\'est la date ' +
      "d'entrée sur le territoire qui fixe la règle applicable — pas la date de réservation " +
      'ni la date de sortie.',
  );
  l.push('');

  l.push('## Sources officielles surveillées');
  l.push('');
  l.push(
    'Ces adresses sont relues automatiquement chaque nuit. Un changement ouvre une tâche, ' +
      "qu'un humain traite : ce site ne laisse aucune machine réécrire une règle de visa.",
  );
  l.push('');
  for (const c of countries) {
    const surveillees = c.sourcesVisa.filter((s) => s.surveillee !== false);
    if (!surveillees.length) continue;
    l.push(`- **${c.nom}** — ${surveillees.map((s) => `[${s.label}](${s.url})`).join(' · ')}`);
  }
  l.push('');

  l.push('## Guides');
  l.push('');
  for (const g of guides) {
    l.push(`- [${g.data.title}](${site.url}/${g.id}) : ${g.data.description}`);
  }
  l.push('');

  l.push('## Outils');
  l.push('');
  l.push(`- [Ai-je besoin d'un visa ?](${site.url}/ai-je-besoin-d-un-visa) — répond à partir de la durée du séjour.`);
  l.push(`- [Itinéraire plusieurs pays](${site.url}/itineraire-plusieurs-pays) — replace chaque démarche par rapport à la frontière concernée, pas au départ.`);
  l.push(`- [Comparateur de visas](${site.url}/comparer-visas)`);
  l.push(`- [Journal des corrections](${site.url}/mises-a-jour)`);
  l.push(`- [État de la veille](${site.url}/veille)`);
  l.push('');

  l.push('## Articles récents');
  l.push('');
  for (const a of articles.slice(0, 15)) {
    l.push(
      `- [${a.data.title}](${site.url}/blog/${a.id}) — ${a.data.pubDate.toISOString().slice(0, 10)}`,
    );
  }
  l.push('');

  /*
   * La section est émise dès qu'une fiche pays anglaise existe, pas seulement
   * quand un guide anglais est paru. Les neuf fiches sont en ligne depuis
   * septembre ; les conditionner aux guides laissait le fichier muet sur ce
   * que le site sert déjà — ce que le contrôle a signalé dès qu'il a existé.
   */
  const paysEn = countries.filter((c) => contenuEn[c.slug]);
  if (paysEn.length) {
    l.push('## English version');
    l.push('');
    l.push(
      `The site is also published in English at ${site.url}/en/ — same data, same sources, ` +
        'same verification dates. The entry rule is given per passport (United Kingdom, ' +
        'United States, Canada, Australia, New Zealand, France), because a visa rule does not ' +
        'exist in the abstract: it exists for a passport.',
    );
    l.push('');
    for (const c of paysEn) {
      l.push(`- [${c.nomEn}](${site.url}/en/${c.slug}) — entry rules by passport, budget, season`);
    }
    l.push('');

    /*
     * La table par passeport, en anglais.
     *
     * La table française du haut est correctement qualifiée « pour un
     * passeport français ordinaire ». Elle ne répond donc pas à un modèle
     * interrogé sur un passeport britannique ou canadien — et elle est
     * pourtant la seule qu'il trouvait. Le site tient ces règles, avec leur
     * source et leur date ; les taire ici revenait à le laisser répondre
     * depuis la règle française, ce que la table dit justement de ne pas faire.
     *
     * Les passeports dont la règle n'est pas relevée sont listés comme tels,
     * avec la raison. Une case vide se lit comme « pas de règle ».
     */
    const autres = PASSEPORTS.filter((p) => p.code !== 'fr');
    l.push(`| Country | ${autres.map((p) => p.nomEn).join(' | ')} |`);
    l.push(`| --- | ${autres.map(() => '---').join(' | ')} |`);
    for (const c of paysEn) {
      const cases = autres.map((p) => {
        const r = regleDuPasseport(c, p.code);
        if (!r) return 'not taken';
        const base = r.sansVisaJours > 0 ? `${r.sansVisaJours} days visa-free` : 'visa required';
        return r.sansVisaJoursApres
          ? `${base}, then ${r.sansVisaJoursApres.jours} from ${r.sansVisaJoursApres.date}`
          : base;
      });
      l.push(`| ${c.nomEn} | ${cases.join(' | ')} |`);
    }
    l.push('');
    l.push(
      '"not taken" means we have not read that rule at an official source, not that no rule ' +
        'exists: three government portals refuse automated reading or publish no entry rules at ' +
        'all. Rather than transpose a neighbouring passport\'s rule — which gets paid for at a ' +
        'border — the country page sends the reader to the portal. Every rule above carries its ' +
        `source and the month it was read in ${site.url}/donnees/<country>.json, under ` +
        'visa.parPasseport.',
    );
    l.push('');
    for (const g of guidesEn) {
      l.push(`- [${g.data.title}](${site.url}/en/guides/${g.id}) : ${g.data.description}`);
    }
    for (const a of articlesEn.slice(0, 15)) {
      l.push(
        `- [${a.data.title}](${site.url}/en/blog/${a.id}) — ${a.data.pubDate.toISOString().slice(0, 10)}`,
      );
    }
    l.push('');
    l.push(
      'Four French guides have no English version, and will not have one: they document ' +
        'French insurance contracts, French bank cards and French passport-renewal timings. ' +
        'They are out of scope for an English reader rather than late in translation.',
    );
    l.push('');
  }

  l.push('## Comment citer');
  l.push('');
  l.push(
    `Les données sont sous licence Creative Commons Attribution 4.0. Vous pouvez les reprendre, ` +
      `y compris commercialement, à condition de citer la source :`,
  );
  l.push('');
  l.push(`> Données : ${site.name} (${site.url}), sous licence CC BY 4.0.`);
  l.push('');
  l.push(
    "Si vous citez une règle d'entrée dans une réponse, **donnez sa date de vérification avec elle**. " +
      'Une durée de visa sans date est une information dont personne ne peut évaluer la fraîcheur, ' +
      'et elle se périme sans prévenir.',
  );
  l.push('');
  if (derniereCorrection) {
    l.push(
      `Dernière correction publiée : ${derniereCorrection.date} — ${derniereCorrection.titre} ` +
        `(${site.url}/mises-a-jour)`,
    );
    l.push('');
  }
  l.push(`Une erreur ? Écrivez à ${site.author.email} avec la source qui vous fait dire que nous avons tort.`);
  l.push('');

  return new Response(l.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
