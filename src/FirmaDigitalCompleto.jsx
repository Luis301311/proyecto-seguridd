import React, { useState } from 'react'

/* ============================ HELPERS ============================= */

// Función para simular la generación de números primos (en realidad usamos WebCrypto)
function simulatePrimeGeneration(bits = 1024) {
  const possiblePrimes = [
    { p: 61, q: 53, n: 3233, e: 17, d: 2753 },
    { p: 101, q: 103, n: 10403, e: 7, d: 8743 },
    { p: 107, q: 109, n: 11663, e: 19, d: 5491 },
  ]
  return possiblePrimes[Math.floor(Math.random() * possiblePrimes.length)]
}

// Algoritmo extendido de Euclides para calcular el inverso modular
function modInverse(a, m) {
  let m0 = m
  let y = 0,
    x = 1

  if (m === 1) return 0

  while (a > 1) {
    let q = Math.floor(a / m)
    let t = m

    m = a % m
    a = t
    t = y

    y = x - q * y
    x = t
  }

  if (x < 0) x += m0

  return x
}

// Función para calcular φ(n) = (p-1)(q-1)
function calculatePhi(p, q) {
  return (p - 1) * (q - 1)
}

// Generar par de claves para CIFRADO
async function generateEncryptionKeyPair() {
  return window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  )
}

// Generar par de claves para FIRMA
async function generateSigningKeyPair() {
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
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function pemEncode(base64, tag) {
  return `-----BEGIN ${tag}-----\n${base64
    .match(/.{1,64}/g)
    .join('\n')}\n-----END ${tag}-----`
}

function pemToBase64(pem) {
  return pem.replace(/-----.*-----/g, '').replace(/\s+/g, '')
}

async function exportPublicKeyToPEM(publicKey) {
  const spki = await crypto.subtle.exportKey('spki', publicKey)
  return pemEncode(bufToBase64(spki), 'PUBLIC KEY')
}

async function exportPrivateKeyToPEM(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey)
  return pemEncode(bufToBase64(pkcs8), 'PRIVATE KEY')
}

// Importar clave pública para CIFRADO
async function importPublicKeyForEncryption(pem) {
  const buf = base64ToBuf(pemToBase64(pem))
  return crypto.subtle.importKey(
    'spki',
    buf,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  )
}

// Importar clave pública para VERIFICACIÓN
async function importPublicKeyForVerification(pem) {
  const buf = base64ToBuf(pemToBase64(pem))
  return crypto.subtle.importKey(
    'spki',
    buf,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    true,
    ['verify']
  )
}

// FIRMAR mensaje
async function signMessage(privateKey, data) {
  return crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, data)
}

// CIFRAR mensaje
async function encryptMessage(publicKey, data) {
  return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data)
}

// DESCIFRAR mensaje
async function decryptMessage(privateKey, encryptedData) {
  return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedData)
}

// VERIFICAR firma
async function verifySignature(publicKey, signature, data) {
  return crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    publicKey,
    signature,
    data
  )
}

/* ============================ COMPONENTE ============================= */

