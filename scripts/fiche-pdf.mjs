#!/usr/bin/env node
/**
 * La fiche de départ, en PDF.
 *
 *   npm run fiche
 *
 * C'est le produit que le site offre contre une adresse. Il fallait qu'il
 * réponde à une question simple : qu'est-ce qu'on veut avoir sous la main dans
 * un pays d'Asie, quand le réseau ne passe pas et qu'il faut décider vite ?
 *
 * Trois choses : à qui téléphoner, ce qu'on a le droit de faire (le visa), et
 * ce que ça coûte. Rien d'autre. Une fiche qui tiendrait à tout dire ne serait
 * plus consultée dans l'urgence, et c'est là qu'elle sert.
 *
 * Elle est engendrée depuis `src/data/countries.ts`, c'est-à-dire depuis les
 * mêmes données que le site — celles que la sentinelle relit chaque matin.
 * C'est ce qui permet la promesse faite aux abonnés : quand une règle change,
 * la fiche est rééditée. Aucun document rédigé à la main ne peut tenir ça.
 */

import { mkdirSync, createWriteStream, readFileSync } from 'node:fs';
import PDFDocument from 'pdfkit';

/* ── Les données ─────────────────────────────────────────────────── */

/**
 * On importe le module, on ne le lit pas au chalumeau.
 *
 * La première version extrayait les champs de `countries.ts` par expressions
 * régulières. Elle a produit une fiche où la règle de visa du Vietnam
 * s'affichait « delà. » — la fin d'une phrase coupée sur une apostrophe. Une
 * fiche fausse est pire qu'une fiche absente : celle-ci est faite pour être
 * consultée dans l'urgence, quand personne ne vérifiera.
 *
 * Node exécute le TypeScript directement depuis la version 22. Le générateur
 * lit donc exactement les mêmes données que le site.
 */
const { countries } = await import('../src/data/countries.ts');
const pays = countries;

/* ── Mise en page ────────────────────────────────────────────────── */

// Helvetica n'encode que le Latin-1. Trois signes de nos données en sortent,
// tous remplaçables sans rien perdre du sens. Embarquer une police pour eux
// coûterait un mégaoctet par fiche.
/**
 * Raccourcir seulement ce qui dépasse.
 *
 * Une première version coupait à la première phrase. Elle produisait des
 * fiches où le coût du visa vietnamien devenait « Gratuit sous exemption ; »,
 * en perdant le prix de l'e-visa — c'est-à-dire l'information qu'on vient
 * chercher. Couper court n'est utile que si l'on garde ce qui compte.
 *
 * On garde donc tout ce qui tient en deux lignes, et on ne tronque, au mot
 * près, que le reste. Le site porte le détail complet.
 */
// 68 caractères : ce qui tient sur une ligne de la fiche. Au-delà, le texte
// était coupé net par la boîte, sans même des points de suspension pour
// signaler qu'il manquait quelque chose — le pire des deux mondes.
const phrase = (t, max = 68) => {
  const p = (t ?? '').trim();
  if (p.length <= max) return p;
  const court = p.slice(0, max).replace(/[\s,;.]+\S*$/, '');
  return `${court}…`;
};

const latin1 = (s) => (s ?? '')
  .replace(/≈/g, 'env.')
  .replace(/[—–]/g, '-')
  .replace(/[’]/g, "'")
  .replace(/[“”]/g, '"');

const ENCRE = '#0A0A0A';
const SARCELLE = '#0F766E';
const AMBRE = '#F59E0B';
const GRIS = '#6B7280';
const CREME = '#F5F3EF';

const doc = new PDFDocument({
  size: 'A4', margin: 46, bufferPages: true,
  info: {
    Title: 'Asia Unseen - Fiches de depart',
    Author: 'Asia Unseen',
    Subject: "Visa, numeros d'urgence et budget pour neuf pays d'Asie",
  },
});

mkdirSync('public/telechargements', { recursive: true });
doc.pipe(createWriteStream('public/telechargements/fiches-depart-asie.pdf'));

const L = doc.page.width - 92;   // largeur utile
const aujourdhui = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** « 2026-08 » ne se lit pas sur un document qu'on consulte dans l'urgence. */
const moisEnClair = (v) => {
  const [a, m] = String(v).split('-');
  const noms = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return m ? `${noms[Number(m) - 1]} ${a}` : v;
};

/* ── Couverture ──────────────────────────────────────────────────── */

doc.rect(0, 0, doc.page.width, doc.page.height).fill(ENCRE);
doc.fillColor(CREME).font('Helvetica-Bold').fontSize(11).text('ASIA UNSEEN', 46, 60, { characterSpacing: 2 });
doc.fillColor(AMBRE).fontSize(11).text('asiaunseen.com', 46, 76, { characterSpacing: 1 });

doc.fillColor(CREME).font('Helvetica-Bold').fontSize(38).text('Les fiches\nde départ', 46, 200, { lineGap: 6 });
doc.fillColor('#B9BEC5').font('Helvetica').fontSize(12).text(
  "Neuf pays d'Asie. Pour chacun : à qui téléphoner en cas d'urgence,\n" +
  "ce que dit la règle de visa, et ce que coûte une journée sur place.",
  46, 320, { width: L, lineGap: 4 },
);

doc.fillColor(AMBRE).font('Helvetica-Bold').fontSize(10).text('CE QUE CE DOCUMENT N\'EST PAS', 46, 420, { characterSpacing: 1 });
doc.fillColor('#B9BEC5').font('Helvetica').fontSize(11).text(
  "Un guide. Il ne raconte rien, il ne conseille pas d'hôtel. Il tient dans une\n" +
  "page par pays parce qu'on le consulte debout, avec 8 % de batterie.",
  46, 440, { width: L, lineGap: 4 },
);

