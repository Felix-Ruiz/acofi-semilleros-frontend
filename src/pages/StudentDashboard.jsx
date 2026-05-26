import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = "https://acofi-backend.onrender.com";

function StudentDashboard() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarPerfil = async () => {
      const estudianteId = localStorage.getItem('usuario_id');
      try {
        const res = await axios.get(`${API_URL}/api/admin/estudiante_perfil/${estudianteId}`);
        setPerfil(res.data);
      } catch (err) {
        setError('No se pudo obtener la información de la ponencia.');
      } finally {
        setCargando(false);
      }
    };
    cargarPerfil();
  }, []);

  if (cargando) {
    return (
      <div className="text-center py-12">
        <p className="text-blue-900 font-bold text-lg animate-pulse">Cargando credenciales de ponencia...</p>
      </div>
    );
  }

  if (error || !perfil) {
    return (
      <div className="max-w-md mx-auto bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 text-center">
        {error || 'Información no disponible.'}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-2 text-center">Mi Credencial Digital</h2>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
        Presente este código QR en su pantalla móvil al jurado asignado en el stand de exposición.
      </p>

      {/* BLOQUE DE ATENCIÓN INTUITIVO DEL QR */}
      <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center mb-8 w-full max-w-sm shadow-inner">
        {perfil.url_qr ? (
          <>
            <img 
              src={perfil.url_qr} 
              alt="Código QR Oficial" 
              className="w-56 h-56 object-contain bg-white p-3 rounded-xl shadow-md border"
            />
            <span className="mt-4 font-mono text-xl font-bold text-gray-800 bg-gray-200 px-4 py-1 rounded-lg tracking-wider">
              PÓSTER: {perfil.codigo || 'S/A'}
            </span>
          </>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-yellow-600 font-semibold mb-1">QR en proceso de asignación</p>
            <p className="text-xs text-gray-400">Su ponencia se encuentra en validación por el comité organizador corporativo.</p>
          </div>
        )}
      </div>

      {/* DETALLES ACADÉMICOS */}
      <div className="w-full bg-gray-50/60 p-6 rounded-xl border border-gray-100 space-y-4 text-sm">
        <h4 className="font-bold text-blue-950 border-b pb-2 text-base">Información Técnica del Proyecto</h4>
        <div>
          <span className="text-gray-400 block font-semibold uppercase text-xs">Título del trabajo</span>
          <span className="text-gray-800 font-medium text-base">{perfil.trabajo_titulo}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 block font-semibold uppercase text-xs">Ponente</span>
            <span className="text-gray-700 font-medium">{perfil.nombre}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold uppercase text-xs">Identificación</span>
            <span className="text-gray-700 font-mono">{perfil.documento}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 block font-semibold uppercase text-xs">Institución</span>
            <span className="text-gray-700 font-medium">{perfil.institucion}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-semibold uppercase text-xs">Sede del Encuentro</span>
            <span className="text-gray-700 font-medium">{perfil.ciudad}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;