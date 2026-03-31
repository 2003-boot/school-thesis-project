import express from 'express';
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  chat,
  explainConcept,
  getChatHistory,
  socrateChat,
  generateMindMap,
} from '../controllers/aiController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/generate-flashcards', generateFlashcards);
router.post('/generate-quiz', generateQuiz);
router.post('/generate-summary', generateSummary);
router.post('/chat', chat);
router.post('/explain-concept', explainConcept);
router.post('/socrate-chat', socrateChat);
router.post('/generate-mindmap', generateMindMap);
router.get('/chat-history/:documentId', getChatHistory);

export default router;