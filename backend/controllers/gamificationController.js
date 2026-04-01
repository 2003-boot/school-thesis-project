import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import { calculateLevel, BADGES, awardXP, checkAndAwardBadges, XP_REWARDS } from '../utils/gamification.js';

// @desc    Récupérer le profil gamification de l'utilisateur
// @route   GET /api/gamification/profile
// @access  Private
export const getGamificationProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('username xp level badges xpHistory');

    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

    // Stats pour vérification des badges
    const [completedQuizList, totalDocuments, flashcardSets] = await Promise.all([
      Quiz.find({ userId: req.user._id, completedAt: { $ne: null } }),
      Document.countDocuments({ userId: req.user._id }),
      Flashcard.find({ userId: req.user._id }),
    ]);

    const perfectQuizzes    = completedQuizList.filter(q => q.score === 100).length;
    const highScoreQuizzes  = completedQuizList.filter(q => q.score >= 80).length;
    let masteredCards       = 0;
    const mindMapsGenerated = user.xpHistory.filter(
      h => h.reason === 'Mind map générée'
    ).length;

    flashcardSets.forEach(set => {
      masteredCards += set.cards.filter(c => (c.repetitions || 0) >= 1).length;
    });

    // Streak
    const allDates = new Set();
    completedQuizList.forEach(q => {
      if (q.completedAt) allDates.add(q.completedAt.toISOString().split('T')[0]);
    });
    flashcardSets.forEach(set => {
      set.cards.forEach(card => {
        if (card.lastReviewed) allDates.add(new Date(card.lastReviewed).toISOString().split('T')[0]);
      });
    });

    const sortedDates = [...allDates].sort().reverse();
    let streak = 0;
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = (new Date(sortedDates[i-1]) - new Date(sortedDates[i])) / 86400000;
        if (diff === 1) streak++;
        else break;
      }
    }

    const stats = {
      completedQuizzes: completedQuizList.length,
      perfectQuizzes,
      highScoreQuizzes,
      totalDocuments,
      masteredCards,
      streak,
      mindMapsGenerated,
    };

    // Vérifier et attribuer de nouveaux badges
    const newBadges = await checkAndAwardBadges(user, stats);
    if (newBadges.length > 0) {
      user.badges.push(...newBadges);
      await user.save();
    }

    const levelInfo = calculateLevel(user.xp);

    // Enrichir les badges avec leurs métadonnées
    const enrichedBadges = user.badges.map(b => ({
      ...b.toObject(),
      ...(Object.values(BADGES).find(bd => bd.id === b.id) || {}),
    }));

    // Tous les badges (débloqués + verrouillés)
    const allBadges = Object.values(BADGES).map(badge => ({
      ...badge,
      unlocked:   enrichedBadges.some(b => b.id === badge.id),
      unlockedAt: enrichedBadges.find(b => b.id === badge.id)?.unlockedAt || null,
    }));

    res.status(200).json({
      success: true,
      data: {
        xp:        user.xp,
        level:     levelInfo,
        badges:    allBadges,
        newBadges: newBadges.map(b => Object.values(BADGES).find(bd => bd.id === b.id)),
        xpHistory: user.xpHistory.slice(-10).reverse(),
        stats,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Attribuer XP après une action
// @route   POST /api/gamification/award-xp
// @access  Private
export const awardXPAction = async (req, res, next) => {
  try {
    const { action, metadata } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });

    let amount = 0;
    let reason = '';

    switch (action) {
      case 'QUIZ_COMPLETE':
        amount = XP_REWARDS.QUIZ_COMPLETE;
        reason = 'Quiz complété';
        if (metadata?.score === 100) { amount += XP_REWARDS.QUIZ_PERFECT;  reason = 'Quiz parfait !'; }
        else if (metadata?.score >= 80) { amount += XP_REWARDS.QUIZ_ABOVE_80 - XP_REWARDS.QUIZ_COMPLETE; reason = 'Excellent score !'; }
        break;
      case 'SRS_SESSION':
        amount = XP_REWARDS.SRS_SESSION;
        reason = 'Session de révision SRS';
        break;
      case 'DOCUMENT_UPLOAD':
        amount = XP_REWARDS.DOCUMENT_UPLOAD;
        reason = 'Document importé';
        break;
      case 'MINDMAP_GENERATE':
        amount = XP_REWARDS.MINDMAP_GENERATE;
        reason = 'Mind map générée';
        break;
      case 'FLASHCARD_MASTER':
        amount = XP_REWARDS.FLASHCARD_MASTER;
        reason = 'Flashcard maîtrisée';
        break;
      default:
        return res.status(400).json({ success: false, error: 'Action inconnue' });
    }

    await awardXP(user, amount, reason);
    await user.save();

    const levelInfo = calculateLevel(user.xp);

    res.status(200).json({
      success: true,
      data: { xp: user.xp, level: levelInfo, awarded: amount, reason },
      message: `+${amount} XP — ${reason}`
    });
  } catch (error) {
    next(error);
  }
};