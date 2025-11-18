import {
  decryptAESKeyWithRSA,
  decryptWithAES,
  base64ToArrayBuffer,
  importPublicKeyFromPEM,
  verifySignature
} from "./crypto";

async function openPackage(packageJson, recipientPrivateRSAKey) {
  const encryptedKey = base64ToArrayBuffer(packageJson.encryptedKey);
  const iv = base64ToArrayBuffer(packageJson.iv);
  const ciphertext = base64ToArrayBuffer(packageJson.ciphertext);
  const signature = base64ToArrayBuffer(packageJson.signature);

  // 1. Descifra AES key
  const aesKey = await decryptAESKeyWithRSA(recipientPrivateRSAKey, encryptedKey);

  // 2. Descifra documento
  const plaintextBuffer = await decryptWithAES(aesKey, new Uint8Array(iv), ciphertext);

  // 3. Importar public key del firmante (PEM -> CryptoKey) y verificar firma
  const signerPubKey = await importPublicKeyFromPEM(packageJson.signerPublicKeyPem);
  const isValid = await verifySignature(signerPubKey, plaintextBuffer, signature);

  return { plaintextBuffer, isValid };
}