export default function FirmaDigitalCompleto() {
  // Estados para claves de FIRMA
  const [privKeyFirma, setPrivKeyFirma] = useState(null)
  const [pubKeyFirma, setPubKeyFirma] = useState(null)
  const [privPemFirma, setPrivPemFirma] = useState('')
  const [pubPemFirma, setPubPemFirma] = useState('')

  // Estados para claves de CIFRADO
  const [privKeyCifrado, setPrivKeyCifrado] = useState(null)
  const [pubKeyCifrado, setPubKeyCifrado] = useState(null)
  const [pubPemCifrado, setPubPemCifrado] = useState('')

  // Estados del receptor
  const [pubKeyReceptor, setPubKeyReceptor] = useState(null)
  const [pubPemReceptor, setPubPemReceptor] = useState('')

  // Estados del mensaje
  const [mensaje, setMensaje] = useState('')
  const [originalMensaje, setOriginalMensaje] = useState('')
  const [firmaB64, setFirmaB64] = useState('')
  const [mensajeCifradoB64, setMensajeCifradoB64] = useState('')
  const [verificacion, setVerificacion] = useState('')
  const [mensajeDescifrado, setMensajeDescifrado] = useState('')

  // Estados para mostrar el proceso de generación de claves
  const [keyGenerationSteps, setKeyGenerationSteps] = useState([])
  const [rsaParams, setRsaParams] = useState(null)

  // Estados para menús desplegables
  const [openSections, setOpenSections] = useState({
    rsaGeneration: false,
    signatureProcess: false,
    encryptionProcess: false,
  })

  // Función para toggle de secciones
  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  /* ---------------------- Generar TODAS las claves ---------------------- */
  const handleGenerarClaves = async () => {
    try {
      setKeyGenerationSteps([])

      // Simular el proceso matemático de RSA
      const steps = []

      steps.push({
        step: 1,
        title: 'Seleccionando números primos grandes',
        description:
          'Buscando dos números primos p y q (en producción serían de 1024+ bits)',
        math: 'p y q deben ser primos grandes y aleatorios',
      })

      // Simular generación de primos
      const params = simulatePrimeGeneration()
      setRsaParams(params)

      steps.push({
        step: 2,
        title: 'Números primos encontrados',
        description: `p = ${params.p}, q = ${params.q}`,
        math: `p = ${params.p}, q = ${params.q}`,
      })

      // Calcular n = p * q
      steps.push({
        step: 3,
        title: 'Calculando módulo n',
        description: 'n = p × q (módulo para las operaciones)',
        math: `n = ${params.p} × ${params.q} = ${params.n}`,
      })

      // Calcular φ(n) = (p-1)(q-1)
      const phi = calculatePhi(params.p, params.q)
      steps.push({
        step: 4,
        title: 'Calculando φ(n) (Función Totient de Euler)',
        description: 'φ(n) = (p-1) × (q-1)',
        math: `φ(n) = (${params.p}-1) × (${params.q}-1) = ${phi}`,
      })

      // Seleccionar e (exponente público)
      steps.push({
        step: 5,
        title: 'Seleccionando exponente público e',
        description: 'e debe ser coprimo con φ(n) y típicamente 65537',
        math: `e = ${params.e} (1 &lt; e &lt; ${phi}, coprimo con ${phi})`,
      })

      // Calcular d (exponente privado)
      steps.push({
        step: 6,
        title: 'Calculando exponente privado d',
        description: 'd = e⁻¹ mod φ(n) (inverso modular)',
        math: `d = ${params.e}⁻¹ mod ${phi} = ${params.d}`,
      })

      // Resumen final
      steps.push({
        step: 7,
        title: 'Claves RSA generadas',
        description: 'Clave pública: (n, e), Clave privada: (n, d)',
        math: `Pública: (${params.n}, ${params.e})\nPrivada: (${params.n}, ${params.d})`,
      })

      setKeyGenerationSteps(steps)

      // Generar claves reales usando WebCrypto (mientras mostramos la simulación)
      const signingPair = await generateSigningKeyPair()
      setPrivKeyFirma(signingPair.privateKey)
      setPubKeyFirma(signingPair.publicKey)

      const privPemFirma = await exportPrivateKeyToPEM(signingPair.privateKey)
      const pubPemFirma = await exportPublicKeyToPEM(signingPair.publicKey)
      setPrivPemFirma(privPemFirma)
      setPubPemFirma(pubPemFirma)

      const encryptionPair = await generateEncryptionKeyPair()
      setPrivKeyCifrado(encryptionPair.privateKey)
      setPubKeyCifrado(encryptionPair.publicKey)

      const pubPemCifrado = await exportPublicKeyToPEM(encryptionPair.publicKey)
      setPubPemCifrado(pubPemCifrado)

      // Abrir automáticamente la sección de generación de claves
      setOpenSections((prev) => ({
        ...prev,
        rsaGeneration: true,
      }))

      setTimeout(() => {
        alert('Todas las claves generadas correctamente.')
      }, 1000)
    } catch (err) {
      alert('Error generando claves: ' + err.message)
    }
  }

  /* -------------------------- Cifrar y Firmar -------------------------- */
  const handleCifrarYFirmar = async () => {
    if (!privKeyFirma || !pubKeyCifrado)
      return alert('Primero genera las claves.')
    if (!mensaje) return alert('Escribe un mensaje.')

    setOriginalMensaje(mensaje)

    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(mensaje)

      // 1. 🔐 CIFRAR el mensaje (ocultar contenido)
      const mensajeCifrado = await encryptMessage(pubKeyCifrado, data)
      setMensajeCifradoB64(bufToBase64(mensajeCifrado))

      // 2. 📝 FIRMAR el mensaje (verificar autenticidad)
      const firma = await signMessage(privKeyFirma, data)
      setFirmaB64(bufToBase64(firma))

      alert('Mensaje cifrado y firmado correctamente.')
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  /* ----------------------- Importar Clave Pública ----------------------- */
  const handleImportarClaveReceptor = async () => {
    if (!pubPemReceptor) return alert('Pega una clave pública PEM.')

    try {
      const imported = await importPublicKeyForVerification(pubPemReceptor)
      setPubKeyReceptor(imported)
      alert('Clave pública importada correctamente.')
    } catch (err) {
      alert('Error importando clave: ' + err.message)
    }
  }

  /* -------------------------- Verificar Firma -------------------------- */
  const handleVerificarFirma = async () => {
    if (!pubKeyReceptor) return alert('Importa la clave pública primero.')
    if (!firmaB64) return alert('Genera una firma primero.')

    const encoder = new TextEncoder()
    const data = encoder.encode(mensaje)
    const sigBuf = base64ToBuf(firmaB64)

    try {
      const esValido = await verifySignature(pubKeyReceptor, sigBuf, data)

      // Detectar ataque MITM
      if (!esValido && mensaje !== originalMensaje) {
        setVerificacion('❌ ATAQUE DETECTADO — El mensaje fue modificado.')
        return
      }

      setVerificacion(
        esValido
          ? '✔ Firma válida — El mensaje es auténtico.'
          : '❌ Firma inválida — Clave incorrecta o mensaje alterado.'
      )
    } catch (err) {
      setVerificacion('Error verificando: ' + err.message)
    }
  }

  /* -------------------------- Descifrar Mensaje -------------------------- */
  const handleDescifrarMensaje = async () => {
    if (!privKeyCifrado || !mensajeCifradoB64)
      return alert('No hay mensaje cifrado para descifrar.')

    try {
      const encryptedBuf = base64ToBuf(mensajeCifradoB64)
      const decrypted = await decryptMessage(privKeyCifrado, encryptedBuf)
      const decoder = new TextDecoder()
      const textoDescifrado = decoder.decode(decrypted)
      setMensajeDescifrado(textoDescifrado)
    } catch (err) {
      alert('Error descifrando: ' + err.message)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8 md:mb-12'>
          <div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
            <span className='text-white text-2xl'>🔐</span>
          </div>
          <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-3'>
            Demostración Completa: Cifrado + Firma Digital
          </h1>
          <p className='text-slate-600 max-w-3xl mx-auto text-sm md:text-base'>
            Ahora puedes ver ambos procesos:{' '}
            <span className='font-semibold text-purple-600'>
              cifrado del mensaje
            </span>{' '}
            y <span className='font-semibold text-blue-600'>firma digital</span>
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-2'>
          {/* ======================= EMISOR ======================= */}
          <section className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6'>
              <h2 className='text-lg md:text-xl font-bold text-white flex items-center gap-3'>
                <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
                  <span className='text-white'>👤</span>
                </div>
                Emisor - Cifrar y Firmar
              </h2>
            </div>

            <div className='p-4 md:p-6 space-y-6'>
              {/* Generar Claves */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
                    1
                  </div>
                  <h3 className='font-semibold text-slate-700'>
                    Generar Todas las Claves
                  </h3>
                </div>
                <button
                  onClick={handleGenerarClaves}
                  className='w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-3'
                >
                  <span className='text-lg'>🔑</span>
                  Generar Claves (Firma + Cifrado)
                </button>
              </div>

              {/* Claves Generadas */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
                    2
                  </div>
                  <h3 className='font-semibold text-slate-700'>
                    Claves Generadas
                  </h3>
                </div>

                <div className='grid gap-4'>
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-slate-600'>
                      Clave Pública (Firma)
                    </label>
                    <div className='relative'>
                      <textarea
                        className='w-full h-20 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-xs font-mono bg-slate-50/50 resize-none'
                        value={pubPemFirma}
                        readOnly
                        placeholder='Clave pública para firma...'
                      />
                      {pubPemFirma && (
                        <div className='absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                          <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                          Firma
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-slate-600'>
                      Clave Pública (Cifrado)
                    </label>
                    <div className='relative'>
                      <textarea
                        className='w-full h-20 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-xs font-mono bg-slate-50/50 resize-none'
                        value={pubPemCifrado}
                        readOnly
                        placeholder='Clave pública para cifrado...'
                      />
                      {pubPemCifrado && (
                        <div className='absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                          <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
                          Cifrado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensaje Original */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
                    3
                  </div>
                  <h3 className='font-semibold text-slate-700'>
                    Mensaje Original
                  </h3>
                </div>

                <div className='space-y-3'>
                  <textarea
                    className='w-full h-20 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none'
                    value={mensaje}
                    onChange={(e) => {
                      setMensaje(e.target.value)
                      setOriginalMensaje(e.target.value)
                    }}
                    placeholder='Escribe el mensaje que deseas cifrar y firmar...'
                  />
                </div>

                <div className='flex gap-3'>
                  <button
                    className='flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    onClick={handleCifrarYFirmar}
                    disabled={!privKeyFirma || !mensaje}
                  >
                    <span>🔐📝</span>
                    Cifrar y Firmar
                  </button>

                  <button
                    className='px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm'
                    onClick={() => {
                      setMensaje(mensaje + ' [MODIFICADO]')
                      alert('Mensaje interceptado por un atacante.')
                    }}
                  >
                    <span>⚠️</span>
                    Simular Ataque
                  </button>
                </div>
              </div>

              {/* Resultados del Cifrado y Firma */}
              {(mensajeCifradoB64 || firmaB64) && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-3'>
                    <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
                      4
                    </div>
                    <h3 className='font-semibold text-slate-700'>Resultados</h3>
                  </div>

                  {/* Mensaje Cifrado */}
                  {mensajeCifradoB64 && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-slate-600 flex items-center gap-2'>
                        <span className='text-purple-600'>🔐</span>
                        Mensaje Cifrado (RSA-OAEP)
                      </label>
                      <div className='relative'>
                        <textarea
                          className='w-full h-24 p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-xs font-mono bg-purple-50/50 resize-none'
                          value={mensajeCifradoB64}
                          readOnly
                          placeholder='El mensaje cifrado aparecerá aquí...'
                        />
                        <div className='absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                          <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
                          Cifrado
                        </div>
                      </div>
                      <p className='text-xs text-purple-600'>
                        Este es el mensaje original convertido a texto ilegible
                      </p>
                    </div>
                  )}

                  {/* Firma Digital */}
                  {firmaB64 && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-slate-600 flex items-center gap-2'>
                        <span className='text-blue-600'>📝</span>
                        Firma Digital (RSASSA-PKCS1-v1_5)
                      </label>
                      <div className='relative'>
                        <textarea
                          className='w-full h-20 p-3 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-xs font-mono bg-blue-50/50 resize-none'
                          value={firmaB64}
                          readOnly
                          placeholder='La firma digital aparecerá aquí...'
                        />
                        <div className='absolute top-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                          <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                          Firma
                        </div>
                      </div>
                      <p className='text-xs text-blue-600'>
                        Esta firma verifica la autenticidad del mensaje
                      </p>
                    </div>
                  )}

                  {/* Botón para descifrar */}
                  {mensajeCifradoB64 && (
                    <button
                      onClick={handleDescifrarMensaje}
                      className='w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2'
                    >
                      <span>🔓</span>
                      Descifrar Mensaje
                    </button>
                  )}

                  {/* Mensaje Descifrado */}
                  {mensajeDescifrado && (
                    <div className='space-y-2'>
                      <label className='block text-sm font-medium text-slate-600 flex items-center gap-2'>
                        <span className='text-green-600'>✅</span>
                        Mensaje Descifrado
                      </label>
                      <div className='p-3 bg-green-50 rounded-lg border-2 border-green-200'>
                        <div className='flex items-center gap-2 text-sm text-green-700'>
                          <span>📄</span>
                          <span className='font-mono'>{mensajeDescifrado}</span>
                        </div>
                      </div>
                      <p className='text-xs text-green-600'>
                        El mensaje original recuperado mediante descifrado
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ======================= RECEPTOR ======================= */}
          <section className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden'>
            <div className='bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6'>
              <h2 className='text-lg md:text-xl font-bold text-white flex items-center gap-3'>
                <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
                  <span className='text-white'>👥</span>
                </div>
                Receptor - Verificar
              </h2>
            </div>

            <div className='p-4 md:p-6 space-y-6'>
              {/* Importar Clave */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
                    1
                  </div>
                  <h3 className='font-semibold text-slate-700'>
                    Importar Clave Pública del Emisor
                  </h3>
                </div>

                <div className='flex gap-3'>
                  <button
                    className='flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    onClick={() => {
                      if (!pubPemFirma)
                        return alert('Primero genera claves en el emisor.')
                      setPubPemReceptor(pubPemFirma)
                      alert('Clave pública copiada al receptor.')
                    }}
                    disabled={!pubPemFirma}
                  >
                    <span>📋</span>
                    Copiar del Emisor
                  </button>

                  <button
                    className='flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    onClick={handleImportarClaveReceptor}
                    disabled={!pubPemReceptor}
                  >
                    <span>📥</span>
                    Importar PEM
                  </button>
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-slate-600'>
                    Clave Pública del Emisor (Firma)
                  </label>
                  <div className='relative'>
                    <textarea
                      className='w-full h-24 p-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-xs font-mono bg-slate-50/50 resize-none'
                      value={pubPemReceptor}
                      onChange={(e) => setPubPemReceptor(e.target.value)}
                      placeholder='Pega la clave pública PEM aquí...'
                    />
                    {pubKeyReceptor && (
                      <div className='absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                        Importada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Verificación */}
              <div className='space-y-4'>
                <div className='flex items-center gap-3'>
                  <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
                    2
                  </div>
                  <h3 className='font-semibold text-slate-700'>
                    Verificar Firma Digital
                  </h3>
                </div>

                <div className='space-y-3'>
                  <p className='text-sm text-slate-600'>
                    Verifica que el mensaje no fue alterado y proviene del
                    emisor legítimo
                  </p>

                  <button
                    className='w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                    onClick={handleVerificarFirma}
                    disabled={!pubKeyReceptor || !firmaB64}
                  >
                    <span>🔍</span>
                    Verificar Firma
                  </button>
                </div>
              </div>

              {/* Resultado */}
              {verificacion && (
                <div className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
                      3
                    </div>
                    <h3 className='font-semibold text-slate-700'>
                      Resultado de Verificación
                    </h3>
                  </div>
                  <div
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      verificacion.includes('✔')
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-xl'>
                        {verificacion.includes('✔') ? '✅' : '❌'}
                      </span>
                      <p className='font-medium'>{verificacion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ==================== SECCIONES DE EXPLICACIÓN ==================== */}
        <div className='mt-12 space-y-6'>
          {/* Generación de Claves RSA - Ahora como menú desplegable */}
          {keyGenerationSteps.length > 0 && (
            <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
              <button
                onClick={() => toggleSection('rsaGeneration')}
                className='w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors'
              >
                <div className='flex items-center gap-4'>
                  <div className='w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center'>
                    <span className='text-white text-xl'>🔢</span>
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-slate-800'>
                      Proceso de Generación de Claves RSA
                    </h3>
                    <p className='text-slate-600'>
                      Proceso matemático completo para crear claves pública y
                      privada
                    </p>
                  </div>
                </div>
                <span
                  className={`text-2xl transition-transform duration-300 ${
                    openSections.rsaGeneration ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {openSections.rsaGeneration && (
                <div className='p-6 border-t border-slate-200'>
                  <div className='space-y-4'>
                    {keyGenerationSteps.map((step, index) => (
                      <div
                        key={step.step}
                        className='flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200'
                      >
                        <div className='flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm'>
                          {step.step}
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-slate-800 mb-2'>
                            {step.title}
                          </h3>
                          <p className='text-slate-600 text-sm mb-2'>
                            {step.description}
                          </p>
                          <div className='bg-white p-3 rounded border border-slate-200'>
                            <code className='text-sm font-mono text-green-700 whitespace-pre-wrap'>
                              {step.math}
                            </code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rsaParams && (
                    <div className='mt-6 grid md:grid-cols-2 gap-4'>
                      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                        <h4 className='font-semibold text-blue-800 mb-2 flex items-center gap-2'>
                          <span>🔑</span>
                          Clave Pública
                        </h4>
                        <div className='space-y-1 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-blue-600'>n (módulo):</span>
                            <span className='font-mono'>{rsaParams.n}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-blue-600'>
                              e (exponente):
                            </span>
                            <span className='font-mono'>{rsaParams.e}</span>
                          </div>
                        </div>
                      </div>

                      <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                        <h4 className='font-semibold text-red-800 mb-2 flex items-center gap-2'>
                          <span>🔒</span>
                          Clave Privada
                        </h4>
                        <div className='space-y-1 text-sm'>
                          <div className='flex justify-between'>
                            <span className='text-red-600'>n (módulo):</span>
                            <span className='font-mono'>{rsaParams.n}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-red-600'>d (exponente):</span>
                            <span className='font-mono'>{rsaParams.d}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className='mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                    <h4 className='font-semibold text-yellow-800 mb-2 flex items-center gap-2'>
                      <span>💡</span>
                      Nota Importante
                    </h4>
                    <p className='text-yellow-700 text-sm'>
                      En un sistema real, los números primos p y q serían de
                      1024-4096 bits (números de 300-1200 dígitos). Esta
                      demostración usa números pequeños para facilitar la
                      comprensión del proceso matemático.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Proceso de Firma Digital */}
          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
            <button
              onClick={() => toggleSection('signatureProcess')}
              className='w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center'>
                  <span className='text-white text-xl'>📝</span>
                </div>
                <div>
                  <h3 className='text-xl font-bold text-slate-800'>
                    Proceso de Firma Digital
                  </h3>
                  <p className='text-slate-600'>
                    Cómo se crea y verifica una firma digital RSA
                  </p>
                </div>
              </div>
              <span
                className={`text-2xl transition-transform duration-300 ${
                  openSections.signatureProcess ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {openSections.signatureProcess && (
              <div className='p-6 border-t border-slate-200'>
                <div className='grid md:grid-cols-2 gap-8'>
                  <div className='space-y-6'>
                    <h4 className='font-semibold text-slate-800 text-lg'>
                      👤 Firma (Emisor)
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex gap-3 p-4 bg-blue-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold'>
                          1
                        </div>
                        <div>
                          <p className='font-medium text-blue-800'>
                            Calcular Hash del Mensaje
                          </p>
                          <p className='text-blue-600 text-sm'>
                            SHA-256 del mensaje original
                          </p>
                          <code className='text-xs font-mono bg-blue-100 p-2 rounded mt-2 block'>
                            hash = SHA256(mensaje)
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-green-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold'>
                          2
                        </div>
                        <div>
                          <p className='font-medium text-green-800'>
                            Aplicar Clave Privada
                          </p>
                          <p className='text-green-600 text-sm'>
                            Cifrado con clave privada del firmante
                          </p>
                          <code className='text-xs font-mono bg-green-100 p-2 rounded mt-2 block'>
                            firma = hash^d mod n
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-purple-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold'>
                          3
                        </div>
                        <div>
                          <p className='font-medium text-purple-800'>
                            Firma Digital Resultante
                          </p>
                          <p className='text-purple-600 text-sm'>
                            Combinación única para este mensaje
                          </p>
                          <code className='text-xs font-mono bg-purple-100 p-2 rounded mt-2 block'>
                            {firmaB64
                              ? `${firmaB64.substring(0, 50)}...`
                              : 'Firma en Base64...'}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-6'>
                    <h4 className='font-semibold text-slate-800 text-lg'>
                      👥 Verificación (Receptor)
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex gap-3 p-4 bg-orange-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold'>
                          1
                        </div>
                        <div>
                          <p className='font-medium text-orange-800'>
                            Aplicar Clave Pública
                          </p>
                          <p className='text-orange-600 text-sm'>
                            Descifrado con clave pública del firmante
                          </p>
                          <code className='text-xs font-mono bg-orange-100 p-2 rounded mt-2 block'>
                            hash_verificado = firma^e mod n
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-red-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold'>
                          2
                        </div>
                        <div>
                          <p className='font-medium text-red-800'>
                            Calcular Hash del Mensaje Recibido
                          </p>
                          <p className='text-red-600 text-sm'>
                            SHA-256 del mensaje recibido
                          </p>
                          <code className='text-xs font-mono bg-red-100 p-2 rounded mt-2 block'>
                            hash_recibido = SHA256(mensaje_recibido)
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-green-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold'>
                          3
                        </div>
                        <div>
                          <p className='font-medium text-green-800'>
                            Comparar Hashes
                          </p>
                          <p className='text-green-600 text-sm'>
                            Verificar que coincidan
                          </p>
                          <code className='text-xs font-mono bg-green-100 p-2 rounded mt-2 block'>
                            válido = (hash_verificado == hash_recibido)
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                      <h5 className='font-semibold text-yellow-800 mb-2'>
                        💡 ¿Por qué funciona?
                      </h5>
                      <p className='text-yellow-700 text-sm'>
                        Solo el poseedor de la clave privada puede crear una
                        firma que se verifique correctamente con la clave
                        pública correspondiente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Proceso de Cifrado/Descifrado */}
          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
            <button
              onClick={() => toggleSection('encryptionProcess')}
              className='w-full p-6 text-left flex justify-between items-center hover:bg-slate-50 transition-colors'
            >
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center'>
                  <span className='text-white text-xl'>🔐</span>
                </div>
                <div>
                  <h3 className='text-xl font-bold text-slate-800'>
                    Proceso de Cifrado/Descifrado
                  </h3>
                  <p className='text-slate-600'>
                    Cifrado RSA-OAEP para proteger la confidencialidad
                  </p>
                </div>
              </div>
              <span
                className={`text-2xl transition-transform duration-300 ${
                  openSections.encryptionProcess ? 'rotate-180' : ''
                }`}
              >
                ▼
              </span>
            </button>

            {openSections.encryptionProcess && (
              <div className='p-6 border-t border-slate-200'>
                <div className='grid md:grid-cols-2 gap-8'>
                  <div className='space-y-6'>
                    <h4 className='font-semibold text-slate-800 text-lg'>
                      🔒 Cifrado (Emisor)
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex gap-3 p-4 bg-purple-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold'>
                          1
                        </div>
                        <div>
                          <p className='font-medium text-purple-800'>
                            Preparar Mensaje
                          </p>
                          <p className='text-purple-600 text-sm'>
                            Convertir a formato adecuado para RSA
                          </p>
                          <code className='text-xs font-mono bg-purple-100 p-2 rounded mt-2 block'>
                            mensaje → bytes
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-blue-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold'>
                          2
                        </div>
                        <div>
                          <p className='font-medium text-blue-800'>
                            Aplicar Clave Pública del Receptor
                          </p>
                          <p className='text-blue-600 text-sm'>
                            Cifrado RSA-OAEP
                          </p>
                          <code className='text-xs font-mono bg-blue-100 p-2 rounded mt-2 block'>
                            cifrado = mensaje^e mod n
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-green-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold'>
                          3
                        </div>
                        <div>
                          <p className='font-medium text-green-800'>
                            Mensaje Cifrado
                          </p>
                          <p className='text-green-600 text-sm'>
                            Texto ilegible para todos excepto el receptor
                          </p>
                          <code className='text-xs font-mono bg-green-100 p-2 rounded mt-2 block'>
                            {mensajeCifradoB64
                              ? `${mensajeCifradoB64.substring(0, 50)}...`
                              : 'Texto cifrado en Base64...'}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='space-y-6'>
                    <h4 className='font-semibold text-slate-800 text-lg'>
                      🔓 Descifrado (Receptor)
                    </h4>
                    <div className='space-y-4'>
                      <div className='flex gap-3 p-4 bg-orange-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold'>
                          1
                        </div>
                        <div>
                          <p className='font-medium text-orange-800'>
                            Aplicar Clave Privada
                          </p>
                          <p className='text-orange-600 text-sm'>
                            Descifrado con clave privada del receptor
                          </p>
                          <code className='text-xs font-mono bg-orange-100 p-2 rounded mt-2 block'>
                            mensaje = cifrado^d mod n
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-red-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold'>
                          2
                        </div>
                        <div>
                          <p className='font-medium text-red-800'>
                            Recuperar Mensaje Original
                          </p>
                          <p className='text-red-600 text-sm'>
                            Convertir bytes a texto legible
                          </p>
                          <code className='text-xs font-mono bg-red-100 p-2 rounded mt-2 block'>
                            bytes → mensaje_original
                          </code>
                        </div>
                      </div>

                      <div className='flex gap-3 p-4 bg-green-50 rounded-lg'>
                        <div className='flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold'>
                          3
                        </div>
                        <div>
                          <p className='font-medium text-green-800'>
                            Mensaje Descifrado
                          </p>
                          <p className='text-green-600 text-sm'>
                            Contenido original recuperado
                          </p>
                          <code className='text-xs font-mono bg-green-100 p-2 rounded mt-2 block'>
                            {mensajeDescifrado ||
                              'Mensaje descifrado aparecerá aquí...'}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className='p-4 bg-slate-50 rounded-lg border border-slate-200'>
                      <h5 className='font-semibold text-slate-800 mb-2'>
                        🛡️ RSA-OAEP vs PKCS#1 v1.5
                      </h5>
                      <p className='text-slate-600 text-sm'>
                        OAEP (Optimal Asymmetric Encryption Padding) es más
                        seguro que PKCS#1 v1.5, ya que incluye protección contra
                        ataques de padding oracle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className='mt-8 text-center text-sm text-slate-500'>
          Sistema de demostración completa: Cifrado RSA-OAEP + Firma Digital
          RSASSA-PKCS1-v1_5
        </div>
      </div>
    </div>
  )
}
