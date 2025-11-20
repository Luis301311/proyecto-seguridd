// utilidades/receiver.js
import {
  decryptAESKeyWithRSA,
  decryptWithAES,
  base64ToArrayBuffer,
  importRSAPublicKeyFromPEM_Sign,
  verifySignature
} from "./crypto";

export async function openPackage(pkg, privateKeyReceiver) {
  try {
    // 2. Convertir Base64 → ArrayBuffers
    const iv = new Uint8Array(base64ToArrayBuffer(pkg.iv));
    const encryptedAES = base64ToArrayBuffer(pkg.encryptedAES);
    const encryptedFile = base64ToArrayBuffer(pkg.encryptedFile);
    const signature = base64ToArrayBuffer(pkg.signature);

    // 3. Descifrar clave AES
    const aesKey = await decryptAESKeyWithRSA(privateKeyReceiver, encryptedAES);

    // 4. Descifrar documento
    const fileBuffer = await decryptWithAES(aesKey, iv, encryptedFile);

    // 5. Verificar firma
    const signerPubKey = await importRSAPublicKeyFromPEM_Sign(pkg.signerPublicKeyPem);
    const valid = await verifySignature(signerPubKey, fileBuffer, signature);

    return { 
      fileBuffer, 
      valid,
      fileName: pkg.fileName || "documento_descifrado",
      fileType: pkg.fileType || "application/octet-stream"
    };
  } catch (error) {
    console.error('Error en openPackage:', error);
    throw new Error('Error al descifrar el paquete: ' + error.message);
  }
}