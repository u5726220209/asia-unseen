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
  capitale: string;
  monnaie: string;
  langue: string;
  decalage: string;
  /** Budget indicatif par personne et par jour, hors vol international (€). */
  budget: { routard: number; confort: number; premium: number };
  /** Note mensuelle, de janvier à décembre. */
  saisons: [Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison, Saison];
  saisonNote: string;
  visa: { resume: string; duree: string; cout: string; procedure: string };
  sourcesVisa: { label: string; url: string }[];
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
    langue: 'Vietnamien', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 25, confort: 55, premium: 120 },
    saisons: [2, 2, 3, 3, 2, 1, 1, 1, 2, 3, 3, 3],
    saisonNote:
      "Le Vietnam fait 1 650 km du nord au sud : il n'y a pas une saison, il y en a trois. Nord (Hanoï, Sapa, Ha Long) : octobre à avril. Centre (Hoi An, Hué, Da Nang) : février à août, avec un pic de pluie en octobre-novembre. Sud (Saïgon, Mékong, Phu Quoc) : décembre à avril. Un itinéraire nord-sud en mars ou en avril reste le meilleur compromis.",
    visa: {
      resume: "E-visa en ligne pour la majorité des séjours ; exemption courte durée pour les passeports français.",
      duree: "E-visa jusqu'à 90 jours, entrées simples ou multiples. Exemption sans visa pour les séjours courts.",
      cout: "≈ 25 USD (entrée simple) / 50 USD (entrées multiples)",
      procedure: "Demande sur le portail officiel de l'immigration, réponse en 3 à 5 jours ouvrés. N'utilisez jamais les sites intermédiaires qui facturent 3 à 5 fois le tarif.",
    },
    sourcesVisa: [
      { label: "Portail e-visa officiel du Vietnam", url: 'https://evisa.gov.vn/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
      "Sous-estimer les distances : Hanoï–Saïgon en train, c'est 33 heures",
      "Louer un scooter sans permis international valable : votre assurance ne couvrira rien",
    ],
  },
  {
    slug: 'thailande',
    nom: 'Thaïlande', article: 'en', capitale: 'Bangkok', monnaie: 'Baht (THB)',
    langue: 'Thaï', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 30, confort: 65, premium: 150 },
    saisons: [3, 3, 2, 2, 1, 1, 1, 1, 1, 2, 3, 3],
    saisonNote:
      "Novembre à mars : sec, respirable, c'est la haute saison et les prix suivent. Avril : 40 °C à Bangkok, mais c'est le mois de Songkran. Mai à octobre : mousson côté Andaman (Phuket, Krabi) — en revanche le golfe (Koh Samui, Koh Phangan) reste correct jusqu'en septembre et ne prend l'eau qu'en octobre-novembre. Les deux côtes n'ont pas la même saison : c'est la clé pour voyager hors des périodes chères.",
    visa: {
      resume: "Exemption de visa pour les séjours touristiques courts, avec une durée récemment allongée.",
      duree: "Exemption jusqu'à 60 jours, prolongeable une fois sur place auprès de l'immigration.",
      cout: "Gratuit à l'entrée ; ≈ 1 900 THB pour la prolongation sur place",
      procedure: "Rien à demander avant le départ, mais un billet de sortie du territoire peut vous être réclamé à l'embarquement. Une déclaration d'arrivée en ligne peut être exigée : vérifiez avant de partir.",
    },
    sourcesVisa: [
      { label: "Ministère thaïlandais des Affaires étrangères", url: 'https://www.mfa.go.th/en/publicservice/visa' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    },
    sourcesVisa: [
      { label: "Ambassade du Japon en France", url: 'https://www.fr.emb-japan.go.jp/' },
      { label: 'Visit Japan Web', url: 'https://www.vjw.digital.go.jp/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Mandarin', decalage: '+6 h en été, +7 h en hiver',
    budget: { routard: 40, confort: 80, premium: 170 },
    saisons: [1, 1, 2, 3, 3, 2, 1, 1, 3, 3, 2, 1],
    saisonNote:
      "Avril-mai et septembre-octobre, sans hésiter. Évitez la « semaine d'or » du 1er au 7 octobre : le pays entier est en déplacement. L'été est étouffant à Pékin et Shanghai, l'hiver mordant au nord. Le Yunnan et le Guangxi, au sud, restent agréables une bonne partie de l'année.",
    visa: {
      resume: "Un dispositif d'exemption de visa pour les ressortissants français est en vigueur, reconduit d'année en année. C'est la formalité la plus mouvante d'Asie : à revérifier systématiquement.",
      duree: "Exemption de courte durée pour le tourisme ; visa L classique au-delà. Transit sans visa possible dans de nombreuses villes.",
      cout: "Gratuit sous exemption ; ≈ 126 € pour un visa L déposé en centre",
      procedure: "Si vous relevez du visa classique : dépôt en centre de visa avec biométrie, comptez 4 à 10 jours ouvrés. Préparez itinéraire, réservations d'hôtel et vols confirmés.",
    },
    sourcesVisa: [
      { label: "Ambassade de Chine en France", url: 'http://fr.china-embassy.gov.cn/' },
      { label: 'Centre de demande de visa pour la Chine', url: 'https://bio.visaforchina.cn/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Lao', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 25, confort: 50, premium: 100 },
    saisons: [3, 3, 2, 2, 1, 1, 1, 1, 2, 3, 3, 3],
    saisonNote:
      "Novembre à février : sec et frais, c'est la fenêtre. Mars-avril : la saison des brûlis noie le nord du pays dans une brume épaisse — Luang Prabang perd une bonne partie de son intérêt. Mai à octobre : pluies, mais aussi rizières vert fluo et cascades pleines.",
    visa: {
      resume: "Visa touristique obtenu à l'arrivée ou en ligne, formalité simple.",
      duree: "30 jours, prolongeable sur place.",
      cout: "≈ 30 à 50 USD selon la nationalité et le point d'entrée",
      procedure: "E-visa en ligne pour éviter la file, ou visa à l'arrivée aux principaux postes frontières. Prévoyez une photo d'identité et des dollars en espèces en bon état.",
    },
    sourcesVisa: [
      { label: 'Portail e-visa officiel du Laos', url: 'https://laoevisa.gov.la/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Khmer', decalage: '+5 h en été, +6 h en hiver',
    budget: { routard: 28, confort: 55, premium: 115 },
    saisons: [3, 3, 3, 2, 1, 1, 1, 1, 2, 2, 3, 3],
    saisonNote:
      "Novembre à mars : sec, chaud, agréable. Avril-mai : la chaleur devient difficile, surtout sur les temples sans ombre. Juin à octobre : la mousson, mais aussi le meilleur moment pour Angkor — douves pleines, lumière verte, groupes divisés par trois.",
    visa: {
      resume: "E-visa touristique en ligne ou visa à l'arrivée.",
      duree: '30 jours.',
      cout: '≈ 36 USD (e-visa, frais de service inclus)',
      procedure: "Demandez uniquement sur le portail gouvernemental officiel — les sites clones facturant 80 à 100 USD sont nombreux et bien référencés.",
    },
    sourcesVisa: [
      { label: 'E-visa officiel du Cambodge', url: 'https://www.evisa.gov.kh/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Coréen', decalage: '+7 h en été, +8 h en hiver',
    budget: { routard: 55, confort: 100, premium: 200 },
    saisons: [1, 1, 2, 3, 3, 3, 1, 1, 3, 3, 2, 1],
    saisonNote:
      "Avril à juin et septembre à octobre : les deux fenêtres évidentes. Juillet-août : chaleur lourde et jangma, la saison des pluies. Décembre à février : très froid mais lumineux, et la saison de ski est correcte. L'automne coréen, en octobre, est l'un des plus beaux d'Asie.",
    visa: {
      resume: "Pas de visa pour un séjour touristique court ; une autorisation électronique (K-ETA) peut être requise ou suspendue selon les périodes.",
      duree: "Jusqu'à 90 jours sans visa.",
      cout: 'Gratuit (K-ETA ≈ 10 000 KRW lorsqu\'elle est exigée)',
      procedure: "Vérifiez impérativement le statut du K-ETA pour les ressortissants français avant le départ : le dispositif a été suspendu puis rétabli plusieurs fois. Déclaration douanière et Q-Code sanitaire à remplir en ligne.",
    },
    sourcesVisa: [
      { label: 'Portail officiel K-ETA', url: 'https://www.k-eta.go.kr/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Indonésien', decalage: '+6 h à +8 h selon les îles',
    budget: { routard: 30, confort: 60, premium: 140 },
    saisons: [1, 1, 2, 3, 3, 3, 3, 3, 3, 3, 2, 1],
    saisonNote:
      "Avril à octobre pour Bali, Java, Lombok et Komodo : c'est la saison sèche. Novembre à mars : pluies quotidiennes, souvent brèves, et prix en baisse. Attention, Sumatra et les Moluques ont un calendrier différent — l'archipel fait 5 000 km de large.",
    visa: {
      resume: "Visa à l'arrivée électronique (e-VOA) ou à un guichet dédié.",
      duree: "30 jours, prolongeable une fois de 30 jours.",
      cout: '≈ 500 000 IDR (≈ 30 €)',
      procedure: "L'e-VOA se demande en ligne quelques jours avant le départ et évite une file d'attente réelle à Denpasar. Une taxe touristique locale s'ajoute à l'entrée à Bali.",
    },
    sourcesVisa: [
      { label: "Direction générale de l'immigration indonésienne", url: 'https://evisa.imigrasi.go.id/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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
    langue: 'Filipino et anglais', decalage: '+6 h en été, +7 h en hiver',
    budget: { routard: 30, confort: 60, premium: 130 },
    saisons: [3, 3, 3, 3, 2, 1, 1, 1, 1, 1, 2, 3],
    saisonNote:
      "Décembre à avril : sec, c'est la saison. Juin à novembre : mousson et surtout saison des typhons, qui touchent principalement le nord et l'est de l'archipel. Le sud (Palawan, Siargao) reste plus praticable, mais les annulations de vols intérieurs sont fréquentes de juillet à octobre.",
    visa: {
      resume: "Pas de visa pour un séjour touristique court avec un passeport français.",
      duree: "30 jours à l'entrée, prolongeable sur place auprès du Bureau of Immigration.",
      cout: "Gratuit à l'entrée ; frais de prolongation sur place",
      procedure: "Un billet de sortie du territoire est réclamé à l'embarquement. Une déclaration d'arrivée électronique (eTravel) est à remplir dans les 72 h avant le vol.",
    },
    sourcesVisa: [
      { label: 'Bureau of Immigration', url: 'https://immigration.gov.ph/' },
      { label: 'eTravel Philippines', url: 'https://etravel.gov.ph/' },
      SOURCE_FD,
    ],
    verifieLe: '2026-08',
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

export const bySlug = Object.fromEntries(countries.map((c) => [c.slug, c]));

/** Pays classés du moins cher au plus cher, pour les tableaux comparatifs. */
export const byBudget = [...countries].sort((a, b) => a.budget.routard - b.budget.routard);

/** Pour l'outil « meilleure saison » : les pays idéaux pour un mois donné (0 = janvier). */
export function bestForMonth(monthIndex: number): Country[] {
  return countries.filter((c) => c.saisons[monthIndex] === 3);
}
