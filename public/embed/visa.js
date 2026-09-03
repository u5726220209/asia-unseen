/*!
 * Asia Unseen — bloc citable des règles d'entrée en Asie
 * https://asiaunseen.com/integrer
 *
 * Données sous licence CC BY 4.0. L'attribution est intégrée au bloc et n'est
 * pas optionnelle : c'est la contrepartie de la licence, et la seule chose que
 * ce site demande en échange.
 *
 * Usage :
 *   <div class="asiaunseen-visa" data-pays="vietnam"></div>
 *   <script src="https://asiaunseen.com/embed/visa.js" async></script>
 *
 * TROIS PRINCIPES, ET ILS EXPLIQUENT TOUT LE RESTE
 *
 * 1. La donnée est lue en direct. Un bloc qui figerait la règle au moment du
 *    copier-coller vieillirait sur le site d'autrui, afficherait une durée de
 *    visa périmée sous notre nom, et abîmerait précisément la réputation qu'il
 *    est censé construire. Il vaut mieux n'afficher qu'un lien que d'afficher
 *    un chiffre faux.
 *
 * 2. La date est toujours visible. Une règle d'entrée sans date de
 *    vérification est inutilisable — c'est l'argument central du site, il
 *    serait absurde de l'abandonner en sortant de chez soi.
 *
 * 3. Rien ne fuit dans les deux sens. Le bloc n'écrit aucun style global, ne
 *    pose aucun cookie, ne mesure rien, et n'hérite pas de la mise en forme de
 *    la page hôte. Un éditeur qui colle trois lignes ne doit pas avoir à se
 *    demander ce qu'elles font.
 */
(function () {
  'use strict';

  var RACINE = 'https://asiaunseen.com';
  var DONNEES = RACINE + '/donnees/visas.json';
  var CLASSE = 'asiaunseen-visa';

  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  function moisEnLettres(aaaaMm) {
    if (!/^\d{4}-\d{2}$/.test(aaaaMm || '')) return '';
    var p = aaaaMm.split('-');
    return MOIS[Number(p[1]) - 1] + ' ' + p[0];
  }

  function el(tag, style, texte) {
    var n = document.createElement(tag);
    if (style) n.setAttribute('style', style);
    if (texte != null) n.textContent = texte;
    return n;
  }

  /* Styles en ligne : rien n'est ajouté au document hôte, et rien de sa
     feuille de style ne s'applique par héritage de classe. */
  var S = {
    cadre: 'all:initial;display:block;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;' +
           'border:1px solid #ddd6cb;border-radius:6px;background:#fff;color:#1c1c1c;padding:18px 20px;margin:20px 0;max-width:640px;line-height:1.55;',
    eyebrow: 'display:block;font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#0f766e;margin:0 0 6px;',
    titre: 'display:block;font-size:18px;font-weight:700;color:#0a0a0a;margin:0 0 8px;',
    regle: 'display:block;font-size:15px;color:#1c1c1c;margin:0 0 10px;',
    detail: 'display:block;font-size:13.5px;color:#4b5563;margin:0 0 4px;',
    pied: 'display:block;font-size:12px;color:#6b7280;margin:12px 0 0;padding:10px 0 0;border-top:1px solid #e9e5dd;',
    lien: 'color:#0f766e;text-decoration:underline;text-underline-offset:2px;',
  };

  function lien(href, texte, style) {
    var a = el('a', (style || '') + S.lien, texte);
    a.setAttribute('href', href);
    a.setAttribute('rel', 'noopener');
    return a;
  }

  /** Le repli. Jamais de bloc vide, jamais de chiffre inventé : un lien. */
  function replier(cible, slug) {
    cible.textContent = '';
    var c = el('div', S.cadre);
    c.appendChild(lien(
      RACINE + (slug ? '/' + slug : '/comparer-visas'),
      'Règles d’entrée en Asie — Asia Unseen',
      'font-size:15px;font-weight:600;'
    ));
    c.appendChild(el('span', S.detail, 'Les données n’ont pas pu être chargées. Le lien reste à jour.'));
    cible.appendChild(c);
  }

  function rendre(cible, pays) {
    cible.textContent = '';
    var c = el('div', S.cadre);

    c.appendChild(el('span', S.eyebrow, 'Entrer ' + (pays.article ? pays.article + ' ' : 'en ') + pays.nom));
    c.appendChild(el('span', S.titre, pays.visa.resume));
    c.appendChild(el('span', S.regle, pays.visa.dureeAutorisee));

    if (pays.visa.cout) {
      c.appendChild(el('span', S.detail, 'Coût officiel : ' + pays.visa.cout));
    }

    var pied = el('div', S.pied);
    var date = moisEnLettres(pays.verifieLe);
    pied.appendChild(document.createTextNode(date ? 'Vérifié en ' + date + ' par ' : 'Source : '));
    pied.appendChild(lien(RACINE + '/' + pays.slug, 'Asia Unseen'));
    pied.appendChild(document.createTextNode(' · '));
    pied.appendChild(lien(RACINE + '/' + pays.slug, 'la fiche complète et ses sources'));
    c.appendChild(pied);

    cible.appendChild(c);
  }

  function cibles() {
    return [].slice.call(document.querySelectorAll('.' + CLASSE + ':not([data-au-fait])'));
  }

  function demarrer() {
    var liste = cibles();
    if (!liste.length) return;
    liste.forEach(function (n) { n.setAttribute('data-au-fait', '1'); });

    // Une seule requête, quel que soit le nombre de blocs sur la page.
    fetch(DONNEES, { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        var index = {};
        (d.pays || []).forEach(function (p) { index[p.slug] = p; });
        liste.forEach(function (n) {
          var slug = (n.getAttribute('data-pays') || '').toLowerCase().trim();
          var p = index[slug];
          if (p) rendre(n, p); else replier(n, slug);
        });
      })
      .catch(function () {
        liste.forEach(function (n) { replier(n, (n.getAttribute('data-pays') || '').toLowerCase().trim()); });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
