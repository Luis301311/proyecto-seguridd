// utilidades/sender.js
import {
  generateAESKey,
  encryptWithAES,
  signData,
  encryptAESKeyWithRSA,
} from './crypto'

function u8ToBase64(u8) {
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i])
  return btoa(binary)
}

export async function preparePackage(
  fileBuffer,
  privateSignKey,
  alcaldiaPubKey,
  myPublicSignKeyPem,
  originalFile // Agregamos el archivo original para obtener metadata
) {
  // 1. Firma del archivo
  const signature = await signData(privateSignKey, fileBuffer)

  // 2. Generar clave AES
  const aesKey = await generateAESKey()

  // 3. Cifrar archivo con AES
  const { ciphertext, iv } = await encryptWithAES(aesKey, fileBuffer)

  // 4. Cifrar clave AES con RSA pública de la alcaldía
  const encryptedAES = await encryptAESKeyWithRSA(alcaldiaPubKey, aesKey)

  // 5. Convertir todo a Base64 y guardar metadata del archivo
  const pkg = {
    iv: u8ToBase64(iv),
    encryptedAES: u8ToBase64(new Uint8Array(encryptedAES)),
    encryptedFile: u8ToBase64(new Uint8Array(ciphertext)),
    signature: u8ToBase64(new Uint8Array(signature)),
    signerPublicKeyPem: myPublicSignKeyPem,
    fileName: originalFile.name,
    fileType: originalFile.type || 'application/octet-stream',
  }

  // 6. Crear blob JSON
  const blob = new Blob([JSON.stringify(pkg, null, 2)], {
    type: 'application/json',
  })

  return blob
}
