#!/usr/bin/env node
/**
 * Audit mécanique du site compilé.
 *
 * Titres et descriptions dans les bornes affichées par Google, canoniques,
 * un seul h1 par page, images décrites, balisage présent, doublons. Rien qui
 * demande du jugement : uniquement ce qu'une machine sait mesurer, et ce qui
 * casse silencieusement quand on ajoute des pages.
 *
 * Sort en code 1 si un défaut est trouvé, pour bloquer une mise en ligne.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const pages = [];
(function walk(d){ for (const e of readdirSync(d)) { const p = join(d,e); const s = statSync(p);
  if (s.isDirectory()) walk(p); else if (e === 'index.html' || e === '404.html') pages.push({p, size:s.size}); } })(DIST);

const dec = (s) => s === null ? null : s.replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const get = (h, re) => { const m = h.match(re); return m ? dec(m[1]) : null; };
const rows = [];
for (const {p, size} of pages) {
  const h = readFileSync(p, 'utf8');
  const url = '/' + p.replace(/^dist\/?/,'').replace(/index\.html$/,'').replace(/\/$/,'');
  rows.push({
    url: url === '' ? '/' : url,
    size,
    title: get(h, /<title>([^<]*)<\/title>/),
    desc: get(h, /<meta name="description" content="([^"]*)"/),
    canonical: get(h, /<link rel="canonical" href="([^"]*)"/),
    h1: (h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/g)||[]).length,
    og: /property="og:image"/.test(h),
    ogSrc: get(h, /property="og:image" content="([^"]*)"/),
    /**
     * Un tableau qui n'a pas de conteneur qui défile.
     *
     * Les tableaux sont ce que ce site a de plus utile, et la seule chose dont
     * la largeur ne dépend pas du lecteur. 544 px dans une colonne de 330 ne
     * rétrécissent pas : ils poussent la page, et le texte sort du cadre à
     * chaque paragraphe. Le défaut ne se voit sur aucun écran d'ordinateur —
     * c'est pour cela que trente-cinq tableaux l'ont eu pendant des mois,
     * pendant que la classe CSS écrite pour les envelopper n'était appliquée
     * nulle part.
     */
    tablesNues: (h.match(/<table\b/g) || []).length -
      (h.match(/class="[^"]*(?:table-wrap|overflow-x-auto)[^"]*"[\s\S]{0,400}?<table\b/g) || []).length,
    jsonld: (h.match(/application\/ld\+json/g)||[]).length,
    imgs: (h.match(/<img /g)||[]).length,
    imgsNoAlt: (h.match(/<img (?![^>]*\balt=)[^>]*>/g)||[]).length,
    lang: get(h, /<html[^>]*lang="([^"]*)"/),
    noindex: /noindex/.test(h),
  });
}
const pb = (l,v)=>console.log(l.padEnd(38), v);
console.log('PAGES', rows.length);
pb('sans <title>', rows.filter(r=>!r.title).length);
pb('title > 60 car.', rows.filter(r=>r.title && r.title.length>60).length);
pb('sans description', rows.filter(r=>!r.desc).length);
pb('description hors 80-170', rows.filter(r=>r.desc && (r.desc.length<80||r.desc.length>170)).length);
pb('sans canonical', rows.filter(r=>!r.canonical).length);
pb('h1 != 1', rows.filter(r=>r.h1!==1).length);
pb('sans og:image', rows.filter(r=>!r.og).length);
/**
 * L'image de partage annoncée doit exister.
 *
 * Le contrôle vérifiait qu'une balise `og:image` est là, jamais que le fichier
 * qu'elle désigne l'est aussi. Une page peut donc annoncer une image et servir
 * un 404 : le défaut n'apparaît qu'au moment où quelqu'un partage le lien,
 * c'est-à-dire hors du site, chez le destinataire, au seul instant où l'on
 * voulait faire bonne impression. C'est arrivé en ajoutant les images
 * anglaises : la balise se met à jour dans le gabarit, le générateur d'images
 * s'oublie, et rien ne le dit.
 */