doc.fillColor(CREME).font('Helvetica-Bold').fontSize(10).text('CHAQUE CHIFFRE A UNE SOURCE ET UNE DATE', 46, 520, { characterSpacing: 1 });
doc.fillColor('#B9BEC5').font('Helvetica').fontSize(11).text(
  "Les règles de visa changent, et elles changent souvent. Celles-ci ont été\n" +
  "relevées aux portails officiels des États concernés et à France Diplomatie.\n" +
  "Le site les revérifie chaque matin, et republie ce document quand une règle bouge.",
  46, 540, { width: L, lineGap: 4 },
);

doc.fillColor(GRIS).fontSize(9).text(`Édition du ${aujourdhui}`, 46, doc.page.height - 78);
doc.fillColor(GRIS).fontSize(9).text(
  "Vérifiez toujours la règle à la source avant de réserver : ce document informe, il n'engage pas.",
  46, doc.page.height - 62, { width: L },
);

/* ── Une page par pays ───────────────────────────────────────────── */

for (const p of pays) {
  doc.addPage();

  // Bandeau de titre
  doc.rect(0, 0, doc.page.width, 96).fill(ENCRE);
  doc.fillColor(CREME).font('Helvetica-Bold').fontSize(26).text(latin1(p.nom), 46, 32);
  doc.fillColor(AMBRE).font('Helvetica').fontSize(9).text(
    latin1(`${p.monnaie}  ·  ${p.volDepuisParis}`), 46, 66, { characterSpacing: 0.5 },
  );

  let y = 128;

  const titre = (t) => {
    doc.fillColor(SARCELLE).font('Helvetica-Bold').fontSize(9).text(t.toUpperCase(), 46, y, { characterSpacing: 1.4 });
    y += 18;
  };
  /**
   * `height` et `ellipsis` sont ce qui garantit la fiche d'une page.
   *
   * Sans eux, pdfkit ajoute une page dès qu'un texte dépasse le bas — et la
   * première version produisait ainsi vingt-huit pages au lieu de dix, chaque
   * pays débordant sur le suivant. Une fiche doit tenir sur une page ou couper :
   * elle ne doit jamais continuer ailleurs.
   */
  const ligne = (gauche, droite) => {
    const texte = latin1(droite);
    const hauteur = Math.min(doc.heightOfString(texte, { width: L - 140 }), 32);
    doc.fillColor(GRIS).font('Helvetica').fontSize(10)
      .text(latin1(gauche), 46, y, { width: 130, height: 14, ellipsis: true, lineBreak: false });
    doc.fillColor(ENCRE).font('Helvetica-Bold').fontSize(10)
      .text(texte, 186, y, { width: L - 140, height: hauteur, ellipsis: true });
    y += Math.max(hauteur, 13) + 7;
  };

  /* Urgences en premier : c'est ce qu'on cherche quand on ouvre ce document
     dans la panique, et le mettre en bas serait une faute de conception. */
  titre('En cas d\'urgence');
  for (const n of p.urgences.numeros) ligne(n.label, n.numero);
  y += 4;

  titre('Ambassade de France');
  ligne('Ville', p.urgences.ambassade.ville);
  if (p.urgences.ambassade.adresse) ligne('Adresse', phrase(p.urgences.ambassade.adresse, 90));
  ligne('Téléphone', p.urgences.ambassade.telephone);
  y += 4;

  titre('Entrée sur le territoire');
  ligne('Règle', phrase(p.visa.resume));
  ligne('Durée', phrase(p.visa.duree));
  ligne('Coût', phrase(p.visa.cout));
  y += 4;

  titre('Budget par jour, hors vol');
  ligne('Routard', `${p.budget.routard} EUR`);
  ligne('Confort', `${p.budget.confort} EUR`);
  ligne('Confortable +', `${p.budget.premium} EUR`);

  /*
    Pied de page. La date de relevé est ce qui rend la fiche vérifiable, donc
    il ne peut pas sauter.

    Il était placé sous la marge basse : pdfkit ajoutait alors une page pour
    l'accueillir, et chaque pays en produisait trois au lieu d'une. Il tient
    maintenant dans la zone de contenu, avec une hauteur bornée — comme tout
    le reste de cette fiche, rien ne doit pouvoir déborder.
  */
  const bas = doc.page.height - 96;
  doc.moveTo(46, bas).lineTo(doc.page.width - 46, bas).lineWidth(0.5).stroke('#E5E7EB');
  doc.fillColor(GRIS).font('Helvetica').fontSize(8).text(
    latin1(`Données relevées en ${moisEnClair(p.verifieLe)} aux sources officielles. La règle peut changer : vérifiez avant de réserver.`),
    46, bas + 9, { width: L, height: 22, ellipsis: true },
  );
  doc.fillColor(GRIS).fontSize(8).text(
    `asiaunseen.com/fiche/${p.slug}`, 46, bas + 32, { width: L, height: 12, ellipsis: true },
  );
}

/**
 * Dix pages : une couverture et neuf pays. Tout autre nombre signifie qu'un
 * texte a débordé et qu'une page s'est ajoutée en silence — le défaut exact
 * qui avait produit vingt-huit pages. On le transforme en échec de génération.
 */
const attendues = pays.length + 1;
const obtenues = doc.bufferedPageRange().count;
if (obtenues !== attendues) {
  console.error(`Mise en page rompue : ${obtenues} pages au lieu de ${attendues}.`);
  console.error('Un contenu a débordé. La fiche n\'est pas publiée.');
  process.exit(1);
}

doc.end();
console.log(`Fiches de départ : ${pays.length} pays, ${obtenues} pages, public/telechargements/fiches-depart-asie.pdf`);
