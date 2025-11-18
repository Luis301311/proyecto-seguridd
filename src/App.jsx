import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import ReceptorAlcaldia from "./DesencriptarDocumento";
import SignAndSend from "./FirmarDocumentos";
import FirmaDigitalCompleto from "./FirmaDigitalCompleto";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 p-6">

        {/* Barra de navegación */}
        <nav className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow">
          <Link
            to="/firmar"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Firmar y Enviar
          </Link>

          <Link
            to="/receptor"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Receptor (Alcaldía)
          </Link>

          <Link
            to="/completo"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Vista Completa
          </Link>
        </nav>

        {/* Contenido principal */}
        <Routes>
          <Route path="/firmar" element={<SignAndSend />} />
          <Route path="/receptor" element={<ReceptorAlcaldia />} />
          <Route path="/completo" element={<FirmaDigitalCompleto />} />

          {/* Ruta inicial */}
          <Route path="*" element={<SignAndSend />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
