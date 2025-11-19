// import React, { useState } from 'react'

// /* ============================ HELPERS ============================= */

// async function generateKeyPair() {
//   return window.crypto.subtle.generateKey(
//     {
//       name: 'RSASSA-PKCS1-v1_5',
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: 'SHA-256',
//     },
//     true,
//     ['sign', 'verify']
//   )
// }

// function bufToBase64(buffer) {
//   return btoa(String.fromCharCode(...new Uint8Array(buffer)))
// }

// function base64ToBuf(base64) {
//   const binary = atob(base64)
//   const bytes = new Uint8Array(binary.length)
//   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
//   return bytes.buffer
// }

// function pemEncode(base64, tag) {
//   return `-----BEGIN ${tag}-----\n${base64
//     .match(/.{1,64}/g)
//     .join('\n')}\n-----END ${tag}-----`
// }

// function pemToBase64(pem) {
//   return pem.replace(/-----.*-----/g, '').replace(/\s+/g, '')
// }

// async function exportPublicKeyToPEM(publicKey) {
//   const spki = await crypto.subtle.exportKey('spki', publicKey)
//   return pemEncode(bufToBase64(spki), 'PUBLIC KEY')
// }

// async function exportPrivateKeyToPEM(privateKey) {
//   const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey)
//   return pemEncode(bufToBase64(pkcs8), 'PRIVATE KEY')
// }

// async function importPublicKeyFromPEM(pem) {
//   const buf = base64ToBuf(pemToBase64(pem))
//   return crypto.subtle.importKey(
//     'spki',
//     buf,
//     { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
//     true,
//     ['verify']
//   )
// }

// async function signMessage(privateKey, data) {
//   return crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, data)
// }

// async function verifySignature(publicKey, signature, data) {
//   return crypto.subtle.verify(
//     { name: 'RSASSA-PKCS1-v1_5' },
//     publicKey,
//     signature,
//     data
//   )
// }

// /* ============================ COMPONENTE ============================= */

// export default function FirmaDigitalCompleto() {
//   const [privKeyA, setPrivKeyA] = useState(null)
//   const [pubKeyA, setPubKeyA] = useState(null)
//   const [privPemA, setPrivPemA] = useState('')
//   const [pubPemA, setPubPemA] = useState('')

//   const [pubKeyB, setPubKeyB] = useState(null)
//   const [pubPemB, setPubPemB] = useState('')

//   const [mensaje, setMensaje] = useState('')
//   const [originalMensaje, setOriginalMensaje] = useState('')
//   const [firmaB64, setFirmaB64] = useState('')
//   const [verificacion, setVerificacion] = useState('')

//   /* ---------------------- Generar claves ---------------------- */
//   const handleGenerarClaves = async () => {
//     try {
//       const pair = await generateKeyPair()
//       setPrivKeyA(pair.privateKey)
//       setPubKeyA(pair.publicKey)

//       const privPem = await exportPrivateKeyToPEM(pair.privateKey)
//       const pubPem = await exportPublicKeyToPEM(pair.publicKey)

//       setPrivPemA(privPem)
//       setPubPemA(pubPem)

//       alert('Claves generadas correctamente.')
//     } catch (err) {
//       alert('Error generando claves: ' + err.message)
//     }
//   }

//   /* -------------------------- Firmar -------------------------- */
//   const handleFirmar = async () => {
//     if (!privKeyA) return alert('Primero genera la clave privada.')
//     if (!mensaje) return alert('Escribe un mensaje.')

//     setOriginalMensaje(mensaje)

//     try {
//       const encoder = new TextEncoder()
//       const data = encoder.encode(mensaje)
//       const sig = await signMessage(privKeyA, data)

//       setFirmaB64(bufToBase64(sig))
//       alert('Mensaje firmado correctamente.')
//     } catch (err) {
//       alert('Error firmando: ' + err.message)
//     }
//   }

//   /* ----------------------- Importar Pública ----------------------- */
//   const handleImportarPubEnReceptor = async () => {
//     if (!pubPemB) return alert('Pega una clave pública PEM.')

//     try {
//       const imported = await importPublicKeyFromPEM(pubPemB)
//       setPubKeyB(imported)
//       alert('Clave pública importada correctamente.')
//     } catch (err) {
//       alert('Error importando clave: ' + err.message)
//     }
//   }

