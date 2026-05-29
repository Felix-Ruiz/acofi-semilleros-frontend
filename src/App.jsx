import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Header from './components/Header';
import RegistrationPage from './pages/RegistrationPage';
import AdminPanel from './pages/AdminPanel';
import EvaluatorRegistration from './pages/EvaluatorRegistration';
import EvaluationPage from './pages/EvaluationPage';
import ScannerPage from './pages/ScannerDashboard';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StudentDashboard from './pages/StudentDashboard'; // Nueva importación

const PrivateRoute = ({ children }) => {
  const isAuth = localStorage.getItem('usuario_logueado');
  return isAuth ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('admin_logueado');
  return isAdmin ? children : <Navigate to="/portal-interno-acofi" />;
};

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
                {/* GRID OCULTO: Ya no contiene el botón gris de Administración */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                  <Link
                    to="/registro"
                    className="flex flex-col items-center justify-center bg-blue-900 text-white p-8 rounded-xl shadow-lg hover:bg-blue-800 transition-colors duration-300 text-center"
                  >
                    <span className="text-2xl font-semibold mb-2">Estudiantes</span>
                    <span className="text-sm opacity-80">Registrar ponencia o ver QR</span>
                  </Link>
                  <Link
                    to="/login"
                    className="flex flex-col items-center justify-center bg-blue-700 text-white p-8 rounded-xl shadow-lg hover:bg-blue-600 transition-colors duration-300 text-center"
                  >
                    <span className="text-2xl font-semibold mb-2">Evaluadores / Estudiantes</span>
                    <span className="text-sm opacity-80">Acceso al Sistema</span>
                  </Link>
                </div>
              </div>
            } />
            
            {/* Rutas Públicas */}
            <Route path="/registro" element={<RegistrationPage />} />
            <Route path="/registro-evaluador" element={<EvaluatorRegistration />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* URL DE ADMINISTRADOR COMPLETAMENTE OCULTA Y CAMBIADA */}
            <Route path="/portal-interno-acofi" element={<AdminLoginPage />} />

            {/* Rutas Protegidas */}
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/mi-ponencia" element={<PrivateRoute><StudentDashboard /></PrivateRoute>} />
            <Route path="/evaluar" element={<PrivateRoute><EvaluationPage /></PrivateRoute>} />
            <Route path="/evaluar/:codigoQR" element={<PrivateRoute><EvaluationPage /></PrivateRoute>} />
            <Route path="/escanear" element={<PrivateRoute><ScannerPage /></PrivateRoute>} />
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