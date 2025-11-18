import {
  generateAESKey, encryptWithAES, signData,
  encryptAESKeyWithRSA, exportPublicKeyToPEM
} from "./crypto";

export async function preparePackage(fileBuffer, privateSignKey, alcaldiaPubKey) {
  // 1. Firmamos el documento
  const signature = await window.crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    privateSignKey,
    fileBuffer
  );

  // 2. Generamos clave AES
  const aesKey = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // 3. Encriptamos archivo con AES
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedFile = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );

  // 4. Exportamos clave AES y la ciframos con la clave pública de la Alcaldía
  const rawAES = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedAES = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    alcaldiaPubKey,
    rawAES
  );

  // 5. Creamos el paquete JSON
  const pkg = {
    iv: Array.from(iv),
    encryptedAES: Array.from(new Uint8Array(encryptedAES)),
    encryptedFile: Array.from(new Uint8Array(encryptedFile)),
    signature: Array.from(new Uint8Array(signature)),
  };

  // Convertimos a Blob descargable
  const blob = new Blob([JSON.stringify(pkg)], {
    type: "application/json",
  });

  return blob;
}