//   /* -------------------------- Verificar -------------------------- */
//   const handleVerificar = async () => {
//     if (!pubKeyB) return alert('Importa la clave pública primero.')
//     if (!firmaB64) return alert('Pega o genera una firma.')

//     const encoder = new TextEncoder()
//     const data = encoder.encode(mensaje)
//     const sigBuf = base64ToBuf(firmaB64)

//     try {
//       const esValido = await verifySignature(pubKeyB, sigBuf, data)

//       // Detectar ataque MITM
//       if (!esValido && mensaje !== originalMensaje) {
//         setVerificacion('❌ ATAQUE DETECTADO — El mensaje fue modificado.')
//         return
//       }

//       setVerificacion(
//         esValido
//           ? '✔ Firma válida — El mensaje es auténtico.'
//           : '❌ Firma inválida — Clave incorrecta o mensaje alterado.'
//       )
//     } catch (err) {
//       setVerificacion('Error verificando: ' + err.message)
//     }
//   }

//   /* ============================ UI MEJORADA ============================= */

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6'>
//       <div className='max-w-7xl mx-auto'>
//         {/* Header */}
//         <div className='text-center mb-10'>
//           <h1 className='text-4xl font-bold text-slate-800 mb-3'>
//             Sistema de Firma Digital
//           </h1>
//           <p className='text-slate-600 max-w-2xl mx-auto'>
//             Simula el proceso completo de firma y verificación digital con
//             criptografía RSA. Genera claves, firma mensajes y verifica
//             autenticidad.
//           </p>
//         </div>

//         <div className='grid gap-8 lg:grid-cols-2'>
//           {/* ======================= EMISOR ======================= */}
//           <section className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
//             <div className='bg-gradient-to-r from-blue-600 to-blue-700 p-6'>
//               <h2 className='text-xl font-bold text-white flex items-center gap-2'>
//                 <span className='w-3 h-3 bg-white rounded-full'></span>
//                 Emisor (A) — Firmar Mensaje
//               </h2>
//             </div>

//             <div className='p-6 space-y-6'>
//               {/* Generar Claves */}
//               <div className='space-y-3'>
//                 <h3 className='font-semibold text-slate-700 flex items-center gap-2'>
//                   <span className='text-blue-600'>1.</span>
//                   Generar Par de Claves
//                 </h3>
//                 <button
//                   onClick={handleGenerarClaves}
//                   className='w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium flex items-center justify-center gap-2'
//                 >
//                   <svg
//                     className='w-5 h-5'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={2}
//                       d='M13 10V3L4 14h7v7l9-11h-7z'
//                     />
//                   </svg>
//                   Generar Claves RSA-2048
//                 </button>
//               </div>

//               {/* Claves */}
//               <div className='grid gap-4'>
//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700 flex items-center gap-2'>
//                     <span className='text-blue-600'>2.</span>
//                     Clave Pública (A)
//                   </label>
//                   <div className='relative'>
//                     <textarea
//                       className='w-full h-32 p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm font-mono bg-slate-50'
//                       value={pubPemA}
//                       onChange={(e) => setPubPemA(e.target.value)}
//                       placeholder='La clave pública se generará automáticamente...'
//                     />
//                     {pubPemA && (
//                       <div className='absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'>
//                         Lista
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700 flex items-center gap-2'>
//                     <span className='text-blue-600'>3.</span>
//                     Clave Privada (A)
//                   </label>
//                   <div className='relative'>
//                     <textarea
//                       className='w-full h-32 p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm font-mono bg-slate-50'
//                       value={privPemA}
//                       onChange={(e) => setPrivPemA(e.target.value)}
//                       placeholder='La clave privada se generará automáticamente...'
//                     />
//                     {privPemA && (
//                       <div className='absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full'>
//                         Privada
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Mensaje y Firma */}
//               <div className='space-y-4'>
//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700 flex items-center gap-2'>
//                     <span className='text-blue-600'>4.</span>
//                     Mensaje a Firmar
//                   </label>
//                   <textarea
//                     className='w-full h-24 p-4 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none'
//                     value={mensaje}
//                     onChange={(e) => {
//                       setMensaje(e.target.value)
//                       setOriginalMensaje(e.target.value)
//                     }}
//                     placeholder='Escribe el mensaje que deseas firmar digitalmente...'
//                   />
//                 </div>

