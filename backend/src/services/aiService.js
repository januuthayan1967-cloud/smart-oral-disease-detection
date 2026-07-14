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
      timeout: 30000,
    });

    const { diseaseName, confidence } = response.data;
    const info = DISEASE_INFO[diseaseName] || DISEASE_INFO['Normal Teeth'];
    const severity = getSeverity(diseaseName, confidence);
    const recommendation = getRecommendation(diseaseName, severity);

    return {
      diseaseName,
      confidence,
      severity,
      description: info.description,
      causes: info.causes,
      treatmentSuggestions: info.treatmentSuggestions,
      preventionTips: info.preventionTips,
      recommendation,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new AppError('AI service is unavailable. Please try again later.', 503);
    }

    const message = error.response?.data?.error || 'Prediction failed.';
    throw new AppError(message, error.response?.status || 500);
  }
};

export default { predictDisease };
