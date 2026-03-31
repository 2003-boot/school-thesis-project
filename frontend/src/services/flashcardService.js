import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getAllFlashcardSets = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.FLASHCARDS.GET_ALL_FLASHCARD_SETS);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch flashcard sets' };
  }
};

const getFlashcardsForDocument = async (documentId) => {
  try {
    const response = await axiosInstance.get(API_PATHS.FLASHCARDS.GET_FLASHCARDS_FOR_DOC(documentId));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch flashcards' };
  }
};

const reviewFlashcard = async (cardId, cardIndex) => {
    try {
        const response = await axiosInstance.post(API_PATHS.FLASHCARDS.REVIEW_FLASHCARD(cardId), { cardIndex });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to review flashcard' };
    }
};

const toggleStar = async (cardId) => {
    try {
        const response = await axiosInstance.put(API_PATHS.FLASHCARDS.TOGGLE_STAR(cardId));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to star flashcard' };
    }
};

const deleteFlashcardSet = async (id) => {
    try {
        const response = await axiosInstance.delete(API_PATHS.FLASHCARDS.DELETE_FLASHCARD_SET(id));
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete flashcards' };
    }
};

const srsReview = async (cardId, quality) => {
  try {
    const response = await axiosInstance.post(
      API_PATHS.FLASHCARDS.SRS_REVIEW(cardId),
      { quality }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur SRS review' };
  }
};

const getDueCards = async (flashcardSetId) => {
  try {
    const response = await axiosInstance.get(
      API_PATHS.FLASHCARDS.GET_DUE_CARDS(flashcardSetId)
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur récupération cartes dues' };
  }
};


const flashcardService = {
  getAllFlashcardSets,
  getFlashcardsForDocument,
  reviewFlashcard,
  toggleStar,
  deleteFlashcardSet,
  srsReview,    
  getDueCards,  
};



export default flashcardService;
