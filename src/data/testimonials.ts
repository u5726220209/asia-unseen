/**
 * Témoignages de lecteurs.
 *
 * ⚠️ CE FICHIER EST VOLONTAIREMENT VIDE.
 *
 * Un faux avis est un faux avis, même « pour l'exemple » : c'est interdit
 * (article L.121-4 du Code de la consommation, directive Omnibus), c'est
 * sanctionné par Google au titre des règles sur le contenu trompeur, et ça
 * détruit exactement la crédibilité que ce site cherche à construire.
 *
 * Le bloc « Ils ont utilisé ces guides » de la page d'accueil ne s'affiche
 * pas tant que ce tableau est vide. Remplissez-le avec de vrais retours,
 * obtenus par email ou via le formulaire de contact, et avec l'accord
 * explicite de leurs auteurs.
 */
export type Testimonial = {
  quote: string;
  auteur: string;
  contexte: string;   // ex. « Vietnam, mars 2026 »
  /** Preuve conservée de l'accord de publication (email, capture, date). */
  consentement: string;
};

export const testimonials: Testimonial[] = [];