//                 <div className='flex gap-3'>
//                   <button
//                     className='flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
//                     onClick={handleFirmar}
//                     disabled={!privKeyA || !mensaje}
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
//                       />
//                     </svg>
//                     Firmar Mensaje
//                   </button>

//                   <button
//                     className='px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm'
//                     onClick={() => {
//                       setMensaje(mensaje + ' [MODIFICADO POR ATAQUE]')
//                       alert('Mensaje interceptado por un atacante.')
//                     }}
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
//                       />
//                     </svg>
//                     Simular Ataque
//                   </button>
//                 </div>

//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700 flex items-center gap-2'>
//                     <span className='text-blue-600'>5.</span>
//                     Firma Digital (Base64)
//                   </label>
//                   <textarea
//                     className='w-full h-24 p-4 border-2 border-slate-200 rounded-xl bg-slate-50 font-mono text-xs resize-none'
//                     value={firmaB64}
//                     readOnly
//                     placeholder='La firma digital aparecerá aquí después de firmar...'
//                   />
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* ======================= RECEPTOR ======================= */}
//           <section className='bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden'>
//             <div className='bg-gradient-to-r from-purple-600 to-purple-700 p-6'>
//               <h2 className='text-xl font-bold text-white flex items-center gap-2'>
//                 <span className='w-3 h-3 bg-white rounded-full'></span>
//                 Receptor (B) — Verificar Firma
//               </h2>
//             </div>

//             <div className='p-6 space-y-6'>
//               {/* Importar Clave */}
//               <div className='space-y-4'>
//                 <h3 className='font-semibold text-slate-700 flex items-center gap-2'>
//                   <span className='text-purple-600'>1.</span>
//                   Importar Clave Pública
//                 </h3>

//                 <div className='flex gap-3'>
//                   <button
//                     className='flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
//                     onClick={() => {
//                       if (!pubPemA)
//                         return alert('Primero genera claves en el emisor.')
//                       setPubPemB(pubPemA)
//                       alert('Clave pública copiada al receptor.')
//                     }}
//                     disabled={!pubPemA}
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
//                       />
//                     </svg>
//                     Copiar de Emisor
//                   </button>

//                   <button
//                     className='flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'
//                     onClick={handleImportarPubEnReceptor}
//                     disabled={!pubPemB}
//                   >
//                     <svg
//                       className='w-5 h-5'
//                       fill='none'
//                       stroke='currentColor'
//                       viewBox='0 0 24 24'
//                     >
//                       <path
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                         strokeWidth={2}
//                         d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10'
//                       />
//                     </svg>
//                     Importar PEM
//                   </button>
//                 </div>

//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700'>
//                     Clave Pública (B)
//                   </label>
//                   <div className='relative'>
//                     <textarea
//                       className='w-full h-32 p-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-sm font-mono bg-slate-50'
//                       value={pubPemB}
//                       onChange={(e) => setPubPemB(e.target.value)}
//                       placeholder='Pega la clave pública PEM aquí...'
//                     />
//                     {pubKeyB && (
//                       <div className='absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full'>
//                         Importada
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Firma y Verificación */}
//               <div className='space-y-4'>
//                 <div className='space-y-3'>
//                   <label className='block font-semibold text-slate-700 flex items-center gap-2'>
//                     <span className='text-purple-600'>2.</span>
//                     Firma Digital (Base64)
//                   </label>
//                   <textarea
//                     className='w-full h-24 p-4 border-2 border-slate-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 font-mono text-xs resize-none'
//                     value={firmaB64}
//                     onChange={(e) => setFirmaB64(e.target.value)}
//                     placeholder='Pega la firma digital en Base64 aquí...'
//                   />
//                 </div>

