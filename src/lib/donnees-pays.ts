import type { Country } from '@/data/countries';
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

  return {
    slug: c.slug,
    nom: c.nom,
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
    donnees: `${site.url}/donnees/${c.slug}.json`,
  };
}
