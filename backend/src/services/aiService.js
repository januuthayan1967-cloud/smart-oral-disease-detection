import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { AppError } from '../utils/AppError.js';
import DISEASE_INFO, { getSeverity, getRecommendation } from '../utils/diseaseInfo.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

export const predictDisease = async (imagePath) => {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const response = await axios.post(`${AI_SERVICE_URL}/predict`, formData, {
      headers: formData.getHeaders(),
      timeout: 45000,
    });

    const { diseaseName, confidence, probabilities } = response.data;

    if (!diseaseName || confidence === undefined) {
      throw new AppError('Invalid response format received from AI prediction service.', 502);
    }

    const info = DISEASE_INFO[diseaseName] || DISEASE_INFO['Normal Teeth'];
    const severity = getSeverity(diseaseName, confidence);
    const recommendation = getRecommendation(diseaseName, severity);

    return {
      diseaseName,
      confidence,
      severity,
      probabilities: probabilities || {},
      description: info.description,
      causes: info.causes,
      treatmentSuggestions: info.treatmentSuggestions,
      preventionTips: info.preventionTips,
      recommendation,
    };
  } catch (error) {
    if (error.isAxiosError) {
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNABORTED'
      ) {
        throw new AppError('AI prediction service is temporarily unavailable. Please try again later.', 503);
      }
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'AI prediction service is temporarily unavailable. Please try again later.';
      throw new AppError(message, error.response?.status || 503);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('AI prediction service is temporarily unavailable. Please try again later.', 503);
  }
};

export default { predictDisease };
