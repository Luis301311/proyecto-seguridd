// import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
// import ReceptorAlcaldia from "./DesencriptarDocumento";
// import SignAndSend from "./FirmarDocumentos";
// import FirmaDigitalCompleto from "./FirmaDigitalCompleto";

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="min-h-screen bg-gray-100 p-6">

//         {/* Barra de navegación */}
//         <nav className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow">
//           <Link
//             to="/firmar"
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Firmar y Enviar
//           </Link>

//           <Link
//             to="/receptor"
//             className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//           >
//             Receptor (Alcaldía)
//           </Link>

//           <Link
//             to="/completo"
//             className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
//           >
//             Vista Completa
//           </Link>
//         </nav>

//         {/* Contenido principal */}
//         <Routes>
//           <Route path="/firmar" element={<SignAndSend />} />
//           <Route path="/receptor" element={<ReceptorAlcaldia />} />
//           <Route path="/completo" element={<FirmaDigitalCompleto />} />

//           {/* Ruta inicial */}
//           <Route path="*" element={<SignAndSend />} />
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;

import React from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom'
import ReceptorAlcaldia from './DesencriptarDocumento'
import SignAndSend from './FirmarDocumentos'
import FirmaDigitalCompleto from './FirmaDigitalCompleto'
import EjemploPractico from './EjemploPractico'

// Componente para los botones de navegación con estado activo
const NavButton = ({ to, children, color }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  const colorClasses = {
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    emerald: 'bg-emerald-500 hover:bg-emerald-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
  }

  return (
    <Link
      to={to}
      className={`
        relative px-6 py-3 rounded-xl font-medium transition-all duration-300 
        text-white shadow-lg hover:shadow-xl transform hover:scale-105
        ${colorClasses[color]}
        ${isActive ? 'ring-2 ring-white ring-opacity-50 shadow-lg' : ''}
      `}
    >
      {children}
    </Link>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 font-sans'>
        {/* HEADER MODERNO */}
        <header className='mb-8 md:mb-12'>
          <div className='max-w-7xl mx-auto'>
            {/* NAVBAR MEJORADO */}
            <nav className='bg-white/90 backdrop-blur-lg shadow-sm rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center gap-4 border border-slate-100'>
              {/* LOGO */}
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg'>
                  <span className='text-white text-xl'>🔐</span>
                </div>
                <div>
                  <h1 className='text-xl font-bold text-slate-800'>
                    RSA 
                  </h1>
                  <p className='text-sm text-slate-500'>Firma Digital Segura</p>
                </div>
              </div>

              <div className='flex-1' />

              {/* BOTONES DE NAVEGACIÓN */}
              <div className='flex flex-wrap justify-center gap-3'>
                <NavButton to='/firmar' color='indigo'>
                  📝 Firmar y Enviar (Ejemplo)
                </NavButton>
                <NavButton to='/receptor' color='emerald'>
                  📨 Receptor (Ejemplo)
                </NavButton>
                <NavButton to='/completo' color='purple'>
                  🔍 Sistema de Firma Digital
                </NavButton>
                <NavButton to='/ejemplo' color='orange'>
                  🚀 Ejemplo Práctico
                </NavButton>
              </div>
            </nav>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className='max-w-7xl mx-auto'>
          <div className='bg-white/80 backdrop-blur-xl shadow-sm rounded-3xl p-6 md:p-8 lg:p-10 border border-slate-200/60'>
            <Routes>
              <Route path='/firmar' element={<SignAndSend />} />
              <Route path='/receptor' element={<ReceptorAlcaldia />} />
              <Route path='/completo' element={<FirmaDigitalCompleto />} />
              <Route path='/ejemplo' element={<EjemploPractico />} />

              {/* DEFAULT */}
              <Route path='*' element={<SignAndSend />} />
            </Routes>
          </div>
        </main>

        {/* FOOTER MINIMALISTA */}
        <footer className='mt-8 text-center'>
          <p className='text-slate-500 text-sm'>
            Sistema de Firma Digital RSA • Seguro y Confiable
          </p>
        </footer>
      </div>
    </BrowserRouter>
  )
}
