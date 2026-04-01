import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const createShare = async (documentId) => {
  try {
    const response = await axiosInstance.post(API_PATHS.SHARE.CREATE, { documentId });
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur création du lien' };
  }
};

const getDocumentShares = async (documentId) => {
  try {
    const response = await axiosInstance.get(API_PATHS.SHARE.GET_FOR_DOCUMENT(documentId));
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur récupération des partages' };
  }
};

const revokeShare = async (token) => {
  try {
    const response = await axiosInstance.delete(API_PATHS.SHARE.REVOKE(token));
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Erreur révocation du lien' };
  }
};

const getSharedContent = async (token) => {
  try {
    const response = await axiosInstance.get(API_PATHS.SHARE.GET_CONTENT(token));
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Lien invalide ou expiré' };
  }
};

const shareService = { createShare, getDocumentShares, revokeShare, getSharedContent };
export default shareService;