import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import acofiBanner from '../assets/acofi_banner.png';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="w-full bg-blue-950 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
        <img
          src={acofiBanner}
          alt="Primer Encuentro Regional de Investigación e Innovación en Ingeniería - ACOFI 2026"
          className="w-full h-auto object-cover rounded-lg"
        />
      </div>
      
      {/* Botón de retroceso universal (Solo se muestra si NO estamos en el inicio) */}
      {location.pathname !== '/' && (
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 text-blue-950 rounded-lg hover:bg-gray-200 font-semibold transition-colors flex items-center text-sm shadow-sm w-max"
          >
            ← Volver Atrás
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;