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
 *
 * Un grain fin complétait l'ensemble. Il a été retiré après mesure : il coûtait
 * 115 Ko par image, soit un tiers du poids servi, en défaisant la compression —
 * du bruit ne se compresse pas. Pour un apport que le virage partagé produit
 * déjà, c'était payer la vitesse du site, qui compte pour le classement, contre
 * un effet que personne ne remarque.
 */

/**
 * Rapports de recadrage, calés sur ce que le conteneur montre réellement.
 *
 * Le bandeau d'en-tête fait 416 px de haut sur toute la largeur : à 1280 px,
 * c'est un rapport de 3,1 pour 1. Produire du 2:1 fabriquait donc la moitié de
 * pixels que `object-cover` découpait sans que personne les voie jamais — payés
 * au transfert, invisibles à l'écran. On reste un peu plus haut que le
 * conteneur pour garder de la marge sur les écrans étroits, où la bande est
 * proportionnellement plus haute.
 */
const RAPPORTS = { hero: 2.4 / 1, bande: 3.4 / 1 };

/**
 * Largeur conservée.
 *
 * Elle vaut exactement la plus grande variante servie par Astro. Garder du
 * 2400 px « au cas où » avait un coût invisible : Astro recopie l'original
 * dans le site publié, référencé par personne — dix-sept mégaoctets partaient
 * à chaque déploiement pour rien. Une source plus large que ce qu'on affiche
 * n'améliore aucune image.
 */
const LARGEUR = 1920;

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

  const buffer = await base
    .modulate({ saturation: REGLAGES.saturation })
    .linear(REGLAGES.pentes, REGLAGES.decalages)
    // Qualité haute, mais pas absurde : ce fichier est la source d'Astro, qui
    // en tirera le WebP réellement servi. Trop économiser ici dégraderait deux
    // fois ; trop dépenser alourdit un fichier que personne ne télécharge.
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:2:0' })
    .toBuffer();

  return { buffer, largeur, hauteur };
}
