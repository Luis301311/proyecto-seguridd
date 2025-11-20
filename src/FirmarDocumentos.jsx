import React, { useState } from 'react'
import {
  generateRSAKeyPair_sign,
  exportPublicKeyToPEM,
  importRSAPublicKeyFromPEM
} from './utilidades/crypto'
import { preparePackage } from './utilidades/sender'

export default function SignAndSend() {
  const [file, setFile] = useState(null)
  const [firmaKeys, setFirmaKeys] = useState(null)
  const [alcaldiaKey, setAlcaldiaKey] = useState(null)
  const [encryptedBlob, setEncryptedBlob] = useState(null)
  const [publicKeyPEM, setPublicKeyPEM] = useState('')
  const [privateKeyPEM, setPrivateKeyPEM] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alcaldiaKeyLoaded, setAlcaldiaKeyLoaded] = useState(false)

  // -----------------------
  //      DESCARGAS
  // -----------------------
  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPublicKey() {
    downloadTextFile("mi_clave_publica.pem", publicKeyPEM)
  }

  function downloadPrivateKey() {
    downloadTextFile("mi_clave_privada.pem", privateKeyPEM)
  }

  // -----------------------
  // GENERAR CLAVES
  // -----------------------
  async function handleGenerateKeys() {
    setIsLoading(true)
    try {
      const kp = await generateRSAKeyPair_sign()
      setFirmaKeys(kp)

      // Exportar clave pública
      const publicPem = await exportPublicKeyToPEM(kp.publicKey)

      // Exportar clave privada
      const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', kp.privateKey)
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)))
      const pemLines = base64.match(/.{1,64}/g).join('\n')
      const privatePem = `-----BEGIN PRIVATE KEY-----\n${pemLines}\n-----END PRIVATE KEY-----`

      setPublicKeyPEM(publicPem)
      setPrivateKeyPEM(privatePem)
    } catch (error) {
      console.error('Error generando claves:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // -----------------------
  // CARGAR CLAVE ALCALDÍA
  // -----------------------
  async function handleLoadAlcaldiaKey(pemText) {
    if (!pemText.trim()) return
    try {
      const imported = await importRSAPublicKeyFromPEM(pemText)
      setAlcaldiaKey(imported)
      setAlcaldiaKeyLoaded(true)
    } catch (err) {
      console.error("Error cargando clave alcaldía:", err)
      setAlcaldiaKeyLoaded(false)
    }
  }

  // -----------------------
  //  PROCESAR ARCHIVO
  // -----------------------
  async function handleSend() {
    if (!file || !firmaKeys || !alcaldiaKey) {
      alert("Falta archivo, claves o clave pública de la Alcaldía");
      return;
    }

    setIsLoading(true);

    try {
      const fileBuffer = await file.arrayBuffer();

      const blob = await preparePackage(
        new Uint8Array(fileBuffer),       // documento
        firmaKeys.privateKey,             // clave privada FIRMA usuario
        alcaldiaKey,                      // clave pública ALCALDÍA (RSA OAEP)
        publicKeyPEM                  // PEM del usuario (firmante)
      );

      setEncryptedBlob(blob);
    } catch (error) {
      console.error(error);
      alert("❌ Error procesando archivo");
    } finally {
      setIsLoading(false);
    }
  }


  function downloadEncrypted() {
    const url = URL.createObjectURL(encryptedBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name + ".enc"
    a.click()
    URL.revokeObjectURL(url)
  }

  const allReady = file && firmaKeys && alcaldiaKey


  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <span className="text-white text-xl">📝</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Firmar y Enviar</h2>
        <p className="text-gray-600">Firma digitalmente tus documentos y envíalos seguros</p>
      </div>

      {/* GENERAR CLAVES */}
      <div className="text-center">
        <button
          onClick={handleGenerateKeys}
          disabled={isLoading}
          className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {isLoading ? "Generando claves..." : "🔑 Generar Mis Claves de Firma"}
        </button>
      </div>

      {/* 📥 BOTONES DE DESCARGA — JUSTO DEBAJO */}
      {(publicKeyPEM || privateKeyPEM) && (
        <div className="grid grid-cols-2 gap-4 text-center">

          <button
            onClick={downloadPublicKey}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
                     transform hover:scale-105 transition-all duration-200"
          >
            📤 Descargar Clave Pública
          </button>

          <button
            onClick={downloadPrivateKey}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl
                     transform hover:scale-105 transition-all duration-200"
          >
            🔐 Descargar Clave Privada
          </button>

        </div>
      )}

      {/* CLAVES MOSTRADAS */}
      {(publicKeyPEM || privateKeyPEM) && (
        <div className="grid md:grid-cols-2 gap-4 mt-4">

          {/* PUBLICA */}
          {publicKeyPEM && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mi Clave Pública</label>
              <textarea
                readOnly
                className="w-full h-40 px-4 py-3 border-2 border-green-300 rounded-xl bg-green-50 font-mono text-xs"
                value={publicKeyPEM}
              />
            </div>
          )}

          {/* PRIVADA */}
          {privateKeyPEM && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Mi Clave Privada</label>
              <textarea
                readOnly
                className="w-full h-40 px-4 py-3 border-2 border-red-300 rounded-xl bg-red-50 font-mono text-xs"
                value={privateKeyPEM}
              />
            </div>
          )}
        </div>
      )}

      {/* ARCHIVO */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Documento a Firmar</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl"
        />
      </div>

      {/* CLAVE ALCALDIA */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Clave Pública de la Alcaldía</label>

        <input
          type="file"
          accept=".pem"
          onChange={async (e) => {
            const f = e.target.files[0]
            if (!f) return
            const text = await f.text()
            handleLoadAlcaldiaKey(text)
          }}
          className={`w-full px-4 py-4 border-2 rounded-xl cursor-pointer font-mono text-sm
            ${alcaldiaKeyLoaded ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white"}`}
        />

        {alcaldiaKeyLoaded && (
          <p className="text-sm text-orange-600 mt-1">✔ Clave de la Alcaldía cargada</p>
        )}
      </div>

      {/* BOTÓN PRINCIPAL */}
      <button
        onClick={handleSend}
        disabled={!allReady || isLoading}
        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 
                   text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                   transform hover:scale-105 transition-all duration-200 
                   disabled:opacity-50"
      >
        🚀 Firmar, Cifrar y Generar Archivo
      </button>

      {/* DESCARGAR ARCHIVO CIFRADO */}
      {encryptedBlob && (
        <button
          onClick={downloadEncrypted}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 
                     text-white font-semibold rounded-xl hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200"
        >
          📥 Descargar Documento Cifrado
        </button>
      )}
    </div>
  )
}
