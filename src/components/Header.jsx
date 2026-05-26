import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import acofiBanner from '../assets/acofi_banner.png';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si hay alguna sesión activa en el navegador
  const isUserAuth = localStorage.getItem('usuario_logueado');
  const isAdminAuth = localStorage.getItem('admin_logueado');
  const nombreUsuario = localStorage.getItem('usuario_nombre') || "Administrador";

  const isAuth = isUserAuth || isAdminAuth;

  const handleLogout = () => {
    localStorage.clear(); // Limpia todas las variables de sesión de forma segura
    navigate('/'); // Redirige a la raíz
  };

  return (
    <header className="w-full bg-blue-950 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <img
          src={acofiBanner}
          alt="Primer Encuentro Regional de Investigación e Innovación en Ingeniería - ACOFI 2026"
          className="w-full h-auto object-cover rounded-lg"
        />
      </div>
      
      {/* Contenedor de acciones */}
      {(location.pathname !== '/' || isAuth) && (
        <div className="max-w-7xl mx-auto px-4 pb-3 flex justify-between items-center">
          <div>
            {location.pathname !== '/' && (
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-100 text-blue-950 rounded-lg hover:bg-gray-200 font-semibold transition-colors flex items-center text-sm shadow-sm w-max"
              >
                ← Volver Atrás
              </button>
            )}
          </div>

          <div>
            {isAuth && (
              <div className="flex items-center gap-3">
                <span className="text-gray-300 text-xs md:text-sm hidden sm:inline">
                  Hola, <strong className="text-white">{nombreUsuario}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors text-xs md:text-sm shadow-sm w-max"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;