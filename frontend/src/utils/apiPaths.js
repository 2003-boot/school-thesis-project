export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    CHANGE_PASSWORD: "/api/auth/change-password",
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESEND_VERIFICATION_CODE: '/api/auth/resend-verification-code',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  DOCUMENTS: {
    UPLOAD: "/api/documents/upload",
    GET_DOCUMENTS: "/api/documents",
    GET_DOCUMENT_BY_ID: (id) => `/api/documents/${id}`,
    UPDATE_DOCUMENT: (id) => `/api/documents/${id}`,
    DELETE_DOCUMENT: (id) => `/api/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS: "/api/ai/generate-flashcards",
    GENERATE_QUIZ: "/api/ai/generate-quiz",
    GENERATE_SUMMARY: "/api/ai/generate-summary",
    CHAT: "/api/ai/chat",
    EXPLAIN_CONCEPT: "/api/ai/explain-concept",
    SOCRATE_CHAT: '/ai/socrate-chat',
    GENERATE_MINDMAP:   '/api/ai/generate-mindmap',
    ANALYZE_WEAKNESSES: '/api/ai/analyze-weaknesses', 
    GET_CHAT_HISTORY: (documentId) => `/api/ai/chat-history/${documentId}`,
  },
  GAMIFICATION: {
    PROFILE:   '/api/gamification/profile',
    AWARD_XP:  '/api/gamification/award-xp',
  },

  SHARE: {
    CREATE:           '/api/share',
    GET_FOR_DOCUMENT: (documentId) => `/api/share/document/${documentId}`,
    REVOKE:           (token) => `/api/share/${token}`,
    GET_CONTENT:      (token) => `/api/share/${token}/content`,
  },

  FLASHCARDS: {
    GET_ALL_FLASHCARD_SETS:   "/api/flashcards",
    GET_FLASHCARDS_FOR_DOC:   (documentId) => `/api/flashcards/${documentId}`,
    TOGGLE_STAR:              (cardId) => `/api/flashcards/${cardId}/star`,
    DELETE_FLASHCARD_SET:     (id) => `/api/flashcards/${id}`,
    SRS_REVIEW:               (cardId) => `/api/flashcards/${cardId}/srs-review`,   // ← nouveau
    GET_DUE_CARDS:            (setId) => `/api/flashcards/${setId}/due`,             // ← nouveau
  },

  QUIZZES: {
    GET_QUIZZES_FOR_DOC: (documentId) => `/api/quizzes/${documentId}`,
    GET_QUIZ_BY_ID: (id) => `/api/quizzes/quiz/${id}`,
    SUBMIT_QUIZ: (id) => `/api/quizzes/${id}/submit`,
    GET_QUIZ_RESULTS: (id) => `/api/quizzes/${id}/results`,
    DELETE_QUIZ: (id) => `/api/quizzes/${id}`,
  },

  PROGRESS: {
    GET_DASHBOARD: "/api/progress/dashboard",
  },
};
