import ChatLog from '../models/ChatLog.js';
import { generateGeminiResponse } from '../services/geminiService.js';
import { generateChatResponse } from '../services/chatService.js';
import { AppError } from '../utils/AppError.js';

export const sendMessage = async (req, res) => {
  const { message, history } = req.body;

  if (!message || !message.trim()) {
    throw new AppError('Message is required.', 400);
  }

  const trimmedMessage = message.trim();
  let aiResponse;

  try {
    aiResponse = await generateGeminiResponse(trimmedMessage, history || []);
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

