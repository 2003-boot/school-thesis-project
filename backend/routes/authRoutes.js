import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import sendEmail from '../utils/sendEmail.js';



const router = express.Router();

//test route
router.get('/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: "tonemail@outlook.com", // mets ton email ici
      subject: "Test email Scolaris",
      text: "Si tu reçois ce message, tout fonctionne !",
      html: "<h1>Test réussi 🎉</h1>",
    });

    res.json({ success: true, message: "Email envoyé !" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "Erreur envoi email" });
  }
});

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;