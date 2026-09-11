/**
 * Le journal des corrections, en anglais.
 *
 * La page d'accueil anglaise promet deux fois que « la correction est publiée
 * à côté de ce que nous disions avant ». Elle le promettait sans qu'aucune
 * page anglaise ne le montre : le journal n'existait qu'en français. Ce n'est
 * pas un manque de contenu, c'est une promesse non tenue — et sur un site dont
 * la crédibilité est le seul actif, c'est la pire espèce de défaut.
 *
 * Un fichier à part plutôt qu'un champ dans chaque entrée : le journal
 * français est alimenté à la main après chaque audit, et rien ne doit rendre
 * ce geste plus lourd. La traduction suit, et `verifier-config.mjs` refuse la
 * mise en ligne si elle prend du retard — sans quoi la version anglaise
 * afficherait un journal partiel en le présentant comme complet, ce qui serait
 * pire que pas de journal du tout.
 *
 * La clé est l'ancre de la correction, pas son titre : un titre se reformule.
 */

export type CorrectionEn = {
  titre: string;
  avant: string;
  apres: string;
  /** Le libellé de la page concernée, en anglais. */
  pageLabel: string;
  /**
   * Le libellé de la source, en anglais — quand il est de nous.
   *
   * La distinction n'est pas cosmétique. « France Diplomatie — Vietnam, entrée
   * et séjour » est le nom d'une page du ministère français : le traduire
   * rendrait la source plus difficile à retrouver, et la source est ce que ce
   * site vend. En revanche « portail officiel du ministère de la Justice
   * coréen » est notre description d'une page coréenne — rien n'oblige un
   * lecteur anglophone à la lire en français.
   *
   * Absent, le libellé français est conservé tel quel : c'est un nom propre.
   */
  sourceLabel?: string;
};

