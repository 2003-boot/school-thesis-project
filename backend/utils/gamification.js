// ── Définition des niveaux ────────────────────────────────────────────────
export const LEVELS = [
  { level: 1,  title: 'Débutant',     minXP: 0,    color: '#94a3b8' },
  { level: 2,  title: 'Apprenti',     minXP: 100,  color: '#60a5fa' },
  { level: 3,  title: 'Étudiant',     minXP: 300,  color: '#34d399' },
  { level: 4,  title: 'Studieux',     minXP: 600,  color: '#a78bfa' },
  { level: 5,  title: 'Avancé',       minXP: 1000, color: '#f59e0b' },
  { level: 6,  title: 'Expert',       minXP: 1500, color: '#f97316' },
  { level: 7,  title: 'Maître',       minXP: 2500, color: '#ef4444' },
  { level: 8,  title: 'Légende',      minXP: 4000, color: '#ec4899' },
];

// ── Définition des badges ─────────────────────────────────────────────────
export const BADGES = {
  FIRST_QUIZ:        { id: 'first_quiz',        label: 'Premier quiz',        desc: 'Compléter son premier quiz',                    icon: '🎯' },
  PERFECT_SCORE:     { id: 'perfect_score',     label: 'Score parfait',       desc: 'Obtenir 100% à un quiz',                        icon: '💯' },
  QUIZ_MASTER:       { id: 'quiz_master',       label: 'Quiz Master',         desc: 'Compléter 10 quiz',                             icon: '🏆' },
  FIRST_FLASHCARD:   { id: 'first_flashcard',   label: 'Première révision',   desc: 'Réviser ses premières flashcards',              icon: '🃏' },
  SRS_APPRENTICE:    { id: 'srs_apprentice',    label: 'Apprenti SRS',        desc: 'Maîtriser 10 flashcards via SRS',               icon: '🧠' },
  STREAK_3:          { id: 'streak_3',          label: 'Sur la lancée',       desc: 'Maintenir un streak de 3 jours',                icon: '🔥' },
  STREAK_7:          { id: 'streak_7',          label: 'Semaine parfaite',    desc: 'Maintenir un streak de 7 jours',                icon: '⚡' },
  FIRST_DOCUMENT:    { id: 'first_document',    label: 'Premier cours',       desc: 'Importer son premier document',                 icon: '📚' },
  SCHOLAR:           { id: 'scholar',           label: 'Érudit',              desc: 'Importer 5 documents',                          icon: '🎓' },
  HIGH_SCORER:       { id: 'high_scorer',       label: 'Bon élève',           desc: 'Obtenir plus de 80% à 5 quiz',                  icon: '⭐' },
  MIND_MAPPER:       { id: 'mind_mapper',       label: 'Cartographe',         desc: 'Générer sa première mind map',                  icon: '🗺️' },
  LEVEL_5:           { id: 'level_5',           label: 'Niveau 5',            desc: 'Atteindre le niveau Avancé',                    icon: '🚀' },
};

// ── XP par action ─────────────────────────────────────────────────────────
export const XP_REWARDS = {
  QUIZ_COMPLETE:    20,
  QUIZ_PERFECT:     50,
  QUIZ_ABOVE_80:    30,
  SRS_SESSION:      15,
  FLASHCARD_MASTER: 5,
  DOCUMENT_UPLOAD:  25,
  MINDMAP_GENERATE: 10,
};

// ── Calcul du niveau selon XP ─────────────────────────────────────────────
export const calculateLevel = (xp) => {
  let currentLevel = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) currentLevel = lvl;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.minXP > xp) || null;
  const progress  = nextLevel
    ? Math.round(((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100)
    : 100;
  return { current: currentLevel, next: nextLevel, progress };
};

// ── Vérifier et attribuer les nouveaux badges ─────────────────────────────
export const checkAndAwardBadges = async (user, stats) => {
  const existingIds   = user.badges.map(b => b.id);
  const newBadges     = [];
  const addBadge      = (badge) => {
    if (!existingIds.includes(badge.id)) {
      newBadges.push({ id: badge.id, unlockedAt: new Date() });
    }
  };

  const { completedQuizzes, perfectQuizzes, highScoreQuizzes,
          totalDocuments, masteredCards, streak, mindMapsGenerated } = stats;

  if (completedQuizzes >= 1)   addBadge(BADGES.FIRST_QUIZ);
  if (completedQuizzes >= 10)  addBadge(BADGES.QUIZ_MASTER);
  if (perfectQuizzes   >= 1)   addBadge(BADGES.PERFECT_SCORE);
  if (highScoreQuizzes >= 5)   addBadge(BADGES.HIGH_SCORER);
  if (masteredCards    >= 1)   addBadge(BADGES.FIRST_FLASHCARD);
  if (masteredCards    >= 10)  addBadge(BADGES.SRS_APPRENTICE);
  if (totalDocuments   >= 1)   addBadge(BADGES.FIRST_DOCUMENT);
  if (totalDocuments   >= 5)   addBadge(BADGES.SCHOLAR);
  if (streak           >= 3)   addBadge(BADGES.STREAK_3);
  if (streak           >= 7)   addBadge(BADGES.STREAK_7);
  if (mindMapsGenerated >= 1)  addBadge(BADGES.MIND_MAPPER);
  if (user.level       >= 5)   addBadge(BADGES.LEVEL_5);

  return newBadges;
};

// ── Ajouter XP à un utilisateur ───────────────────────────────────────────
export const awardXP = async (user, amount, reason) => {
  user.xp += amount;
  user.xpHistory.push({ amount, reason, createdAt: new Date() });

  // Recalculer le niveau
  const levelInfo = calculateLevel(user.xp);
  user.level = levelInfo.current.level;

  return user;
};