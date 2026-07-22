import { GoogleGenerativeAI } from '@google/generative-ai';

const BASE_SYSTEM_INSTRUCTION = `You are a dedicated AI Dental Care Assistant integrated into the Smart Oral Disease Detection System.

Your core mission:
- Explain oral diseases, dental hygiene, and preventive oral care in simple, easy-to-understand language.
- Explain symptoms, potential causes, prevention strategies, and general oral health advice.
- When users share disease prediction results or query details from the MobileNetV3 AI disease detection tool, explain what the results mean clearly and constructively.
- Use friendly, professional, empathetic, and clear language.

LANGUAGE RULE:
Always detect the language of the user's latest message.

* Tamil script (Unicode range U+0B80–U+0BFF) → respond entirely in Tamil.
* English → respond in English.
* Mixed Tamil and English → naturally use the same mixed style.
The latest user message language has priority over previous conversation history.
If the user writes in Tamil, never respond entirely in English.
Do not translate a Tamil question into English before answering.
Do not answer a Tamil question in English unless the user explicitly asks for an English answer.

CRITICAL SAFETY & MEDICAL RULES:
1. NEVER claim to provide a definitive medical diagnosis.
2. NEVER prescribe medications or suggest specific drug dosages.
3. NEVER provide unsafe or unverified home treatment instructions.
4. ALWAYS emphasize that your advice is for general educational purposes only.
5. ALWAYS recommend consulting a qualified dentist or healthcare professional for proper evaluation and personalized treatment.
6. FOR URGENT OR SEVERE SYMPTOMS (e.g., severe unrelenting pain, facial swelling, difficulty breathing or swallowing, uncontrolled bleeding, high fever, or acute oral trauma): IMMEDIATELY advise the user to seek prompt emergency dental or medical care.`;

/**
 * Detect language of user message using Unicode script matching
 */
const detectLanguageDirective = (text = '') => {
  const hasTamil = /[\u0B80-\u0BFF]/.test(text);
  const hasEnglish = /[a-zA-Z]/.test(text);

  if (hasTamil && !hasEnglish) {
    return 'CRITICAL LANGUAGE DIRECTIVE: The user\'s latest message is written in Tamil script. You MUST write your ENTIRE response in Tamil (தமிழ்) script only. Do not reply in English.';
  }
  if (hasTamil && hasEnglish) {
    return 'CRITICAL LANGUAGE DIRECTIVE: The user\'s latest message mixes Tamil and English. You MUST respond naturally using the exact same mixed Tamil and English style (Tanglish / Tamil-English).';
  }
  return 'CRITICAL LANGUAGE DIRECTIVE: The user\'s latest message is in English. Respond in English.';
};

/**
 * Normalizes history items into Gemini chat format: [{ role: 'user' | 'model', parts: [{ text }] }]
 */
const normalizeHistory = (rawHistory = []) => {
  if (!Array.isArray(rawHistory)) return [];

  const formatted = [];
  for (const item of rawHistory) {
    if (!item) continue;
    let role = 'user';
    if (item.role === 'model' || item.role === 'bot' || item.type === 'bot' || item.type === 'model') {
      role = 'model';
    }

    let text = '';
    if (typeof item.text === 'string') {
      text = item.text.trim();
    } else if (typeof item.message === 'string') {
      text = item.message.trim();
    } else if (typeof item.response === 'string') {
      text = item.response.trim();
    } else if (Array.isArray(item.parts)) {
      text = item.parts.map(p => (typeof p === 'string' ? p : p.text || '')).join(' ').trim();
    }

    if (text) {
      formatted.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Gemini chat history requires strict alternating user/model pattern starting with 'user'
  const validHistory = [];
  for (let i = 0; i < formatted.length; i++) {
    const current = formatted[i];
    if (validHistory.length === 0) {
      if (current.role === 'user') {
        validHistory.push(current);
      }
    } else {
      const prevRole = validHistory[validHistory.length - 1].role;
      if (current.role !== prevRole) {
        validHistory.push(current);
      }
    }
  }

  // Ensure history ends with 'model' so the new user message can follow as 'user'
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
    validHistory.pop();
  }

  return validHistory;
};

/**
 * Generates AI chat response via Google Gemini API
 * Reads key ONLY from process.env.GEMINI_API_KEY
 */
export const generateGeminiResponse = async (message, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing in backend .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const formattedHistory = normalizeHistory(history);

  // Dynamic language directive based on latest user message
  const langDirective = detectLanguageDirective(message);
  const fullSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}\n\n${langDirective}`;

  // Models to attempt in priority order
  const modelCandidates = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: fullSystemInstruction,
      });

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const textText = response.text();

      if (textText) {
        return textText;
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Fallback direct prompt generation if chat history mode encountered issue
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: fullSystemInstruction,
      });

      const prompt = formattedHistory.length > 0
        ? `Previous conversation history:\n${formattedHistory.map(h => `${h.role}: ${h.parts[0].text}`).join('\n')}\n\n[Current User Message]: ${message}`
        : message;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text) {
        return text;
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Mask any potential API key tokens in error message before throwing
  const errorMsg = lastError?.message || 'Failed to generate AI response';
  const safeMsg = errorMsg.replace(/key=[^&\s]+/gi, 'key=***');
  throw new Error(`Gemini AI service error: ${safeMsg}`);
};

export default { generateGeminiResponse };
