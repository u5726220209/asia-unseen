#!/usr/bin/env node
/**
 * Les certificats des sites officiels que nous recommandons.
 *
 * Ce site envoie ses lecteurs demander leur visa sur les portails d'État. Ces
 * portails laissent régulièrement expirer leur certificat — evisa.gov.vn l'a
 * fait plusieurs fois. Le navigateur affiche alors un avertissement rouge en
 * pleine page, et le lecteur se retrouve devant un choix qu'il ne sait pas
 * trancher : passer outre, ou renoncer.
 *
 * Nous ne pouvons pas réparer leur certificat. Nous pouvons prévenir le
 * lecteur avant qu'il clique, ce qui vaut mieux que de le laisser croire que
 * nous l'avons envoyé sur un site frauduleux. C'est aussi, très concrètement,
 * la différence entre un guide qui connaît son sujet et un guide qui recopie
 * des adresses.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/** Les domaines officiels tirés du registre des pays, dédoublonnés. */
const ts = readFileSync('src/data/countries.ts', 'utf8');
const domaines = [...new Set(
  [...ts.matchAll(/url: '(https:\/\/[^']+)'/g)]
    .map((m) => new URL(m[1]).hostname)
    .filter((h) => /\.gov|\.go\.|gouv|\.gob|immigration|evisa|diplomatie/i.test(h)),
)].sort();

const SEUIL_ALERTE = 10; // jours

const resultats = [];
for (const hote of domaines) {
  try {
    const sortie = execFileSync('bash', ['-c',
      `echo | openssl s_client -servername ${hote} -connect ${hote}:443 2>/dev/null | openssl x509 -noout -enddate -issuer`,
    ], { encoding: 'utf8', timeout: 20_000 });

    const fin = sortie.match(/notAfter=(.+)/)?.[1];
    if (!fin) { resultats.push({ hote, etat: 'injoignable' }); continue; }

    const jours = Math.round((new Date(fin) - Date.now()) / 86_400_000);
    resultats.push({
      hote,
      jours,
      expireLe: new Date(fin).toISOString().slice(0, 10),
      etat: jours < 0 ? 'expiré' : jours < SEUIL_ALERTE ? 'bientôt' : 'valide',
    });
  } catch {
    resultats.push({ hote, etat: 'injoignable' });
  }
}

const inquiets = resultats.filter((r) => r.etat === 'expiré' || r.etat === 'bientôt');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ verifieLe: new Date().toISOString().slice(0, 10), domaines: resultats }, null, 2));
} else {
  console.log(`Certificats des portails officiels — ${resultats.length} domaines\n`);
  for (const r of resultats) {
    const marque = { valide: '✓', bientôt: '⚠', 'expiré': '⛔', injoignable: '·' }[r.etat];
    const detail = r.jours === undefined ? 'pas de réponse' : `${r.jours} j (jusqu'au ${r.expireLe})`;
    console.log(`   ${marque} ${r.hote.padEnd(34)} ${detail}`);
  }
  console.log();
  if (inquiets.length) {
    console.log(`⚠  ${inquiets.length} portail(s) présenteront bientôt un avertissement de sécurité.\n`);
    console.log('   Ce n\'est pas réparable de notre côté. Ce qui est de notre côté :');
    console.log('   prévenir le lecteur sur la fiche du pays, pour qu\'il sache que');
    console.log('   l\'avertissement vient du site d\'État et non d\'une contrefaçon.\n');
  }
}

process.exit(inquiets.length ? 2 : 0);
