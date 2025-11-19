// crypto.js - utilidades con WebCrypto
const enc = new TextEncoder();
const dec = new TextDecoder();

async function generateRSAKeyPair_sign() {
  // Para firma: RSASSA-PKCS1-v1_5 o RSA-PSS
  return await window.crypto.subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: { name: "SHA-256" },
  }, true, ["sign", "verify"]);
}

async function generateRSAKeyPair_encrypt() {
  // Para cifrado: RSA-OAEP
  return await window.crypto.subtle.generateKey({
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: { name: "SHA-256" },
  }, true, ["encrypt", "decrypt"]);
}

async function generateAESKey() {
  return await window.crypto.subtle.generateKey({
    name: "AES-GCM",
    length: 256,
  }, true, ["encrypt", "decrypt"]);
}

async function sha256(buffer) {
  return await window.crypto.subtle.digest("SHA-256", buffer);
}

async function signData(privateKey, dataBuffer) {
  // dataBuffer: ArrayBuffer (document bytes)
  const hash = await sha256(dataBuffer);
  return await window.crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    hash
  ); // ArrayBuffer signature
}

async function verifySignature(publicKey, dataBuffer, signature) {
  const hash = await sha256(dataBuffer);
  return await window.crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    signature,
    hash
  );
}

async function encryptWithAES(aesKey, plaintextBuffer) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit iv
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    plaintextBuffer
  );
  return { ciphertext, iv };
}

async function decryptWithAES(aesKey, iv, ciphertext) {
  return await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  ); // ArrayBuffer plaintext
}

async function encryptAESKeyWithRSA(rsaPublicKey, aesKey) {
  const rawKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    rsaPublicKey,
    rawKey
  );
  return encryptedKey;
}

async function decryptAESKeyWithRSA(rsaPrivateKey, encryptedKey) {
  const rawKey = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    rsaPrivateKey,
    encryptedKey
  );
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export/Import keys to PEM (public RSA) - helpers
async function exportPublicKeyToPEM(key) {
  const spki = await window.crypto.subtle.exportKey("spki", key);
  const b64 = arrayBufferToBase64(spki);
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64.match(/.{1,64}/g).join("\n")}\n-----END PUBLIC KEY-----`;
  return pem;
}

async function exportPrivateKeyToPEM(key) {
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", key);
  const b64 = arrayBufferToBase64(pkcs8);
  const pem = `-----BEGIN PRIVATE KEY-----\n${b64.match(/.{1,64}/g).join("\n")}\n-----END PRIVATE KEY-----`;
  return pem;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i=0;i<bytes.byteLength;i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function importRSAPublicKeyFromPEM(pem) {
  // Limpia encabezados/footers PEM y saltos de línea
  const cleanPem = pem
    .replace("-----BEGIN PUBLIC KEY-----", "")
    .replace("-----END PUBLIC KEY-----", "")
    .replace(/\s+/g, "");

  // Convierte base64 a ArrayBuffer
  const binaryDer = Uint8Array.from(atob(cleanPem), c => c.charCodeAt(0));

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
}

async function importRSAPrivateKeyFromPEM(pem) {
  const clean = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(clean), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
}


export {
  generateRSAKeyPair_sign,
  generateRSAKeyPair_encrypt,
  generateAESKey,
  sha256,
  signData,
  verifySignature,
  encryptWithAES,
  decryptWithAES,
  encryptAESKeyWithRSA,   // <- Asegúrate que esté aquí
  decryptAESKeyWithRSA,
  exportPublicKeyToPEM,
  exportPrivateKeyToPEM,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  importRSAPublicKeyFromPEM,
  importRSAPrivateKeyFromPEM
};
//fin