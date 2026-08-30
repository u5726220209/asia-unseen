/**
 * Registre des photographies.
 *
 * Une photo n'est publiée que si elle est déclarée ici. Le fichier seul ne
 * suffit pas : sans texte alternatif ni crédit, une image n'a rien à faire
 * en ligne — ni pour l'accessibilité, ni pour le référencement, ni pour le
 * respect de l'auteur.
 *
 * Le site fonctionne parfaitement avec ce tableau vide : chaque emplacement
 * retombe alors sur une illustration « Horizons ». Ajouter des photos est une
 * amélioration progressive, jamais un prérequis.
 *
 * Mode d'emploi complet : PHOTOS.md à la racine.
 */

export type Photo = {
  /** Chemin du fichier, relatif à src/photos/ — ex. « vietnam/hanoi-rue-matin.jpg ». */
  fichier: string;

  /**
   * Texte alternatif. Décrit ce que l'on voit, pas ce que l'on ressent :
   * « une marchande verse du bouillon dans un bol, rue Hang Bo à Hanoï »,
   * pas « l'authenticité du Vietnam ». Sans point final, 125 caractères max.
   */
  alt: string;

  /** Légende visible sous l'image. Optionnelle — n'en mettez que si elle apprend quelque chose. */
  legende?: string;

  /**
   * Crédit. Unsplash et Pexels ne l'imposent pas ; Wikimedia Commons si, et
   * c'est tant mieux — un site qui affiche sa transparence sur les liens
   * partenaires ne va pas taire d'où viennent ses images.
   */
  credit?: {
    auteur: string;
    source: 'Unsplash' | 'Pexels' | 'Personnel' | string;
    url?: string;
  };

  /**
   * Licence, telle qu'elle est écrite sur la page d'origine. Elle n'est pas
   * décorative : c'est ce qui rend la publication légale, et elle peut changer
   * — un contributeur reverse une image, un fichier est supprimé. D'où la date
   * de relevé, contrôlée comme le sont les tarifs cités dans les comparatifs.
   */
  licence?: { nom: string; url?: string };

  /** Page d'origine, où la licence peut être revérifiée. */
  origine?: string;

  /** Date à laquelle la licence a été constatée, au format AAAA-MM-JJ. */
  releveLe?: string;

  /** Pages où la photo s'affiche — chemins exacts, ex. « /vietnam », « /blog/ha-giang-moto-4-jours ». */
  pages: string[];

  /** Emplacement : sous l'en-tête, ou en respiration au milieu de la page. */
  position: 'hero' | 'bande';
};