const ogAbsentes = rows.filter((r) => {
  if (!r.ogSrc) return false;
  const chemin = r.ogSrc.replace(/^https?:\/\/[^/]+/, '');
  return !existsSync(join(DIST, chemin));
});
pb('og:image annoncée mais absente', ogAbsentes.length);
pb('tableaux sans conteneur qui défile', rows.reduce((a, r) => a + Math.max(0, r.tablesNues), 0));
pb('sans JSON-LD', rows.filter(r=>r.jsonld===0).length);
pb('images sans alt', rows.reduce((a,r)=>a+r.imgsNoAlt,0));
/**
 * La langue déclarée doit correspondre au chemin.
 *
 * Ce contrôle exigeait `lang="fr"` partout, ce qui était juste tant que le site
 * n'avait qu'une langue. Il aurait signalé la première page anglaise comme un
 * défaut — et le desserrer en acceptant n'importe quelle langue aurait laissé
 * passer l'inverse : une page sous /en/ qui se déclare française, invisible à
 * l'œil et désastreuse pour le référencement, puisque Google la servirait à des
 * francophones.
 *
 * On vérifie donc l'accord, pas une valeur fixe : /en/... en anglais, le reste
 * en français.
 */
pb('lang ne correspond pas au chemin',
   rows.filter(r => r.lang !== (/^\/en(\/|$)/.test(r.url) ? 'en' : 'fr')).length);
pb('noindex', rows.filter(r=>r.noindex).length);
pb('page la plus lourde (Ko)', Math.round(Math.max(...rows.map(r=>r.size))/1024));
pb('poids HTML moyen (Ko)', Math.round(rows.reduce((a,r)=>a+r.size,0)/rows.length/1024));

const dupT = {}, dupD = {};
rows.forEach(r=>{ if(r.title) (dupT[r.title] ||= []).push(r.url); if(r.desc) (dupD[r.desc] ||= []).push(r.url); });
const dt = Object.entries(dupT).filter(([,v])=>v.length>1);
const dd = Object.entries(dupD).filter(([,v])=>v.length>1);
pb('titles dupliqués', dt.length);
pb('descriptions dupliquées', dd.length);
dt.forEach(([k,v])=>console.log('   TITRE DUP:', k.slice(0,60), '→', v.join(', ')));
dd.forEach(([k,v])=>console.log('   DESC DUP:', k.slice(0,50), '→', v.join(', ')));
console.log('\n--- titles trop longs ---');
rows.filter(r=>r.title&&r.title.length>60).forEach(r=>console.log(' ', r.title.length, r.url, '|', r.title.slice(0,70)));
console.log('\n--- descriptions hors bornes ---');
rows.filter(r=>r.desc&&(r.desc.length<80||r.desc.length>170)).forEach(r=>console.log(' ', r.desc.length, r.url));

const defauts =
  rows.filter((r) => !r.title || r.title.length > 60).length +
  rows.filter((r) => !r.desc || r.desc.length < 80 || r.desc.length > 170).length +
  // La langue attendue dépend du chemin, pas d'une valeur fixe : ce comptage
  // gardait `lang !== 'fr'` et signalait la première page anglaise comme un
  // défaut, alors que le tableau au-dessus disait déjà le contraire. Un
  // récapitulatif qui contredit son propre détail est pire qu'absent.
  rows.filter((r) => !r.canonical || r.h1 !== 1 || !r.og || r.jsonld === 0 ||
    r.lang !== (/^\/en(\/|$)/.test(r.url) ? 'en' : 'fr')).length +
  rows.reduce((a, r) => a + r.imgsNoAlt, 0) + dt.length + dd.length + ogAbsentes.length +
  rows.reduce((a, r) => a + Math.max(0, r.tablesNues), 0);

if (ogAbsentes.length) {
  console.log('\n--- og:image annoncée mais absente ---');
  for (const r of ogAbsentes.slice(0, 10)) console.log(`  ${r.url} → ${r.ogSrc}`);
}

console.log('\n' + (defauts ? `\u26a0  ${defauts} défaut(s) mécanique(s)` : '\u2713 Aucun défaut mécanique.'));
process.exit(defauts ? 1 : 0);
