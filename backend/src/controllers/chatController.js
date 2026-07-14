import ChatLog from '../models/ChatLog.js';
import { generateChatResponse } from '../services/chatService.js';
import { AppError } from '../utils/AppError.js';

export const sendMessage = async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    throw new AppError('Message is required.', 400);
  }

  const response = generateChatResponse(message.trim());

  const chatLog = await ChatLog.create({
    userId: req.user._id,
    message: message.trim(),
    response,
    timestamp: new Date(),
  });

  res.status(201).json({ success: true, data: chatLog });
};

export const getChatHistory = async (req, res) => {
  const filter = req.user.role === 'admin' && req.query.userId
    ? { userId: req.query.userId }
    : { userId: req.user._id };

  const history = await ChatLog.find(filter).sort({ timestamp: -1 }).limit(100);

  res.json({ success: true, count: history.length, data: history.reverse() });
};

export default { sendMessage, getChatHistory };
