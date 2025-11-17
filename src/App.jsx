import React, { useState, useEffect } from 'react'

// FirmaDigital_React_Tailwind_Completo.jsx
// Componente React completo que implementa:
// - Generación de par de claves (RSA 2048) usando Web Crypto API
// - Export / Import de claves en PEM (Base64) para compartir
// - Firmado de mensajes (y archivos) con la clave privada
// - Verificación con la clave pública
// - Guardado / carga de claves en localStorage (simulación de persistencia)
// - Descarga de la firma como archivo .sig (Base64)
// - Interfaz con dos paneles: Emisor (firma) y Receptor (verifica)
// - UI con TailwindCSS (estética moderna y accesible)

// Nota: pegar este archivo en un proyecto React (Vite / Create React App) con Tailwind configurado.

/* Helpers */
async function generateKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  )
}

function bufToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToBuf(base64) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function pemEncode(base64, tag) {
  const wrap = base64.match(/.{1,64}/g).join('\n')
  return `-----BEGIN ${tag}-----\n${wrap}\n-----END ${tag}-----`
}

function pemToBase64(pem) {
  return pem.replace(/-----.*-----/g, '').replace(/\s+/g, '')
}

async function exportPublicKeyToPEM(publicKey) {
  const spki = await window.crypto.subtle.exportKey('spki', publicKey)
  const b64 = bufToBase64(spki)
  return pemEncode(b64, 'PUBLIC KEY')
}

async function exportPrivateKeyToPEM(privateKey) {
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', privateKey)
  const b64 = bufToBase64(pkcs8)
  return pemEncode(b64, 'PRIVATE KEY')
}

async function importPublicKeyFromPEM(pem) {
  const b64 = pemToBase64(pem)
  const buf = base64ToBuf(b64)
  return window.crypto.subtle.importKey(
    'spki',
    buf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    ['verify']
  )
}

async function importPrivateKeyFromPEM(pem) {
  const b64 = pemToBase64(pem)
  const buf = base64ToBuf(b64)
  return window.crypto.subtle.importKey(
    'pkcs8',
    buf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    ['sign']
  )
}

async function signMessage(privateKey, messageArrayBuffer) {
  return window.crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    messageArrayBuffer
  )
}

async function verifySignature(
  publicKey,
  signatureArrayBuffer,
  messageArrayBuffer
) {
  return window.crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    signatureArrayBuffer,
    messageArrayBuffer
  )
}

