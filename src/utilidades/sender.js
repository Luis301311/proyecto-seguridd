import {
  generateAESKey,
  encryptWithAES,
  signData,
} from "./crypto";

function u8ToBase64(u8) {
  let binary = "";
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]);
  return btoa(binary);
}

export async function preparePackage(
  fileBuffer,
  privateSignKey,
  alcaldiaPubKey,
  myPublicSignKeyPem
) {

  // 1. Firma del archivo
  const signature = await signData(privateSignKey, fileBuffer);

  // 2. Generar clave AES
  const aesKey = await generateAESKey();

  // 3. Cifrar archivo con AES
  const { ciphertext, iv } = await encryptWithAES(aesKey, fileBuffer);

  // 4. Exportar clave AES para cifrarla con RSA
  const rawAES = new Uint8Array(await crypto.subtle.exportKey("raw", aesKey));

  const encryptedAES = new Uint8Array(
    await crypto.subtle.encrypt({ name: "RSA-OAEP" }, alcaldiaPubKey, rawAES)
  );

  // 5. Convertir TODO a Base64 pero SIN usar spread (...)
  const pkg = {
    iv: u8ToBase64(iv),
    encryptedAES: u8ToBase64(encryptedAES),
    encryptedFile: u8ToBase64(ciphertext),
    signature: u8ToBase64(new Uint8Array(signature)),
    signerPublicKeyPem: myPublicSignKeyPem,
  };

  // 6. Crear blob JSON
  const blob = new Blob([JSON.stringify(pkg, null, 2)], {
    type: "application/json",
  });

  return blob;
}
