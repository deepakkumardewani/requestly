const AES_KEY_LENGTH_BYTES = 32;
const GCM_IV_LENGTH_BYTES = 12;
const GCM_TAG_LENGTH_BITS = 128;

function requireSubtle(): SubtleCrypto {
  const { subtle } = globalThis.crypto;
  if (subtle === undefined) {
    throw new Error(
      "Web Crypto (crypto.subtle) is not available in this environment",
    );
  }
  return subtle;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * AES-256-GCM: generates a key and IV, encrypts the plaintext, returns base64
 * strings suitable for the API and the URL fragment (key only in `#`).
 */
export async function encryptPayload(plaintext: string): Promise<{
  ciphertext: string;
  iv: string;
  keyB64: string;
}> {
  const subtle = requireSubtle();
  const keyBytes = new Uint8Array(AES_KEY_LENGTH_BYTES);
  globalThis.crypto.getRandomValues(keyBytes);
  const iv = new Uint8Array(GCM_IV_LENGTH_BYTES);
  globalThis.crypto.getRandomValues(iv);

  const cryptoKey = await subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: GCM_TAG_LENGTH_BITS },
    cryptoKey,
    encoded,
  );

  return {
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
    iv: uint8ToBase64(iv),
    keyB64: uint8ToBase64(keyBytes),
  };
}

/**
 * Decrypts a payload produced by `encryptPayload`. Throws if the key is wrong
 * or the ciphertext is corrupted/tampered.
 */
export async function decryptPayload(
  ciphertext: string,
  iv: string,
  keyB64: string,
): Promise<string> {
  const subtle = requireSubtle();
  const keyBytes = base64ToUint8(keyB64);
  const ivBytes = base64ToUint8(iv);
  const ctBytes = base64ToUint8(ciphertext);

  const keyBuf = new Uint8Array(keyBytes);
  const cryptoKey = await subtle.importKey(
    "raw",
    keyBuf,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  const ivCopy = new Uint8Array(ivBytes);
  const ctCopy = new Uint8Array(ctBytes);
  const decrypted = await subtle.decrypt(
    { name: "AES-GCM", iv: ivCopy, tagLength: GCM_TAG_LENGTH_BITS },
    cryptoKey,
    ctCopy,
  );
  return new TextDecoder().decode(decrypted);
}
