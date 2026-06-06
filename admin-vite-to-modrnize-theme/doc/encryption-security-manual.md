# Client-Side Secure Encryption Manual (RSA + AES)

This document outlines the security architecture and implementation details for the hybrid encryption system used in the React Admin Dashboard.

## 1. Security Architecture

The system uses a **Hybrid Asymmetric/Symmetric** encryption pattern to provide high security without sacrificing performance.

- **RSA (Asymmetric)**: Used once per request to encrypt a randomly generated AES session key.
- **AES-256-CBC (Symmetric)**: Used to encrypt the actual JSON payload.
- **Session Key Reuse**: The server uses the same AES key provided by the client to encrypt the response, reducing overhead.

## 2. Packet Structure

All encrypted requests and responses follow a specific binary structure, encoded in Base64 for transport:

### Request Packet
`[KeyLen (4 bytes)][EncryptedAESKey (N bytes)][IV (16 bytes)][EncryptedPayload (M bytes)]`

### Response Packet
`[0, 0, 0, 0 (4 bytes)][IV (16 bytes)][EncryptedPayload (M bytes)]`
*Note: The 4-byte zero header signals the client to reuse the last sent AES key.*

## 3. Public Key Protection (Obfuscation)

To prevent the RSA Public Key from being discovered through simple string searches or memory inspection in the UI:

1.  **Bitwise XOR Masking**: The key is masked using an XOR operation against a secret seed.
2.  **Numeric Byte Storage**: The data is stored as raw numeric arrays (e.g., `[109, 105, 105, ...]`) in `encryption.service.ts`.
3.  **Dynamic Reconstruction**: The key is only built in memory for a fraction of a second during encryption.

### Updating the Public Key
If the server's public key changes, use the provided utility script:
```bash
node scripts/obfuscate_key.js "YOUR_NEW_PEM_PUBLIC_KEY"
```
Copy the output into the `getServerPublicKey` function in `src/lib/encryption.service.ts`.

## 4. Implementation Details

### Axios Interceptors (`src/lib/axios.ts`)
The encryption logic is integrated directly into the Axios request/response cycle:
- **Request Interceptor**: Automatically detects the `encrypt: true` flag, generates keys, and packs the binary data.
- **Response Interceptor**: Automatically detects encrypted responses and performs decryption.

### Usage in Services
To secure an endpoint, use the `postSecure` method in `apiService`:

```typescript
// Secure Login Example
export const authService = {
  loginSecure: async (credentials: LoginCredentials) => {
    return apiService.postSecure(API_MODULES.AUTH, '/user/login', credentials);
  }
};
```

## 5. Security Best Practices
- **Do not log** sensitive data or decrypted packets in production.
- **Session Keys** are stored in volatile memory (`lastAesKey`) and are lost upon page refresh, providing "Forward Secrecy" for individual browser sessions.
- **Key Rotation**: It is recommended to rotate the RSA key pair every 6-12 months.
