/**
 * Fiches pays — source unique de vérité pour :
 *   · les pages pays (/vietnam, /thailande, …)
 *   · le calculateur de budget
 *   · l'outil « meilleure saison »
 *   · les tableaux comparatifs
 *
 * ⚠️ FORMALITÉS & PRIX : les règles de visa et les tarifs changent souvent.
 * Chaque fiche porte un champ `verifieLe`. Avant toute mise en ligne,
 * revérifiez sur les sources officielles listées dans `sourcesVisa` et
 * mettez la date à jour. Voir README.md → « Avant de publier ».
 */

export type Saison = 1 | 2 | 3; // 1 = à éviter · 2 = acceptable · 3 = idéal

export type Country = {
  slug: string;
  nom: string;
  article: string;          // « au », « en », « aux » — pour les tournures de phrase
  /**
   * L'article quand le pays est sujet : « le Japon arrive au 9e rang ».
   *
   * `article` est locatif — « au Japon », « en Thaïlande » — et ne convient pas
   * quand le pays commence la phrase. Les gabarits le déduisaient jusqu'ici du
   * locatif, ce qui donnait « la Indonésie » dans un titre H1, ou écrivaient le
   * nom tout nu : « Où se situe Japon ». Deux fautes que personne ne fait en
   * écrivant à la main, et que neuf pages affichaient.
   *
   * L'élision est incluse dans la valeur : « l'Indonésie » se colle, les autres
   * prennent une espace. C'est au gabarit de le savoir, pas à chaque appel.
   */
  articleSujet: string;
  capitale: string;
  monnaie: string;
  langue: string;
  decalage: string;
  /** Budget indicatif par personne et par jour, hors vol international (€). */
  budget: { routard: number; confort: number; premium: number };
  /** Note mensuelle, de janvier à décembre. */
  saisons: [Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison];
  saisonNote: string;
  visa: {
    resume: string;
    duree: string;
    cout: string;
    procedure: string;
    /**
     * Nombre de jours de séjour autorisés SANS aucune démarche, passeport
     * français ordinaire. Zéro quand un visa est exigé dès le premier jour,
     * même s'il s'obtient à l'arrivée ou en ligne.
     *
     * Ce nombre est transcrit de `duree`, jamais déduit : il sert uniquement à
     * trancher « ce séjour tient-il dans l'exemption ». Tout le reste — le
     * coût, la procédure, les pièges — est cité tel quel. Un outil qui
     * reformulerait une règle d'entrée finirait par en inventer une.
     *
     * `scripts/verifier-config.mjs` vérifie que ce nombre figure bien dans le
     * texte de `duree` : si la règle change et que le texte est corrigé sans
     * l'entier, la mise en ligne s'arrête.
     */
    sansVisaJours: number;
    /**
     * Une règle dont la date d'effet est connue et encore à venir.
     *
     * La Thaïlande a publié le 31 août 2026 une réduction applicable le
     * 15 septembre. Entre les deux, la fiche a le choix entre deux erreurs :
     * annoncer l'ancienne règle et se périmer sans prévenir, ou annoncer la
     * nouvelle et se tromper pendant quinze jours — c'est ce second travers
     * qui s'était installé, et il répondait « 30 jours » à quelqu'un qui
     * partait le lendemain avec droit à 60.
     *
     * Le champ tient les deux régimes. La bascule se fait toute seule le jour
     * dit, à la reconstruction quotidienne : personne n'a à s'en souvenir.
     * `duree` doit annoncer les deux nombres et leur date — c'est vérifié.
     */
    sansVisaJoursApres?: { date: string; jours: number };
  };
  /**
   * Les sources officielles citées sur la fiche. `surveillee: false` les garde
   * visibles pour le lecteur tout en les retirant de la sentinelle : certaines
   * pages officielles sont des fils d'actualité dont le texte change tous les
   * jours sans qu'aucune règle bouge. Voir scripts/veille.mjs.
   */
  sourcesVisa: { label: string; url: string; surveillee?: boolean }[];
  /**
   * Démarches datées propres au pays, consommées par la checklist de départ.
   * `jours` est le nombre de jours avant le départ où la démarche doit être faite.
   * Renseignées à partir des audits de fraîcheur — voir audits/.
   */
  demarches: { jours: number; titre: string; detail: string }[];
  /**
   * Numéros de secours et représentation diplomatique française.
   * Relevés un par un sur les pages « Contacts utiles » de France Diplomatie
   * et sur les sites des ambassades. Une donnée d'urgence fausse est pire
   * qu'une donnée absente : là où la source officielle ne dit rien, on ne
   * comble pas le trou.
   */
  urgences: {
    numeros: { label: string; numero: string }[];
    ambassade: { ville: string; adresse: string; telephone: string };
    source: { label: string; url: string };
  };
  verifieLe: string;
  volDepuisParis: string;
  accent: string;           // couleur d'accent de la fiche (palette de marque uniquement)
  resume: string;
  pourQui: string;
  incontournables: string[];
  horsSentiers: string[];
  erreurs: string[];
};

export const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'] as const;

const SOURCE_FD = { label: 'France Diplomatie — Conseils aux voyageurs', url: 'https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/' };

