// FirmarDocumentos.jsx
import React, { useState } from 'react'
import {
  generateRSAKeyPair_sign,
  exportPublicKeyToPEM,
  importRSAPublicKeyFromPEM,
} from './utilidades/crypto'
import { preparePackage } from './utilidades/sender'

export default function SignAndSend() {
  const [file, setFile] = useState(null)
  const [firmaKeys, setFirmaKeys] = useState(null)
  const [alcaldiaKey, setAlcaldiaKey] = useState(null)
  const [encryptedBlob, setEncryptedBlob] = useState(null)
  const [publicKeyPEM, setPublicKeyPEM] = useState('')
  const [privateKeyPEM, setPrivateKeyPEM] = useState('')
  const [alcaldiaKeyPEM, setAlcaldiaKeyPEM] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alcaldiaKeyLoaded, setAlcaldiaKeyLoaded] = useState(false)

  // Generar claves de firma
  async function handleGenerateKeys() {
    setIsLoading(true)
    try {
      const kp = await generateRSAKeyPair_sign()
      setFirmaKeys(kp)

      // Exportar claves a PEM
      const publicPem = await exportPublicKeyToPEM(kp.publicKey)

      const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', kp.privateKey)
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pkcs8)))
      const pemLines = base64.match(/.{1,64}/g).join('\n')
      const privatePem = `-----BEGIN PRIVATE KEY-----\n${pemLines}\n-----END PRIVATE KEY-----`

      setPublicKeyPEM(publicPem)
      setPrivateKeyPEM(privatePem)
    } catch (error) {
      console.error('Error generando claves:', error)
      alert('Error generando claves: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Importar clave pública de la alcaldía
  async function handleLoadAlcaldiaKey(pemText) {
    if (!pemText.trim()) return
    try {
      const imported = await importRSAPublicKeyFromPEM(pemText)
      setAlcaldiaKey(imported)
      setAlcaldiaKeyPEM(pemText)
      setAlcaldiaKeyLoaded(true)
    } catch (err) {
      console.error('Error cargando clave alcaldía:', err)
      alert('Error cargando clave de la alcaldía: ' + err.message)
      setAlcaldiaKeyLoaded(false)
    }
  }

  // Procesar archivo
  // FirmarDocumentos.jsx (solo actualiza la función handleSend)
  async function handleSend() {
    if (!file || !firmaKeys || !alcaldiaKey) {
      alert('Falta archivo, claves de firma o clave pública de la Alcaldía')
      return
    }

    setIsLoading(true)

    try {
      const fileBuffer = await file.arrayBuffer()

      const blob = await preparePackage(
        new Uint8Array(fileBuffer),
        firmaKeys.privateKey,
        alcaldiaKey,
        publicKeyPEM,
        file // Pasamos el archivo original para preservar metadata
      )

      setEncryptedBlob(blob)
      alert('✅ Documento firmado y cifrado correctamente')
    } catch (error) {
      console.error(error)
      alert('❌ Error procesando archivo: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  function downloadEncrypted() {
    if (!encryptedBlob) return

    const url = URL.createObjectURL(encryptedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = file ? `${file.name}.enc` : 'documento_firmado.enc'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allReady = file && firmaKeys && alcaldiaKey

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center space-y-3'>
        <div className='w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
          <span className='text-white text-2xl'>📝</span>
        </div>
        <h2 className='text-2xl font-bold text-gray-800'>Firmar y Enviar</h2>
        <p className='text-gray-600'>
          Firma digitalmente tus documentos y envíalos seguros
        </p>
      </div>

      {/* Generar Claves */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          🔑 Claves de Firma
        </h3>
        <button
          onClick={handleGenerateKeys}
          disabled={isLoading}
          className='w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-[1.02] transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
        >
          {isLoading
            ? '⏳ Generando claves...'
            : '🔑 Generar Mis Claves de Firma'}
        </button>
      </div>

      {/* Mostrar Claves Generadas */}
      {(publicKeyPEM || privateKeyPEM) && (
        <div className='grid md:grid-cols-2 gap-4'>
          {/* Clave Pública */}
          {publicKeyPEM && (
            <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Mi Clave Pública
              </label>
              <textarea
                readOnly
                className='w-full h-32 px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 font-mono text-xs focus:ring-2 focus:ring-green-500 focus:border-transparent'
                value={publicKeyPEM}
              />
              <button
                onClick={() => navigator.clipboard.writeText(publicKeyPEM)}
                className='mt-3 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
              >
                📋 Copiar al Portapapeles
              </button>
            </div>
          )}

          {/* Clave Privada */}
          {privateKeyPEM && (
            <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Mi Clave Privada
              </label>
              <textarea
                readOnly
                className='w-full h-32 px-4 py-3 border-2 border-red-200 rounded-xl bg-red-50 font-mono text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent'
                value={privateKeyPEM}
              />
              <button
                onClick={() => navigator.clipboard.writeText(privateKeyPEM)}
                className='mt-3 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
              >
                📋 Copiar al Portapapeles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seleccionar Archivo */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          📄 Documento a Firmar
        </label>
        <input
          type='file'
          onChange={(e) => setFile(e.target.files[0])}
          className='w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 transition-colors cursor-pointer'
        />
      </div>

      {/* Clave de la Alcaldía */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          🏛️ Clave Pública de la Alcaldía
        </label>
        <textarea
          placeholder='Pega aquí la clave pública de la alcaldía...'
          value={alcaldiaKeyPEM}
          onChange={(e) => setAlcaldiaKeyPEM(e.target.value)}
          onBlur={() => handleLoadAlcaldiaKey(alcaldiaKeyPEM)}
          className={`w-full h-32 px-4 py-3 border-2 rounded-xl font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
            alcaldiaKeyLoaded
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 bg-white'
          }`}
        />
        {alcaldiaKeyLoaded && (
          <p className='text-sm text-green-600 mt-2 flex items-center'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>✔
            Clave de la Alcaldía cargada correctamente
          </p>
        )}
      </div>

      {/* Botón Principal */}
      <button
        onClick={handleSend}
        disabled={!allReady || isLoading}
        className='w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 
                   text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                   transform hover:scale-[1.02] transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
      >
        {isLoading ? '⏳ Procesando...' : '🚀 Firmar, Cifrar y Generar Archivo'}
      </button>

      {/* Descargar Archivo Cifrado */}
      {encryptedBlob && (
        <button
          onClick={downloadEncrypted}
          className='w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-[1.02] transition-all duration-200'
        >
          📥 Descargar Documento Cifrado
        </button>
      )}
    </div>
  )
}
