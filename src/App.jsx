import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import RegistrationPage from './pages/RegistrationPage';
import AdminPanel from './pages/AdminPanel';
import EvaluatorRegistration from './pages/EvaluatorRegistration';
import EvaluationPage from './pages/EvaluationPage';
import ScannerPage from './pages/ScannerPage'; // Importamos el escáner

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Header />

        <main className="grow p-4 md:p-8">
          <Routes>
            <Route path="/" element={
              <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-6 text-center">
                  Bienvenido al Portal del Semillero
                </h2>
                <p className="text-gray-700 text-lg md:text-xl text-center mb-10 max-w-2xl">
                  Seleccione su perfil para continuar en la plataforma de gestión y evaluación.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <Link
                    to="/registro"
                    className="flex flex-col items-center justify-center bg-blue-900 text-white p-8 rounded-xl shadow-lg hover:bg-blue-800 transition-colors duration-300 text-center"
                  >
                    <span className="text-2xl font-semibold mb-2">Estudiantes</span>
                    <span className="text-sm opacity-80">Registrar ponencia</span>
                  </Link>
                  <Link
                    to="/escanear"
                    className="flex flex-col items-center justify-center bg-blue-700 text-white p-8 rounded-xl shadow-lg hover:bg-blue-600 transition-colors duration-300 text-center"
                  >
                    <span className="text-2xl font-semibold mb-2">Evaluadores</span>
                    <span className="text-sm opacity-80">Escanear póster</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="flex flex-col items-center justify-center bg-gray-800 text-white p-8 rounded-xl shadow-lg hover:bg-gray-700 transition-colors duration-300 text-center"
                  >
                    <span className="text-2xl font-semibold mb-2">Administración</span>
                    <span className="text-sm opacity-80">Panel de control</span>
                  </Link>
                </div>
              </div>
            } />
            <Route path="/registro" element={<RegistrationPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/registro-evaluador" element={<EvaluatorRegistration />} />
            <Route path="/evaluar" element={<EvaluationPage />} />
            <Route path="/evaluar/:codigoQR" element={<EvaluationPage />} />
            <Route path="/escanear" element={<ScannerPage />} /> {/* Ruta del escáner habilitada */}
          </Routes>
        </main>

        <footer className="w-full bg-blue-950 p-6 text-center text-gray-300 mt-10">
          <p>© 2026 ACOFI - Encuentro Regional de Investigación e Innovación en Ingeniería</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;