export const photos: Photo[] = [
  /*
   * Les neuf pages pays.
   *
   * Toutes viennent de Wikimedia Commons, en CC BY ou CC0, et toutes ont été
   * regardées une par une avant d'être déclarées — le drapeau « personne
   * identifiable » de Commons est saisi par les contributeurs, donc incomplet.
   * Trois images ont été écartées à ce contrôle, dont deux que Commons n'avait
   * pas signalées.
   *
   * Les sujets ont été choisis pour ne pas se répéter : une vieille ville, des
   * falaises marines, un village de montagne, une skyline, une cascade, des
   * ruines, une rue urbaine, des rizières, une baie. Neuf photographies de
   * paysages identiques auraient été homogènes, et illisibles.
   *
   * Pas de légendes : une phrase sous une image est une affirmation comme une
   * autre, et ce site ne publie pas d'affirmation sans source. Le texte
   * alternatif décrit ce que l'on voit, et rien de plus.
   */
  {
    fichier: 'vietnam/hoi-an-vieille-ville.jpg',
    alt: "façades jaunes à volets de bois dans la vieille ville de Hội An, motos garées le long de la rue",
    credit: { auteur: 'David McKelvey', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Hoi_An_Ancient_Town,_Vietnam_(7090606593).jpg' },
    licence: { nom: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Hoi_An_Ancient_Town,_Vietnam_(7090606593).jpg',
    releveLe: '2026-08-30',
    pages: ['/vietnam'],
    position: 'hero',
  },
  {
    fichier: 'thailande/railay-krabi.jpg',
    alt: "falaises calcaires couvertes de végétation plongeant dans la mer, à Railay, province de Krabi",
    credit: { auteur: 'Wendy Harman', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Railay.jpg' },
    licence: { nom: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Railay.jpg',
    releveLe: '2026-08-30',
    pages: ['/thailande'],
    position: 'hero',
  },
  {
    fichier: 'japon/shirakawa-go.jpg',
    alt: "maisons aux toits de chaume et rizières jaunies du village de Shirakawa-gō, vues de hauteur",
    credit: { auteur: '663highland', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Ogi_Shirakawa-g%C5%8D,_Gifu,_Japan.jpg' },
    licence: { nom: 'CC BY 2.5', url: 'https://creativecommons.org/licenses/by/2.5' },
    origine: 'https://commons.wikimedia.org/wiki/File:Ogi_Shirakawa-g%C5%8D,_Gifu,_Japan.jpg',
    releveLe: '2026-08-30',
    pages: ['/japon'],
    position: 'hero',
  },
  {
    fichier: 'chine/shanghai-pudong.jpg',
    alt: "les tours de Pudong vues depuis la rive du Huangpu, à Shanghai",
    credit: { auteur: 'Carl Lovén', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Shanghai_Skyline_2009.jpg' },
    licence: { nom: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Shanghai_Skyline_2009.jpg',
    releveLe: '2026-08-30',
    pages: ['/chine'],
    position: 'hero',
  },
  {
    fichier: 'laos/kuang-si.jpg',
    alt: "eau turquoise et cascades en gradins de Kuang Si, au milieu de la forêt",
    credit: { auteur: 'Visions of Domino', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Kuang_Si_Waterfall_(23756198879).jpg' },
    licence: { nom: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Kuang_Si_Waterfall_(23756198879).jpg',
    releveLe: '2026-08-30',
    pages: ['/laos'],
    position: 'hero',
  },
  {
    fichier: 'cambodge/angkor-thom.jpg',
    // Le crédit ne reprend que le nom : la page Commons y ajoute un paragraphe
    // de conditions d'usage, qui n'a pas sa place sous une photographie.
    alt: "tour à visages de pierre d'une porte d'Angkor Thom, encadrée par les arbres",
    credit: { auteur: 'Supanut Arunoprayote', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Angkor_Thom_(I).jpg' },
    licence: { nom: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Angkor_Thom_(I).jpg',
    releveLe: '2026-08-30',
    pages: ['/cambodge'],
    position: 'hero',
  },
  {
    fichier: 'coree-du-sud/bukchon.jpg',
    alt: "ruelle de maisons traditionnelles de Bukchon, les tours de Séoul en arrière-plan",
    credit: { auteur: 'Bgag', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Bukchon_Hanok_Village_01.jpg' },
    licence: { nom: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
    origine: 'https://commons.wikimedia.org/wiki/File:Bukchon_Hanok_Village_01.jpg',
    releveLe: '2026-08-30',
    pages: ['/coree-du-sud'],
    position: 'hero',
  },
  {
    fichier: 'indonesie/tegallalang.jpg',
    alt: "rizières en terrasses et palmiers de Tegallalang, à Bali",
    credit: { auteur: 'Philip Nalangan', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:Tegallalang_Rice_Terraces_Bali_1.jpg' },
    licence: { nom: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:Tegallalang_Rice_Terraces_Bali_1.jpg',
    releveLe: '2026-08-30',
    pages: ['/indonesie'],
    position: 'hero',
  },
  {
    fichier: 'philippines/el-nido.jpg',
    alt: "baie d'El Nido, à Palawan, bordée de falaises boisées, bateaux au mouillage",
    credit: { auteur: 'Philippine Fly Boy', source: 'Wikimedia Commons', url: 'https://commons.wikimedia.org/wiki/File:El_Nido_Palawan_2.jpg' },
    licence: { nom: 'CC BY 2.0', url: 'https://creativecommons.org/licenses/by/2.0' },
    origine: 'https://commons.wikimedia.org/wiki/File:El_Nido_Palawan_2.jpg',
    releveLe: '2026-08-30',
    pages: ['/philippines'],
    position: 'hero',
  },
];

/** Photo déclarée pour une page et un emplacement donnés, s'il y en a une. */
export function photoPour(page: string, position: 'hero' | 'bande'): Photo | undefined {
  const cible = page.replace(/\/$/, '') || '/';
  return photos.find((p) => p.position === position && p.pages.some((x) => (x.replace(/\/$/, '') || '/') === cible));
}

/** Nombre de pages couvertes par au moins une photo — repris par le script de contrôle. */
export const pagesAvecPhoto = new Set(photos.flatMap((p) => p.pages)).size;