export const correctionsEn: Record<string, CorrectionEn> = {
  'c-2026-09-04-thailande': {
    pageLabel: 'Thailand',
    titre: 'The country page announced the 15 September rule eleven days before it applied',
    avant:
      '30-day visa exemption for tourist stays, since 15 September 2026. It was 60 days previously.',
    apres:
      '60 days for an entry up to 14 September 2026, 30 days for an entry from the 15th. The reduction was published on 31 August, and the page was already writing it in the past tense: someone leaving that week read that they were entitled to thirty days, when they had sixty. The visa guide was saying the opposite at the same moment, and the guide was right. The page now carries both regimes with their dates, and the number the tools decide on switches over by itself on the morning of the 15th — with nobody having to remember. The publication check now refuses a dated rule whose second regime is not announced to the reader.',
  },
  'c-2026-09-04-vietnam': {
    sourceLabel: 'Đường sắt Việt Nam — official fare table, train SE1',
    pageLabel: 'Vietnam',
    titre: 'The correction to the Hanoi–Saigon train time had forgotten the country page',
    avant: 'Underestimating distances: Hanoi to Saigon by train is 33 hours',
    apres:
      '32 h 45, the time read from the official SE1 timetable. The figure had been corrected the previous day in two guides, and the journal told the reader that a sentinel would from now on refuse any page saying otherwise. It would not have: it checked that an amount appears where it is expected, never that a stale value is lurking elsewhere. It was lurking here, on the country page and in its printable version. The check now asks the question both ways, and it was deliberately made to fail on this exact case before being adopted.',
  },
  'c-2026-09-04-chine': {
    sourceLabel: 'Chinese embassy in France — extension of the reduced visa fees',
    pageLabel: 'China',
    titre: 'The Chinese visa was quoted at 126 €; consular fees are 45 €',
    avant: 'Free under the waiver; ≈ 126 € for an L visa lodged at a centre',
    apres:
      'The Chinese embassy in France publishes 45 € in consular fees for a single-entry visa, a reduced rate extended to 31 December 2026 for Schengen-area nationals. The 126 € was the full rate from before the successive reductions of the last two years. Service fees at the lodging centre are added on top, bringing the total to around 110 €: we could not open the Paris centre\'s official fee schedule, whose link leads to an inaccessible PDF, so that total remains an order of magnitude. The 45 € comes from the embassy itself.',
  },
  'c-2026-09-04-transports-asie': {
    sourceLabel: 'Đường sắt Việt Nam — official fare table, train SE1',
    pageLabel: 'Transport in Asia',
    titre: 'Two guides said 33 hours of train where the site wrote 32 h 45 elsewhere',
    avant: 'Hanoi to Saigon in one go is 33 hours: nobody should do that.',
    apres:
      '32 h 45 on the SE1 night train — leaving Hanoi at 21:45, arriving in Saigon at 06:30 on the second morning. That is the duration the article devoted to this line had published since launch, official timetable in hand; two guides announced another. A quarter of an hour has never hurt anyone, but it proved that nothing connected those three pages to each other. The duration is now in the register of published figures: the sentinel refuses publication if one of them starts saying something else again.',
  },
  'c-2026-09-03-thailande': {
    pageLabel: 'Thailand',
    titre: 'The visa exemption drops from 60 to 30 days on 15 September 2026',
    avant:
      '60 days at present, but a reduction to 30 days is announced as imminent by the French authorities.',
    apres:
      'The reduction is no longer an announcement: it has a date. The Thai Ministry of the Interior published four regulations in the Royal Gazette on 31 August 2026, and the exemption drops to 30 days on 15 September. Two points appeared nowhere on this page: land entries are now limited to two visa-free crossings per calendar year, and a single extension of up to 30 days can be requested at an immigration office. A traveller who entered before 15 September keeps the length granted on arrival.',
  },
  'c-2026-09-03-thailande-2': {
    sourceLabel: 'Thailand Digital Arrival Card — official portal',
    pageLabel: 'Thailand',
    titre: 'An official source cited since launch no longer led anywhere',
    avant: 'Thai Ministry of Foreign Affairs — https://www.mfa.go.th/en/publicservice/visa',
    apres:
      'That address serves a "PAGE NOT FOUND" page while answering HTTP 200. The daily watch could not see it: the page answers, its content no longer moves, no alert fires. It is replaced by the digital arrival card portal, which matches the formality actually required. A false 404 is more dangerous than a dead link — it looks like a source.',
  },
  'c-2026-08-31-blog-ou-dormir-a-bangkok': {
    sourceLabel: 'The Nation Thailand — rollout of the 20-baht flat fare',
    pageLabel: 'Where to stay in Bangkok',
    titre: 'The flat-fare network has eight lines, not thirteen',
    avant: '13 lines, nearly 200 stations.',
    apres:
      'Eight lines and thirteen routes, 194 stations, about 277 kilometres. The confusion came from counting routes, which are often presented as a number of lines. The point that matters to the traveller is unchanged: that fare is reserved for Thai nationals.',
  },
  'c-2026-08-31-coree-du-sud': {
    sourceLabel: 'K-ETA — official portal of the Korean Ministry of Justice',
    pageLabel: 'South Korea',
    titre: 'The optional K-ETA is not free, contrary to what was written',
    avant: 'Cost: free.',
    apres:
      'Free because the K-ETA is not required until 31 December 2026 — but applying voluntarily costs 10,000 won, non-refundable even if refused. The word "free", without that nuance, implied the optional application was free too. The end date is also the one set by a notice of 20 March 2026, not an annual deadline.',
  },
  'c-2026-08-30-thailande': {
    pageLabel: 'Thailand',
    titre: 'The visa exemption drops from 60 to 30 days',
    avant: 'Exemption up to 60 days, extendable once locally.',
    apres:
      '60 days at present, but a reduction to 30 days is announced as imminent. Any stay planned beyond 30 days must be reconfirmed before departure.',
  },
  'c-2026-08-30-thailande-2': {
    sourceLabel: 'Thailand Digital Arrival Card — official portal',
    pageLabel: 'Thailand',
    titre: 'The digital arrival card (TDAC) is compulsory, not optional',
    avant: 'An online arrival declaration may be required: check before you leave.',
    apres:
      'Compulsory since 1 May 2025 for every entry by air, land or sea, to be filled in within the 3 days before arrival.',
  },
  'c-2026-08-30-coree-du-sud': {
    sourceLabel: 'Embassy of the Republic of Korea in France',
    pageLabel: 'South Korea',
    titre: 'The K-ETA is suspended for French nationals until 31 December 2026',
    avant:
      'The K-ETA may be required or suspended depending on the period — cost announced at ≈ 10,000 KRW.',
    apres:
      'Exemption in force from 1 January to 31 December 2026. The K-ETA remains optional: applying for it exempts you from the arrival card. Cost brought to zero.',
  },
  'c-2026-08-30-chine': {
    pageLabel: 'China',
    titre: 'The waiver covers 30 days and runs to 31 December 2026',
    avant: 'Short-stay waiver for tourism — with no duration and no end date.',
    apres:
      '30 days, for tourism, business, family visits, cultural exchange and transit. Emergency passports excluded. Passport valid 6 months beyond departure. Police registration within 24 hours.',
  },
  'c-2026-08-30-vietnam': {
    pageLabel: 'Vietnam',
    titre: 'The exemption is 45 days, and it is not extendable',
    avant: 'Visa-free for short stays — with no duration given.',
    apres:
      '45 days visa-free. Neither the exemption nor the e-visa is extendable locally. Online registration 72 hours before arrival at Ho Chi Minh City airport.',
  },
  'c-2026-08-30-philippines': {
    pageLabel: 'Philippines',
    titre: 'The extension has a figure, and eTravel is compulsory',
    avant: 'Extendable locally — with no duration and no cost. eTravel presented as a declaration.',
    apres:
      'A 29-day extension (59 in total) for ≈ 3,030 PHP. eTravel compulsory: the QR code is asked for by the airline and on arrival.',
  },
  'c-2026-08-30-indonesie': {
    pageLabel: 'Indonesia',
    titre: 'The Bali tourist levy has a figure',
    avant: 'A local tourist levy applies on entry to Bali — with no amount.',
    apres:
      '150,000 IDR (≈ 7.50 €) per entry. "All Indonesia" customs form within 72 hours. A damaged passport leads to refusal of entry.',
  },
  'c-2026-08-30-laos': {
    pageLabel: 'Laos',
    titre: 'Not every land border post issues a visa',
    avant: 'Visa on arrival at the main border posts.',
    apres:
      'The land crossings that issue a visa on arrival or accept the e-visa are limited: check yours before turning up. Missing an entry stamp carries a penalty of at least 200 USD.',
  },
  'c-2026-08-30-cambodge': {
    pageLabel: 'Cambodia',
    titre: 'The "Cambodia e-arrival" app is compulsory by air',
    avant: 'No mention of an arrival form.',
    apres:
      'Compulsory since 1 September 2024 for every arrival by plane. Insurance covering hospitalisation and repatriation is also required.',
  },
};
