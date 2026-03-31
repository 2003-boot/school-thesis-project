/**
 * Algorithme de répétition espacée SM-2
 * 
 * Qualités de réponse :
 *   0 = Blackout (oubli total)       → réinitialise
 *   1 = À revoir (difficile)         → répète bientôt
 *   2 = Difficile (avec hésitation)  → intervalle court
 *   3 = Bien (rappel correct)        → intervalle normal
 *   4 = Facile (rappel immédiat)     → long intervalle
 * 
 * On expose 4 boutons côté UI : "À revoir"(1), "Difficile"(2), "Bien"(3), "Facile"(4)
 */

/**
 * Calcule le prochain état SRS d'une carte
 * @param {Object} card - carte actuelle avec {interval, easeFactor, repetitions}
 * @param {number} quality - qualité de réponse (0–4)
 * @returns {{ interval, easeFactor, repetitions, nextReview }}
 */
export const calculateNextReview = (card, quality) => {
  let { interval = 1, easeFactor = 2.5, repetitions = 0 } = card;

  // Si la réponse est mauvaise (< 3), on repart de zéro
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    // Calcul de l'intervalle selon SM-2
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Mise à jour du facteur de facilité
  easeFactor = easeFactor + (0.1 - (4 - quality) * (0.08 + (4 - quality) * 0.02));
  easeFactor = Math.max(1.3, easeFactor); // ne descend jamais en dessous de 1.3

  // Date de prochaine révision
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { interval, easeFactor, repetitions, nextReview };
};

/**
 * Filtre les cartes dues pour révision (nextReview <= maintenant ou jamais révisées)
 * @param {Array} cards
 * @returns {Array} cartes à réviser
 */
export const getDueCards = (cards) => {
  const now = new Date();
  return cards.filter(card =>
    !card.nextReview || new Date(card.nextReview) <= now
  );
};

/**
 * Trie les cartes dues : d'abord les plus en retard, puis les nouvelles
 * @param {Array} cards
 * @returns {Array}
 */
export const sortDueCards = (cards) => {
  return [...cards].sort((a, b) => {
    if (!a.nextReview) return 1;  // nouvelles cartes à la fin
    if (!b.nextReview) return -1;
    return new Date(a.nextReview) - new Date(b.nextReview); // plus en retard en premier
  });
};