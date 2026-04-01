import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const getProfile = async () => {
  try {
    const response = await axiosInstance.get(API_PATHS.GAMIFICATION.PROFILE);
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur récupération profil gamification' };
  }
};

const awardXP = async (action, metadata = {}) => {
  try {
    const response = await axiosInstance.post(API_PATHS.GAMIFICATION.AWARD_XP, { action, metadata });
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur attribution XP' };
  }
};

const gamificationService = { getProfile, awardXP };
export default gamificationService;