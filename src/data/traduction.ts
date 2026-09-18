/**
 * Ce qui se traduit, ce qui ne se traduit pas, et pourquoi.
 *
 * La question n'est pas « avons-nous le temps de traduire les quarante et un
 * textes » mais « lesquels resteraient vrais en anglais ». Un comparatif
 * d'assurances AVI et Chapka traduit mot pour mot donne une page
 * irréprochable et parfaitement inutile à un Britannique : ces contrats ne lui
 * sont pas vendus. Un calendrier de départ qui compte huit semaines pour
 * renouveler un passeport compte les semaines françaises.
 *
 * Ces pages-là ne sont pas « à traduire plus tard » : elles sont à réécrire,
 * avec d'autres assureurs, d'autres banques, d'autres délais — c'est-à-dire à
 * documenter depuis zéro pour chaque marché. Les confondre avec un retard de
 * traduction ferait croire à un rattrapage possible, et produirait un jour une
 * traduction qui trompe.
 *
 * Ce fichier existe donc pour que la raison survive à celui qui l'a trouvée.
 * Sans lui, quelqu'un traduira le comparatif d'assurances un mardi, de bonne
 * foi, et personne ne saura dire pourquoi c'était une erreur.
 */

export type Verdict = 'traduire' | 'reecrire' | 'sans-objet';

export type Classement = {
  /** Le slug, tel qu'il vit dans src/content/. */
  slug: string;
  collection: 'guides' | 'blog';
  verdict: Verdict;
  /** Pourquoi. Une phrase, lisible par quelqu'un qui découvre le dossier. */
  raison: string;
};