//                 <button
//                   className='w-full px-4 py-3 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-xl shadow-lg hover:from-sky-700 hover:to-sky-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
//                   onClick={handleVerificar}
//                   disabled={!pubKeyB || !firmaB64}
//                 >
//                   <svg
//                     className='w-5 h-5'
//                     fill='none'
//                     stroke='currentColor'
//                     viewBox='0 0 24 24'
//                   >
//                     <path
//                       strokeLinecap='round'
//                       strokeLinejoin='round'
//                       strokeWidth={2}
//                       d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
//                     />
//                   </svg>
//                   Verificar Firma
//                 </button>
//               </div>

//               {/* Resultado */}
//               <div className='space-y-3'>
//                 <h3 className='font-semibold text-slate-700 flex items-center gap-2'>
//                   <span className='text-purple-600'>3.</span>
//                   Resultado de Verificación
//                 </h3>
//                 <div
//                   className={`p-4 rounded-xl border-2 ${
//                     verificacion.includes('✔')
//                       ? 'bg-green-50 border-green-200 text-green-800'
//                       : verificacion.includes('❌')
//                       ? 'bg-red-50 border-red-200 text-red-800'
//                       : 'bg-slate-50 border-slate-200 text-slate-600'
//                   } transition-all duration-300`}
//                 >
//                   <div className='flex items-center gap-3'>
//                     {verificacion.includes('✔') && (
//                       <svg
//                         className='w-6 h-6 text-green-600 flex-shrink-0'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
//                         />
//                       </svg>
//                     )}
//                     {verificacion.includes('❌') && (
//                       <svg
//                         className='w-6 h-6 text-red-600 flex-shrink-0'
//                         fill='none'
//                         stroke='currentColor'
//                         viewBox='0 0 24 24'
//                       >
//                         <path
//                           strokeLinecap='round'
//                           strokeLinejoin='round'
//                           strokeWidth={2}
//                           d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
//                         />
//                       </svg>
//                     )}
//                     <p className='font-medium'>
//                       {verificacion || 'La verificación aparecerá aquí...'}
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   )
// }

// ESTE ES OTRA OJO ----------------------

// import React, { useState } from 'react'

// /* ============================ HELPERS ============================= */

// async function generateKeyPair() {
//   return window.crypto.subtle.generateKey(
//     {
//       name: 'RSA-OAEP',
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: 'SHA-256',
//     },
//     true,
//     ['encrypt', 'decrypt']
//   )
// }

// async function generateKeyPairForSigning() {
//   return window.crypto.subtle.generateKey(
//     {
//       name: 'RSASSA-PKCS1-v1_5',
//       modulusLength: 2048,
//       publicExponent: new Uint8Array([1, 0, 1]),
//       hash: 'SHA-256',
//     },
//     true,
//     ['sign', 'verify']
//   )
// }

// function bufToBase64(buffer) {
//   return btoa(String.fromCharCode(...new Uint8Array(buffer)))
// }

// function base64ToBuf(base64) {
//   const binary = atob(base64)
//   const bytes = new Uint8Array(binary.length)
//   for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
//   return bytes.buffer
// }

// function pemEncode(base64, tag) {
//   return `-----BEGIN ${tag}-----\n${base64
//     .match(/.{1,64}/g)
//     .join('\n')}\n-----END ${tag}-----`
// }

// function pemToBase64(pem) {
//   return pem.replace(/-----.*-----/g, '').replace(/\s+/g, '')
// }

// async function exportPublicKeyToPEM(publicKey) {
//   const spki = await crypto.subtle.exportKey('spki', publicKey)
//   return pemEncode(bufToBase64(spki), 'PUBLIC KEY')
// }

// async function exportPrivateKeyToPEM(privateKey) {
//   const pkcs8 = await crypto.subtle.exportKey('pkcs8', privateKey)
//   return pemEncode(bufToBase64(pkcs8), 'PRIVATE KEY')
// }

// async function importPublicKeyFromPEM(pem) {
//   const buf = base64ToBuf(pemToBase64(pem))
//   return crypto.subtle.importKey(
//     'spki',
//     buf,
//     { name: 'RSA-OAEP', hash: 'SHA-256' },
//     true,
//     ['encrypt']
//   )
// }

// async function importPublicKeyForVerification(pem) {
//   const buf = base64ToBuf(pemToBase64(pem))
//   return crypto.subtle.importKey(
//     'spki',
//     buf,
//     { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
//     true,
//     ['verify']
//   )
// }

