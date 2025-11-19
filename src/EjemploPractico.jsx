// EjemploPractico.jsx
import React from 'react'
import ReceptorAlcaldia from './DesencriptarDocumento'
import SignAndSend from './FirmarDocumentos'

function EjemploPractico() {
  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-6 text-gray-800'>
        Ejemplo Práctico de Firma y Desencriptación RSA
      </h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Sección de Firmar Documento */}
        <div className='bg-white p-6 shadow rounded-lg'>
          <h2 className='text-xl font-semibold mb-4 text-blue-600'>
            1. Firmar Documento (Emisor)
          </h2>
          <SignAndSend />
        </div>

        {/* Sección de Desencriptar Documento */}
        <div className='bg-white p-6 shadow rounded-lg'>
          <h2 className='text-xl font-semibold mb-4 text-green-600'>
            2. Desencriptar Documento (Receptor)
          </h2>
          <ReceptorAlcaldia />
        </div>
      </div>
    </div>
  )
}

export default EjemploPractico
