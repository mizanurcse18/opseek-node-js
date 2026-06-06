/**
 * Public Key Obfuscator Utility
 * Use this script to generate the obfuscated numeric arrays for the frontend
 * whenever the RSA Public Key changes.
 * 
 * Usage: node obfuscate_key.js "YOUR_PUBLIC_KEY_PEM"
 */

const fs = require('fs');

const seed = "8f2a1c9b";
const publicKeyPem = process.argv[2] || `-----BEGIN PUBLIC KEY-----

-----END PUBLIC KEY-----`;

function obfuscate(pem) {
  // 1. Clean the PEM
  const cleanKey = pem
    .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
    .replace(/\s/g, "");

  // 2. Split into segments (approx 76 chars each to match PEM lines)
  const segments = cleanKey.match(/.{1,76}/g) || [];
  
  console.log("/** Copy this into getServerPublicKey() in encryption.service.ts **/ ");
  console.log(`const _s = "${seed}";`);
  console.log("const _parts = [");
  
  segments.forEach((seg, idx) => {
    const numericArray = [];
    for (let i = 0; i < seg.length; i++) {
      numericArray.push(seg.charCodeAt(i) ^ seed.charCodeAt(i % seed.length));
    }
    console.log(`  [${numericArray.join(', ')}]${idx < segments.length - 1 ? ',' : ''}`);
  });
  
  console.log("];");
}

obfuscate(publicKeyPem);
