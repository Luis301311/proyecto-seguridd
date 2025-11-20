// utilidades/crypto.js
const enc = new TextEncoder()
const dec = new TextDecoder()

async function generateRSAKeyPair_sign() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: 'SHA-256' },
    },
    true,
    ['sign', 'verify']
  )
}

async function generateRSAKeyPair_alcaldia() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: { name: 'SHA-256' },
    },
    true,
    ['encrypt', 'decrypt']
  )
}

async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  )
}

async function sha256(buffer) {
  return await window.crypto.subtle.digest('SHA-256', buffer)
}

async function signData(privateKey, dataBuffer) {
  const hash = await sha256(dataBuffer)
  return await window.crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    hash
  )
}

async function verifySignature(publicKey, dataBuffer, signature) {
  const hash = await sha256(dataBuffer)
  return await window.crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    signature,
    hash
  )
}

async function encryptWithAES(aesKey, plaintextBuffer) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    plaintextBuffer
  )
  return { ciphertext, iv }
}

async function decryptWithAES(aesKey, iv, ciphertext) {
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  )
}

async function encryptAESKeyWithRSA(rsaPublicKey, aesKey) {
  const rawKey = await window.crypto.subtle.exportKey('raw', aesKey)
  return await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    rawKey
  )
}

async function decryptAESKeyWithRSA(rsaPrivateKey, encryptedKey) {
  const rawKey = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    rsaPrivateKey,
    encryptedKey
  )
  return await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    true,
    ['encrypt', 'decrypt']
  )
}

async function exportPublicKeyToPEM(key) {
  const spki = await window.crypto.subtle.exportKey('spki', key)
  const b64 = arrayBufferToBase64(spki)
  const pem = `-----BEGIN PUBLIC KEY-----\n${b64
    .match(/.{1,64}/g)
    .join('\n')}\n-----END PUBLIC KEY-----`
  return pem
}

async function exportPrivateKeyToPEM(key) {
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', key)
  const b64 = arrayBufferToBase64(pkcs8)
  const pem = `-----BEGIN PRIVATE KEY-----\n${b64
    .match(/.{1,64}/g)
    .join('\n')}\n-----END PRIVATE KEY-----`
  return pem
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function importRSAPublicKeyFromPEM(pem) {
  const clean = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')

  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))

  return window.crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  )
}

async function importRSAPrivateKeyFromPEM(pem) {
  const clean = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '')

  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))

  return window.crypto.subtle.importKey(
    'pkcs8',
    bytes,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  )
}

async function importRSAPublicKeyFromPEM_Sign(pem) {
  const clean = pem
    .replace('-----BEGIN PUBLIC KEY-----', '')
    .replace('-----END PUBLIC KEY-----', '')
    .replace(/\s+/g, '')

  const binary = atob(clean)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))

  return window.crypto.subtle.importKey(
    'spki',
    bytes,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['verify']
  )
}

export {
  generateRSAKeyPair_sign,
  generateRSAKeyPair_alcaldia,
  generateAESKey,
  sha256,
  signData,
  verifySignature,
  encryptWithAES,
  decryptWithAES,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
  exportPublicKeyToPEM,
  exportPrivateKeyToPEM,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  importRSAPublicKeyFromPEM,
  importRSAPrivateKeyFromPEM,
  importRSAPublicKeyFromPEM_Sign,
}