// async function signMessage(privateKey, data) {
//   return crypto.subtle.sign({ name: 'RSASSA-PKCS1-v1_5' }, privateKey, data)
// }

// async function verifySignature(publicKey, signature, data) {
//   return crypto.subtle.verify(
//     { name: 'RSASSA-PKCS1-v1_5' },
//     publicKey,
//     signature,
//     data
//   )
// }

// async function encryptMessage(publicKey, data) {
//   return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, data)
// }

// async function decryptMessage(privateKey, encryptedData) {
//   return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, encryptedData)
// }

// /* ============================ COMPONENTE ============================= */

// export default function FirmaDigitalCompleto() {
//   const [privKeyA, setPrivKeyA] = useState(null)
//   const [pubKeyA, setPubKeyA] = useState(null)
//   const [privPemA, setPrivPemA] = useState('')
//   const [pubPemA, setPubPemA] = useState('')

//   const [pubKeyB, setPubKeyB] = useState(null)
//   const [pubPemB, setPubPemB] = useState('')

//   const [mensaje, setMensaje] = useState('')
//   const [originalMensaje, setOriginalMensaje] = useState('')
//   const [firmaB64, setFirmaB64] = useState('')
//   const [mensajeCifradoB64, setMensajeCifradoB64] = useState('')
//   const [verificacion, setVerificacion] = useState('')
//   const [mensajeDescifrado, setMensajeDescifrado] = useState('')

//   /* ---------------------- Generar claves ---------------------- */
//   const handleGenerarClaves = async () => {
//     try {
//       // Generar par de claves para cifrado
//       const encryptionPair = await generateKeyPair()
//       // Generar par de claves para firma
//       const signingPair = await generateKeyPairForSigning()

//       setPrivKeyA({
//         encryption: encryptionPair.privateKey,
//         signing: signingPair.privateKey,
//       })
//       setPubKeyA({
//         encryption: encryptionPair.publicKey,
//         signing: signingPair.publicKey,
//       })

//       const privPem = await exportPrivateKeyToPEM(signingPair.privateKey)
//       const pubPem = await exportPublicKeyToPEM(signingPair.publicKey)

//       setPrivPemA(privPem)
//       setPubPemA(pubPem)

//       alert('Claves generadas correctamente.')
//     } catch (err) {
//       alert('Error generando claves: ' + err.message)
//     }
//   }

//   /* -------------------------- Firmar y Cifrar -------------------------- */
//   const handleFirmarYCifrar = async () => {
//     if (!privKeyA) return alert('Primero genera la clave privada.')
//     if (!mensaje) return alert('Escribe un mensaje.')

//     setOriginalMensaje(mensaje)

//     try {
//       const encoder = new TextEncoder()
//       const data = encoder.encode(mensaje)

//       // 1. Firmar el mensaje
//       const sig = await signMessage(privKeyA.signing, data)
//       setFirmaB64(bufToBase64(sig))

//       // 2. Cifrar el mensaje (simulando envío seguro)
//       const encrypted = await encryptMessage(pubKeyA.encryption, data)
//       setMensajeCifradoB64(bufToBase64(encrypted))

//       alert('Mensaje firmado y cifrado correctamente.')
//     } catch (err) {
//       alert('Error firmando: ' + err.message)
//     }
//   }

//   /* ----------------------- Importar Pública ----------------------- */
//   const handleImportarPubEnReceptor = async () => {
//     if (!pubPemB) return alert('Pega una clave pública PEM.')

//     try {
//       const imported = await importPublicKeyForVerification(pubPemB)
//       setPubKeyB(imported)
//       alert('Clave pública importada correctamente.')
//     } catch (err) {
//       alert('Error importando clave: ' + err.message)
//     }
//   }

//   /* -------------------------- Verificar -------------------------- */
//   const handleVerificar = async () => {
//     if (!pubKeyB) return alert('Importa la clave pública primero.')
//     if (!firmaB64) return alert('Genera una firma primero.')

//     const encoder = new TextEncoder()
//     const data = encoder.encode(mensaje)
//     const sigBuf = base64ToBuf(firmaB64)

//     try {
//       const esValido = await verifySignature(pubKeyB, sigBuf, data)

