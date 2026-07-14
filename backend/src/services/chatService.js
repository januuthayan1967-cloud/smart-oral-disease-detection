import DISEASE_INFO from '../utils/diseaseInfo.js';

const FAQ_RESPONSES = [
  {
    keywords: ['brush', 'brushing', 'toothbrush'],
    response:
      'Brush your teeth twice daily for at least 2 minutes using fluoride toothpaste. Use gentle circular motions and replace your toothbrush every 3 months.',
  },
  {
    keywords: ['floss', 'flossing'],
    response:
      'Floss once daily to remove plaque between teeth where a toothbrush cannot reach. Use about 18 inches of floss and curve it around each tooth.',
  },
  {
    keywords: ['caries', 'cavity', 'cavities', 'decay'],
    response:
      'Dental caries (cavities) are caused by bacteria producing acid that erodes tooth enamel. Early treatment with fillings prevents further damage. Limit sugar and maintain good hygiene.',
  },
  {
    keywords: ['gingivitis', 'gum', 'bleeding'],
    response:
      'Gingivitis causes red, swollen, bleeding gums. It is reversible with improved brushing, flossing, and professional cleaning. See a dentist if symptoms persist.',
  },
  {
    keywords: ['ulcer', 'sore'],
    response:
      'Mouth ulcers usually heal within 1-2 weeks. Avoid spicy foods, use a soft toothbrush, and consult a dentist if ulcers are large, persistent, or recurring.',
  },
  {
    keywords: ['whiten', 'discoloration', 'stain', 'yellow'],
    response:
      'Tooth discoloration can result from food, drinks, tobacco, or aging. Professional whitening and limiting staining substances help maintain a brighter smile.',
  },
  {
    keywords: ['mouthwash', 'rinse'],
    response:
      'Use mouthwash as a supplement to brushing and flossing, not a replacement. Choose an antiseptic rinse for gum health or fluoride rinse for cavity prevention.',
  },
  {
    keywords: ['calculus', 'tartar'],
    response:
      'Dental calculus (tartar) is hardened plaque that requires professional cleaning. Regular brushing, flossing, and dental visits prevent tartar buildup.',
  },
];

const DEFAULT_RESPONSE =
  'Thank you for your question about oral health. Maintain daily brushing and flossing, eat a balanced diet low in sugar, and visit your dentist regularly. For specific concerns, please use our disease detection feature or book a consultation with a dentist.';

export const generateChatResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  for (const faq of FAQ_RESPONSES) {
    if (faq.keywords.some((keyword) => lowerMessage.includes(keyword))) {
      return faq.response;
    }
  }

  for (const [disease, info] of Object.entries(DISEASE_INFO)) {
    if (lowerMessage.includes(disease.toLowerCase())) {
      return `${disease}: ${info.description} Prevention tips: ${info.preventionTips.slice(0, 2).join(' ')}`;
    }
  }

  if (lowerMessage.includes('prevent') || lowerMessage.includes('prevention')) {
    return 'Key prevention tips: brush twice daily, floss daily, limit sugary foods, avoid tobacco, drink water after meals, and visit your dentist every 6 months.';
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return 'Hello! I am your dental care assistant. Ask me about oral hygiene, diseases, prevention tips, or general dental health questions.';
  }

  return DEFAULT_RESPONSE;
};

export default { generateChatResponse };
