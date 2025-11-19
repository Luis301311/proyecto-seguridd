import React, { useState } from 'react'
import {
  generateRSAKeyPair_sign,
  exportPublicKeyToPEM,
} from './utilidades/crypto'
import { preparePackage } from './utilidades/sender'
import { importRSAPublicKeyFromPEM } from './utilidades/crypto'

export default function SignAndSend() {
  const [file, setFile] = useState(null)
  const [firmaKeys, setFirmaKeys] = useState(null)
  const [alcaldiaKey, setAlcaldiaKey] = useState(null)
  const [encryptedBlob, setEncryptedBlob] = useState(null)
  const [publicKeyPEM, setPublicKeyPEM] = useState('')
  const [privateKeyPEM, setPrivateKeyPEM] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alcaldiaKeyLoaded, setAlcaldiaKeyLoaded] = useState(false)

  async function handleGenerateKeys() {
    setIsLoading(true)
    try {
      const kp = await generateRSAKeyPair_sign()
      setFirmaKeys(kp)

      // Exportar clave pública
      const publicPem = await exportPublicKeyToPEM(kp.publicKey)

      // Exportar clave privada a PEM
      const privatePem = await window.crypto.subtle
        .exportKey('pkcs8', kp.privateKey)
        .then((buf) => {
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
          const lines = base64.match(/.{1,64}/g).join('\n')
          return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`
        })

      setPublicKeyPEM(publicPem)
      setPrivateKeyPEM(privatePem)
    } catch (error) {
      console.error('Error generando claves:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLoadAlcaldiaKey(pemText) {
    if (!pemText.trim()) return

    try {
      const imported = await importRSAPublicKeyFromPEM(pemText)
      setAlcaldiaKey(imported)
      setAlcaldiaKeyLoaded(true)
    } catch (error) {
      console.error('Error cargando clave de la alcaldía:', error)
      setAlcaldiaKeyLoaded(false)
    }
  }

  async function handleSend() {
    if (!file || !firmaKeys || !alcaldiaKey) {
      alert('Falta archivo, clave de firma o clave pública de la Alcaldía.')
      return
    }

    setIsLoading(true)
    try {
      const fileBuffer = await file.arrayBuffer()
      const blob = await preparePackage(
        fileBuffer,
        firmaKeys.privateKey,
        alcaldiaKey
      )
      setEncryptedBlob(blob)
    } catch (error) {
      console.error('Error procesando archivo:', error)
      alert('Error al procesar el archivo. Verifica los datos.')
    } finally {
      setIsLoading(false)
    }
  }

  function downloadEncrypted() {
    const url = URL.createObjectURL(encryptedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name + '.enc'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allReady = file && firmaKeys && alcaldiaKey

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <div className='w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
          <span className='text-white text-xl'>📝</span>
        </div>
        <h2 className='text-2xl font-bold text-gray-800'>Firmar y Enviar</h2>
        <p className='text-gray-600'>
          Firma digitalmente tus documentos y prepáralos para envío seguro
        </p>
      </div>

      <div className='space-y-6'>
        {/* Generar Claves */}
        <div className='text-center'>
          <button
            onClick={handleGenerateKeys}
            disabled={isLoading}
            className='px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            {isLoading ? (
              <div className='flex items-center justify-center gap-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                Generando claves...
              </div>
            ) : (
              '🔑 Generar Mis Claves de Firma'
            )}
          </button>
        </div>

        {/* Claves Generadas */}
        {(publicKeyPEM || privateKeyPEM) && (
          <div className='grid md:grid-cols-2 gap-4'>
            {/* Clave Pública */}
            {publicKeyPEM && (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    Mi Clave Pública
                  </div>
                </label>
                <textarea
                  className='w-full h-40 px-4 py-3 border-2 border-green-200 rounded-xl 
                            bg-green-50 font-mono text-xs focus:ring-2 focus:ring-green-500 
                            transition-all duration-200 resize-none'
                  readOnly
                  value={publicKeyPEM}
                />
                <p className='text-xs text-green-600'>
                  Comparte esta clave con otros
                </p>
              </div>
            )}

            {/* Clave Privada */}
            {privateKeyPEM && (
              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700'>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                    Mi Clave Privada
                  </div>
                </label>
                <textarea
                  className='w-full h-40 px-4 py-3 border-2 border-red-200 rounded-xl 
                            bg-red-50 font-mono text-xs focus:ring-2 focus:ring-red-500 
                            transition-all duration-200 resize-none'
                  readOnly
                  value={privateKeyPEM}
                />
                <p className='text-xs text-red-600'>
                  ⚠️ Mantén esta clave en secreto
                </p>
              </div>
            )}
          </div>
        )}

        {/* Selección de Archivo */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Documento a Firmar
          </label>
          <div className='relative'>
            <input
              type='file'
              onChange={(e) => setFile(e.target.files[0])}
              className='w-full px-4 py-4 border-2 border-dashed border-gray-300 
                         rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                         transition-all duration-200 file:mr-4 file:py-2 file:px-4 
                         file:rounded-lg file:border-0 file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                         cursor-pointer'
            />
            {file && (
              <div className='absolute top-2 right-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-sm'>
                ✅ {file.name}
              </div>
            )}
          </div>
        </div>

        {/* Clave de la Alcaldía */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Clave Pública de la Alcaldía
          </label>
          <textarea
            className={`w-full h-24 px-4 py-3 border-2 rounded-xl font-mono text-sm
                       focus:ring-2 focus:ring-orange-500 transition-all duration-200 
                       resize-none placeholder-gray-400
                       ${
                         alcaldiaKeyLoaded
                           ? 'border-orange-500 bg-orange-50'
                           : 'border-gray-200'
                       }`}
            placeholder='-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...'
            onBlur={(e) => handleLoadAlcaldiaKey(e.target.value)}
          />
          {alcaldiaKeyLoaded && (
            <div className='flex items-center gap-2 text-sm text-orange-600'>
              <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
              Clave de la alcaldía cargada correctamente
            </div>
          )}
        </div>

        {/* Botón de Procesar */}
        <button
          onClick={handleSend}
          disabled={!allReady || isLoading}
          className='w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 
                   text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                   transform hover:scale-105 transition-all duration-200 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                   focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
        >
          {isLoading ? (
            <div className='flex items-center justify-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
              Procesando documento...
            </div>
          ) : (
            '🚀 Firmar, Cifrar y Generar Archivo'
          )}
        </button>

        {/* Descargar Archivo Cifrado */}
        {encryptedBlob && (
          <button
            onClick={downloadEncrypted}
            className='w-full py-4 bg-gradient-to-r from-purple-500 to-pink-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200 
                     focus:ring-2 focus:ring-purple-500 focus:ring-offset-2'
          >
            📥 Descargar Documento Cifrado
          </button>
        )}
      </div>

      {/* Indicador de Estado */}
      <div className='flex items-center justify-between text-sm text-gray-500 pt-4 border-t'>
        <div className='flex items-center gap-4'>
          <div
            className={`flex items-center gap-1 ${
              firmaKeys ? 'text-green-600' : ''
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                firmaKeys ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            Claves de firma
          </div>
          <div
            className={`flex items-center gap-1 ${file ? 'text-blue-600' : ''}`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                file ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            ></div>
            Documento
          </div>
          <div
            className={`flex items-center gap-1 ${
              alcaldiaKey ? 'text-orange-600' : ''
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                alcaldiaKey ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            ></div>
            Clave alcaldía
          </div>
        </div>
        <div
          className={`text-xs px-2 py-1 rounded ${
            allReady
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {allReady ? 'Listo para firmar' : 'Completa los pasos'}
        </div>
      </div>
    </div>
  )
}
