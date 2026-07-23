import ChatLog from '../models/ChatLog.js';
import Prediction from '../models/Prediction.js';
import { generateGeminiResponse } from '../services/geminiService.js';
import { generateChatResponse } from '../services/chatService.js';
import { AppError } from '../utils/AppError.js';
import { evaluatePredictionRisk } from '../utils/riskRules.js';

export const sendMessage = async (req, res) => {
  const { message, history, predictionId, predictionContext } = req.body;

  if (!message || !message.trim()) {
    throw new AppError('Message is required.', 400);
  }

  const trimmedMessage = message.trim();
  let resolvedPredictionContext = null;

  // 1. Verify and fetch prediction context by predictionId if provided
  if (predictionId) {
    const prediction = await Prediction.findById(predictionId);
    if (prediction) {
      if (
        req.user.role !== 'admin' &&
        prediction.userId.toString() !== req.user._id.toString()
      ) {
        throw new AppError('Not authorized to access this prediction context.', 403);
      }
      const riskEval = evaluatePredictionRisk(prediction.diseaseName, prediction.confidence);
      resolvedPredictionContext = {
        predictionId: prediction._id,
        predictedClass: prediction.predictedClass || riskEval.rawClass,
        displayName: prediction.displayName || prediction.diseaseName || riskEval.displayName,
        confidence: prediction.confidence,
        confidencePercentage: prediction.confidencePercentage || Math.round(prediction.confidence || 0),
        riskLevel: prediction.riskLevel || riskEval.riskLevel,
        riskReason: prediction.riskReason || riskEval.riskReason,
        description: prediction.description,
        recommendation: prediction.recommendation,
      };
    }
  } else if (predictionContext && typeof predictionContext === 'object') {
    // 2. Direct prediction context passed from frontend
    const riskEval = evaluatePredictionRisk(
      predictionContext.displayName || predictionContext.predictedClass || predictionContext.diseaseName,
      predictionContext.confidence || predictionContext.confidencePercentage
    );
    resolvedPredictionContext = {
      predictedClass: predictionContext.predictedClass || riskEval.rawClass,
      displayName: predictionContext.displayName || predictionContext.diseaseName || riskEval.displayName,
      confidence: predictionContext.confidence || 0,
      confidencePercentage: predictionContext.confidencePercentage || Math.round(predictionContext.confidence || 0),
      riskLevel: predictionContext.riskLevel || riskEval.riskLevel,
      riskReason: predictionContext.riskReason || riskEval.riskReason,
      description: predictionContext.description || predictionContext.explanation || '',
      recommendation: predictionContext.recommendation || '',
    };
  }

  let aiResponse;

  try {
    aiResponse = await generateGeminiResponse(trimmedMessage, history || [], resolvedPredictionContext);
  } catch (error) {
    console.error('Gemini API Error in chatController:', error.message);
    // Fallback to local rule-based response if Gemini call fails unexpectedly
    aiResponse = generateChatResponse(trimmedMessage);
  }

  const chatLog = await ChatLog.create({
    userId: req.user._id,
    message: trimmedMessage,
    response: aiResponse,
    timestamp: new Date(),
  });

  res.status(201).json({
    success: true,
    response: aiResponse,
    data: chatLog,
  });
};

export const getChatHistory = async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.userId
    ? { userId: req.query.userId }
    : { userId: req.user._id };

  const history = await ChatLog.find(filter).sort({ timestamp: -1 }).limit(100);

  res.json({ success: true, count: history.length, data: history.reverse() });
};

export default { sendMessage, getChatHistory };
