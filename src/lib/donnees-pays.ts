import { PASSEPORTS, PORTAILS_NON_RELEVES, regleDuPasseport, type Country } from '@/data/countries';
import { contenuEn } from '@/data/countries.en';
import type { Correction } from '@/data/corrections';
import { site } from '@/data/site';

/**
 * La description machine d'une fiche pays, écrite une seule fois.
 *
 * Elle sert au jeu complet (`/donnees/visas.json`) et au fichier par pays
 * (`/donnees/<slug>.json`). Les écrire deux fois garantissait qu'ils
 * finiraient par diverger : un champ ajouté ici, oublié là, et deux réponses
 * différentes à la même question selon l'adresse ouverte. C'est exactement le
 * défaut que ce site passe son temps à traquer dans ses propres pages.
 */
export function ficheDuPays(c: Country, corrections: Correction[]) {
  const derniereCorrection =
    corrections
      .filter((x) => x.page === `/${c.slug}`)
      .map((x) => x.date)
      .sort()
      .at(-1) ?? null;

  /**
   * La règle de chaque passeport, et non plus celle d'un seul.
   *
   * Le fichier ne connaissait que le passeport français. `joursSansVisa: 45`
   * y figurait sans qualificatif, au premier niveau : une machine qui lisait
   * ce fichier pour répondre à « combien de jours au Vietnam » citait une
   * durée française comme si elle valait pour tout le monde. C'est exactement
   * l'erreur que ce site existe pour empêcher, produite par le fichier qu'il
   * publie pour être cité.
   *
   * Les passeports dont la règle n'est pas relevée sont déclarés eux aussi,
   * avec la raison et le portail. Se taire sur eux les ferait passer pour des
   * passeports sans règle — pire qu'un silence, une réponse fausse.
   */
  const parPasseport = Object.fromEntries(
    PASSEPORTS.map((p) => {
      const r = regleDuPasseport(c, p.code);
      if (!r) {
        const portail = PORTAILS_NON_RELEVES[p.code];
        return [p.code, {
          releve: false,
          pourquoi: portail?.pourquoi.fr ?? 'règle non relevée',
          source: portail ? { label: portail.nom, url: portail.url } : null,
        }];
      }
      return [p.code, {
        releve: true,
        joursSansVisa: r.sansVisaJours,
        resume: r.resume,
        changeLe: r.sansVisaJoursApres
          ? { date: r.sansVisaJoursApres.date, joursSansVisa: r.sansVisaJoursApres.jours }
          : null,
        source: { label: r.source.label, url: r.source.url },
        verifieLe: r.verifieLe,
      }];
    }),
  );

  return {
    slug: c.slug,
    nom: c.nom,
    nomEn: c.nomEn,
    capitale: c.capitale,
    monnaie: c.monnaie,
    langue: c.langue,
    // « au Vietnam », « en Thaïlande », « aux Philippines » : sans cet article,
    // le bloc citable écrirait « Entrer en Vietnam » sur le site de quelqu'un
    // d'autre, sous notre nom.
    article: c.article,
    decalageHoraire: c.decalage,
    visa: {
      resume: c.visa.resume,
      dureeAutorisee: c.visa.duree,
      /**
       * La durée d'exemption en jours, pour un passeport français ordinaire.
       *
       * C'est le seul champ décidable du fichier, et il manquait. Le reste est
       * de la prose française : une machine qui répond à « puis-je rester 45
       * jours ? » devait l'analyser pour en extraire un nombre, avec le risque
       * de lire « 30 jours » dans une phrase qui parle d'une prolongation. Ici,
       * la comparaison est directe. Zéro signifie qu'aucune exemption
       * n'existe — un visa est exigé dès le premier jour.
       */
      joursSansVisa: c.visa.sansVisaJours,
      /**
       * Le passeport auquel s'appliquent les champs ci-dessus.
       *
       * Il était sous-entendu, ce qui revenait à ne pas le dire. Un champ
       * `joursSansVisa` sans passeport se cite comme une règle universelle,
       * et une règle d'entrée n'en est jamais une : elle existe pour un
       * passeport, jamais dans l'absolu.
       */
      passeport: 'fr',
      /**
       * Une règle déjà publiée dont la date d'effet est encore à venir.
       *
       * Absente la plupart du temps. Quand elle est là, `joursSansVisa` reste
       * la règle applicable aujourd'hui, et ce bloc dit ce qui la remplacera :
       * ne pas distinguer les deux fait répondre la nouvelle règle à quelqu'un
       * qui part demain sous l'ancienne.
       */
      changeLe: c.visa.sansVisaJoursApres
        ? { date: c.visa.sansVisaJoursApres.date, joursSansVisa: c.visa.sansVisaJoursApres.jours }
        : null,
      cout: c.visa.cout,
      procedure: c.visa.procedure,
      parPasseport,
    },
    demarchesPrealables: c.demarches.map((d) => ({
      joursAvantDepart: d.jours,
      titre: d.titre,
      detail: d.detail,
    })),
    sources: c.sourcesVisa.map((s) => ({
      label: s.label,
      url: s.url,
      // Une source citée pour le lecteur mais illisible par une machine —
      // chaîne TLS incomplète, blocage anti-robot — ne peut pas fonder la date
      // de vérification. Le dire évite de laisser croire qu'elle a été relue.
      surveillee: s.surveillee !== false,
    })),
    verifieLe: c.verifieLe,
    derniereCorrection,
    page: `${site.url}/${c.slug}`,
    pageEn: contenuEn[c.slug] ? `${site.url}/en/${c.slug}` : null,
    donnees: `${site.url}/donnees/${c.slug}.json`,
  };
}
