export const DISEASE_INFO = {
  'Dental Caries': {
    description: 'Dental caries, commonly known as cavities, is tooth decay caused by bacterial acid production.',
    causes: ['Poor oral hygiene', 'High sugar diet', 'Acidic foods and drinks', 'Dry mouth'],
    treatmentSuggestions: [
      'Visit a dentist for filling or restoration',
      'Fluoride treatment for early stages',
      'Root canal for advanced decay',
    ],
    preventionTips: [
      'Brush twice daily with fluoride toothpaste',
      'Limit sugary snacks and drinks',
      'Regular dental checkups every 6 months',
    ],
  },
  'Dental Calculus': {
    description: 'Dental calculus (tartar) is hardened plaque that forms on teeth and cannot be removed by brushing alone.',
    causes: ['Plaque buildup', 'Irregular brushing', 'Smoking', 'Mineral deposits in saliva'],
    treatmentSuggestions: [
      'Professional dental cleaning (scaling)',
      'Improved daily oral hygiene routine',
      'Antiseptic mouthwash as recommended',
    ],
    preventionTips: [
      'Brush and floss daily',
      'Use tartar-control toothpaste',
      'Schedule regular cleanings',
    ],
  },
  Gingivitis: {
    description: 'Gingivitis is inflammation of the gums caused by bacterial plaque along the gumline.',
    causes: ['Plaque accumulation', 'Poor flossing habits', 'Smoking', 'Hormonal changes'],
    treatmentSuggestions: [
      'Professional cleaning',
      'Improved brushing and flossing technique',
      'Antibacterial mouth rinse',
    ],
    preventionTips: [
      'Floss daily',
      'Use soft-bristle toothbrush',
      'Maintain regular dental visits',
    ],
  },
  'Mouth Ulcer': {
    description: 'Mouth ulcers are painful sores that appear on the soft tissues inside the mouth.',
    causes: ['Stress', 'Minor injury', 'Nutritional deficiencies', 'Certain medications'],
    treatmentSuggestions: [
      'Topical oral gels or rinses',
      'Avoid spicy and acidic foods',
      'Consult dentist if ulcers persist over 2 weeks',
    ],
    preventionTips: [
      'Maintain good oral hygiene',
      'Manage stress levels',
      'Ensure adequate vitamin B12 and iron intake',
    ],
  },
  'Tooth Discoloration': {
    description: 'Tooth discoloration refers to staining or darkening of teeth affecting appearance.',
    causes: ['Coffee, tea, and wine', 'Tobacco use', 'Aging', 'Certain medications'],
    treatmentSuggestions: [
      'Professional teeth whitening',
      'Dental veneers for severe cases',
      'Improved brushing with whitening toothpaste',
    ],
    preventionTips: [
      'Limit staining foods and beverages',
      'Rinse mouth after consuming dark liquids',
      'Avoid tobacco products',
    ],
  },
  'Normal Teeth': {
    description: 'No significant oral disease detected. Teeth appear healthy with no major abnormalities.',
    causes: [],
    treatmentSuggestions: ['Continue regular oral care routine', 'Maintain scheduled dental checkups'],
    preventionTips: [
      'Brush twice daily for 2 minutes',
      'Floss once daily',
      'Use fluoride toothpaste',
      'Visit dentist every 6 months',
    ],
  },
};

export const getSeverity = (diseaseName, confidence) => {
  if (diseaseName === 'Normal Teeth') return 'None';
  if (confidence >= 85) return 'High';
  if (confidence >= 65) return 'Moderate';
  return 'Low';
};

export const getRecommendation = (diseaseName, severity) => {
  if (diseaseName === 'Normal Teeth') {
    return 'Your oral health appears good. Continue your daily hygiene routine and schedule regular checkups.';
  }

  const severityAdvice = {
    High: 'We strongly recommend scheduling a dental appointment as soon as possible.',
    Moderate: 'Please consult a dentist within the next few weeks for evaluation.',
    Low: 'Monitor the condition and maintain good oral hygiene. Consult a dentist if symptoms persist.',
  };

  return severityAdvice[severity] || severityAdvice.Low;
};

export default DISEASE_INFO;
