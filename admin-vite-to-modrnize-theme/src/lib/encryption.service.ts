import { handleApiError } from './error-handler';

// Session Key Storage
let lastAesKey: CryptoKey | null = null;

/**
 * Deeply Obfuscated Public Key Retrieval
 * Uses a multi-stage reconstruction (XOR + Shifting + Segmenting) to prevent
 * discovery via string search or simple memory dumping.
 */
const getServerPublicKey = (): string => {
  const _s = "8f2a1c9b"; // Seed
  const _parts = [
    [117, 47, 123, 35, 120, 9, 120, 44, 122, 1, 89, 16, 89, 8, 80, 37, 1, 17, 2, 35, 112, 50, 124, 36, 121, 39, 125, 34, 112, 50, 1, 35, 117, 47, 123, 35, 114, 4, 114, 33, 121, 55, 119, 32, 6, 49, 64, 51, 12, 11, 118, 51, 119, 41, 90, 59, 66, 14, 94, 86, 127, 22, 123, 59, 74, 62, 121, 35, 107, 26, 83, 39, 10, 17, 98, 3],
    [111, 73, 83, 57, 2, 15, 123, 24, 87, 37, 7, 47, 92, 83, 82, 20, 91, 83, 127, 78, 125, 36, 97, 45, 23, 10, 98, 18, 7, 59, 116, 85, 115, 3, 2, 47, 69, 82, 72, 14, 97, 73, 103, 25, 64, 51, 74, 13, 110, 12, 118, 7, 7, 50, 12, 49, 95, 73, 67, 16, 66, 38, 88, 24, 105, 12, 96, 18, 90, 55, 123, 27, 121, 13, 75, 8],
    [106, 49, 88, 44, 71, 27, 12, 86, 112, 3, 83, 49, 67, 10, 126, 91, 75, 47, 83, 2, 126, 15, 94, 42, 112, 23, 102, 15, 73, 47, 87, 9, 84, 52, 120, 38, 92, 90, 104, 5, 65, 16, 125, 53, 114, 47, 113, 84, 116, 95, 90, 15, 8, 57, 13, 42, 8, 31, 70, 52, 93, 36, 92, 40, 124, 17, 116, 88, 102, 1, 77, 39, 15, 80, 117, 38],
    [124, 19, 68, 21, 125, 25, 87, 12, 12, 49, 83, 87, 6, 12, 83, 49, 76, 31, 67, 19, 64, 86, 83, 59, 106, 48, 11, 14, 69, 50, 79, 4, 86, 9, 70, 18, 80, 20, 77, 10, 14, 83, 92, 51, 125, 52, 91, 5, 126, 85, 71, 53, 9, 50, 110, 39, 116, 7, 0, 5, 91, 82, 99, 52, 117, 87, 74, 8, 0, 21, 80, 26, 104, 47, 123, 39],
    [94, 36, 113, 50, 82, 16, 67, 91, 127, 53, 29, 46, 71, 6, 1, 45, 124, 13, 83, 47, 91, 81, 125, 42, 80, 55, 103, 4, 104, 43, 85, 81, 65, 54, 65, 59, 69, 82, 114, 82, 15, 36, 87, 50, 118, 14, 94, 35, 23, 47, 120, 12, 2, 32, 107, 82, 116, 17, 1, 88, 66, 40, 123, 23, 126, 81, 65, 80, 1, 59, 82, 24, 107, 84, 103, 21],
    [105, 10, 112, 80, 125, 50, 112, 38, 121, 55, 115, 35]
  ];

  const _d = (a: number[]) => a.map((c, i) => String.fromCharCode(c ^ _s.charCodeAt(i % _s.length))).join("");
  const _b = _parts.map(_d).join("");
  return `-----BEGIN PUBLIC KEY-----\n${_b}\n-----END PUBLIC KEY-----`;
};

/**
 * Encrypts a request body using Hybrid RSA+AES Encryption
 * Packet Structure: [KeyLen(4)][EncKey][IV(16)][EncData]
 */
export async function encryptRequest(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  const dataBytes = new TextEncoder().encode(jsonString);

  // 1. Generate random AES Key (256-bit) and IV (128-bit)
  lastAesKey = await window.crypto.subtle.generateKey(
    { name: "AES-CBC", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(16));

  // 2. Encrypt data with AES
  const encryptedDataBuffer = await window.crypto.subtle.encrypt({ name: "AES-CBC", iv }, lastAesKey, dataBytes);
  const encryptedData = new Uint8Array(encryptedDataBuffer);

  // 3. Encrypt AES Key with RSA
  const rawAesKey = await window.crypto.subtle.exportKey("raw", lastAesKey);
  const rsaKey = await importPublicKey(getServerPublicKey());
  const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKey, rawAesKey);
  const encryptedAesKey = new Uint8Array(encryptedAesKeyBuffer);

  // 4. Build Packet: [KeyLen(4)][EncKey][IV(16)][EncData]
  const keyLen = encryptedAesKey.length;
  const packet = new Uint8Array(4 + keyLen + 16 + encryptedData.length);
  const view = new DataView(packet.buffer);
  view.setUint32(0, keyLen, false); // Big-endian

  packet.set(encryptedAesKey, 4);
  packet.set(iv, 4 + keyLen);
  packet.set(encryptedData, 4 + keyLen + 16);

  // Robust binary-to-base64 conversion to avoid corruption and stack limits
  const binaryString = Array.from(packet, byte => String.fromCharCode(byte)).join('');
  return window.btoa(binaryString);
}

/**
 * Decrypts a response packet using the last used AES Session Key
 * Packet Structure: [0,0,0,0][IV(16)][EncData]
 */
export async function decryptResponse(base64Data: string): Promise<any> {
  try {
    const binaryString = atob(base64Data);
    const packet = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      packet[i] = binaryString.charCodeAt(i);
    }

    const view = new DataView(packet.buffer);

    // 1. Read Header
    const keyLen = view.getUint32(0, false);

    if (keyLen === 0) {
      // Session Key Reuse Mode
      if (!lastAesKey) {
        console.error("Encryption Error: No active session key found.");
        throw new Error("No session key found. Did you send a request first?");
      }

      const iv = packet.slice(4, 20);
      const encryptedData = packet.slice(20);

      const decryptedBuffer = await window.crypto.subtle.decrypt({ name: "AES-CBC", iv }, lastAesKey, encryptedData);
      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString);
    } else {
      // This mode means server sent a new key - not currently used in our pattern
      throw new Error("Full hybrid response decryption (New Key) not implemented yet.");
    }
  } catch (error) {
    console.error("Decryption failed:", error);
    throw error;
  }
}

/**
 * Helper to import the Server's PEM Public Key into a CryptoKey object
 */
async function importPublicKey(pem: string) {
  const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "").replace(/\s/g, "");
  const binaryDer = new Uint8Array(atob(b64).split("").map(c => c.charCodeAt(0)));
  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}
