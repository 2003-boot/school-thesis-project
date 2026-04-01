import Flashcard from '../models/Flashcard.js';

// @desc    Get all flashcards for a document
// @route   GET /api/flashcards/:documentId
// @access  Private
export const getFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({
      userId: req.user._id,
      documentId: req.params.documentId
    })
      .populate('documentId', 'title fileName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcards.length,
      data: flashcards
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all flashcard sets for a user
// @route   GET /api/flashcards
// @access  Private
export const getAllFlashcardSets = async (req, res, next) => {
   try {
    const flashcardSets = await Flashcard.find({ userId: req.user._id })
      .populate('documentId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: flashcardSets.length,
      data: flashcardSets,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Toggle star/favorite on flashcard
// @route   PUT /api/flashcards/:cardId/star
// @access  Private
export const toggleStarFlashcard = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      'cards._id': req.params.cardId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Lot de flashcards ou carte introuvable',
        statusCode: 404
      });
    }

    const cardIndex = flashcardSet.cards.findIndex(
      (card) => card._id.toString() === req.params.cardId
    );

    if (cardIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Carte introuvable dans le lot',
        statusCode: 404
      });
    }

    flashcardSet.cards[cardIndex].isStarred =
      !flashcardSet.cards[cardIndex].isStarred;

    await flashcardSet.save();

    const isStarred = flashcardSet.cards[cardIndex].isStarred;

    res.status(200).json({
      success: true,
      data: {
        flashcardSet,
        cardId: req.params.cardId,
        isStarred
      },
      message: isStarred
        ? 'Flashcard ajoutée aux favoris'
        : 'Flashcard retirée des favoris'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete flashcard set
// @route   DELETE /api/flashcards/:id
// @access  Private
export const deleteFlashcardSet = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard set not found',
        statusCode: 404
      });
    }

    await flashcardSet.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

import { calculateNextReview, getDueCards, sortDueCards } from '../utils/srsAlgorithm.js';

// @desc    Soumettre une réponse SRS (qualité 1–4) sur une carte
// @route   POST /api/flashcards/:cardId/srs-review
// @access  Private
export const srsReview = async (req, res, next) => {
  try {
    const { quality } = req.body; // 1 = À revoir, 2 = Difficile, 3 = Bien, 4 = Facile

    if (quality === undefined || quality < 1 || quality > 4) {
      return res.status(400).json({
        success: false,
        error: 'La qualité doit être un entier entre 1 et 4',
        statusCode: 400
      });
    }

    const flashcardSet = await Flashcard.findOne({
      'cards._id': req.params.cardId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({ success: false, error: 'Carte introuvable', statusCode: 404 });
    }

    const cardIndex = flashcardSet.cards.findIndex(c => c._id.toString() === req.params.cardId);
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, error: 'Carte introuvable dans le lot', statusCode: 404 });
    }

    const card = flashcardSet.cards[cardIndex];
    const srsResult = calculateNextReview(card, quality);

    // Mise à jour de la carte
    flashcardSet.cards[cardIndex].interval     = srsResult.interval;
    flashcardSet.cards[cardIndex].easeFactor   = srsResult.easeFactor;
    flashcardSet.cards[cardIndex].repetitions  = srsResult.repetitions;
    flashcardSet.cards[cardIndex].nextReview   = srsResult.nextReview;
    flashcardSet.cards[cardIndex].lastReviewed = new Date();
    flashcardSet.cards[cardIndex].reviewCount  += 1;

    await flashcardSet.save();

    res.status(200).json({
      success: true,
      data: {
        cardId: req.params.cardId,
        nextReview: srsResult.nextReview,
        interval: srsResult.interval,
        repetitions: srsResult.repetitions,
      },
      message: `Prochaine révision dans ${srsResult.interval} jour(s)`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer les cartes dues pour révision (mode SRS)
// @route   GET /api/flashcards/:flashcardSetId/due
// @access  Private
export const getDueFlashcards = async (req, res, next) => {
  try {
    const flashcardSet = await Flashcard.findOne({
      _id: req.params.flashcardSetId,
      userId: req.user._id
    });

    if (!flashcardSet) {
      return res.status(404).json({ success: false, error: 'Lot de flashcards introuvable', statusCode: 404 });
    }

    const dueCards = sortDueCards(getDueCards(flashcardSet.cards));

    res.status(200).json({
      success: true,
      data: {
        dueCards,
        totalDue: dueCards.length,
        totalCards: flashcardSet.cards.length,
        newCards: dueCards.filter(c => !c.nextReview).length,
      },
      message: `${dueCards.length} carte(s) à réviser`
    });
  } catch (error) {
    next(error);
  }
};