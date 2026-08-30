import sharp from 'sharp';

/**
 * Le traitement d'homogénéité.
 *
 * C'est la pièce qui décide de tout. Vingt photographes différents ne donneront
 * jamais un site cohérent, quelle que soit la banque d'images : l'un shoote au
 * soleil de midi, l'autre sous un ciel couvert, un troisième pousse la
 * saturation. Mis côte à côte, ça ressemble à un moodboard, pas à une publication.
 *
 * Une première version appliquait une désaturation légère et un voile crème à
 * 6 %. À l'œil, l'avant et l'après étaient indiscernables — un traitement
 * invisible ne fabrique aucune identité. Celui-ci assume donc un parti pris.
 *
 * Le cœur est un virage partagé, obtenu en appliquant une pente et un décalage
 * différents à chaque canal. Une pente forte avec un décalage négatif pousse la
 * couleur dans les hautes lumières et la retire des ombres ; l'inverse la
 * réserve aux ombres. On obtient ainsi, en une opération :
 *
 *   · des hautes lumières qui tirent vers le crème du site,
 *   · des ombres qui tirent vers son sarcelle,
 *
 * c'est-à-dire la palette du site imprimée dans chaque photographie. C'est ce
 * qui fait qu'une image prise à Kyoto et une autre à Luang Prabang finissent
 * par appartenir à la même publication.
 */

/** Rapports de recadrage, calés sur les hauteurs des conteneurs. */
const RAPPORTS = { hero: 2 / 1, bande: 3 / 1 };

/** Largeur conservée. Astro produit ensuite les variantes 640 à 1920. */
const LARGEUR = 2400;

export const REGLAGES = {
  /** En dessous de 0,80 les verts d'Asie deviennent ternes. */
  saturation: 0.85,

  /**
   * Virage partagé. Pente et décalage par canal, dans l'ordre R, G, B.
   * Le rouge et le vert montent en pente avec un décalage négatif : ils
   * dominent les hautes lumières, d'où le crème. Le bleu garde une pente
   * faible avec un décalage positif : il ne survit que dans les ombres,
   * d'où le sarcelle. L'écart entre les deux fait tout le travail.
   *
   * Les décalages ont été adoucis après examen : à -10, les façades de bois
   * de Kyoto perdaient leur grain dans le noir. Des ombres bouchées sont la
   * signature d'un traitement fait à l'aveugle.
   */
  pentes: [1.10, 1.07, 1.00],
  decalages: [-7, -3, 5],

  /** Assez pour lier les textures d'un capteur de 2010 et d'un de 2024. */
  grain: 0.07,
};

/**
 * @param {Buffer|string} entree  fichier ou tampon d'origine
 * @param {'hero'|'bande'} variante
 */
export async function traiter(entree, variante = 'hero') {
  const rapport = RAPPORTS[variante] ?? RAPPORTS.hero;
  const largeur = LARGEUR;
  const hauteur = Math.round(largeur / rapport);

  // `attention` place le recadrage sur la zone la plus chargée plutôt qu'au
  // centre : sur un paysage cadré haut, un recadrage centré couperait le sujet
  // pour garder le ciel.
  const base = sharp(entree, { failOn: 'none' })
    .rotate()
    .resize(largeur, hauteur, { fit: 'cover', position: sharp.strategy.attention });

  const grain = {
    create: {
      width: largeur, height: hauteur, channels: 3,
      noise: { type: 'gaussian', mean: 128, sigma: 20 },
    },
  };

  const buffer = await base
    .modulate({ saturation: REGLAGES.saturation })
    .linear(REGLAGES.pentes, REGLAGES.decalages)
    .composite([
      { input: await sharp(grain).png().toBuffer(), blend: 'overlay', opacity: REGLAGES.grain },
    ])
    // Qualité haute : ce fichier est la source d'Astro, qui en tirera l'AVIF et
    // le WebP réellement servis. Économiser ici dégraderait deux fois.
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toBuffer();

  return { buffer, largeur, hauteur };
}
