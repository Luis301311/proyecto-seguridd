// DesencriptarDocumento.jsx
import React, { useState } from 'react'
import {
  generateRSAKeyPair_alcaldia,
  exportPublicKeyToPEM,
  exportPrivateKeyToPEM,
  importRSAPrivateKeyFromPEM,
  importRSAPublicKeyFromPEM_Sign,
} from './utilidades/crypto'
import { openPackage } from './utilidades/receiver'

export default function ReceptorAlcaldia() {
  const [alcaldiaKeys, setAlcaldiaKeys] = useState(null)
  const [privateKeyLoaded, setPrivateKeyLoaded] = useState(false)
  const [userPublicKey, setUserPublicKey] = useState(null)
  const [userPublicKeyPEM, setUserPublicKeyPEM] = useState('')

  const [publicPem, setPublicPem] = useState('')
  const [privatePem, setPrivatePem] = useState('')

  const [encryptedFile, setEncryptedFile] = useState(null)
  const [originalBuffer, setOriginalBuffer] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [verificationResult, setVerificationResult] = useState(null)

  // Generar claves de la alcaldía
  async function generateKeys() {
    setIsLoading(true)
    try {
      const kp = await generateRSAKeyPair_alcaldia()
      setAlcaldiaKeys(kp)

      const publicOut = await exportPublicKeyToPEM(kp.publicKey)
      const privateOut = await exportPrivateKeyToPEM(kp.privateKey)

      setPublicPem(publicOut)
      setPrivatePem(privateOut)

      setPrivateKeyLoaded(true)
      alert('✅ Claves de la alcaldía generadas correctamente')
    } catch (e) {
      console.error(e)
      alert('❌ Error generando claves: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Importar clave privada
  async function handleImportPrivateKey(pemText) {
    if (!pemText.trim()) return
    try {
      const priv = await importRSAPrivateKeyFromPEM(pemText)
      setAlcaldiaKeys((prev) => ({ ...prev, privateKey: priv }))
      setPrivateKeyLoaded(true)
      setPrivatePem(pemText)
      alert('✅ Clave privada cargada correctamente')
    } catch (err) {
      console.error(err)
      alert('❌ Error importando clave privada: ' + err.message)
    }
  }

  // Importar clave pública del usuario
  async function handleImportUserPublicKey(pemText) {
    if (!pemText.trim()) return
    try {
      const pub = await importRSAPublicKeyFromPEM_Sign(pemText)
      setUserPublicKey(pub)
      setUserPublicKeyPEM(pemText)
      alert('✅ Clave pública del usuario cargada correctamente')
    } catch (err) {
      console.error(err)
      alert('❌ Error importando clave del usuario: ' + err.message)
    }
  }

  // Descifrar archivo
  async function handleDecrypt() {
    if (!encryptedFile || !alcaldiaKeys?.privateKey) {
      alert('Falta archivo cifrado o clave privada de la alcaldía')
      return
    }

    setIsLoading(true)
    setVerificationResult(null)
    setOriginalBuffer(null)

    try {
      const text = await encryptedFile.text()
      const pkg = JSON.parse(text)

      const { fileBuffer, valid, fileName, fileType } = await openPackage(
        pkg,
        alcaldiaKeys.privateKey
      )

      // Guardamos toda la información del archivo
      setOriginalBuffer({
        data: fileBuffer,
        name: fileName,
        type: fileType,
      })
      setVerificationResult(valid ? 'valid' : 'invalid')

      if (valid) {
        alert('✅ Documento descifrado y firma válida')
      } else {
        alert('⚠️ Documento descifrado, pero firma NO válida')
      }
    } catch (e) {
      console.error(e)
      alert('❌ Error descifrando: ' + e.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Descargar documento original
  function downloadOriginal() {
    if (!originalBuffer || !originalBuffer.data) return

    // Crear el blob con el tipo MIME correcto
    const blob = new Blob([originalBuffer.data], { type: originalBuffer.type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = originalBuffer.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canDecrypt = encryptedFile && alcaldiaKeys?.privateKey
  const canDownload = originalBuffer && originalBuffer.data

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center space-y-3'>
        <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center mx-auto rounded-2xl shadow-lg'>
          <span className='text-2xl'>🏛️</span>
        </div>
        <h2 className='text-2xl font-bold text-gray-800'>
          Receptor - Alcaldía
        </h2>
        <p className='text-gray-600'>
          Descifra y verifica documentos enviados por los ciudadanos
        </p>
      </div>

      {/* Generar Claves */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-800 mb-4'>
          🔑 Claves de la Alcaldía
        </h3>
        <button
          onClick={generateKeys}
          disabled={isLoading}
          className='w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-[1.02] transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isLoading ? '⏳ Generando...' : '🔑 Generar Claves de la Alcaldía'}
        </button>
      </div>

      {/* Mostrar Claves Generadas */}
      {(publicPem || privatePem) && (
        <div className='grid md:grid-cols-2 gap-4'>
          {/* Clave Pública */}
          {publicPem && (
            <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Clave Pública Alcaldía
              </label>
              <textarea
                readOnly
                className='w-full h-32 px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 font-mono text-xs'
                value={publicPem}
              />
              <button
                onClick={() => navigator.clipboard.writeText(publicPem)}
                className='mt-3 w-full py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
              >
                📋 Copiar al Portapapeles
              </button>
            </div>
          )}

          {/* Clave Privada */}
          {privatePem && (
            <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Clave Privada Alcaldía
              </label>
              <textarea
                readOnly
                className='w-full h-32 px-4 py-3 border-2 border-red-200 rounded-xl bg-red-50 font-mono text-xs'
                value={privatePem}
              />
              <button
                onClick={() => navigator.clipboard.writeText(privatePem)}
                className='mt-3 w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors'
              >
                📋 Copiar al Portapapeles
              </button>
            </div>
          )}
        </div>
      )}

      {/* Importar Clave Privada */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          🔒 Clave Privada de la Alcaldía
        </label>
        <textarea
          placeholder='Pega aquí la clave privada de la alcaldía...'
          value={privatePem}
          onChange={(e) => setPrivatePem(e.target.value)}
          onBlur={() => handleImportPrivateKey(privatePem)}
          className={`w-full h-32 px-4 py-3 border-2 rounded-xl font-mono text-xs focus:ring-2 focus:ring-red-500 focus:border-transparent ${
            privateKeyLoaded
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white'
          }`}
        />
        {privateKeyLoaded && (
          <p className='text-sm text-green-600 mt-2 flex items-center'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>✔
            Clave privada cargada correctamente
          </p>
        )}
      </div>

      {/* Clave Pública del Usuario */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          👤 Clave Pública del Usuario
        </label>
        <textarea
          placeholder='Pega aquí la clave pública del usuario firmante...'
          value={userPublicKeyPEM}
          onChange={(e) => setUserPublicKeyPEM(e.target.value)}
          onBlur={() => handleImportUserPublicKey(userPublicKeyPEM)}
          className='w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent'
        />
        {userPublicKey && (
          <p className='text-sm text-green-600 mt-2 flex items-center'>
            <span className='w-2 h-2 bg-green-500 rounded-full mr-2'></span>✔
            Clave pública del usuario cargada
          </p>
        )}
      </div>

      {/* Archivo Cifrado */}
      <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
        <label className='block text-sm font-semibold text-gray-700 mb-3'>
          📁 Documento Cifrado (.enc)
          {encryptedFile && (
            <span className='ml-2 text-sm font-normal text-blue-600'>
              ✔ {encryptedFile.name} ({(encryptedFile.size / 1024).toFixed(2)}{' '}
              KB)
            </span>
          )}
        </label>
        <input
          type='file'
          accept='.enc'
          onChange={(e) => setEncryptedFile(e.target.files[0])}
          className='w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors cursor-pointer'
        />
      </div>

      {/* Botón Descifrar */}
      <button
        onClick={handleDecrypt}
        disabled={!canDecrypt || isLoading}
        className='w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 
                   text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                   transform hover:scale-[1.02] transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {isLoading ? '⏳ Descifrando...' : '🔓 Descifrar y Verificar Documento'}
      </button>

      {/* Resultado de Verificación */}
      {verificationResult && (
        <div
          className={`rounded-2xl p-6 text-center ${
            verificationResult === 'valid'
              ? 'bg-green-50 border border-green-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              verificationResult === 'valid' ? 'bg-green-100' : 'bg-yellow-100'
            }`}
          >
            <span className='text-2xl'>
              {verificationResult === 'valid' ? '✅' : '⚠️'}
            </span>
          </div>
          <p
            className={`font-semibold ${
              verificationResult === 'valid'
                ? 'text-green-700'
                : 'text-yellow-700'
            }`}
          >
            {verificationResult === 'valid'
              ? 'Firma digital válida'
              : 'Firma digital NO válida'}
          </p>
          <p className='text-sm text-gray-600 mt-2'>
            {verificationResult === 'valid'
              ? 'El documento ha sido verificado y es auténtico'
              : 'El documento puede haber sido alterado o la firma no coincide'}
          </p>
        </div>
      )}

      {/* Información del Archivo Descifrado */}
      {originalBuffer && originalBuffer.data && (
        <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100'>
          <h4 className='text-lg font-semibold text-gray-800 mb-3'>
            📄 Documento Descifrado
          </h4>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Nombre:</span>
              <span className='font-mono text-blue-600'>
                {originalBuffer.name}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Tipo:</span>
              <span className='font-mono text-green-600'>
                {originalBuffer.type}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-600'>Tamaño:</span>
              <span className='font-mono text-purple-600'>
                {(originalBuffer.data.byteLength / 1024).toFixed(2)} KB
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Descargar Documento */}
      {canDownload && (
        <button
          onClick={downloadOriginal}
          className='w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-[1.02] transition-all duration-200'
        >
          📥 Descargar {originalBuffer.name}
        </button>
      )}

      {/* Estado del Sistema */}
      <div className='bg-blue-50 rounded-2xl p-4 border border-blue-200'>
        <h4 className='font-semibold text-blue-800 mb-2'>
          Estado del sistema:
        </h4>
        <div className='space-y-2 text-sm'>
          <div className='flex items-center'>
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                alcaldiaKeys?.privateKey ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            <span>
              Clave privada alcaldía:{' '}
              {alcaldiaKeys?.privateKey ? '✅ Cargada' : '❌ Pendiente'}
            </span>
          </div>
          <div className='flex items-center'>
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                encryptedFile ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            <span>
              Documento cifrado:{' '}
              {encryptedFile ? `✅ ${encryptedFile.name}` : '❌ Pendiente'}
            </span>
          </div>
          <div className='flex items-center'>
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                userPublicKey ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            <span>
              Clave pública usuario:{' '}
              {userPublicKey ? '✅ Cargada' : '⚠️ Opcional'}
            </span>
          </div>
          <div className='flex items-center'>
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                originalBuffer?.data ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            <span>
              Documento descifrado:{' '}
              {originalBuffer?.data ? '✅ Listo' : '❌ Pendiente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
