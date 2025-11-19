import React, { useState } from 'react'
import {
  importRSAPrivateKeyFromPEM,
  importRSAPublicKeyFromPEM,
} from './utilidades/crypto'

export default function ReceptorAlcaldia() {
  const [privateKey, setPrivateKey] = useState(null)
  const [senderPublicKey, setSenderPublicKey] = useState(null)
  const [result, setResult] = useState(null)
  const [restoredFile, setRestoredFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLoadPrivateKey(e) {
    const pem = e.target.value
    if (pem.trim()) {
      try {
        const key = await importRSAPrivateKeyFromPEM(pem)
        setPrivateKey(key)
        e.target.classList.remove('border-red-300')
        e.target.classList.add('border-green-500')
      } catch (error) {
        e.target.classList.add('border-red-300')
        console.error('Error cargando clave privada:', error)
      }
    }
  }

  async function handleLoadSenderPublicKey(e) {
    const pem = e.target.value
    if (pem.trim()) {
      try {
        const key = await importRSAPublicKeyFromPEM(pem)
        setSenderPublicKey(key)
        e.target.classList.remove('border-red-300')
        e.target.classList.add('border-green-500')
      } catch (error) {
        e.target.classList.add('border-red-300')
        console.error('Error cargando clave pública:', error)
      }
    }
  }

  async function handleLoadEncryptedFile(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!privateKey || !senderPublicKey) {
      setResult('❌ Primero carga ambas claves')
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const text = await file.text()
      const pkg = JSON.parse(text)

      const iv = new Uint8Array(pkg.iv)
      const encryptedAES = new Uint8Array(pkg.encryptedAES)
      const encryptedFile = new Uint8Array(pkg.encryptedFile)
      const signature = new Uint8Array(pkg.signature)

      // 1. Descifrar la clave AES con clave privada RSA
      const rawAesKey = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        encryptedAES
      )

      const aesKey = await crypto.subtle.importKey(
        'raw',
        rawAesKey,
        'AES-GCM',
        false,
        ['decrypt']
      )

      // 2. Descifrar archivo
      const decryptedFile = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encryptedFile
      )

      // 3. Verificar firma
      const validSignature = await crypto.subtle.verify(
        {
          name: 'RSASSA-PKCS1-v1_5',
        },
        senderPublicKey,
        signature,
        decryptedFile
      )

      setResult(validSignature ? 'Firma válida ✔' : 'Firma NO válida ❌')
      setRestoredFile(new Blob([decryptedFile], { type: 'application/pdf' }))
    } catch (err) {
      setResult('❌ Error al descifrar el archivo')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  function downloadRestored() {
    const url = URL.createObjectURL(restoredFile)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documento-restaurado.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allKeysLoaded = privateKey && senderPublicKey

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <div className='w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
          <span className='text-white text-xl'>🏛️</span>
        </div>
        <h2 className='text-2xl font-bold text-gray-800'>
          Receptor - Alcaldía
        </h2>
        <p className='text-gray-600'>
          Descifra y verifica documentos firmados digitalmente
        </p>
      </div>

      <div className='space-y-6'>
        {/* Clave privada de la Alcaldía */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Clave Privada de la Alcaldía
          </label>
          <textarea
            className='w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                       transition-all duration-200 resize-none font-mono text-sm
                       placeholder-gray-400'
            placeholder='-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...'
            onBlur={handleLoadPrivateKey}
          />
          {privateKey && (
            <div className='flex items-center gap-2 text-sm text-green-600'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Clave privada cargada correctamente
            </div>
          )}
        </div>

        {/* Clave pública del remitente */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Clave Pública del Ciudadano
          </label>
          <textarea
            className='w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl 
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       transition-all duration-200 resize-none font-mono text-sm
                       placeholder-gray-400'
            placeholder='-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...'
            onBlur={handleLoadSenderPublicKey}
          />
          {senderPublicKey && (
            <div className='flex items-center gap-2 text-sm text-green-600'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Clave pública cargada correctamente
            </div>
          )}
        </div>

        {/* Upload de archivo */}
        <div className='space-y-2'>
          <label className='block text-sm font-medium text-gray-700'>
            Archivo Cifrado
          </label>
          <div className='relative'>
            <input
              type='file'
              className='w-full px-4 py-4 border-2 border-dashed border-gray-300 
                         rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 
                         transition-all duration-200 file:mr-4 file:py-2 file:px-4 
                         file:rounded-lg file:border-0 file:text-sm file:font-semibold
                         file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100
                         cursor-pointer'
              onChange={handleLoadEncryptedFile}
              accept='.json,.txt'
              disabled={!allKeysLoaded || isLoading}
            />
            {!allKeysLoaded && (
              <div className='absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center'>
                <p className='text-sm text-gray-500'>
                  Carga ambas claves primero
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className='flex justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600'></div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div
            className={`p-4 rounded-xl text-center font-semibold text-lg ${
              result.includes('válida ✔')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {result}
          </div>
        )}

        {/* Botón de descarga */}
        {restoredFile && (
          <button
            onClick={downloadRestored}
            className='w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 
                     text-white font-semibold rounded-xl shadow-lg hover:shadow-xl 
                     transform hover:scale-105 transition-all duration-200 
                     focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2'
          >
            📥 Descargar Documento Restaurado
          </button>
        )}
      </div>

      {/* Indicador de estado */}
      <div className='flex items-center justify-between text-sm text-gray-500 pt-4 border-t'>
        <div className='flex items-center gap-4'>
          <div
            className={`flex items-center gap-1 ${
              privateKey ? 'text-green-600' : ''
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                privateKey ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            Clave privada
          </div>
          <div
            className={`flex items-center gap-1 ${
              senderPublicKey ? 'text-green-600' : ''
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                senderPublicKey ? 'bg-green-500' : 'bg-gray-300'
              }`}
            ></div>
            Clave pública
          </div>
        </div>
        <div className='text-xs bg-gray-100 px-2 py-1 rounded'>
          Listo para descifrar
        </div>
      </div>
    </div>
  )
}
