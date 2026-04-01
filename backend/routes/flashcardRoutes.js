import express from 'express';
import {
  getFlashcards,
  getAllFlashcardSets,
  toggleStarFlashcard,
  deleteFlashcardSet,
  srsReview,         
  getDueFlashcards,
} from '../controllers/flashcardController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllFlashcardSets);
router.get('/:documentId', getFlashcards);
router.post('/:cardId/srs-review', srsReview);         
router.get('/:flashcardSetId/due', getDueFlashcards);
router.put('/:cardId/star', toggleStarFlashcard);
router.delete('/:id', deleteFlashcardSet);

export default router;