export const countries: Country[] = [
  {
    slug: 'vietnam',
    nom: 'Vietnam', article: 'au', capitale: 'Hanoï', monnaie: 'Dong (VND)',
    articleSujet: "le ",
    langue: 'Vietnamien', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 25, confort: 55, premium: 120 },
    saisons: [2, 2, 3, 3, 2, 1, 1, 1, 2, 3, 3, 3],
    saisonNote:
      "Le Vietnam fait 1 650 km du nord au sud : il n'y a pas une saison, il y en a trois. Nord (Hanoï, Sapa, Ha Long) : octobre à avril. Centre (Hoi An, Hué, Da Nang) : février à août, avec un pic de pluie en octobre-novembre. Sud (Saïgon, Mékong, Phu Quoc) : décembre à avril. Un itinéraire nord-sud en mars ou en avril reste le meilleur compromis.",
    visa: {
      resume: "Exemption de visa jusqu'à 45 jours pour les passeports français ; e-visa au-delà.",
      duree: "45 jours sans visa. E-visa jusqu'à 90 jours, entrées simples ou multiples. Ni l'exemption ni l'e-visa ne sont prolongeables sur place.",
      cout: "Gratuit sous exemption ; ≈ 25 USD (entrée simple) / 50 USD (entrées multiples) pour l'e-visa",
      procedure: "E-visa sur le portail officiel de l'immigration, réponse en 3 à 5 jours ouvrés. N'utilisez jamais les sites intermédiaires qui facturent 3 à 5 fois le tarif. Passeport valide 6 mois à la date d'entrée. Un enregistrement en ligne dans les 72 h précédant l'arrivée est demandé à l'aéroport de Hô Chi Minh-Ville.",
      sansVisaJours: 45,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Vietnam, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/vietnam/conseils-aux-voyageurs-entree-sejour' },
      // Chaîne de certificats incomplète : ce portail ne sert pas son
      // intermédiaire, et aucune machine ne peut valider la connexion. Le
      // navigateur du lecteur, lui, l'accepte — on le cite donc sans le surveiller.
      { label: "Portail e-visa officiel du Vietnam", url: 'https://evisa.gov.vn/', surveillee: false },
      { label: "Enregistrement préalable (aéroport de Hô Chi Minh-Ville)", url: 'https://prearrival.immigration.gov.vn/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 28, titre: "Déposer l'e-visa vietnamien", detail: "≈ 25 USD sur evisa.gov.vn, 3 à 5 jours ouvrés annoncés. Inutile si votre séjour tient dans les 45 jours d'exemption." },
      { jours: 3, titre: 'Enregistrement en ligne préalable', detail: "Demandé dans les 72 h précédant l'arrivée à l'aéroport de Hô Chi Minh-Ville, sur prearrival.immigration.gov.vn." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '113' }, { label: 'Pompiers', numero: '114' }, { label: 'Secours médicaux', numero: '115' }],
      ambassade: { ville: 'Hanoï', adresse: '57 Tran Hung Dao, Hanoï', telephone: '+84 24 3944 5700' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/vietnam/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 12 h en direct vers Hanoï ou Hô Chi Minh-Ville',
    accent: 'teal',
    resume:
      "Le meilleur rapport dépaysement / prix d'Asie du Sud-Est, et de loin. Une cuisine de rue qui n'a pas d'équivalent, des paysages qui changent tous les 200 kilomètres, et un pays où l'on peut encore voyager trois semaines pour le prix d'une semaine au Japon.",
    pourQui: "Premier voyage en Asie, petits budgets, amateurs de cuisine, voyageurs à moto.",
    incontournables: [
      "La baie d'Ha Long — mais côté Lan Ha ou Bai Tu Long, pas depuis le port principal",
      "Hoi An hors saison, tôt le matin, avant les groupes",
      "La boucle de Ha Giang à moto : 4 jours, la plus belle route du pays",
      "Le delta du Mékong au départ de Can Tho, pas de Saïgon en excursion à la journée",
      "Hué et ses tombeaux impériaux, largement sous-visités",
    ],
    horsSentiers: [
      "Cao Bang et les chutes de Ban Gioc, à la frontière chinoise",
      "Quy Nhon : les plages du centre sans les resorts de Nha Trang",
      "Le marché de Bac Ha le dimanche, plutôt que celui de Sapa",
    ],
    erreurs: [
      "Réserver la baie d'Ha Long depuis la rue à Hanoï : la moitié des bateaux vendus n'existent pas sous le nom annoncé",
      "Changer de l'argent à l'aéroport — le taux y est 5 à 8 % moins bon qu'en ville",
      "Sous-estimer les distances : Hanoï–Saïgon en train, c'est 32 h 45",
      "Louer un scooter sans permis international valable : votre assurance ne couvrira rien",
    ],
  },
  {
    slug: 'thailande',
    nom: 'Thaïlande', article: 'en', capitale: 'Bangkok', monnaie: 'Baht (THB)',
    articleSujet: "la ",
    langue: 'Thaï', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 30, confort: 65, premium: 150 },
    saisons: [3, 3, 2, 2, 1, 1, 1, 1, 1, 2, 3, 3],
    saisonNote:
      "Novembre à mars : sec, respirable, c'est la haute saison et les prix suivent. Avril : 40 °C à Bangkok, mais c'est le mois de Songkran. Mai à octobre : mousson côté Andaman (Phuket, Krabi) — en revanche le golfe (Koh Samui, Koh Phangan) reste correct jusqu'en septembre et ne prend l'eau qu'en octobre-novembre. Les deux côtes n'ont pas la même saison : c'est la clé pour voyager hors des périodes chères.",
    visa: {
      resume: "Exemption de visa pour les séjours touristiques : 60 jours pour une entrée jusqu'au 14 septembre 2026, 30 jours pour une entrée à partir du 15 septembre 2026.",
      duree: "60 jours sans visa pour une entrée jusqu'au 14 septembre 2026 ; 30 jours pour une entrée à partir du 15 septembre 2026. C'est la date d'entrée sur le territoire qui fixe la durée, pas la date de sortie : une arrivée le 14 septembre garde ses 60 jours jusqu'à leur terme. Une extension unique pouvant aller jusqu'à 30 jours se demande sur place, auprès d'un bureau de l'immigration.",
      cout: "Gratuit à l'entrée ; ≈ 1 900 THB pour une prolongation sur place",
      procedure: "La Thailand Digital Arrival Card (TDAC) est obligatoire depuis le 1er mai 2025 pour toute entrée par air, terre ou mer : à remplir en ligne dans les 3 jours précédant l'arrivée sur tdac.immigration.go.th — gratuitement, les sites qui la facturent sont des intermédiaires. Passeport valide 6 mois à compter de la date d'entrée. Un billet de sortie du territoire peut être réclamé à l'embarquement.",
      sansVisaJours: 60,
      sansVisaJoursApres: { date: '2026-09-15', jours: 30 },
    },
    sourcesVisa: [
      { label: "France Diplomatie — Thaïlande, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/thailande/conseils-aux-voyageurs-entree-sejour' },
      { label: 'Thailand Digital Arrival Card (TDAC) — portail officiel', url: 'https://tdac.immigration.go.th/', surveillee: false },
      // Cette adresse répondait 200 en servant une page « PAGE NOT FOUND » — un
      // faux 404, invisible pour la veille : la page répond, son contenu ne
      // bouge plus, aucune alerte ne se déclenche jamais. Remplacée par le
      // portail de la carte d'arrivée, qui est la démarche réellement exigée.
      { label: "Thailand Digital Arrival Card — portail officiel", url: 'https://tdac.immigration.go.th/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 30, titre: "Reconfirmer la durée d'exemption", detail: "L'exemption passe de 60 à 30 jours pour toute entrée à partir du 15 septembre 2026. C'est la date d'entrée qui compte : si la vôtre est postérieure et votre séjour plus long qu'un mois, prévoyez l'extension sur place avant de bloquer vos vols." },
      { jours: 3, titre: 'Remplir la Thailand Digital Arrival Card', detail: "Obligatoire pour toute entrée par air, terre ou mer, dans les 3 jours précédant l'arrivée, sur tdac.immigration.go.th." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '191' }, { label: 'Police touristique', numero: '1155' }, { label: 'Pompiers', numero: '199' }, { label: 'Secours médicaux', numero: '1669' }],
      ambassade: { ville: 'Bangkok', adresse: '35 Charoenkrung soi 36, Bangrak, Bangkok 10500', telephone: '+66 2 844 7005' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/thailande/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 11 h en direct vers Bangkok',
    accent: 'amber',
    resume:
      "Le pays le plus facile d'Asie pour un premier voyage : infrastructure solide, transports fiables, anglais courant dans le tourisme. Le revers, c'est qu'il faut faire un vrai effort pour sortir du circuit — mais dès qu'on le fait, la Thaïlande redevient extraordinaire.",
    pourQui: "Premier voyage, familles, voyageurs qui veulent combiner ville, montagne et plage sans galérer.",
    incontournables: [
      "Bangkok en bateau sur les klongs, pas en taxi dans les embouteillages",
      "Chiang Mai et la boucle de Mae Hong Son",
      "Ayutthaya à vélo, en une journée depuis Bangkok",
      "Le parc national de Khao Sok, plus impressionnant que la plupart des îles",
    ],
    horsSentiers: [
      "L'Isan (Nord-Est) : Nong Khai, Ubon Ratchathani — presque aucun touriste occidental",
      "Koh Yao Noi, entre Phuket et Krabi, à 45 minutes de bateau du chaos",
      "Nan, à la frontière laotienne",
    ],
    erreurs: [
      "Accepter un tuk-tuk qui propose un tour « à 20 bahts » : c'est une tournée de boutiques à commission",
      "Réserver Phuket en septembre en pensant échapper à la pluie",
      "Louer un scooter en laissant son passeport en caution — photocopie uniquement",
      "Ignorer la franchise de l'assurance sur les deux-roues : elle est souvent totale sans permis A",
    ],
  },
  {
    slug: 'japon',
    nom: 'Japon', article: 'au', capitale: 'Tokyo', monnaie: 'Yen (JPY)',
    articleSujet: "le ",
    langue: 'Japonais', decalage: '+7 h en été, +8 h en hiver',
    budget: { routard: 65, confort: 120, premium: 250 },
    saisons: [2, 2, 3, 3, 3, 1, 1, 1, 2, 3, 3, 2],
    saisonNote:
      "Avril (sakura) et novembre (érables) sont sublimes — et pleins. Mai et début juin : le meilleur compromis météo/affluence/prix. Mi-juin à mi-juillet : tsuyu, la saison des pluies. Juillet-août : 35 °C et 80 % d'humidité à Tokyo, mais c'est la saison des festivals et le seul moment pour les Alpes japonaises. Janvier-février : Hokkaido pour la neige, le reste du pays est froid mais très praticable et bon marché.",
    visa: {
      resume: "Pas de visa pour un séjour touristique de courte durée avec un passeport français.",
      duree: "Jusqu'à 90 jours sans visa, sans démarche préalable.",
      cout: "Gratuit",
      procedure: "Une déclaration douanière et d'immigration en ligne (Visit Japan Web) accélère considérablement le passage à l'aéroport. Faites-la la veille du départ.",
      sansVisaJours: 90,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Japon, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/japon/conseils-aux-voyageurs-entree-sejour' },
      { label: "Ambassade du Japon en France", url: 'https://www.fr.emb-japan.go.jp/', surveillee: false },
      { label: 'Visit Japan Web', url: 'https://www.vjw.digital.go.jp/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 2, titre: 'Remplir Visit Japan Web', detail: "Facultatif mais fait gagner une vraie demi-heure au passage de l'immigration et de la douane." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '110' }, { label: 'Pompiers et ambulance', numero: '119' }, { label: 'Police, assistance en français', numero: '+81 3 3503 8484' }],
      ambassade: { ville: 'Tokyo', adresse: '4-11-44 Minami-Azabu, Minato-ku, Tokyo 106-8514', telephone: '+81 3 5798 6000' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/japon/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 12 h à 14 h selon la route',
    accent: 'ink',
    resume:
      "Le pays qui rend tous les autres voyages plus difficiles ensuite. Cher, oui — mais beaucoup moins qu'on ne le croit si l'on sort des hôtels internationaux et qu'on mange là où mangent les Japonais. Le rapport qualité/prix de la nourriture à 900 yens y est imbattable.",
    pourQui: "Voyageurs autonomes, amateurs de villes, de design, de randonnée, de gastronomie.",
    incontournables: [
      "Tokyo par quartiers, à raison d'un seul par jour",
      "Kyoto tôt le matin (avant 8 h) ou tard le soir — l'expérience n'a rien à voir",
      "Le Kumano Kodo ou le Nakasendo à pied, deux à quatre jours",
      "Kanazawa et Takayama, largement préférables à Osaka pour un premier voyage",
    ],
    horsSentiers: [
      "La mer intérieure de Seto : Naoshima, Teshima, Shodoshima",
      "Le Tohoku (Aomori, Akita) en automne, quasi vide",
      "Yakushima, forêt primaire subtropicale au sud de Kyushu",
    ],
    erreurs: [
      "Acheter le JR Pass par réflexe : depuis la hausse tarifaire, il n'est rentable qu'au-delà d'un aller-retour Tokyo–Kyoto–Hiroshima",
      "Arriver sans espèces : de nombreux petits restaurants et temples n'acceptent pas la carte",
      "Réserver un hôtel « près de la gare de Kyoto » pour tout faire à pied — la ville est bien plus étendue qu'elle n'en a l'air",
      "Prévoir Tokyo et Kyoto en 7 jours avec un vol arrivant à Narita : vous perdrez deux demi-journées en transferts",
    ],
  },
  {
    slug: 'chine',
    nom: 'Chine', article: 'en', capitale: 'Pékin', monnaie: 'Yuan (CNY)',
    articleSujet: "la ",
    langue: 'Mandarin', decalage: '+6 h en été, +7 h en hiver',
    budget: { routard: 40, confort: 80, premium: 170 },
    saisons: [1, 1, 2, 3, 3, 2, 1, 1, 3, 3, 2, 1],
    saisonNote:
      "Avril-mai et septembre-octobre, sans hésiter. Évitez la « semaine d'or » du 1er au 7 octobre : le pays entier est en déplacement. L'été est étouffant à Pékin et Shanghai, l'hiver mordant au nord. Le Yunnan et le Guangxi, au sud, restent agréables une bonne partie de l'année.",
    visa: {
      resume: "Exemption de visa de 30 jours pour les passeports français ordinaires, en vigueur jusqu'au 31 décembre 2026. Le dispositif est reconduit d'année en année : à revérifier avant chaque départ.",
      duree: "30 jours sans visa, pour le tourisme, les affaires, les visites familiales, les échanges culturels et le transit. Non prolongeable sur place. Visa L classique au-delà de 30 jours.",
      cout: "Gratuit sous exemption ; 45 € de frais consulaires pour un visa L à entrée simple — tarif réduit prolongé jusqu'au 31 décembre 2026 —, plus les frais de service du centre de dépôt, soit environ 110 € au total",
      procedure: "Passeport valide 6 mois après la date de sortie du territoire. Les passeports d'urgence sont exclus du dispositif. Enregistrement obligatoire auprès de la police locale dans les 24 h suivant l'arrivée — l'hôtel s'en charge, mais pas une location entre particuliers. Pour un visa L : dépôt en centre avec biométrie, 4 à 10 jours ouvrés.",
      sansVisaJours: 30,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Chine, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/chine/conseils-aux-voyageurs-entree-sejour' },
      // Citée, pas surveillée : cette adresse est un fil d'actualité en chinois
      // qui se renouvelle chaque jour et ne documente aucune règle d'entrée.
      // La sentinelle y voyait donc « 0,0 % de similarité » tous les matins.
      // Elle reste la référence officielle pour le lecteur ; la règle, elle,
      // se vérifie sur les deux sources suivantes.
      { label: "Ambassade de Chine en France", url: 'http://fr.china-embassy.gov.cn/', surveillee: false },
      { label: 'Centre de demande de visa pour la Chine', url: 'https://bio.visaforchina.cn/' },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 42, titre: "Vérifier le dispositif d'exemption", detail: "Exemption de 30 jours en vigueur jusqu'au 31 décembre 2026. Au-delà de 30 jours, un visa L déposé en centre est nécessaire : comptez 4 à 10 jours ouvrés." },
      { jours: 14, titre: 'Lier une carte étrangère à Alipay ou WeChat Pay', detail: "À faire et à tester depuis la France : la vérification suppose un accès à des services filtrés sur place." },
      { jours: 14, titre: 'Installer et tester deux VPN', detail: "Les magasins d'applications sont eux aussi filtrés : un VPN téléchargé sur place est un VPN qu'on ne téléchargera pas." },
      { jours: 12, titre: 'Réserver les trains à grande vitesse', detail: "Les billets se vendent 10 à 15 jours à l'avance et partent vite sur les liaisons principales." },
      { jours: 7, titre: "Revérifier l'exemption de visa", detail: "C'est la formalité la plus mouvante d'Asie : une seconde vérification avant le départ est justifiée." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '110' }, { label: 'Secours médicaux', numero: '120' }, { label: 'Hong Kong et Macao, tous secours', numero: '999' }],
      ambassade: { ville: 'Pékin', adresse: '60 Tianze Lu, Pékin 100600', telephone: '+86 10 8531 2000' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/chine/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 11 h vers Pékin, 12 h vers Shanghai',
    accent: 'teal',
    resume:
      "Le pays le plus sous-estimé de la liste. Un réseau à grande vitesse qui met le reste du monde à la traîne, des paysages sans équivalent, et un tourisme occidental qui n'est jamais revenu au niveau d'avant 2019. La barrière n'est pas la sécurité ni le coût : c'est la préparation numérique.",
    pourQui: "Deuxième ou troisième voyage en Asie, voyageurs organisés, amateurs de trains et de grands espaces.",
    incontournables: [
      "Pékin : la Grande Muraille à Jinshanling ou Gubeikou, jamais à Badaling",
      "Xi'an et l'armée de terre cuite, puis la muraille de la ville à vélo",
      "Les rizières en terrasse de Longji, au Guangxi",
      "Chengdu, sa vie de quartier et le Sichuan autour",
    ],
    horsSentiers: [
      "Le Yunnan : Shaxi, Nuodeng, les villages Bai et Naxi",
      "Le Guizhou et ses villages Miao, en dehors des circuits",
      "Zhangye et ses montagnes colorées, au Gansu",
    ],
    erreurs: [
      "Arriver sans VPN installé et testé : Google, WhatsApp, Instagram et Gmail sont inaccessibles",
      "Ne pas lier une carte étrangère à Alipay ou WeChat Pay avant de partir — le cash disparaît du quotidien",
      "Croire qu'on trouvera des billets de train la veille : ils partent 10 à 15 jours à l'avance",
      "Négliger le passeport à l'enregistrement d'hôtel : seuls certains établissements sont autorisés à recevoir des étrangers",
    ],
  },
  {
    slug: 'laos',
    nom: 'Laos', article: 'au', capitale: 'Vientiane', monnaie: 'Kip (LAK)',
    articleSujet: "le ",
    langue: 'Lao', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 25, confort: 50, premium: 100 },
    saisons: [3, 3, 2, 2, 1, 1, 1, 1, 2, 3, 3, 3],
    saisonNote:
      "Novembre à février : sec et frais, c'est la fenêtre. Mars-avril : la saison des brûlis noie le nord du pays dans une brume épaisse — Luang Prabang perd une bonne partie de son intérêt. Mai à octobre : pluies, mais aussi rizières vert fluo et cascades pleines.",
    visa: {
      resume: "Visa touristique obtenu à l'arrivée ou en ligne, formalité simple.",
      duree: "30 jours, prolongeable sur place.",
      cout: "≈ 30 à 50 USD selon la nationalité et le point d'entrée ; prolongation à 2 USD par jour à Vientiane",
      procedure: "E-visa en ligne pour éviter la file, ou visa à l'arrivée aux principaux postes frontières. Attention : les points de passage terrestres délivrant un visa à l'arrivée ou acceptant l'e-visa sont limités — vérifiez le vôtre avant de vous y présenter. Exigez le tampon d'entrée sur votre passeport : son absence est sanctionnée d'au moins 200 USD. Prévoyez une photo d'identité et des dollars en espèces en bon état.",
      sansVisaJours: 0,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Laos, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/laos/conseils-aux-voyageurs-entree-sejour' },
      { label: 'Portail e-visa officiel du Laos', url: 'https://laoevisa.gov.la/' },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 28, titre: "Déposer l'e-visa laotien, ou préparer le visa à l'arrivée", detail: "≈ 30 à 50 USD. Vérifiez que votre point d'entrée délivre bien un visa à l'arrivée ou accepte l'e-visa : tous ne le font pas." },
      { jours: 7, titre: 'Prévoir des dollars en espèces et une photo', detail: "Billets en bon état exigés au poste-frontière." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '191' }, { label: 'Pompiers', numero: '190' }, { label: 'Police touristique, Vientiane', numero: '+856 21 243647' }, { label: 'Centre médical français, Vientiane', numero: '+856 21 214150' }],
      ambassade: { ville: 'Vientiane', adresse: 'Rue Setthathirath, BP 06, Vientiane', telephone: '+856 21 267400' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/laos/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 15 h avec une escale (Bangkok, Hanoï ou Singapour)',
    accent: 'teal',
    resume:
      "Le pays où l'on ralentit. Peu d'infrastructures, peu de monde, et depuis l'ouverture de la ligne ferroviaire à grande vitesse, une accessibilité transformée. À faire avant que cette accessibilité ne change tout.",
    pourQui: "Voyageurs sans programme, amateurs de rivières et de montagne, séjours longs.",
    incontournables: [
      "Luang Prabang et l'aumône des moines — de loin, sans flash, sans acheter le riz aux vendeurs de rue",
      "La descente du Mékong en bateau lent depuis Huay Xai",
      "La plaine des Jarres, à Phonsavan",
      "Les 4 000 îles (Si Phan Don), tout au sud",
    ],
    horsSentiers: [
      "Nong Khiaw et Muang Ngoi, accessibles seulement par la rivière",
      "La boucle de Thakhek à moto, 3 à 4 jours",
      "Le plateau des Bolovens et ses plantations de café",
    ],
    erreurs: [
      "Compter sur les distributeurs en dehors des villes — ils sont rares et souvent vides",
      "Sortir des sentiers battus sans se renseigner : certaines zones rurales restent contaminées par des munitions non explosées",
      "Prévoir des trajets au kilomètre : 200 km de route de montagne, c'est 7 heures",
    ],
  },
  {
    slug: 'cambodge',
    nom: 'Cambodge', article: 'au', capitale: 'Phnom Penh', monnaie: 'Riel (KHR) et dollar US',
    articleSujet: "le ",
    langue: 'Khmer', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 28, confort: 55, premium: 115 },
    saisons: [3, 3, 3, 2, 1, 1, 1, 1, 2, 2, 3, 3],
    saisonNote:
      "Novembre à mars : sec, chaud, agréable. Avril-mai : la chaleur devient difficile, surtout sur les temples sans ombre. Juin à octobre : la mousson, mais aussi le meilleur moment pour Angkor — douves pleines, lumière verte, groupes divisés par trois.",
    visa: {
      resume: "E-visa touristique en ligne ou visa à l'arrivée.",
      duree: '30 jours.',
      cout: '≈ 36 USD (e-visa, frais de service inclus) ; ≈ 40 USD en espèces aux postes-frontières terrestres',
      procedure: "Demandez uniquement sur le portail gouvernemental officiel — les sites clones facturant 80 à 100 USD sont nombreux et bien référencés. L'application « Cambodia e-arrival » est obligatoire depuis le 1er septembre 2024 pour toute arrivée par avion. Une assurance couvrant hospitalisation et rapatriement est exigée. Visa touristique prolongeable une fois d'un mois.",
      sansVisaJours: 0,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Cambodge, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/cambodge/conseils-aux-voyageurs-entree-sejour' },
      // Refuse toute requête automatisée. Cité pour le lecteur, hors veille.
      { label: 'E-visa officiel du Cambodge', url: 'https://www.evisa.gov.kh/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 28, titre: "Déposer l'e-visa cambodgien", detail: "≈ 36 USD sur evisa.gov.kh uniquement — les sites clones facturent 80 à 100 USD." },
      { jours: 2, titre: "Remplir l'application « Cambodia e-arrival »", detail: "Obligatoire pour toute arrivée par avion depuis le 1er septembre 2024." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '117 ou 118' }, { label: 'Ambulance', numero: '119' }],
      ambassade: { ville: 'Phnom Penh', adresse: '1 boulevard Monivong, BP 18, Phnom Penh', telephone: '+855 23 260 010' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/cambodge/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 14 h avec une escale',
    accent: 'amber',
    resume:
      "Angkor justifie à lui seul le déplacement, mais le Cambodge se réduit trop souvent à trois jours de temples. Le pays qui l'entoure — la côte, le Mékong, les villages — est encore largement à l'écart du tourisme.",
    pourQui: "Passionnés d'histoire et d'architecture, voyageurs en circuit Vietnam–Cambodge, petits budgets.",
    incontournables: [
      "Angkor sur 3 jours minimum, à vélo ou en tuk-tuk, en commençant par les temples éloignés",
      "Phnom Penh : Tuol Sleng et Choeung Ek, difficiles mais nécessaires",
      "Battambang et le train de bambou, plus authentique que sa réputation",
      "Kampot et Kep, poivre et fruits de mer",
    ],
    horsSentiers: [
      "Koh Rong Sanloem plutôt que Koh Rong",
      "Les temples de Koh Ker et Beng Mealea, quasi déserts",
      "Le Mondolkiri et ses forêts, à l'est",
    ],
    erreurs: [
      "Acheter le pass Angkor à un intermédiaire : il ne se vend qu'au guichet officiel, avec photo",
      "Accepter un tuk-tuk « gratuit » vers un hôtel — la commission est dans votre note",
      "Payer en riels ce qui se paie en dollars : le pays fonctionne en USD, le riel sert de monnaie d'appoint",
      "Soutenir les orphelinats-tourisme : la quasi-totalité relève d'une industrie dénoncée par l'UNICEF",
    ],
  },
  {
    slug: 'coree-du-sud',
    nom: 'Corée du Sud', article: 'en', capitale: 'Séoul', monnaie: 'Won (KRW)',
    articleSujet: "la ",
    langue: 'Coréen', decalage: '+7 h en été, +8 h en hiver',
    budget: { routard: 55, confort: 100, premium: 200 },
    saisons: [1, 1, 2, 3, 3, 3, 1, 1, 3, 3, 2, 1],
    saisonNote:
      "Avril à juin et septembre à octobre : les deux fenêtres évidentes. Juillet-août : chaleur lourde et jangma, la saison des pluies. Décembre à février : très froid mais lumineux, et la saison de ski est correcte. L'automne coréen, en octobre, est l'un des plus beaux d'Asie.",
    visa: {
      resume: "Pas de visa pour un séjour touristique court. L'autorisation électronique K-ETA est actuellement suspendue pour les ressortissants français.",
      duree: "Jusqu'à 90 jours sans visa. Exemption de K-ETA prolongée jusqu'au 31 décembre 2026 par un avis du 20 mars 2026.",
      cout: "Gratuit — le K-ETA n'étant pas exigé. Le demander volontairement coûte 10 000 wons, non remboursables.",
      procedure: "Le K-ETA n'est pas exigé sur cette période, mais reste facultatif : le demander dispense de remplir la carte d'arrivée à l'atterrissage. Sans K-ETA, la carte d'arrivée électronique est à compléter avant l'entrée. L'exemption prend fin le 31 décembre 2026 : revérifiez pour tout voyage en 2027.",
      sansVisaJours: 90,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Corée du Sud, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/coree-du-sud/conseils-aux-voyageurs-entree-sejour' },
      { label: 'Portail officiel K-ETA', url: 'https://www.k-eta.go.kr/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 7, titre: 'Vérifier le statut du K-ETA', detail: "L'exemption court jusqu'au 31 décembre 2026. Pour un départ en 2027, le K-ETA pourrait redevenir obligatoire." },
      { jours: 3, titre: "Préparer la carte d'arrivée électronique", detail: "À compléter avant l'entrée si vous n'avez pas demandé de K-ETA." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '112' }, { label: 'Pompiers et ambulance', numero: '119' }],
      ambassade: { ville: 'Séoul', adresse: '43-12 Seosomun-ro, Seodaemun-gu, Séoul 03741', telephone: '+82 2 3149 4300' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/coree-du-sud/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 11 h à 13 h en direct vers Séoul-Incheon',
    accent: 'ink',
    resume:
      "Le meilleur secret d'Asie du Nord-Est. Une infrastructure au niveau du Japon pour 30 % moins cher, une scène culinaire et culturelle en pleine explosion, et un tourisme occidental encore modeste dès qu'on quitte Séoul.",
    pourQui: "Amateurs de villes, de randonnée, de cuisine ; voyageurs qui ont déjà fait le Japon.",
    incontournables: [
      "Séoul quartier par quartier : Bukchon, Seongsu, Mangwon",
      "Gyeongju, capitale du royaume de Silla, à vélo",
      "Busan et le marché de Jagalchi",
      "Le parc national de Seoraksan à l'automne",
    ],
    horsSentiers: [
      "L'île d'Ulleungdo, en mer de l'Est",
      "Andong et ses villages confucéens",
      "Le sentier Olle sur Jeju, 400 km de côte à pied",
    ],
    erreurs: [
      "Rester uniquement à Séoul : le KTX met Busan à 2 h 30",
      "Négliger la T-money : elle sert dans tous les transports et la plupart des supérettes",
      "Réserver un hôtel à Myeongdong « pour être au centre » — c'est le quartier le plus touristique et le moins intéressant",
    ],
  },
  {
    slug: 'indonesie',
    nom: 'Indonésie', article: 'en', capitale: 'Jakarta', monnaie: 'Roupie (IDR)',
    articleSujet: "l'",
    langue: 'Indonésien', decalage: '+6 h à +8 h selon les îles',
    budget: { routard: 30, confort: 60, premium: 140 },
    saisons: [1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    saisonNote:
      "Avril à octobre pour Bali, Java, Lombok et Komodo : c'est la saison sèche. Novembre à mars : pluies quotidiennes, souvent brèves, et prix en baisse. Attention, Sumatra et les Moluques ont un calendrier différent — l'archipel fait 5 000 km de large.",
    visa: {
      resume: "Visa à l'arrivée électronique (e-VOA) ou à un guichet dédié.",
      duree: "30 jours, prolongeable une fois de 30 jours.",
      cout: '≈ 500 000 IDR (≈ 30 €), plus 150 000 IDR (≈ 7,50 €) de taxe touristique à Bali',
      procedure: "L'e-VOA se demande en ligne quelques jours avant le départ et évite une file d'attente réelle à Denpasar. Le formulaire douanier « All Indonesia » se remplit dans les 72 h précédant l'arrivée. Un billet de sortie du territoire est exigé, et le passeport doit être en excellent état — un document abîmé entraîne un refus d'entrée.",
      sansVisaJours: 0,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Indonésie, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/indonesie/conseils-aux-voyageurs-entree-sejour' },
      // Répond 403 à tout robot, systématiquement. Cité pour le lecteur, hors veille.
      { label: "Direction générale de l'immigration indonésienne", url: 'https://evisa.imigrasi.go.id/', surveillee: false },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 14, titre: "Demander l'e-VOA", detail: "≈ 500 000 IDR sur evisa.imigrasi.go.id — évite une vraie file d'attente à Denpasar." },
      { jours: 3, titre: 'Remplir le formulaire douanier « All Indonesia »', detail: "Dans les 72 h précédant l'arrivée. Prévoyez aussi 150 000 IDR de taxe touristique à Bali." },
      { jours: 30, titre: "Vérifier l'état du passeport", detail: "Un passeport abîmé entraîne un refus d'entrée et une reconduite — le contrôle est strict." },
    ],
    urgences: {
      numeros: [{ label: 'Police', numero: '110 ou 112' }, { label: 'Pompiers', numero: '113' }, { label: 'Ambulance', numero: '118 ou 119' }, { label: 'Recherche et sauvetage', numero: '115' }],
      ambassade: { ville: 'Jakarta', adresse: 'Jl. M.H. Thamrin 20, Jakarta 10350', telephone: '+62 21 2355 8000' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/indonesie/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 16 h à 18 h avec une escale',
    accent: 'teal',
    resume:
      "17 000 îles, dont trois que tout le monde visite. Bali est devenue difficile au sud, mais l'Indonésie reste le terrain de jeu le plus vaste d'Asie du Sud-Est — et l'un des rares où l'on peut encore arriver quelque part sans y croiser personne.",
    pourQui: "Surfeurs, plongeurs, randonneurs volcaniques, voyageurs au long cours.",
    incontournables: [
      "Bali centre et nord : Sidemen, Munduk, Amed — pas Canggu ni Seminyak",
      "Le Bromo et l'Ijen à Java-Est, en partant très tôt",
      "Komodo depuis Labuan Bajo, en bateau sur 2 à 3 jours",
      "Yogyakarta, Borobudur et Prambanan",
    ],
    horsSentiers: [
      "Les Raja Ampat, en Papouasie occidentale — cher, loin, inégalé",
      "Le lac Toba à Sumatra et l'île de Samosir",
      "Les Kei ou les Banda, dans les Moluques",
    ],
    erreurs: [
      "Sous-estimer le trafic du sud de Bali : 20 km peuvent prendre 1 h 30",
      "Louer un scooter sans permis A ni permis international — c'est la première cause de rapatriement sanitaire",
      "Réserver Komodo au meilleur prix : l'état des bateaux est très variable et les incidents ne sont pas rares",
      "Enchaîner trop d'îles : chaque changement coûte une journée entière",
    ],
  },
  {
    slug: 'philippines',
    nom: 'Philippines', article: 'aux', capitale: 'Manille', monnaie: 'Peso (PHP)',
    articleSujet: "les ",
    langue: 'Filipino et anglais', decalage: '+6 h en été, +7 h en hiver',
    budget: { routard: 30, confort: 60, premium: 130 },
    saisons: [3, 3, 3, 3, 2, 1, 1, 1, 1, 1, 2, 3],
    saisonNote:
      "Décembre à avril : sec, c'est la saison. Juin à novembre : mousson et surtout saison des typhons, qui touchent principalement le nord et l'est de l'archipel. Le sud (Palawan, Siargao) reste plus praticable, mais les annulations de vols intérieurs sont fréquentes de juillet à octobre.",
    visa: {
      resume: "Pas de visa pour un séjour touristique court avec un passeport français.",
      duree: "30 jours à l'entrée, prolongeables de 29 jours supplémentaires auprès du Bureau of Immigration, soit 59 jours au total.",
      cout: "Gratuit à l'entrée ; ≈ 3 030 PHP pour la prolongation sur place",
      procedure: "Un billet de sortie ou de continuation est exigé à l'embarquement. La carte eTravel est obligatoire : remplissez-la 72 h avant le départ, le QR code généré est réclamé par la compagnie et à l'arrivée. Une taxe d'aéroport peut s'ajouter si elle n'est pas incluse dans le billet.",
      sansVisaJours: 30,
    },
    sourcesVisa: [
      { label: "France Diplomatie — Philippines, entrée et séjour", url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/philippines/conseils-aux-voyageurs-entree-sejour' },
      { label: 'Bureau of Immigration', url: 'https://immigration.gov.ph/' },
      { label: 'eTravel Philippines', url: 'https://etravel.gov.ph/' },
      SOURCE_FD,
    ],
    demarches: [
      { jours: 3, titre: 'Remplir la carte eTravel', detail: "Obligatoire : le QR code généré est réclamé par la compagnie et à l'arrivée." },
      { jours: 21, titre: 'Réserver un billet de sortie du territoire', detail: "Exigé à l'embarquement. Un aller simple sans billet de continuation vaut un refus au départ de Paris." },
    ],
    urgences: {
      numeros: [{ label: 'Tous secours', numero: '911' }, { label: 'Centre antipoison, Manille', numero: '+63 2 8524 1078' }],
      ambassade: { ville: 'Manille', adresse: '21e étage, Ayala Triangle Gardens Tower 2, Paseo de Roxas, 1226 Makati, Metro Manila', telephone: '+63 2 8857 6900' },
      source: { label: 'France Diplomatie — Contacts utiles', url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/philippines/conseils-aux-voyageurs-contacts-utiles' },
    },
    verifieLe: '2026-09',
    volDepuisParis: '≈ 16 h à 18 h avec une escale',
    accent: 'amber',
    resume:
      "L'anglais partout, une hospitalité qui n'a pas d'équivalent régional, et les plus belles côtes d'Asie du Sud-Est. En contrepartie : la logistique la plus lourde de la liste, parce que tout se fait en avion ou en ferry.",
    pourQui: "Plongeurs, surfeurs, voyageurs à l'aise avec l'imprévu et les vols intérieurs.",
    incontournables: [
      "Palawan : El Nido et Coron, en island hopping",
      "Siargao pour le surf et les lagons",
      "Les rizières en terrasse de Banaue et Batad, au nord de Luzon",
      "Bohol et les Chocolate Hills",
    ],
    horsSentiers: [
      "Siquijor, à 1 h de ferry de Dumaguete",
      "Camiguin, l'île aux sept volcans",
      "La côte de Kalanggaman et Biliran, dans les Visayas orientales",
    ],
    erreurs: [
      "Prévoir moins de 3 h de battement entre deux vols intérieurs : les retards sont la norme",
      "Réserver Manille comme étape — mieux vaut transiter et repartir le jour même",
      "Voyager en octobre en pensant que la saison des typhons est finie",
      "Compter sur la carte bancaire hors des grandes villes : l'archipel fonctionne largement en espèces",
    ],
  },
];

/**
 * La bascule des règles datées.
 *
 * Une règle annoncée pour une date future doit rester fausse jusqu'à cette
 * date, puis devenir vraie sans intervention. Les outils « Puis-je entrer ? »
 * et « Itinéraire » lisent `sansVisaJours` et tranchent un séjour dessus :
 * s'il anticipe, ils refusent un séjour encore autorisé ; s'il retarde, ils
 * autorisent un séjour qui vaudra une amende à la sortie.
 *
 * Le site se reconstruit chaque jour. La bascule se fait donc d'elle-même le
 * matin du jour dit, et le texte de `duree` — qui annonce les deux régimes et
 * leurs dates — reste exact des deux côtés.
 */
for (const c of countries) {
  const bascule = c.visa.sansVisaJoursApres;
  if (bascule && new Date().toISOString().slice(0, 10) >= bascule.date) {
    c.visa.sansVisaJours = bascule.jours;
  }
}

export const bySlug = Object.fromEntries(countries.map((c) => [c.slug, c]));

/** Pays classés du moins cher au plus cher, pour les tableaux comparatifs. */
export const byBudget = [...countries].sort((a, b) => a.budget.routard - b.budget.routard);

/** Pour l'outil « meilleure saison » : les pays idéaux pour un mois donné (0 = janvier). */
export function bestForMonth(monthIndex: number): Country[] {
  return countries.filter((c) => c.saisons[monthIndex] === 3);
}