//       // Detectar ataque MITM
//       if (!esValido && mensaje !== originalMensaje) {
//         setVerificacion('❌ ATAQUE DETECTADO — El mensaje fue modificado.')
//         return
//       }

//       setVerificacion(
//         esValido
//           ? '✔ Firma válida — El mensaje es auténtico.'
//           : '❌ Firma inválida — Clave incorrecta o mensaje alterado.'
//       )
//     } catch (err) {
//       setVerificacion('Error verificando: ' + err.message)
//     }
//   }

//   /* -------------------------- Descifrar -------------------------- */
//   const handleDescifrar = async () => {
//     if (!privKeyA || !mensajeCifradoB64)
//       return alert('No hay mensaje cifrado para descifrar.')

//     try {
//       const encryptedBuf = base64ToBuf(mensajeCifradoB64)
//       const decrypted = await decryptMessage(privKeyA.encryption, encryptedBuf)
//       const decoder = new TextDecoder()
//       const textoDescifrado = decoder.decode(decrypted)
//       setMensajeDescifrado(textoDescifrado)
//     } catch (err) {
//       alert('Error descifrando: ' + err.message)
//     }
//   }

//   return (
//     <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 md:p-6'>
//       <div className='max-w-6xl mx-auto'>
//         {/* Header */}
//         <div className='text-center mb-8 md:mb-12'>
//           <div className='w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg'>
//             <span className='text-white text-2xl'>🔐</span>
//           </div>
//           <h1 className='text-2xl md:text-3xl font-bold text-slate-800 mb-3'>
//             Demostración de Firma Digital y Cifrado
//           </h1>
//           <p className='text-slate-600 max-w-2xl mx-auto text-sm md:text-base'>
//             Simula el proceso completo de firma digital y cifrado con
//             criptografía RSA
//           </p>
//         </div>

//         <div className='grid gap-6 lg:grid-cols-2'>
//           {/* ======================= EMISOR ======================= */}
//           <section className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden'>
//             <div className='bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6'>
//               <h2 className='text-lg md:text-xl font-bold text-white flex items-center gap-3'>
//                 <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
//                   <span className='text-white'>👤</span>
//                 </div>
//                 Emisor - Firmar y Cifrar
//               </h2>
//             </div>

//             <div className='p-4 md:p-6 space-y-6'>
//               {/* Generar Claves */}
//               <div className='space-y-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                     1
//                   </div>
//                   <h3 className='font-semibold text-slate-700'>
//                     Generar Par de Claves
//                   </h3>
//                 </div>
//                 <button
//                   onClick={handleGenerarClaves}
//                   className='w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-3'
//                 >
//                   <span className='text-lg'>🔑</span>
//                   Generar Claves RSA-2048
//                 </button>
//               </div>

//               {/* Claves Generadas */}
//               <div className='space-y-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                     2
//                   </div>
//                   <h3 className='font-semibold text-slate-700'>
//                     Claves Generadas
//                   </h3>
//                 </div>

//                 <div className='space-y-4'>
//                   <div className='space-y-2'>
//                     <label className='block text-sm font-medium text-slate-600'>
//                       Clave Pública
//                     </label>
//                     <div className='relative'>
//                       <textarea
//                         className='w-full h-28 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm font-mono bg-slate-50/50 resize-none'
//                         value={pubPemA}
//                         onChange={(e) => setPubPemA(e.target.value)}
//                         placeholder='La clave pública se generará automáticamente...'
//                       />
//                       {pubPemA && (
//                         <div className='absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
//                           <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
//                           Lista
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   <div className='space-y-2'>
//                     <label className='block text-sm font-medium text-slate-600'>
//                       Clave Privada
//                     </label>
//                     <div className='relative'>
//                       <textarea
//                         className='w-full h-28 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm font-mono bg-slate-50/50 resize-none'
//                         value={privPemA}
//                         onChange={(e) => setPrivPemA(e.target.value)}
//                         placeholder='La clave privada se generará automáticamente...'
//                       />
//                       {privPemA && (
//                         <div className='absolute top-2 right-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
//                           <div className='w-1.5 h-1.5 bg-red-500 rounded-full'></div>
//                           Privada
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Mensaje y Firma */}
//               <div className='space-y-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                     3
//                   </div>
//                   <h3 className='font-semibold text-slate-700'>
//                     Firmar y Cifrar Mensaje
//                   </h3>
//                 </div>

