/**
 * The English prose for the nine country pages.
 *
 * POURQUOI CE FICHIER EXISTE À PART
 * Les nombres — jours d'exemption, budget quotidien, notes de saison — vivent
 * dans `countries.ts` et n'ont pas de langue. Seule la prose en a une. Les
 * séparer garde une seule source de vérité pour les faits : une durée de visa
 * ne peut pas diverger entre deux langues, puisqu'elle n'est écrite qu'une fois.
 *
 * CE QUI N'EST PAS ICI, ET POURQUOI
 * La prose de visa française — « 45 jours sans visa, e-visa au-delà » — n'a pas
 * d'équivalent ici, et c'est délibéré. Elle décrit la règle d'un passeport
 * français ; la traduire en anglais produirait une phrase fausse pour la moitié
 * de ses lecteurs. Les pages anglaises affichent la règle par passeport, celle
 * du modèle, avec sa source et sa date.
 *
 * Ce texte est écrit, pas traduit machinalement. Un site dont la valeur tient à
 * la précision ne peut pas se permettre une prose qui sonne comme une sortie de
 * traducteur automatique : le lecteur anglophone le sent en deux phrases, et il
 * cesse de croire les chiffres en même temps que la prose.
 */

export type ContenuEn = {
  resume: string;
  pourQui: string;
  saisonNote: string;
  erreurs: string[];
};

