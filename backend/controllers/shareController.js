import crypto from 'crypto';
import Share from '../models/Share.js';
import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';

// @desc    Créer un lien de partage pour un document
// @route   POST /api/share
// @access  Private
export const createShare = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ success: false, error: 'documentId requis', statusCode: 400 });
    }

    const document = await Document.findOne({ _id: documentId, userId: req.user._id });
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document introuvable', statusCode: 404 });
    }

    // Vérifier si un partage actif existe déjà
    const existing = await Share.findOne({ documentId, ownerId: req.user._id, isActive: true });
    if (existing) {
      return res.status(200).json({
        success: true,
        data: { token: existing.token, shareUrl: `${process.env.FRONTEND_URL}/shared/${existing.token}` },
        message: 'Lien de partage existant'
      });
    }

    // Générer un token unique
    const token = crypto.randomBytes(24).toString('hex');

    const share = await Share.create({
      documentId,
      ownerId: req.user._id,
      token,
    });

    res.status(201).json({
      success: true,
      data: {
        token: share.token,
        shareUrl: `${process.env.FRONTEND_URL}/shared/${share.token}`,
      },
      message: 'Lien de partage créé'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Récupérer tous les partages d'un document
// @route   GET /api/share/document/:documentId
// @access  Private
export const getDocumentShares = async (req, res, next) => {
  try {
    const shares = await Share.find({
      documentId: req.params.documentId,
      ownerId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: shares });
  } catch (error) {
    next(error);
  }
};

// @desc    Révoquer un lien de partage
// @route   DELETE /api/share/:token
// @access  Private
export const revokeShare = async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token, ownerId: req.user._id });

    if (!share) {
      return res.status(404).json({ success: false, error: 'Lien introuvable', statusCode: 404 });
    }

    share.isActive = false;
    await share.save();

    res.status(200).json({ success: true, message: 'Lien de partage révoqué' });
  } catch (error) {
    next(error);
  }
};

// @desc    Accéder à un document partagé (public — sans auth)
// @route   GET /api/share/:token/content
// @access  Public
export const getSharedContent = async (req, res, next) => {
  try {
    const share = await Share.findOne({ token: req.params.token, isActive: true });

    if (!share) {
      return res.status(404).json({ success: false, error: 'Lien invalide ou expiré', statusCode: 404 });
    }

    // Vérifier expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      share.isActive = false;
      await share.save();
      return res.status(410).json({ success: false, error: 'Lien expiré', statusCode: 410 });
    }

    // Incrémenter le compteur d'accès
    share.accessCount += 1;
    await share.save();

    const document = await Document.findById(share.documentId)
      .select('title fileName fileSize uploadDate status filePath');

    if (!document) {
      return res.status(404).json({ success: false, error: 'Document introuvable', statusCode: 404 });
    }

    // Flashcards publiques (sans données SRS personnelles)
    const flashcardSets = await Flashcard.find({ documentId: share.documentId })
      .select('cards createdAt')
      .lean();

    // Nettoyer les données SRS personnelles des cartes
    const cleanSets = flashcardSets.map(set => ({
      ...set,
      cards: set.cards.map(({ question, answer, difficulty, _id }) => ({
        _id, question, answer, difficulty
      }))
    }));

    // Quiz publics
    const quizzes = await Quiz.find({ documentId: share.documentId })
      .select('title questions totalQuestions createdAt')
      .lean();

    // Nettoyer les réponses correctes des quiz (l'invité doit trouver lui-même)
    const cleanQuizzes = quizzes.map(q => ({
      ...q,
      questions: q.questions.map(({ question, options, difficulty, _id }) => ({
        _id, question, options, difficulty
      }))
    }));

    res.status(200).json({
      success: true,
      data: {
        document,
        flashcardSets: cleanSets,
        quizzes: cleanQuizzes,
        sharedAt: share.createdAt,
        accessCount: share.accessCount,
      }
    });
  } catch (error) {
    next(error);
  }
};