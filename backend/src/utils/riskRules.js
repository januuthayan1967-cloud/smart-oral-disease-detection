/**
 * Centralized Risk Rules & Disease Mapping Configuration
 * Categorizes predictions into standardized risk levels: LOW, MEDIUM, HIGH
 */

export const RAW_TO_DISPLAY_MAP = {
  calculus: 'Dental Calculus',
  caries: 'Dental Caries',
  gingivitis: 'Gingivitis',
  healthy_teeth: 'Normal Teeth',
  mouth_ulcer: 'Mouth Ulcer',
  tooth_discoloration: 'Tooth Discoloration',
};

export const DISPLAY_TO_RAW_MAP = {
  'Dental Calculus': 'calculus',
  'Dental Caries': 'caries',
  Gingivitis: 'gingivitis',
  'Normal Teeth': 'healthy_teeth',
  'Mouth Ulcer': 'mouth_ulcer',
  'Tooth Discoloration': 'tooth_discoloration',
};

/**
 * Evaluates disease prediction and confidence score to assign risk level (LOW, MEDIUM, HIGH)
 * @param {string} diseaseName Raw or display disease name
 * @param {number} confidence Confidence percentage (0-100)
 * @returns {{ riskLevel: 'LOW' | 'MEDIUM' | 'HIGH', riskReason: string, rawClass: string, displayName: string }}
 */
export const evaluatePredictionRisk = (diseaseName, confidence = 0) => {
  const normName = (diseaseName || '').trim();
  const displayName = RAW_TO_DISPLAY_MAP[normName] || normName || 'Normal Teeth';
  const rawClass = DISPLAY_TO_RAW_MAP[displayName] || normName.toLowerCase().replace(/\s+/g, '_');

  const conf = Number(confidence) || 0;

  // 1. Normal / Healthy Teeth
  if (displayName === 'Normal Teeth' || rawClass === 'healthy_teeth') {
    return {
      riskLevel: 'LOW',
      riskReason: 'No active oral disease detected. Maintain daily oral hygiene and routine checkups.',
      rawClass,
      displayName,
    };
  }

  // 2. Tooth Discoloration
  if (displayName === 'Tooth Discoloration' || rawClass === 'tooth_discoloration') {
    return {
      riskLevel: conf >= 90 ? 'MEDIUM' : 'LOW',
      riskReason: 'Surface tooth discoloration detected. General oral cleaning or whitening consultation recommended.',
      rawClass,
      displayName,
    };
  }

  // 3. Dental Calculus
  if (displayName === 'Dental Calculus' || rawClass === 'calculus') {
    return {
      riskLevel: conf >= 85 ? 'HIGH' : 'MEDIUM',
      riskReason: 'Hardened plaque/calculus detected. Professional dental scaling and cleaning recommended.',
      rawClass,
      displayName,
    };
  }

  // 4. Gingivitis
  if (displayName === 'Gingivitis' || rawClass === 'gingivitis') {
    if (conf >= 80) {
      return {
        riskLevel: 'HIGH',
        riskReason: 'Notable gum inflammation detected with high confidence. Prompt dental consultation recommended.',
        rawClass,
        displayName,
      };
    }
    return {
      riskLevel: 'MEDIUM',
      riskReason: 'Mild to moderate gum inflammation detected. Professional dental evaluation recommended.',
      rawClass,
      displayName,
    };
  }

  // 5. Dental Caries
  if (displayName === 'Dental Caries' || rawClass === 'caries') {
    if (conf >= 65) {
      return {
        riskLevel: 'HIGH',
        riskReason: 'Tooth decay (caries) detected. Prompt professional dental examination and treatment recommended.',
        rawClass,
        displayName,
      };
    }
    return {
      riskLevel: 'MEDIUM',
      riskReason: 'Possible early tooth decay detected. Dental examination recommended to prevent progression.',
      rawClass,
      displayName,
    };
  }

  // 6. Mouth Ulcer
  if (displayName === 'Mouth Ulcer' || rawClass === 'mouth_ulcer') {
    if (conf >= 70) {
      return {
        riskLevel: 'HIGH',
        riskReason: 'Oral ulcer lesion detected. Professional dental or medical evaluation recommended if persistent.',
        rawClass,
        displayName,
      };
    }
    return {
      riskLevel: 'MEDIUM',
      riskReason: 'Oral ulcer detected. Monitor symptoms and consult a dental professional if pain persists.',
      rawClass,
      displayName,
    };
  }

  // Default Fallback
  return {
    riskLevel: conf >= 80 ? 'HIGH' : 'MEDIUM',
    riskReason: 'The detected condition may require professional dental evaluation.',
    rawClass,
    displayName,
  };
};

export default {
  RAW_TO_DISPLAY_MAP,
  DISPLAY_TO_RAW_MAP,
  evaluatePredictionRisk,
};
