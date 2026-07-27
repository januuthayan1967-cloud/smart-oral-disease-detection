export const FIRST_AID_TIPS = {
  calculus: {
    title: 'Calculus',
    tips: [
      'Brush gently twice daily using fluoride toothpaste.',
      'Floss or use interdental cleaning to remove food debris.',
      'Avoid attempting to scrape or remove hardened tartar at home.',
      'Schedule a dental examination for professional cleaning.',
    ],
  },
  caries: {
    title: 'Caries',
    tips: [
      'Rinse the mouth with clean water after eating.',
      'Maintain regular brushing with fluoride toothpaste.',
      'Avoid frequent sugary foods and drinks.',
      'Visit a dentist as soon as possible because tooth decay may require professional treatment.',
    ],
  },
  gingivitis: {
    title: 'Gingivitis',
    tips: [
      'Brush gently along the gumline twice daily.',
      'Floss carefully to remove plaque between teeth.',
      'Rinse the mouth with clean water after meals.',
      'Consult a dentist if gum swelling or bleeding continues.',
    ],
  },
  healthy_teeth: {
    title: 'Healthy Teeth',
    tips: [
      'Continue brushing twice daily with fluoride toothpaste.',
      'Floss or clean between teeth regularly.',
      'Maintain regular dental check-ups.',
      'Limit excessive sugary foods and drinks.',
    ],
  },
  mouth_ulcer: {
    title: 'Mouth Ulcer',
    tips: [
      'Rinse the mouth gently with clean water or a mild salt-water rinse.',
      'Avoid spicy, acidic, or very hot foods if they cause irritation.',
      'Maintain gentle oral hygiene.',
      'Consult a dentist or healthcare professional if the ulcer persists, becomes severe, or frequently returns.',
    ],
  },
  tooth_discoloration: {
    title: 'Tooth Discoloration',
    tips: [
      'Maintain regular brushing and flossing.',
      'Avoid or reduce foods and drinks that commonly stain teeth.',
      'Do not use harsh or unsafe home whitening methods.',
      'Consult a dentist to determine the underlying cause of the discoloration.',
    ],
  },
};

export const DISCLAIMER_TEXT =
  'These first-aid tips are for general guidance only and are not a substitute for professional dental diagnosis or treatment.';

export function getFirstAidTips(diseaseClass) {
  if (!diseaseClass || typeof diseaseClass !== 'string') {
    return FIRST_AID_TIPS.healthy_teeth;
  }

  const normalized = diseaseClass.toLowerCase().replace(/[_-]/g, ' ').trim();

  if (normalized.includes('calculus')) {
    return FIRST_AID_TIPS.calculus;
  }
  if (normalized.includes('caries') || normalized.includes('decay')) {
    return FIRST_AID_TIPS.caries;
  }
  if (normalized.includes('gingivitis') || normalized.includes('gum')) {
    return FIRST_AID_TIPS.gingivitis;
  }
  if (normalized.includes('ulcer')) {
    return FIRST_AID_TIPS.mouth_ulcer;
  }
  if (normalized.includes('discolor') || normalized.includes('stain')) {
    return FIRST_AID_TIPS.tooth_discoloration;
  }
  if (normalized.includes('healthy') || normalized.includes('normal')) {
    return FIRST_AID_TIPS.healthy_teeth;
  }

  return FIRST_AID_TIPS.healthy_teeth;
}
