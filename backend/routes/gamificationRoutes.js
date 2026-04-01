import express from 'express';
import { getGamificationProfile, awardXPAction } from '../controllers/gamificationController.js';
import protect from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/profile', getGamificationProfile);
router.post('/award-xp', awardXPAction);

export default router;