export const classement: Classement[] = [
  /* ── Ce qui traverse les langues sans se déformer ────────────────
     Un aéroport, un train, une mousson et un quartier sont les mêmes pour
     tout le monde. Ces textes se réécrivent en anglais sans perdre leur
     exactitude — c'est du travail d'écriture, pas de documentation. */
  { slug: 'aeroport-noi-bai-hanoi', collection: 'blog', verdict: 'traduire', raison: "Les tarifs de bus de l'exploitant valent pour tout passager." },
  { slug: 'angkor-saison-des-pluies', collection: 'blog', verdict: 'traduire', raison: 'La mousson ne dépend pas du passeport.' },
  { slug: 'applications-voyage-asie', collection: 'blog', verdict: 'traduire', raison: 'Les applications sont les mêmes ; seules deux mentions de banques françaises sautent.' },
  { slug: 'arriver-en-chine-preparation', collection: 'blog', verdict: 'traduire', raison: 'Le pare-feu, les paiements et les portiques traitent tous les étrangers pareil.' },
  { slug: 'cout-reel-30-jours-vietnam', collection: 'blog', verdict: 'traduire', raison: 'Des dépenses relevées sur place, converties en euros ; la devise se dit.' },
  { slug: 'ha-giang-moto-4-jours', collection: 'blog', verdict: 'traduire', raison: 'Un itinéraire de montagne, identique pour qui le roule.' },
  { slug: 'hoi-an-pluie-que-faire', collection: 'blog', verdict: 'traduire', raison: 'La pluie tombe sur tout le monde.' },
  { slug: 'itineraire-thailande-laos-18-jours', collection: 'blog', verdict: 'traduire', raison: 'Un ordre d’étapes ; seules les formalités citées doivent devenir « selon votre passeport ».' },
  { slug: 'itineraire-vietnam-10-jours', collection: 'blog', verdict: 'traduire', raison: 'Idem : la géographie ne change pas de nationalité.' },
  { slug: 'japon-15-jours-sans-jr-pass', collection: 'blog', verdict: 'traduire', raison: 'Le calcul du JR Pass est le même pour tout étranger éligible.' },
  { slug: 'jr-pass-rentable-ou-pas', collection: 'blog', verdict: 'traduire', raison: 'Un calcul de rentabilité, en yens.' },
  { slug: 'ou-dormir-a-bangkok', collection: 'blog', verdict: 'traduire', raison: 'Le choix d’un quartier ne dépend pas du passeport.' },
  { slug: 'ou-dormir-a-hanoi', collection: 'blog', verdict: 'traduire', raison: 'Idem.' },
  { slug: 'ou-dormir-a-kyoto', collection: 'blog', verdict: 'traduire', raison: 'Idem.' },
  { slug: 'sac-a-dos-asie-checklist', collection: 'blog', verdict: 'traduire', raison: 'Une liste de matériel ; les mentions d’ordonnances françaises sautent.' },
  { slug: 'taxi-aeroport-asie-tarifs', collection: 'blog', verdict: 'traduire', raison: 'Une grille tarifaire d’exploitant d’aéroport, publique et universelle.' },
  { slug: 'train-chine-reservation-15-jours', collection: 'blog', verdict: 'traduire', raison: 'La fenêtre de quinze jours s’applique à tous les passeports étrangers.' },
  { slug: 'train-coree-changements-septembre-2026', collection: 'blog', verdict: 'traduire', raison: 'Un site de réservation qui déménage concerne tout le monde.' },
  { slug: 'train-laos-vientiane-luang-prabang', collection: 'blog', verdict: 'traduire', raison: "La ligne, l'application et la fenêtre de sept jours sont les mêmes pour tous les passeports." },
  { slug: 'train-hanoi-saigon', collection: 'blog', verdict: 'traduire', raison: 'Les horaires et les classes sont ceux de l’opérateur.' },
  { slug: 'trois-semaines-asie-sud-est', collection: 'blog', verdict: 'traduire', raison: 'Un itinéraire ; les formalités citées deviennent « selon votre passeport ».' },
  { slug: 'voyager-en-asie-avec-enfants', collection: 'blog', verdict: 'traduire', raison: 'Les contraintes d’âge et de rythme sont universelles.' },
  { slug: 'activites-asie', collection: 'guides', verdict: 'traduire', raison: 'Ce qui vaut son prix sur place ne dépend pas de la nationalité.' },
  { slug: 'budget-voyage-asie', collection: 'guides', verdict: 'traduire', raison: 'Des fourchettes en euros ; la devise se dit, le montant reste vrai.' },
  { slug: 'erreurs-a-eviter', collection: 'guides', verdict: 'traduire', raison: 'Les arnaques visent les étrangers, pas une nationalité.' },
  { slug: 'hotels-asie', collection: 'guides', verdict: 'traduire', raison: 'Les plateformes et les réflexes de réservation sont les mêmes.' },
  { slug: 'meilleure-saison-asie', collection: 'guides', verdict: 'traduire', raison: 'Une mousson est un fait météorologique.' },
  { slug: 'transports-asie', collection: 'guides', verdict: 'traduire', raison: 'Trains, bus et ferries traitent tous les voyageurs pareil.' },
  { slug: 'esim-asie', collection: 'guides', verdict: 'traduire', raison: 'Les forfaits eSIM se vendent au même prix partout ; seule la devise change.' },
  { slug: 'esim-asie-comparatif-prix', collection: 'blog', verdict: 'traduire', raison: 'Idem : les tarifs des opérateurs sont mondiaux.' },
  { slug: 'negocier-en-asie', collection: 'blog', verdict: 'traduire', raison: 'L’usage du marchandage par pays ne dépend pas du passeport du visiteur.' },

  /* ── Ce qui demanderait d'autres sources, donc une autre enquête ──
     Traduire ces pages produirait un texte juste dans sa langue et faux dans
     son objet. Elles ne sont pas en retard : elles n'existent pas encore
     pour ces marchés, et les écrire veut dire tout re-sourcer. */
  { slug: 'assurances-voyage', collection: 'guides', verdict: 'reecrire', raison: "AVI et Chapka ne vendent pas hors de France : un lecteur britannique ne peut rien souscrire de ce qui est comparé." },
  { slug: 'assurance-voyage-asie-comparatif', collection: 'blog', verdict: 'reecrire', raison: 'Même raison : le comparatif entier porte sur des contrats français.' },
  { slug: 'banques-asie', collection: 'guides', verdict: 'reecrire', raison: 'Les frais comparés sont ceux de banques françaises, et les alternatives citées aussi.' },
  { slug: 'carte-bancaire-asie-comparatif', collection: 'blog', verdict: 'reecrire', raison: 'Idem : des cartes distribuées en France, avec des conditions françaises.' },
  { slug: 'sante-vaccins-voyage-asie', collection: 'blog', verdict: 'reecrire', raison: "Les recommandations vaccinales et le remboursement cités viennent des autorités françaises ; d'autres pays recommandent autre chose." },
  { slug: 'checklist-depart', collection: 'guides', verdict: 'reecrire', raison: 'Le calendrier compte des délais français — renouvellement de passeport, dépôt de visa depuis la France.' },
  { slug: 'scooter-asie-permis-assurance', collection: 'blog', verdict: 'reecrire', raison: "La validité d'un permis international dépend du pays qui l'a délivré : la règle française ne vaut pas pour un Australien." },

  /* ── Ce que le modèle par passeport a remplacé ───────────────────
     Ces articles disent la règle d'un passeport français. Les pages anglaises
     donnent la règle du passeport du lecteur, avec sa source et sa date : les
     traduire ajouterait une seconde réponse, moins juste, à la même question. */
  { slug: 'visas-asie', collection: 'guides', verdict: 'sans-objet', raison: 'Remplacé en anglais par la règle par passeport, sur /en et sur chaque fiche.' },
  { slug: 'visa-vietnam-e-visa-2026', collection: 'blog', verdict: 'sans-objet', raison: 'Les tarifs et la procédure cités sont ceux du passeport français.' },
  { slug: 'visa-thailande-30-jours-2026', collection: 'blog', verdict: 'sans-objet', raison: "Le changement du 15 septembre figure dans la règle thaïlandaise de chaque passeport concerné." },
  { slug: 'visa-chine-exemption-2026', collection: 'blog', verdict: 'sans-objet', raison: "L'exemption chinoise est portée par la règle de chaque passeport." },
  { slug: 'visa-indonesie-prolongation', collection: 'blog', verdict: 'sans-objet', raison: 'Le visa à l’arrivée et sa prolongation figurent dans la règle par passeport.' },
  { slug: 'k-eta-coree-2026', collection: 'blog', verdict: 'sans-objet', raison: "L'exemption de K-ETA est portée par la règle coréenne de chaque passeport." },
  { slug: 'etravel-philippines', collection: 'blog', verdict: 'sans-objet', raison: 'La carte eTravel figure dans la règle philippine de chaque passeport.' },
];

export const parVerdict = (v: Verdict) => classement.filter((c) => c.verdict === v);