export const contenuEn: Record<string, ContenuEn> = {
  vietnam: {
    resume:
      'The best ratio of strangeness to price in South-East Asia, and it is not close. Street food with no equivalent anywhere, landscapes that change every 200 kilometres, and a country where three weeks still costs what one week in Japan does.',
    pourQui: 'A first trip to Asia, small budgets, people who travel for food, motorbike riders.',
    saisonNote:
      'Vietnam runs 1,650 km north to south, so there is no single season — there are three. North (Hanoi, Sapa, Ha Long): October to April. Centre (Hoi An, Hue): February to August. South (Ho Chi Minh City, the Mekong): December to April. Any itinerary covering the whole country will hit rain somewhere, and that is normal rather than bad planning.',
    erreurs: [
      'Booking Ha Long Bay from a street desk in Hanoi — half the boats sold that way are not the boat in the photograph',
      'Changing money at the airport, where the rate is 5 to 8 % worse than in town',
      'Underestimating distances: Hanoi to Saigon by train is 32 h 45',
      'Renting a scooter without a valid international licence — your insurance will not cover anything',
    ],
  },

  thailande: {
    resume:
      'The easiest country in Asia for a first trip: solid infrastructure, reliable transport, English spoken throughout the tourist economy. The flip side is that leaving the circuit takes a real effort — but the moment you do, Thailand becomes extraordinary again.',
    pourQui: 'A first trip, families, travellers who want city, mountains and coast without a fight.',
    saisonNote:
      'November to March: dry, breathable, high season, and prices follow. April: 40 °C in Bangkok, but it is the month of Songkran. May to October: monsoon on the Andaman side (Phuket, Krabi) — while the Gulf (Koh Samui, Koh Phangan) stays fine until September and only takes water in October and November. The two coasts do not share a season, and that is the key to travelling outside the expensive months.',
    erreurs: [
      'Accepting a tuk-tuk offering a tour “for 20 baht” — it is a circuit of shops, and you are the commission',
      'Buying a temple “closed today, come with me instead” story at the Grand Palace: the temples are not closed',
      'Booking a full-moon island in the same week without checking the party calendar first',
      'Treating the 15 September 2026 change as a detail: the date you enter the country decides how long you may stay',
    ],
  },

  japon: {
    resume:
      'The country that makes every trip afterwards harder. Expensive, yes — but far less so than people believe, once you leave international hotels and eat where Japanese people eat. The value of a 900-yen lunch is unbeatable.',
    pourQui: 'Independent travellers, people who love cities, design, hiking and food.',
    saisonNote:
      'April (cherry blossom) and November (maples) are magnificent — and full. May and early June are the best compromise of weather, crowds and price. Mid-June to mid-July is the rainy season. August is hot and humid in the cities but the right time for the northern Alps. Winter is excellent for the Sea of Japan coast and its snow.',
    erreurs: [
      'Buying the JR Pass by reflex: since the price rise it only pays off on a very specific itinerary',
      'Planning Tokyo and Kyoto only, and missing what makes the country — the smaller cities',
      'Arriving without a way to pay: many places are still cash-only despite the reputation',
      'Booking accommodation late for cherry-blossom season, when prices triple',
    ],
  },

  chine: {
    resume:
      'The most underrated country on this list. A high-speed rail network that leaves the rest of the world behind, landscapes with no equivalent, and Western tourism that never returned to its pre-2019 level. The barrier is neither safety nor cost: it is digital preparation.',
    pourQui: 'A second or third trip to Asia, organised travellers, people who love trains and open space.',
    saisonNote:
      'April–May and September–October, without hesitation. Avoid Golden Week, 1 to 7 October, when the entire country is travelling. Summer is stifling in Beijing and Shanghai, winter biting in the north. Yunnan and Guangxi, in the south, stay pleasant for most of the year.',
    erreurs: [
      'Arriving without a VPN installed and tested — Google, WhatsApp, Instagram and Gmail are unreachable',
      'Not linking a foreign card to Alipay or WeChat Pay before leaving: cash has largely disappeared from daily life',
      'Assuming train tickets can be found the day before — they open 15 days ahead and no earlier',
      'Overlooking the passport at hotel check-in: only certain establishments are licensed to take foreign guests',
    ],
  },

  laos: {
    resume:
      'The country where you slow down. Little infrastructure, few people, and since the high-speed railway opened, a transformed accessibility. Worth doing before that accessibility changes everything.',
    pourQui: 'Travellers without a plan, people drawn to rivers and mountains, long stays.',
    saisonNote:
      'November to February: dry and cool, this is the window. March and April: the slash-and-burn season drowns the north in thick haze — Luang Prabang loses much of its point. May to October: rain, but also fluorescent green rice terraces and full waterfalls.',
    erreurs: [
      'Relying on cash machines outside the cities — they are rare and often empty',
      'Leaving marked paths without asking first: some rural areas remain contaminated by unexploded ordnance',
      'Planning journeys by the kilometre: 200 km of mountain road is seven hours',
    ],
  },

  cambodge: {
    resume:
      'Angkor alone justifies the trip, but Cambodia too often shrinks to three days of temples. The country around them — the coast, the Mekong, the villages — is still largely outside tourism.',
    pourQui: 'People drawn to history and architecture, travellers on a Vietnam–Cambodia route, small budgets.',
    saisonNote:
      'November to March: dry, warm, comfortable. April and May: the heat becomes hard work, especially on temples with no shade. June to October: monsoon, but also the best time for Angkor — full moats, green light, and a third of the crowds.',
    erreurs: [
      'Buying the Angkor pass from an intermediary: it is only sold at the official counter, with a photograph',
      'Accepting a “free” tuk-tuk to a hotel — the commission is in your bill',
      'Paying in riel what is priced in dollars: the country runs on USD, with riel as small change',
      'Supporting orphanage tourism: almost all of it belongs to an industry UNICEF has publicly condemned',
    ],
  },

  'coree-du-sud': {
    resume:
      'The best-kept secret in North-East Asia. Infrastructure on a par with Japan for 30 % less, a food and culture scene in full expansion, and Western tourism that stays modest the moment you leave Seoul.',
    pourQui: 'People who love cities, hiking and food; travellers who have already done Japan.',
    saisonNote:
      'April to June and September to October are the two obvious windows. July and August bring heavy heat and jangma, the rainy season. December to February is very cold but bright, and the ski season is decent. Korean autumn, in October, is one of the finest in Asia.',
    erreurs: [
      'Staying only in Seoul: the KTX puts Busan two and a half hours away',
      'Skipping the T-money card — it works on every form of transport and in most convenience stores',
      'Booking a hotel in Myeongdong “to be central”: it is the most touristed and least interesting district',
    ],
  },

  indonesie: {
    resume:
      '17,000 islands, three of which everyone visits. Southern Bali has become hard work, but Indonesia remains the largest playground in South-East Asia — and one of the few places where you can still arrive somewhere and meet nobody.',
    pourQui: 'Surfers, divers, volcano hikers, long-haul travellers.',
    saisonNote:
      'April to October for Bali, Java, Lombok and Komodo: this is the dry season. November to March brings daily rain, often brief, and lower prices. Note that Sumatra and the Moluccas run on a different calendar — the archipelago is 5,000 km wide.',
    erreurs: [
      'Underestimating traffic in southern Bali: 20 km can take an hour and a half',
      'Renting a scooter without a motorcycle licence and an international permit — the leading cause of medical repatriation',
      'Booking Komodo on price alone: boat condition varies enormously and incidents are not rare',
      'Chaining too many islands: every change costs a full day',
    ],
  },

  philippines: {
    resume:
      'English everywhere, hospitality with no regional equivalent, and the finest coastline in South-East Asia. In exchange: the heaviest logistics on this list, because everything happens by plane or ferry.',
    pourQui: 'Divers, surfers, travellers comfortable with the unexpected and with domestic flights.',
    saisonNote:
      'December to April: dry, and this is the season. June to November: monsoon and above all typhoon season, which mainly hits the north and east of the archipelago. The south (Palawan, Siargao) stays more practicable, but domestic flight cancellations are common from July to October.',
    erreurs: [
      'Leaving less than three hours between two domestic flights — delays are the norm',
      'Booking Manila as a stop: better to transit and leave the same day',
      'Travelling in October believing typhoon season is over',
      'Counting on a bank card outside the main cities: the archipelago runs largely on cash',
    ],
  },
};
