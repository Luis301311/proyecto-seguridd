import React, { useState } from "react"
import {
  generateRSAKeyPair_alcaldia,
  exportPublicKeyToPEM,
  exportPrivateKeyToPEM,
  importRSAPrivateKeyFromPEM,
  importRSAPublicKeyFromPEM
} from "./utilidades/crypto"

import { openPackage } from "./utilidades/receiver"

export default function ReceptorAlcaldia() {
  const [alcaldiaKeys, setAlcaldiaKeys] = useState(null)
  const [privateKeyLoaded, setPrivateKeyLoaded] = useState(false)
  const [userPublicKey, setUserPublicKey] = useState(null)

  const [publicPem, setPublicPem] = useState("")
  const [privatePem, setPrivatePem] = useState("")

  const [encryptedFile, setEncryptedFile] = useState(null)
  const [originalBuffer, setOriginalBuffer] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // ---------------------------------------------------
  // GENERAR CLAVES ALCALDÍA
  // ---------------------------------------------------
  async function generateKeys() {
    setIsLoading(true)

    try {
      const kp = await generateRSAKeyPair_alcaldia()

      setAlcaldiaKeys(kp)

      const publicOut = await exportPublicKeyToPEM(kp.publicKey)
      const privateOut = await exportPrivateKeyToPEM(kp.privateKey)

      setPublicPem(publicOut)
      setPrivatePem(privateOut)

      alert("Claves generadas correctamente.")
    } catch (e) {
      console.error(e)
      alert("Error generando claves.")
    } finally {
      setIsLoading(false)
    }
  }

  // ---------------------------------------------------
  // DESCARGA DE ARCHIVOS PEM
  // ---------------------------------------------------
  function downloadPem(filename, content) {
    const blob = new Blob([content], { type: "application/x-pem-file" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------
  // CARGAR CLAVE PRIVADA ALCALDÍA
  // ---------------------------------------------------
  async function loadPrivateKeyFromFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const text = await file.text()

    try {
      const priv = await importRSAPrivateKeyFromPEM(text)
      setAlcaldiaKeys((prev) => ({ ...prev, privateKey: priv }))
      setPrivateKeyLoaded(true)
      alert("Clave privada cargada correctamente.")
    } catch (err) {
      console.error(err)
      alert("❌ Error leyendo clave privada")
    }
  }

  // ---------------------------------------------------
  // CARGAR CLAVE PÚBLICA DEL USUARIO (para validar firma)
  // ---------------------------------------------------
  async function loadUserPublicKeyFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const text = await file.text()

    try {
      const pub = await importRSAPublicKeyFromPEM(text)
      setUserPublicKey(pub)
      alert("Clave pública del usuario cargada.")
    } catch (err) {
      console.error(err)
      alert("❌ Error cargando clave del usuario")
    }
  }

  // ---------------------------------------------------
  // DESCIFRAR ARCHIVO .enc
async function handleDecrypt() {
  if (!encryptedFile || !alcaldiaKeys?.privateKey) {
    alert("Falta archivo o clave privada.");
    return;
  }

  setIsLoading(true);

  try {
    // 1. Leer JSON del archivo .enc
    const text = await encryptedFile.text();
    const pkg = JSON.parse(text);

    // 2. Llamar a openPackage con el JSON (NO archivo)
    const { fileBuffer, valid } = await openPackage(
      pkg,
      alcaldiaKeys.privateKey
    );

    // 3. Guardar resultado en el estado
    setOriginalBuffer(fileBuffer);

    // 4. Notificación
    alert(
      valid
        ? "Documento descifrado y firma válida 🎉"
        : "Documento descifrado, pero firma NO válida ⚠️"
    );
  } catch (e) {
    console.error(e);
    alert("❌ Error descifrando. Verifique archivo y claves.");
  } finally {
    setIsLoading(false);
  }
}



  // ---------------------------------------------------
  // DESCARGAR DOCUMENTO ORIGINAL
  // ---------------------------------------------------
  function downloadOriginal() {
    if (!originalBuffer) return

    const blob = new Blob([originalBuffer])
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "documento_descifrado"
    a.click()

    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="max-w-2xl mx-auto space-y-8">

      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-600 text-white flex items-center justify-center mx-auto rounded-xl">
          🏛️
        </div>
        <h2 className="text-3xl font-bold">Receptor - Alcaldía</h2>
        <p className="text-gray-600">Descifra y verifica documentos enviados por los ciudadanos</p>
      </div>

      {/* GENERAR CLAVES */}
      <button
        onClick={generateKeys}
        disabled={isLoading}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl"
      >
        {isLoading ? "Generando..." : "🔑 Generar Claves de la Alcaldía"}
      </button>

      {/* DESCARGAR CLAVES */}
      {publicPem && (
        <div className="space-y-3">
          <button
            onClick={() => downloadPem("alcaldia_public.pem", publicPem)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg w-full"
          >
            📤 Descargar clave pública de la alcaldía
          </button>

          <button
            onClick={() => downloadPem("alcaldia_private.pem", privatePem)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg w-full"
          >
            🔒 Descargar clave privada (respaldo)
          </button>
        </div>
      )}

      {/* CARGAR CLAVE PRIVADA */}
      <div className="space-y-2">
        <p className="font-semibold">Cargar clave privada de la Alcaldía:</p>
        <input
          type="file"
          accept=".pem"
          onChange={loadPrivateKeyFromFile}
          className="w-full p-3 border rounded-xl"
        />
      </div>

      {/* CARGAR CLAVE PÚBLICA DEL USUARIO */}
      <div className="space-y-2">
        <p className="font-semibold">Cargar clave pública del usuario:</p>
        <input
          type="file"
          accept=".pem"
          onChange={loadUserPublicKeyFile}
          className="w-full p-3 border rounded-xl"
        />
      </div>

      {/* CARGAR ARCHIVO CIFRADO */}
      <div className="space-y-2">
        <p className="font-semibold">Documento cifrado (.enc):</p>
        <input
          type="file"
          accept=".enc"
          onChange={(e) => setEncryptedFile(e.target.files[0])}
          className="w-full p-3 border rounded-xl"
        />
      </div>

      {/* DESCIFRAR */}
      <button
        onClick={handleDecrypt}
        disabled={isLoading}
        className="w-full py-4 bg-emerald-600 text-white rounded-xl"
      >
        {isLoading ? "Descifrando..." : "🔓 Descifrar Documento"}
      </button>

      {/* DESCARGAR DOCUMENTO */}
      {originalBuffer && (
        <button
          onClick={downloadOriginal}
          className="w-full py-4 bg-purple-600 text-white rounded-xl"
        >
          📥 Descargar Documento Original
        </button>
      )}
    </div>
  )
}
