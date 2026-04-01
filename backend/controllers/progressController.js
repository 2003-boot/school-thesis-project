import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';

export const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // ── Counts de base ─────────────────────────────────────────────────
    const totalDocuments     = await Document.countDocuments({ userId });
    const totalFlashcardSets = await Flashcard.countDocuments({ userId });
    const totalQuizzes       = await Quiz.countDocuments({ userId });
    const completedQuizzes   = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

    // ── Stats flashcards ───────────────────────────────────────────────
    const flashcardSets = await Flashcard.find({ userId });
    let totalFlashcards   = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards  = 0;
    let srsLearned         = 0; // cartes avec repetitions >= 3

    flashcardSets.forEach(set => {
      totalFlashcards    += set.cards.length;
      reviewedFlashcards += set.cards.filter(c => c.reviewCount > 0).length;
      starredFlashcards  += set.cards.filter(c => c.isStarred).length;
      srsLearned         += set.cards.filter(c => (c.repetitions || 0) >= 3).length;
    });

    // ── Stats quiz ────────────────────────────────────────────────────
    const completedQuizList = await Quiz.find({ userId, completedAt: { $ne: null } })
      .sort({ completedAt: 1 });

    const averageScore = completedQuizList.length > 0
      ? Math.round(completedQuizList.reduce((s, q) => s + q.score, 0) / completedQuizList.length)
      : 0;

    const bestScore = completedQuizList.length > 0
      ? Math.max(...completedQuizList.map(q => q.score))
      : 0;

    // ── Historique des scores (7 derniers quiz) ───────────────────────
    const scoreHistory = completedQuizList.slice(-7).map(q => ({
      date:  q.completedAt?.toISOString().split('T')[0] || '',
      score: q.score,
      title: q.title?.substring(0, 20) || 'Quiz',
    }));

    // ── Streak réel (jours consécutifs d'activité) ───────────────────
    const allDates = new Set();

    // Jours avec quiz complété
    completedQuizList.forEach(q => {
      if (q.completedAt) allDates.add(q.completedAt.toISOString().split('T')[0]);
    });

    // Jours avec flashcard révisée
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
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = (prev - curr) / 86400000;
        if (diff === 1) streak++;
        else break;
      }
    }

    // ── Breakdown par difficulté (quiz) ──────────────────────────────
    let easyCorrect = 0, easyTotal = 0;
    let mediumCorrect = 0, mediumTotal = 0;
    let hardCorrect = 0, hardTotal = 0;

    completedQuizList.forEach(quiz => {
      quiz.questions.forEach((q, idx) => {
        const answer = quiz.userAnswers?.find(a => a.questionIndex === idx);
        if (!answer) return;
        if (q.difficulty === 'easy')   { easyTotal++;   if (answer.isCorrect) easyCorrect++;   }
        if (q.difficulty === 'medium') { mediumTotal++; if (answer.isCorrect) mediumCorrect++; }
        if (q.difficulty === 'hard')   { hardTotal++;   if (answer.isCorrect) hardCorrect++;   }
      });
    });

    const difficultyBreakdown = {
      easy:   { correct: easyCorrect,   total: easyTotal,   rate: easyTotal   > 0 ? Math.round(easyCorrect   / easyTotal   * 100) : null },
      medium: { correct: mediumCorrect, total: mediumTotal, rate: mediumTotal > 0 ? Math.round(mediumCorrect / mediumTotal * 100) : null },
      hard:   { correct: hardCorrect,   total: hardTotal,   rate: hardTotal   > 0 ? Math.round(hardCorrect   / hardTotal   * 100) : null },
    };

    // ── Activité récente ──────────────────────────────────────────────
    const recentDocuments = await Document.find({ userId })
      .sort({ lastAccessed: -1 }).limit(5)
      .select('title fileName lastAccessed status');

    const recentQuizzes = await Quiz.find({ userId })
      .sort({ createdAt: -1 }).limit(5)
      .populate('documentId', 'title')
      .select('title score totalQuestions completedAt');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalDocuments,
          totalFlashcardSets,
          totalFlashcards,
          reviewedFlashcards,
          starredFlashcards,
          srsLearned,
          totalQuizzes,
          completedQuizzes,
          averageScore,
          bestScore,
          streak,
        },
        scoreHistory,
        difficultyBreakdown,
        recentActivity: {
          documents: recentDocuments,
          quizzes:   recentQuizzes,
        },
      }
    });
  } catch (error) {
    next(error);
  }
};