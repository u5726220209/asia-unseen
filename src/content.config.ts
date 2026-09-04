import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const seo = {
  title: z.string().max(70, 'Le title dépasse 70 caractères : il sera tronqué dans Google.'),
  description: z.string().min(80).max(170),
  /** Titre affiché en H1, si différent du <title> optimisé pour le SERP. */
  heading: z.string().optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  draft: z.boolean().default(false),

  /**
   * Article rédigé automatiquement, sans relecture humaine avant publication.
   *
   * Ce n'est pas un détail technique : c'est une information que le lecteur a
   * le droit d'avoir pour juger de ce qu'il lit. Le drapeau déclenche une
   * mention visible en tête d'article. Un site qui affiche d'où viennent ses
   * liens partenaires et ses photographies ne va pas taire qui écrit ses textes.
   */
  redactionAutomatique: z.boolean().default(false),
};

const guides = defineCollection({
  loader: glob({ base: './src/content/guides', pattern: '**/*.md' }),
  schema: z.object({
    ...seo,
    /** Ordre d'affichage dans le hub /ressources et la navigation. */
    ordre: z.number().default(50),
    /** Résumé d'une phrase, affiché dans les listes et les cartes. */
    accroche: z.string(),
    /** Outil interactif injecté après l'introduction, le cas échéant. */
    outil: z.enum(['budget', 'saison', 'checklist', 'assurance', 'visas']).optional(),
    /** Questions-réponses balisées en FAQPage pour les extraits enrichis. */
    faq: z.array(z.object({ q: z.string(), r: z.string() })).default([]),
    /** Sources officielles citées en bas de page (E-E-A-T). */
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    /**
     * Nature de la page, et ce qu'elle engage.
     *
     * Huit guides sur onze ne citaient aucune source, sur un site dont la page
     * d'accueil promet que « les sources sont citées et cliquables ». En allant
     * les sourcer, une distinction s'est imposée : certains guides reposent sur
     * des faits externes vérifiables — une durée de train, un tarif d'opérateur,
     * une commission bancaire — et leur absence de source était une lacune.
     * D'autres sont des conseils : comment choisir un quartier, dans quel ordre
     * enchaîner des étapes, quelle activité vaut son prix. Leur coller une
     * source officielle n'aurait rien prouvé — elle n'aurait étayé aucune des
     * phrases de la page. C'est la décoration de la preuve, pas la preuve.
     *
     * `editorial` dit donc ce qu'il en est, et le bandeau de vérification le
     * répète au lecteur. Mieux vaut assumer un jugement que déguiser un
     * jugement en fait sourcé.
     */
    nature: z.enum(['factuel', 'editorial']).default('factuel'),
    /** Pays concernés — génère les liens croisés automatiques. */
    pays: z.array(z.string()).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    ...seo,
    accroche: z.string(),
    categorie: z.enum(['recit', 'pratique', 'itineraire', 'argent']).default('pratique'),
    pays: z.array(z.string()).default([]),
    tempsLecture: z.number().optional(),
    faq: z.array(z.object({ q: z.string(), r: z.string() })).default([]),
    /**
     * Sources primaires citées. Affichées en bas d'article dans le bandeau de
     * fraîcheur : c'est ce qui rend un fait citable par un moteur génératif
     * plutôt que paraphrasable.
     */
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  }),
});

export const collections = { guides, blog };