//                 <div className='space-y-3'>
//                   <textarea
//                     className='w-full h-20 p-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none'
//                     value={mensaje}
//                     onChange={(e) => {
//                       setMensaje(e.target.value)
//                       setOriginalMensaje(e.target.value)
//                     }}
//                     placeholder='Escribe el mensaje que deseas firmar y cifrar...'
//                   />
//                 </div>

//                 <div className='flex gap-3'>
//                   <button
//                     className='flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
//                     onClick={handleFirmarYCifrar}
//                     disabled={!privKeyA || !mensaje}
//                   >
//                     <span>🔐</span>
//                     Firmar y Cifrar
//                   </button>

//                   <button
//                     className='px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm'
//                     onClick={() => {
//                       setMensaje(mensaje + ' [MODIFICADO]')
//                       alert('Mensaje interceptado por un atacante.')
//                     }}
//                   >
//                     <span>⚠️</span>
//                     Simular Ataque
//                   </button>
//                 </div>

//                 {/* Mensaje Cifrado */}
//                 {mensajeCifradoB64 && (
//                   <div className='space-y-2'>
//                     <label className='block text-sm font-medium text-slate-600'>
//                       Mensaje Cifrado
//                     </label>
//                     <div className='relative'>
//                       <textarea
//                         className='w-full h-24 p-3 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-xs font-mono bg-purple-50/50 resize-none'
//                         value={mensajeCifradoB64}
//                         readOnly
//                         placeholder='El mensaje cifrado aparecerá aquí...'
//                       />
//                       <div className='absolute top-2 right-2 bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
//                         <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
//                         Cifrado
//                       </div>
//                     </div>
//                     <p className='text-xs text-purple-600'>
//                       Este es el mensaje cifrado con RSA-OAEP
//                     </p>
//                   </div>
//                 )}

//                 {/* Botón para descifrar */}
//                 {mensajeCifradoB64 && (
//                   <button
//                     onClick={handleDescifrar}
//                     className='w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2'
//                   >
//                     <span>🔓</span>
//                     Descifrar Mensaje
//                   </button>
//                 )}

//                 {/* Mensaje Descifrado */}
//                 {mensajeDescifrado && (
//                   <div className='space-y-2'>
//                     <label className='block text-sm font-medium text-slate-600'>
//                       Mensaje Descifrado
//                     </label>
//                     <div className='p-3 bg-green-50 rounded-lg border-2 border-green-200'>
//                       <div className='flex items-center gap-2 text-sm text-green-700'>
//                         <span>✅</span>
//                         <span>{mensajeDescifrado}</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {firmaB64 && (
//                   <div className='space-y-2'>
//                     <label className='block text-sm font-medium text-slate-600'>
//                       Firma Digital Generada
//                     </label>
//                     <div className='p-3 bg-slate-50 rounded-lg border-2 border-slate-200'>
//                       <div className='flex items-center gap-2 text-sm text-slate-600'>
//                         <span>📝</span>
//                         <span>Firma creada correctamente</span>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </section>

//           {/* ======================= RECEPTOR ======================= */}
//           <section className='bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden'>
//             <div className='bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6'>
//               <h2 className='text-lg md:text-xl font-bold text-white flex items-center gap-3'>
//                 <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
//                   <span className='text-white'>👥</span>
//                 </div>
//                 Receptor - Verificar Firma
//               </h2>
//             </div>

//             <div className='p-4 md:p-6 space-y-6'>
//               {/* Importar Clave */}
//               <div className='space-y-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                     1
//                   </div>
//                   <h3 className='font-semibold text-slate-700'>
//                     Importar Clave Pública
//                   </h3>
//                 </div>

//                 <div className='flex gap-3'>
//                   <button
//                     className='flex-1 px-3 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
//                     onClick={() => {
//                       if (!pubPemA)
//                         return alert('Primero genera claves en el emisor.')
//                       setPubPemB(pubPemA)
//                       alert('Clave pública copiada al receptor.')
//                     }}
//                     disabled={!pubPemA}
//                   >
//                     <span>📋</span>
//                     Copiar de Emisor
//                   </button>

