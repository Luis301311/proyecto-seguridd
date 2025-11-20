// EjemploPractico.jsx
import React from 'react'
import ReceptorAlcaldia from './DesencriptarDocumento'
import SignAndSend from './FirmarDocumentos'

function EjemploPractico() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header Principal */}
        <div className='text-center mb-12'>
          <div className='w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg mb-6'>
            <span className='text-3xl text-white'>🔐</span>
          </div>
          <h1 className='text-4xl font-bold text-gray-800 mb-4'>
            Sistema de Firma Digital RSA
          </h1>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Demostración práctica de firma digital y cifrado asimétrico usando
            RSA
          </p>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-8'>
          {/* Sección Emisor */}
          <div className='bg-white rounded-3xl shadow-xl p-8 border border-gray-100'>
            <SignAndSend />
          </div>

          {/* Sección Receptor */}
          <div className='bg-white rounded-3xl shadow-xl p-8 border border-gray-100'>
            <ReceptorAlcaldia />
          </div>
        </div>

        {/* Información Adicional */}
        <div className='mt-12 text-center text-gray-500'>
          <p>
            Este sistema utiliza RSA-2048 para firma digital y cifrado
            asimétrico
          </p>
        </div>
      </div>
    </div>
  )
}

export default EjemploPractico
