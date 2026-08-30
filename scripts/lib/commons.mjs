/**
 * Interrogation de Wikimedia Commons, et tri de ce qui est publiable.
 *
 * Mutualisé entre l'import (`scripts/commons.mjs`) et la planche de contact
 * (`scripts/planche.mjs`) : les deux doivent appliquer exactement les mêmes
 * règles, sinon on choisit sur une planche une image que l'import refusera.
 */

export const UA = 'AsiaUnseen/1.0 (https://asiaunseen.com; contact@racinesvietnam.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/**
 * Licences retenues : domaine public et CC BY. On cite l'auteur, ce que le site
 * fait déjà pour ses sources.
 *
 * CC BY-SA est exclu à dessein. Sa clause de partage à l'identique se propage
 * aux œuvres dérivées, et notre traitement d'homogénéité en est une. On ne va
 * pas placer le site sous licence libre pour une photographie.
 */
const LICENCES_OK = [
  /^cc0/i, /^public domain/i, /^cc by 4\.0/i, /^cc by 3\.0/i, /^cc by 2\.5/i,
  /^cc by 2\.0/i, /^cc by 1\.0/i, /^attribution$/i,
];

const RESOLUTION_MINIMALE = 1600;
/** Recadrer un portrait en 2:1 jette les trois quarts du cadre. */
const RAPPORT_MINIMAL = 1.2;

export const sansBalises = (s) =>
  (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export async function chercher(requete, limite = 30) {
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query', format: 'json',
    generator: 'search', gsrnamespace: '6', gsrlimit: String(limite),
    gsrsearch: `${requete} filetype:bitmap`,
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|user', iiurlwidth: '480',
  }).toString();

  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  const pages = Object.values((await r.json())?.query?.pages ?? {});

  const retenues = [];
  const ecartes = [];

  for (const p of pages) {
    const info = p.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const val = (k) => sansBalises(meta[k]?.value);

    const licence = val('LicenseShortName') || '—';
    const restrictions = val('Restrictions');
    const fiche = {
      titre: p.title.replace(/^File:/, ''),
      largeur: info.width, hauteur: info.height,
      url: info.url, vignette: info.thumburl,
      page: info.descriptionurl,
      auteur: val('Artist') || info.user || 'auteur non renseigné',
      licence, licenceUrl: val('LicenseUrl'),
      description: val('ImageDescription').slice(0, 120),
    };

    if (/personality/i.test(restrictions)) { ecartes.push({ ...fiche, motif: 'personne identifiable' }); continue; }
    if (/trademark/i.test(restrictions))   { ecartes.push({ ...fiche, motif: 'marque déposée visible' }); continue; }
    if (!LICENCES_OK.some((r) => r.test(licence))) { ecartes.push({ ...fiche, motif: `licence « ${licence} »` }); continue; }
    if (info.width < RESOLUTION_MINIMALE) { ecartes.push({ ...fiche, motif: `${info.width} px, trop peu` }); continue; }
    if (info.width / info.height < RAPPORT_MINIMAL) { ecartes.push({ ...fiche, motif: 'cadrage vertical' }); continue; }

    retenues.push(fiche);
  }

  return { retenues, ecartes, total: pages.length };
}

/**
 * Saturation moyenne réelle, mesurée pixel par pixel.
 *
 * Une première version comparait les moyennes des trois canaux sur l'image
 * entière. C'était faux, et dangereusement : sur une photo d'Angkor, le ciel
 * bleu et la pierre ocre s'annulent, les trois moyennes se rejoignent, et
 * l'image est déclarée monochrome. Deux photographies parfaitement colorées
 * ont ainsi été rejetées.
 *
 * On mesure donc l'écart entre le canal le plus fort et le plus faible de
 * chaque pixel, puis on en prend la moyenne — ce qui est la définition même de
 * la saturation. Le calcul se fait sur une vignette de 160 px : c'est
 * instantané, et une image en noir et blanc l'est à toutes les échelles.
 */
export async function saturationMoyenne(entree) {
  const { default: sharp } = await import('sharp');
  const { data, info } = await sharp(entree, { failOn: 'none' })
    .resize(160, 160, { fit: 'inside' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) return 0;
  let somme = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    somme += Math.max(r, g, b) - Math.min(r, g, b);
  }
  const pixels = data.length / info.channels;
  return Math.round((somme / pixels) * 10) / 10;
}
