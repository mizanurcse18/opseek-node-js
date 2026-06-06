/**
 * ID Obfuscator Utility
 * Converts numeric IDs to/from 8-character strings for URL obfuscation.
 * This hides sequential IDs from users while maintaining a professional URL look.
 */

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SECRET_XOR = 12345678; // Static seed for transformation

/**
 * Encodes a numeric ID into an 8-character string
 */
export function obfuscateId(id: number | string): string {
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
  if (isNaN(numericId) || numericId < 0) return '';
  
  // 1. Transform with XOR to hide sequential patterns
  let xored = numericId ^ SECRET_XOR;
  
  // 2. Convert to Base62
  let result = '';
  while (xored > 0) {
    result = ALPHABET[xored % 62] + result;
    xored = Math.floor(xored / 62);
  }
  
  // 3. Pad to 8 characters with a deterministic prefix ('K' for KYC or just '0')
  // We use '0' as padding and ensure it's exactly 8 chars
  return result.padStart(8, '0');
}

/**
 * Decodes an 8-character string back into a numeric ID
 */
export function deobfuscateId(code: string | undefined): number | null {
  if (!code) return null;
  
  // 1. Remove padding
  const trimmed = code.replace(/^0+/, '');
  if (!trimmed) return 0 ^ SECRET_XOR;
  
  // 2. Decode from Base62
  let decoded = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const charIndex = ALPHABET.indexOf(trimmed[i]);
    if (charIndex === -1) return null; // Invalid character
    decoded = decoded * 62 + charIndex;
  }
  
  // 3. Reverse the XOR transformation
  return decoded ^ SECRET_XOR;
}