function downloadFile(filename, content, asBinary = false) {
  const a = document.createElement('a')
  const blob = asBinary
    ? new Blob([content])
    : new Blob([content], { type: 'text/plain;charset=utf-8' })
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

/* Main Component */
export default function FirmaDigitalCompleto() {
  // Emisor (A)
  const [privKeyA, setPrivKeyA] = useState(null)
  const [pubKeyA, setPubKeyA] = useState(null)
  const [privPemA, setPrivPemA] = useState('')
  const [pubPemA, setPubPemA] = useState('')

  // Receptor (B) - puede importar la clave pública del emisor
  const [pubKeyB, setPubKeyB] = useState(null) // Usually will hold emisor's public key for verification
  const [pubPemB, setPubPemB] = useState('')

  // Mensajes y firma
  const [mensaje, setMensaje] = useState('')
  const [firmaB64, setFirmaB64] = useState('')
  const [verificacion, setVerificacion] = useState('')

  // Estado UI
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Al iniciar, intentar cargar claves desde localStorage para persistencia simple
    const savedPub = localStorage.getItem('pubPemA')
    const savedPriv = localStorage.getItem('privPemA')
    if (savedPub && savedPriv) {
      setPubPemA(savedPub)
      setPrivPemA(savedPriv)
      // Intentar importar
      ;(async () => {
        try {
          const importedPub = await importPublicKeyFromPEM(savedPub)
          const importedPriv = await importPrivateKeyFromPEM(savedPriv)
          setPubKeyA(importedPub)
          setPrivKeyA(importedPriv)
        } catch (e) {
          console.error('Error importando claves desde localStorage:', e)
        }
      })()
    }
  }, [])

  /* Generar par de claves y exportar PEM */
  const handleGenerarClaves = async () => {
    setLoading(true)
    try {
      const pair = await generateKeyPair()
      setPrivKeyA(pair.privateKey)
      setPubKeyA(pair.publicKey)

      const privPem = await exportPrivateKeyToPEM(pair.privateKey)
      const pubPem = await exportPublicKeyToPEM(pair.publicKey)

      setPrivPemA(privPem)
      setPubPemA(pubPem)

      // Guardar en localStorage (para demo / aula)
      localStorage.setItem('privPemA', privPem)
      localStorage.setItem('pubPemA', pubPem)

      alert('Par de claves generado y guardado en localStorage (demo).')
    } catch (err) {
      console.error(err)
      alert('Error generando claves: ' + err.message)
    }
    setLoading(false)
  }

  /* Firmar texto */
  const handleFirmar = async () => {
    if (!privKeyA)
      return alert('Primero genera o importa la clave privada (Emisor).')
    if (!mensaje) return alert('Escribe un mensaje para firmar.')

    setLoading(true)
    try {
      const enc = new TextEncoder()
      const data = enc.encode(mensaje)
      const sigBuf = await signMessage(privKeyA, data)
      const sigB64 = bufToBase64(sigBuf)
      setFirmaB64(sigB64)
      alert('Mensaje firmado.')
    } catch (err) {
      console.error(err)
      alert('Error firmando: ' + err.message)
    }
    setLoading(false)
  }

  /* Descargar firma como .sig (Base64) */
  const handleDescargarFirma = () => {
    if (!firmaB64) return alert('No hay firma generada.')
    const content = firmaB64
    downloadFile('firma_base64.sig', content)
  }

  /* Importar clave pública en el receptor (puede pegar PEM) */
  const handleImportarPubEnReceptor = async () => {
    if (!pubPemB)
      return alert('Pega la clave pública PEM en el campo del receptor.')
    setLoading(true)
    try {
      const imported = await importPublicKeyFromPEM(pubPemB)
      setPubKeyB(imported)
      alert('Clave pública importada en el receptor.')
    } catch (err) {
      console.error(err)
      alert('Error importando clave pública: ' + err.message)
    }
    setLoading(false)
  }

  /* Verificar firma en receptor */
  const handleVerificar = async () => {
    if (!pubKeyB)
      return alert('El receptor necesita una clave pública importada.')
    if (!firmaB64) return alert('No hay firma para verificar.')

    setLoading(true)
    try {
      const sigBuf = base64ToBuf(firmaB64)
      const enc = new TextEncoder()
      const data = enc.encode(mensaje)
      const esValido = await verifySignature(pubKeyB, sigBuf, data)
      setVerificacion(
        esValido
          ? '✔ Firma válida: mensaje auténtico e íntegro.'
          : '❌ Firma inválida: posible alteración o clave equivocada.'
      )
    } catch (err) {
      console.error(err)
      setVerificacion('Error al verificar: ' + err.message)
    }
    setLoading(false)
  }

  /* Exportar claves a archivos (PEM) */
  const handleDescargarClaves = () => {
    if (pubPemA) downloadFile('public_key.pem', pubPemA)
    if (privPemA) downloadFile('private_key.pem', privPemA)
    if (!pubPemA && !privPemA) alert('No hay claves para descargar.')
  }

  /* Importar clave pública desde el Emisor (simulación: pegar la pubPemA en pubPemB) */
  const copiarPubParaReceptor = () => {
    if (!pubPemA) return alert('Genera primero las claves en el emisor.')
    setPubPemB(pubPemA)
    alert(
      'Clave pública copiada al campo del receptor. Ahora importa en el receptor.'
    )
  }

  /* Importar clave privada manual (opcional) */
  const handleImportPrivManual = async () => {
    if (!privPemA)
      return alert(
        'Pega una clave privada PEM en el campo de la clave privada (emisor).'
      )
    setLoading(true)
    try {
      const imported = await importPrivateKeyFromPEM(privPemA)
      setPrivKeyA(imported)
      // Save too
      localStorage.setItem('privPemA', privPemA)
      alert(
        'Clave privada importada en el emisor y guardada en localStorage (demo).'
      )
    } catch (err) {
      console.error(err)
      alert('Error importando clave privada: ' + err.message)
    }
    setLoading(false)
  }

  /* Descargar mensaje y firma juntos (demo) */
  const handleDescargarPackage = () => {
    if (!mensaje || !firmaB64)
      return alert('Necesitas mensaje y firma para descargar el paquete.')
    const pkg = JSON.stringify({ mensaje, firma: firmaB64, publicKey: pubPemA })
    downloadFile('mensaje_firmado.json', pkg)
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-6xl mx-auto grid gap-6 md:grid-cols-2'>
        {/* Emisor */}
        <section className='bg-white p-6 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-3'>Emisor (A) — Firmar</h2>

          <div className='flex gap-2 mb-4'>
            <button
              className='px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm'
              onClick={handleGenerarClaves}
              disabled={loading}
            >
              Generar par de claves
            </button>

            <button
              className='px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm'
              onClick={handleDescargarClaves}
              disabled={loading}
            >
              Descargar claves (PEM)
            </button>

            <button
              className='px-4 py-2 bg-yellow-500 text-white rounded-md shadow-sm'
              onClick={() => {
                navigator.clipboard
                  ?.writeText(pubPemA || '')
                  .then(() =>
                    alert('Clave pública copiada al portapapeles (si existe).')
                  )
                  .catch(() => alert('No se pudo copiar. Pega manualmente.'))
              }}
            >
              Copiar pública
            </button>
          </div>

          <label className='block text-sm font-medium text-gray-700'>
            PEM Clave Pública (A)
          </label>
          <textarea
            className='w-full h-28 mt-1 p-3 border rounded-md text-xs font-mono'
            value={pubPemA}
            onChange={(e) => setPubPemA(e.target.value)}
            placeholder='Aquí aparecerá la clave pública en formato PEM después de generarla...'
          />

          <label className='block text-sm font-medium text-gray-700 mt-3'>
            PEM Clave Privada (A)
          </label>
          <textarea
            className='w-full h-28 mt-1 p-3 border rounded-md text-xs font-mono'
            value={privPemA}
            onChange={(e) => setPrivPemA(e.target.value)}
            placeholder='La clave privada (PEM) — guárdala en un lugar seguro.'
          />

          <div className='mt-4'>
            <label className='block text-sm font-medium text-gray-700'>
              Mensaje a firmar
            </label>
            <textarea
              className='w-full mt-1 p-3 border rounded-md'
              rows={4}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder='Escribe aquí el mensaje que quieres firmar...'
            />

            <div className='flex gap-2 mt-3'>
              <button
                className='px-4 py-2 bg-green-600 text-white rounded-md'
                onClick={handleFirmar}
                disabled={loading}
              >
                Firmar mensaje
              </button>

              <button
                className='px-4 py-2 bg-gray-600 text-white rounded-md'
                onClick={handleDescargarFirma}
                disabled={!firmaB64}
              >
                Descargar firma (.sig)
              </button>

              <button
                className='px-4 py-2 bg-sky-500 text-white rounded-md'
                onClick={handleDescargarPackage}
                disabled={!firmaB64}
              >
                Descargar paquete (mensaje+firma+pub)
              </button>
            </div>

            <div className='mt-3'>
              <label className='block text-sm text-gray-600'>
                Firma (Base64)
              </label>
              <textarea
                className='w-full h-24 mt-1 p-3 border rounded-md font-mono text-xs'
                value={firmaB64}
                readOnly
              />
            </div>
          </div>
        </section>

        {/* Receptor */}
        <section className='bg-white p-6 rounded-2xl shadow-lg'>
          <h2 className='text-xl font-semibold mb-3'>
            Receptor (B) — Verificar
          </h2>

          <div className='flex gap-2 mb-4'>
            <button
              className='px-4 py-2 bg-emerald-600 text-white rounded-md'
              onClick={copiarPubParaReceptor}
            >
              Copiar pública del Emisor → Receptor
            </button>

            <button
              className='px-4 py-2 bg-purple-600 text-white rounded-md'
              onClick={handleImportarPubEnReceptor}
              disabled={loading}
            >
              Importar clave pública (PEM)
            </button>

            <button
              className='px-4 py-2 bg-gray-500 text-white rounded-md'
              onClick={() => {
                navigator.clipboard
                  ?.writeText(firmaB64 || '')
                  .then(() =>
                    alert('Firma copiada al portapapeles (si existe).')
                  )
                  .catch(() => alert('No se pudo copiar.'))
              }}
            >
              Copiar firma
            </button>
          </div>

          <label className='block text-sm font-medium text-gray-700'>
            PEM Clave Pública (Receptor)
          </label>
          <textarea
            className='w-full h-28 mt-1 p-3 border rounded-md text-xs font-mono'
            value={pubPemB}
            onChange={(e) => setPubPemB(e.target.value)}
            placeholder='Pega aquí la clave pública PEM que usarás para verificar...'
          />

          <label className='block text-sm font-medium text-gray-700 mt-3'>
            Firma (Base64)
          </label>
          <textarea
            className='w-full h-24 mt-1 p-3 border rounded-md font-mono text-xs'
            value={firmaB64}
            onChange={(e) => setFirmaB64(e.target.value)}
            placeholder='Pega o pega la firma Base64 aquí para verificar...'
          />

          <div className='mt-3'>
            <button
              className='px-4 py-2 bg-indigo-700 text-white rounded-md'
              onClick={handleVerificar}
              disabled={loading}
            >
              Verificar firma
            </button>

            <p className='mt-3 font-medium'>
              Resultado: <span className='ml-2 text-sm'>{verificacion}</span>
            </p>
          </div>

          <div className='mt-8 p-4 bg-gray-50 rounded-md text-xs'>
            <h3 className='font-semibold'>Instrucciones rápidas</h3>
            <ol className='list-decimal ml-4 mt-2'>
              <li>
                En el panel Emisor: Genera claves o pega una clave privada PEM
                (solo para demos).
              </li>
              <li>
                Escribe el mensaje y pulsa "Firmar mensaje" — copia o descarga
                la firma.
              </li>
              <li>
                En el Receptor: pega la clave pública (PEM) y la firma (Base64)
                — pulsa "Verificar".
              </li>
              <li>
                Si la firma es válida verás el mensaje que confirma autenticidad
                e integridad.
              </li>
            </ol>
          </div>
        </section>
      </div>

      <footer className='max-w-6xl mx-auto mt-6 text-center text-sm text-gray-600'>
        <p>
          Proyecto de aula: sistema de firma digital — Web Crypto API • React •
          Tailwind
        </p>
      </footer>
    </div>
  )
}
