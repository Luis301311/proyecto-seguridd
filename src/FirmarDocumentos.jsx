import React, { useState } from "react";
import { generateRSAKeyPair_sign, exportPublicKeyToPEM } from "./utilidades/crypto";
import { preparePackage } from "./utilidades/sender";
import { importRSAPublicKeyFromPEM } from "./utilidades/crypto";

export default function SignAndSend() {
  const [file, setFile] = useState(null);
  const [firmaKeys, setFirmaKeys] = useState(null);
  const [alcaldiaKey, setAlcaldiaKey] = useState(null);
  const [encryptedBlob, setEncryptedBlob] = useState(null);

  const [publicKeyPEM, setPublicKeyPEM] = useState("");
  const [privateKeyPEM, setPrivateKeyPEM] = useState("");

  async function handleGenerateKeys() {
    const kp = await generateRSAKeyPair_sign();
    setFirmaKeys(kp);

    // Exportar clave pública
    const publicPem = await exportPublicKeyToPEM(kp.publicKey);

    // Exportar clave privada a PEM
    const privatePem = await window.crypto.subtle.exportKey("pkcs8", kp.privateKey)
      .then(buf => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
        const lines = base64.match(/.{1,64}/g).join("\n");
        return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
      });

    // Mostrar ambas claves
    setPublicKeyPEM(publicPem);
    setPrivateKeyPEM(privatePem);
  }

  async function handleLoadAlcaldiaKey(pemText) {
    const imported = await importRSAPublicKeyFromPEM(pemText);
    setAlcaldiaKey(imported);
  }

  async function handleSend() {
    if (!file || !firmaKeys || !alcaldiaKey) {
      alert("Falta archivo, clave de firma o clave pública de la Alcaldía.");
      return;
    }

    const fileBuffer = await file.arrayBuffer();
    const blob = await preparePackage(
      fileBuffer,
      firmaKeys.privateKey,
      alcaldiaKey
    );

    setEncryptedBlob(blob);
  }

  function downloadEncrypted() {
    const url = URL.createObjectURL(encryptedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name + ".enc";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-xl space-y-4">

      <button
        onClick={handleGenerateKeys}
        className="w-full py-3 bg-blue-600 text-white rounded-lg"
      >
        Generar Mis Claves de Firma
      </button>

      {publicKeyPEM && (
        <div>
          <h3 className="font-bold mt-4">Mi Clave Pública</h3>
          <textarea
            className="w-full border rounded p-2 text-xs"
            rows={6}
            readOnly
            value={publicKeyPEM}
          />
        </div>
      )}

      {privateKeyPEM && (
        <div>
          <h3 className="font-bold mt-4">Mi Clave Privada</h3>
          <textarea
            className="w-full border rounded p-2 text-xs"
            rows={6}
            readOnly
            value={privateKeyPEM}
          />
        </div>
      )}

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="w-full border rounded p-2"
      />

      <textarea
        className="w-full border rounded p-2"
        placeholder="Pega aquí la clave pública de la Alcaldía"
        onBlur={(e) => handleLoadAlcaldiaKey(e.target.value)}
      />

      <button
        onClick={handleSend}
        className="w-full py-3 bg-green-600 text-white rounded-lg"
      >
        Firmar, Cifrar y Generar Archivo Descargable
      </button>

      {encryptedBlob && (
        <button
          onClick={downloadEncrypted}
          className="w-full py-3 bg-purple-600 text-white rounded-lg"
        >
          Descargar Documento Cifrado
        </button>
      )}
    </div>
  );
}
