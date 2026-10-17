export interface ToothInfo {
  num: number;
  name: string;
  isMilk: boolean;
  quadrant: number;
}

export const TOOTH_METADATA: Record<number, ToothInfo> = {
  // --- Permanent Maxillary (Upper) ---
  18: { num: 18, name: 'Upper Right 3rd Molar (Wisdom)', isMilk: false, quadrant: 1 },
  17: { num: 17, name: 'Upper Right 2nd Molar', isMilk: false, quadrant: 1 },
  16: { num: 16, name: 'Upper Right 1st Molar', isMilk: false, quadrant: 1 },
  15: { num: 15, name: 'Upper Right 2nd Premolar', isMilk: false, quadrant: 1 },
  14: { num: 14, name: 'Upper Right 1st Premolar', isMilk: false, quadrant: 1 },
  13: { num: 13, name: 'Upper Right Canine', isMilk: false, quadrant: 1 },
  12: { num: 12, name: 'Upper Right Lateral Incisor', isMilk: false, quadrant: 1 },
  11: { num: 11, name: 'Upper Right Central Incisor', isMilk: false, quadrant: 1 },

  21: { num: 21, name: 'Upper Left Central Incisor', isMilk: false, quadrant: 2 },
  22: { num: 22, name: 'Upper Left Lateral Incisor', isMilk: false, quadrant: 2 },
  23: { num: 23, name: 'Upper Left Canine', isMilk: false, quadrant: 2 },
  24: { num: 24, name: 'Upper Left 1st Premolar', isMilk: false, quadrant: 2 },
  25: { num: 25, name: 'Upper Left 2nd Premolar', isMilk: false, quadrant: 2 },
  26: { num: 26, name: 'Upper Left 1st Molar', isMilk: false, quadrant: 2 },
  27: { num: 27, name: 'Upper Left 2nd Molar', isMilk: false, quadrant: 2 },
  28: { num: 28, name: 'Upper Left 3rd Molar (Wisdom)', isMilk: false, quadrant: 2 },

  // --- Permanent Mandibular (Lower) ---
  48: { num: 48, name: 'Lower Right 3rd Molar (Wisdom)', isMilk: false, quadrant: 4 },
  47: { num: 47, name: 'Lower Right 2nd Molar', isMilk: false, quadrant: 4 },
  46: { num: 46, name: 'Lower Right 1st Molar', isMilk: false, quadrant: 4 },
  45: { num: 45, name: 'Lower Right 2nd Premolar', isMilk: false, quadrant: 4 },
  44: { num: 44, name: 'Lower Right 1st Premolar', isMilk: false, quadrant: 4 },
  43: { num: 43, name: 'Lower Right Canine', isMilk: false, quadrant: 4 },
  42: { num: 42, name: 'Lower Right Lateral Incisor', isMilk: false, quadrant: 4 },
  41: { num: 41, name: 'Lower Right Central Incisor', isMilk: false, quadrant: 4 },

  31: { num: 31, name: 'Lower Left Central Incisor', isMilk: false, quadrant: 3 },
  32: { num: 32, name: 'Lower Left Lateral Incisor', isMilk: false, quadrant: 3 },
  33: { num: 33, name: 'Lower Left Canine', isMilk: false, quadrant: 3 },
  34: { num: 34, name: 'Lower Left 1st Premolar', isMilk: false, quadrant: 3 },
  35: { num: 35, name: 'Lower Left 2nd Premolar', isMilk: false, quadrant: 3 },
  36: { num: 36, name: 'Lower Left 1st Molar', isMilk: false, quadrant: 3 },
  37: { num: 37, name: 'Lower Left 2nd Molar', isMilk: false, quadrant: 3 },
  38: { num: 38, name: 'Lower Left 3rd Molar (Wisdom)', isMilk: false, quadrant: 3 },

  // --- Deciduous (Milk) Maxillary (Upper) ---
  55: { num: 55, name: 'Upper Right 2nd Primary Molar', isMilk: true, quadrant: 5 },
  54: { num: 54, name: 'Upper Right 1st Primary Molar', isMilk: true, quadrant: 5 },
  53: { num: 53, name: 'Upper Right Primary Canine', isMilk: true, quadrant: 5 },
  52: { num: 52, name: 'Upper Right Primary Lateral Incisor', isMilk: true, quadrant: 5 },
  51: { num: 51, name: 'Upper Right Primary Central Incisor', isMilk: true, quadrant: 5 },

  61: { num: 61, name: 'Upper Left Primary Central Incisor', isMilk: true, quadrant: 6 },
  62: { num: 62, name: 'Upper Left Primary Lateral Incisor', isMilk: true, quadrant: 6 },
  63: { num: 63, name: 'Upper Left Primary Canine', isMilk: true, quadrant: 6 },
  64: { num: 64, name: 'Upper Left 1st Primary Molar', isMilk: true, quadrant: 6 },
  65: { num: 65, name: 'Upper Left 2nd Primary Molar', isMilk: true, quadrant: 6 },

  // --- Deciduous (Milk) Mandibular (Lower) ---
  85: { num: 85, name: 'Lower Right 2nd Primary Molar', isMilk: true, quadrant: 8 },
  84: { num: 84, name: 'Lower Right 1st Primary Molar', isMilk: true, quadrant: 8 },
  83: { num: 83, name: 'Lower Right Primary Canine', isMilk: true, quadrant: 8 },
  82: { num: 82, name: 'Lower Right Primary Lateral Incisor', isMilk: true, quadrant: 8 },
  81: { num: 81, name: 'Lower Right Primary Central Incisor', isMilk: true, quadrant: 8 },

  71: { num: 71, name: 'Lower Left Primary Central Incisor', isMilk: true, quadrant: 7 },
  72: { num: 72, name: 'Lower Left Primary Lateral Incisor', isMilk: true, quadrant: 7 },
  73: { num: 73, name: 'Lower Left Primary Canine', isMilk: true, quadrant: 7 },
  74: { num: 74, name: 'Lower Left 1st Primary Molar', isMilk: true, quadrant: 7 },
  75: { num: 75, name: 'Lower Left 2nd Primary Molar', isMilk: true, quadrant: 7 },
};

// Quadrant Groupings for Quick Selectors
export const TOOTH_GROUPS = {
  q1: [18, 17, 16, 15, 14, 13, 12, 11],
  q2: [21, 22, 23, 24, 25, 26, 27, 28],
  q3: [31, 32, 33, 34, 35, 36, 37, 38],
  q4: [48, 47, 46, 45, 44, 43, 42, 41],
  q5: [55, 54, 53, 52, 51],
  q6: [61, 62, 63, 64, 65],
  q7: [71, 72, 73, 74, 75],
  q8: [85, 84, 83, 82, 81],
  upperPermanent: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lowerPermanent: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
  allMilk: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  allPermanent: [
    18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
    48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
  ],
};