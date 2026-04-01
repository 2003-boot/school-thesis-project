import express from 'express';
import {
  createShare,
  getDocumentShares,
  revokeShare,
  getSharedContent,
} from '../controllers/shareController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Route publique — pas d'auth requise
router.get('/:token/content', getSharedContent);

// Routes privées
router.use(protect);
router.post('/', createShare);
router.get('/document/:documentId', getDocumentShares);
router.delete('/:token', revokeShare);

export default router;