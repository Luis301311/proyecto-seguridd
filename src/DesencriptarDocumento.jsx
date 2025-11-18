import React, { useState } from "react";
import { importRSAPrivateKeyFromPEM, importRSAPublicKeyFromPEM } from "./utilidades/crypto";

export default function ReceptorAlcaldia() {

  const [privateKey, setPrivateKey] = useState(null);
  const [senderPublicKey, setSenderPublicKey] = useState(null);
  const [result, setResult] = useState(null);
  const [restoredFile, setRestoredFile] = useState(null);

  async function handleLoadPrivateKey(e) {
    const pem = await e.target.value;
    const key = await importRSAPrivateKeyFromPEM(pem);
    setPrivateKey(key);
  }

  async function handleLoadSenderPublicKey(e) {
    const pem = e.target.value;
    const key = await importRSAPublicKeyFromPEM(pem);
    setSenderPublicKey(key);
  }

  async function handleLoadEncryptedFile(e) {
    const file = e.target.files[0];
    const text = await file.text();
    const pkg = JSON.parse(text);

    try {
      const iv = new Uint8Array(pkg.iv);
      const encryptedAES = new Uint8Array(pkg.encryptedAES);
      const encryptedFile = new Uint8Array(pkg.encryptedFile);
      const signature = new Uint8Array(pkg.signature);

      // 1. Descifrar la clave AES con clave privada RSA
      const rawAesKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedAES
      );

      const aesKey = await crypto.subtle.importKey(
        "raw",
        rawAesKey,
        "AES-GCM",
        false,
        ["decrypt"]
      );

      // 2. Descifrar archivo
      const decryptedFile = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        encryptedFile
      );

      // 3. Verificar firma
      const validSignature = await crypto.subtle.verify(
        {
          name: "RSASSA-PKCS1-v1_5",
        },
        senderPublicKey,
        signature,
        decryptedFile
      );

      setResult(validSignature ? "Firma válida ✔" : "Firma NO válida ❌");
      setRestoredFile(new Blob([decryptedFile], { type: "application/pdf" }));

    } catch (err) {
      setResult("❌ Error al descifrar el archivo");
      console.error(err);
    }
  }

  function downloadRestored() {
    const url = URL.createObjectURL(restoredFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = "documento-restaurado.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-xl space-y-4">

      <h2 className="text-xl font-bold text-gray-700">Receptor – Alcaldía</h2>

      {/* Clave privada */}
      <textarea
        className="w-full border p-2 rounded"
        rows={6}
        placeholder="Pega aquí la clave PRIVADA de la Alcaldía"
        onBlur={handleLoadPrivateKey}
      />

      {/* Clave pública del remitente */}
      <textarea
        className="w-full border p-2 rounded"
        rows={4}
        placeholder="Pega la clave pública del ciudadano"
        onBlur={handleLoadSenderPublicKey}
      />

      {/* Archivo cifrado */}
      <input
        type="file"
        className="w-full border p-2 rounded"
        onChange={handleLoadEncryptedFile}
      />

      {result && <div className="text-center font-bold">{result}</div>}

      {restoredFile && (
        <button
          onClick={downloadRestored}
          className="w-full py-3 bg-purple-600 text-white rounded-lg"
        >
          Descargar Documento Restaurado
        </button>
      )}
    </div>
  );
}
