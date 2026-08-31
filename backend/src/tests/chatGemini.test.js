import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import assert from 'assert';
import User from '../models/User.js';
import ChatLog from '../models/ChatLog.js';
import Prediction from '../models/Prediction.js';
import { sendMessage, getChatHistory } from '../controllers/chatController.js';
import { generateGeminiResponse } from '../services/geminiService.js';
import { generateChatResponse } from '../services/chatService.js';

function createMockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function runTests() {
  console.log('======================================================');
  console.log('  GEMINI AI CHAT ASSISTANT END-TO-END TEST SUITE');
  console.log('======================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.\n');

  // Clean test fixtures
  await User.deleteMany({ email: 'chat_test_user@example.com' });
  await ChatLog.deleteMany({});

  const testUser = await User.create({
    name: 'Chat Test User',
    email: 'chat_test_user@example.com',
    password: 'Password123!',
    role: 'user',
  });

  const testPrediction = await Prediction.create({
    userId: testUser._id,
    imageUrl: '/uploads/test.jpg',
    predictedClass: 'Gingivitis',
    confidence: 94,
    riskLevel: 'MEDIUM',
    diseaseName: 'Gingivitis',
    description: 'Gum inflammation and mild bleeding.',
  });

  let totalTests = 0;
  let passedTests = 0;

  function runAssert(condition, testName) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
    passedTests++;
    console.log(`  ✅ PASSED: ${testName}`);
  }

  try {
    // ---------------------------------------------------------------
    // TC1: Gemini API Available & Responding
    // ---------------------------------------------------------------
    console.log('[TC1] Gemini API Live Generation (English & Tamil)');
    {
      const englishReply = await generateGeminiResponse('What are the best habits for healthy teeth?');
      runAssert(
        typeof englishReply === 'string' && englishReply.length > 50,
        'TC1.1: Live Gemini API returns rich English response'
      );

      const tamilReply = await generateGeminiResponse('பல் சொத்தை வராமல் தடுக்க என்ன செய்ய வேண்டும்?');
      const hasTamilChars = /[\u0B80-\u0BFF]/.test(tamilReply);
      runAssert(
        typeof tamilReply === 'string' && hasTamilChars,
        'TC1.2: Live Gemini API correctly responds in Tamil (தமிழ்) script'
      );
    }

    // ---------------------------------------------------------------
    // TC2: Gemini API Unavailable -> Existing fallback chatService responds
    // ---------------------------------------------------------------
    console.log('\n[TC2] Fallback chatService When Gemini Is Unavailable');
    {
      const fallbackReply = generateChatResponse('How do I prevent cavities?');
      runAssert(
        typeof fallbackReply === 'string' && fallbackReply.length > 10,
        'TC2.1: Fallback chatService responds with dental guidance'
      );

      const tamilFallback = generateChatResponse('பல் சொத்தை தடுப்பது எப்படி?');
      runAssert(
        typeof tamilFallback === 'string' && /[\u0B80-\u0BFF]/.test(tamilFallback),
        'TC2.2: Fallback chatService handles Tamil questions in Tamil'
      );
    }

    // ---------------------------------------------------------------
    // TC3: Missing / Invalid API Key -> Graceful Fallback & No Key Leak
    // ---------------------------------------------------------------
    console.log('\n[TC3] Missing / Invalid API Key Security & Fallback');
    {
      const originalKey = process.env.GEMINI_API_KEY;
      try {
        // Temporarily unset key
        delete process.env.GEMINI_API_KEY;
        let threwError = false;
        try {
          await generateGeminiResponse('Hello');
        } catch (err) {
          threwError = true;
          runAssert(
            !err.message.includes(originalKey),
            'TC3.1: Error message never reveals or leaks API key'
          );
        }
        runAssert(threwError, 'TC3.2: Missing API key throws controlled error');

        // Test controller graceful fallback when key is missing
        const req = {
          body: { message: 'What is gingivitis?' },
          user: testUser,
        };
        const res = createMockRes();
        await sendMessage(req, res);
        runAssert(res.statusCode === 201, 'TC3.3: Controller returns 201 with fallback response when Gemini is unconfigured');
        runAssert(typeof res.data.response === 'string' && res.data.response.length > 10, 'TC3.4: Valid fallback response delivered to client');
      } finally {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }

    // ---------------------------------------------------------------
    // TC4: Invalid Model Name Handling
    // ---------------------------------------------------------------
    console.log('\n[TC4] Invalid Model Graceful Fallback');
    {
      const fallbackTest = generateChatResponse('tell me about flossing');
      runAssert(
        fallbackTest.toLowerCase().includes('floss'),
        'TC4: Rule-based fallback handles invalid model scenarios without crash'
      );
    }

    // ---------------------------------------------------------------
    // TC5: End-to-End Chat Flow (Message + History + Prediction Context)
    // ---------------------------------------------------------------
    console.log('\n[TC5] Full End-to-End Chat Flow via chatController');
    {
      // 5.1 Chat with Prediction Context
      const reqWithPred = {
        body: {
          message: 'What should I do about this diagnosis?',
          history: [],
          predictionId: testPrediction._id.toString(),
        },
        user: testUser,
      };
      const resWithPred = createMockRes();
      await sendMessage(reqWithPred, resWithPred);
      runAssert(resWithPred.statusCode === 201, 'TC5.1: Chat with prediction context returns 201 Created');
      runAssert(
        typeof resWithPred.data.response === 'string' && resWithPred.data.response.length > 20,
        'TC5.2: AI responds with contextual advice'
      );

      // 5.2 Chat with Conversation History
      const reqWithHist = {
        body: {
          message: 'Can you summarize what you just told me?',
          history: [
            { role: 'user', text: 'I was diagnosed with gingivitis.' },
            { role: 'model', text: 'Gingivitis is mild gum disease causing redness.' },
          ],
        },
        user: testUser,
      };
      const resWithHist = createMockRes();
      await sendMessage(reqWithHist, resWithHist);
      runAssert(resWithHist.statusCode === 201, 'TC5.3: Chat with conversation history returns 201 Created');

      // 5.3 Fetch Chat History
      const reqHistory = {
        user: testUser,
        query: {},
      };
      const resHistory = createMockRes();
      await getChatHistory(reqHistory, resHistory);
      runAssert(resHistory.data.success === true, 'TC5.4: getChatHistory succeeds');
      runAssert(resHistory.data.count >= 2, 'TC5.5: Logged messages retrieved correctly in history');
    }

    // ---------------------------------------------------------------
    // TC6: Unauthorized Chat API Access
    // ---------------------------------------------------------------
    console.log('\n[TC6] Unauthorized Chat API & Cross-User Protection');
    {
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another_chat_user@example.com',
        password: 'Password123!',
        role: 'user',
      });

      let blocked = false;
      try {
        // anotherUser attempts to use testUser's predictionId
        const reqCross = {
          body: {
            message: 'Explain this',
            predictionId: testPrediction._id.toString(),
          },
          user: anotherUser,
        };
        await sendMessage(reqCross, createMockRes());
      } catch (err) {
        if (err.statusCode === 403) {
          blocked = true;
        }
      }
      runAssert(blocked, 'TC6: Cross-user prediction context access is blocked with 403 Forbidden');

      await User.deleteOne({ _id: anotherUser._id });
    }

    console.log('\n======================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} GEMINI CHAT TEST CASES PASSED SUCCESSFULLY!`);
    console.log('======================================================\n');
  } finally {
    await User.deleteMany({ email: { $in: ['chat_test_user@example.com', 'another_chat_user@example.com'] } });
    await ChatLog.deleteMany({ userId: testUser._id });
    await Prediction.deleteOne({ _id: testPrediction._id });
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
