/**
 * Normalizes various class/grade input formats to the StudentClass enum values.
 *
 * Handles:
 * - Numeric: "1", "2", "12", "01"
 * - Ordinal: "1st", "2nd", "3rd", "12th"
 * - Written: "first", "second", "twelfth"
 * - Roman numerals: "I", "II", "XII"
 * - With prefixes: "Grade 1", "Class 2", "Standard 3", "Std 4"
 * - Empty/invalid: "", "N/A", "unknown" → "OTHER"
 */

export type StudentClass =
  | 'FIRST'
  | 'SECOND'
  | 'THIRD'
  | 'FOURTH'
  | 'FIFTH'
  | 'SIXTH'
  | 'SEVENTH'
  | 'EIGHTH'
  | 'NINTH'
  | 'TENTH'
  | 'ELEVENTH'
  | 'TWELFTH'
  | 'OTHER';

const VALID_CLASSES: StudentClass[] = [
  'FIRST',
  'SECOND',
  'THIRD',
  'FOURTH',
  'FIFTH',
  'SIXTH',
  'SEVENTH',
  'EIGHTH',
  'NINTH',
  'TENTH',
  'ELEVENTH',
  'TWELFTH',
  'OTHER',
];

// Map numbers 1-12 to ordinal words
const numberToOrdinal: Record<number, StudentClass> = {
  1: 'FIRST',
  2: 'SECOND',
  3: 'THIRD',
  4: 'FOURTH',
  5: 'FIFTH',
  6: 'SIXTH',
  7: 'SEVENTH',
  8: 'EIGHTH',
  9: 'NINTH',
  10: 'TENTH',
  11: 'ELEVENTH',
  12: 'TWELFTH',
};

// Map roman numerals to ordinal words
const romanToOrdinal: Record<string, StudentClass> = {
  I: 'FIRST',
  II: 'SECOND',
  III: 'THIRD',
  IV: 'FOURTH',
  V: 'FIFTH',
  VI: 'SIXTH',
  VII: 'SEVENTH',
  VIII: 'EIGHTH',
  IX: 'NINTH',
  X: 'TENTH',
  XI: 'ELEVENTH',
  XII: 'TWELFTH',
};

/**
 * Normalizes class/grade input to StudentClass enum value.
 *
 * @param input - The class/grade string to normalize
 * @returns Normalized StudentClass enum value
 */
export function normalizeClassName(
  input: string | undefined | null
): StudentClass {
  // Handle null, undefined, or empty string
  if (!input || input.trim() === '') {
    return 'OTHER';
  }

  // Trim and convert to uppercase
  let normalized = input.trim().toUpperCase();

  // Check if it's already a valid enum value
  if (VALID_CLASSES.includes(normalized as StudentClass)) {
    return normalized as StudentClass;
  }

  // Handle common "not applicable" values
  if (
    ['N/A', 'NA', 'NONE', '-', 'UNKNOWN', 'NOT APPLICABLE'].includes(normalized)
  ) {
    return 'OTHER';
  }

  // Remove common prefixes: "GRADE ", "CLASS ", "STANDARD ", "STD ", "STD. "
  normalized = normalized
    .replace(/^(GRADE|CLASS|STANDARD|STD\.?)\s+/i, '')
    .trim();

  // Remove common suffixes: " GRADE", " CLASS", " STANDARD", " STD", " STD."
  normalized = normalized
    .replace(/\s+(GRADE|CLASS|STANDARD|STD\.?)$/i, '')
    .trim();

  // Try to extract a number (handles "1", "1ST", "01", etc.)
  const numMatch = normalized.match(/^(\d+)(ST|ND|RD|TH)?$/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (numberToOrdinal[num]) {
      return numberToOrdinal[num];
    }
  }

  // Try roman numerals
  if (romanToOrdinal[normalized]) {
    return romanToOrdinal[normalized];
  }

  // Try written ordinals (already uppercase)
  // Check all valid class names except OTHER
  for (const className of VALID_CLASSES) {
    if (className !== 'OTHER' && className === normalized) {
      return className;
    }
  }

  // Default to OTHER for unrecognized values
  return 'OTHER';
}

/**
 * Validates if a string can be normalized to a valid StudentClass.
 * Useful for validation before import.
 *
 * @param input - The class/grade string to validate
 * @returns true if it can be normalized to a valid class, false otherwise
 */
export function isValidClassName(input: string | undefined | null): boolean {
  if (!input) return false;
  const normalized = normalizeClassName(input);
  return normalized !== 'OTHER' || input.trim().toUpperCase() === 'OTHER';
}