//                   <button
//                     className='flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
//                     onClick={handleImportarPubEnReceptor}
//                     disabled={!pubPemB}
//                   >
//                     <span>📥</span>
//                     Importar PEM
//                   </button>
//                 </div>

//                 <div className='space-y-2'>
//                   <label className='block text-sm font-medium text-slate-600'>
//                     Clave Pública del Emisor
//                   </label>
//                   <div className='relative'>
//                     <textarea
//                       className='w-full h-28 p-3 border-2 border-slate-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 text-sm font-mono bg-slate-50/50 resize-none'
//                       value={pubPemB}
//                       onChange={(e) => setPubPemB(e.target.value)}
//                       placeholder='Pega la clave pública PEM aquí...'
//                     />
//                     {pubKeyB && (
//                       <div className='absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1'>
//                         <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
//                         Importada
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Verificación */}
//               <div className='space-y-4'>
//                 <div className='flex items-center gap-3'>
//                   <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                     2
//                   </div>
//                   <h3 className='font-semibold text-slate-700'>
//                     Verificar Firma
//                   </h3>
//                 </div>

//                 <button
//                   className='w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
//                   onClick={handleVerificar}
//                   disabled={!pubKeyB || !firmaB64}
//                 >
//                   <span>🔍</span>
//                   Verificar Firma
//                 </button>
//               </div>

//               {/* Resultado */}
//               {verificacion && (
//                 <div className='space-y-3'>
//                   <div className='flex items-center gap-3'>
//                     <div className='w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold'>
//                       3
//                     </div>
//                     <h3 className='font-semibold text-slate-700'>Resultado</h3>
//                   </div>
//                   <div
//                     className={`p-4 rounded-xl border-2 transition-all duration-300 ${
//                       verificacion.includes('✔')
//                         ? 'bg-green-50 border-green-200 text-green-800'
//                         : 'bg-red-50 border-red-200 text-red-800'
//                     }`}
//                   >
//                     <div className='flex items-center gap-3'>
//                       <span className='text-xl'>
//                         {verificacion.includes('✔') ? '✅' : '❌'}
//                       </span>
//                       <p className='font-medium'>{verificacion}</p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>

//         {/* Footer */}
//         <div className='mt-8 text-center text-sm text-slate-500'>
//           Sistema de demostración de firma digital y cifrado RSA-2048
//         </div>
//       </div>
//     </div>
//   )
// }

import React, { useState } from 'react'

/* ============================ HELPERS ============================= */

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

  /* ---------------------- Generar TODAS las claves ---------------------- */
  const handleGenerarClaves = async () => {
    try {
      // Generar claves para FIRMA
      const signingPair = await generateSigningKeyPair()
      setPrivKeyFirma(signingPair.privateKey)
      setPubKeyFirma(signingPair.publicKey)

      const privPemFirma = await exportPrivateKeyToPEM(signingPair.privateKey)
      const pubPemFirma = await exportPublicKeyToPEM(signingPair.publicKey)
      setPrivPemFirma(privPemFirma)
      setPubPemFirma(pubPemFirma)

      // Generar claves para CIFRADO
      const encryptionPair = await generateEncryptionKeyPair()
      setPrivKeyCifrado(encryptionPair.privateKey)
      setPubKeyCifrado(encryptionPair.publicKey)

      const pubPemCifrado = await exportPublicKeyToPEM(encryptionPair.publicKey)
      setPubPemCifrado(pubPemCifrado)

      alert('Todas las claves generadas correctamente.')
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

              {/* Resumen de Diferencias */}
              <div className='mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200'>
                <h4 className='font-semibold text-slate-700 mb-2'>
                  📚 ¿Qué estás viendo?
                </h4>
                <div className='space-y-2 text-sm text-slate-600'>
                  <div className='flex items-center gap-2'>
                    <span className='text-purple-600'>🔐</span>
                    <span>
                      <strong>Cifrado:</strong> Convierte el mensaje en texto
                      ilegible
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-blue-600'>📝</span>
                    <span>
                      <strong>Firma:</strong> Verifica identidad e integridad
                      (no oculta)
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-green-600'>✅</span>
                    <span>
                      <strong>Descifrado:</strong> Recupera el mensaje original
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
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
