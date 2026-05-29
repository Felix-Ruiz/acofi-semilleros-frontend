import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "https://acofi-backend.onrender.com";

function ScannerDashboard() {
  const navigate = useNavigate();
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const usuarioNombre = localStorage.getItem('usuario_nombre');
  const usuarioDoc = localStorage.getItem('usuario_documento');

  useEffect(() => {
    // Si no es evaluador o no está logueado, chao.
    if (!localStorage.getItem('usuario_logueado') || localStorage.getItem('usuario_tipo') !== 'evaluador') {
      window.location.href = '/login';
      return;
    }

    const cargarAsignaciones = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/admin/evaluador_dashboard/${usuarioDoc}`);
        setAsignaciones(res.data.asignaciones);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarAsignaciones();
  }, [usuarioDoc]);

  return (
    <div className="max-w-3xl mx-auto bg-gray-50 min-h-screen p-4 md:p-8 font-sans">
      
      <div className="bg-blue-950 rounded-3xl p-6 text-white shadow-xl mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1">¡Hola, {usuarioNombre}!</h1>
          <p className="text-blue-200 text-sm">Dashboard del Evaluador Oficial</p>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">
          Salir
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
          📷
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Escanear Nuevo Proyecto</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">Usa la cámara de tu dispositivo para leer el código QR del póster de los estudiantes.</p>
        
        {/* Aquí va tu componente de escáner de cámara si lo tienes.
            Como es un ejemplo nativo, pongo un botón simulado para abrir cámara */}
        <button onClick={() => alert("Aquí debes abrir tu componente de cámara QR")} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-colors w-full md:w-auto text-lg">
          Abrir Cámara Escáner
        </button>
        
        <div className="mt-6 flex items-center gap-4 text-sm text-gray-400">
          <div className="flex-1 h-px bg-gray-200"></div>
          o ingresa código manual
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
        
        <div className="mt-4 flex gap-2 max-w-xs mx-auto">
          <input type="text" id="manualCode" placeholder="Ej: 123" className="flex-1 px-4 py-2 border border-gray-300 rounded-xl outline-none focus:border-indigo-500 text-center font-mono font-bold text-lg" />
          <button onClick={() => navigate(`/evaluar/${document.getElementById('manualCode').value}`)} className="px-5 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors">Ir</button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 px-2">Mis Asignaciones ({asignaciones.filter(a => a.evaluado).length}/{asignaciones.length})</h3>
        
        {cargando ? (
          <p className="text-center text-gray-400 py-10">Cargando tus tareas...</p>
        ) : asignaciones.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center shadow-sm">
            <span className="text-4xl block mb-2">🎉</span>
            <p className="text-gray-500 text-sm font-medium">No tienes ponencias asignadas o has terminado todo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {asignaciones.map((a, i) => (
              <div key={i} className={`p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${a.evaluado ? 'bg-emerald-50/50 border-emerald-200 opacity-70' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex-1">
                  <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full ${a.evaluado ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'} mb-2 inline-block`}>
                    CÓDIGO {a.codigo}
                  </span>
                  <p className={`text-sm font-bold line-clamp-2 ${a.evaluado ? 'text-emerald-900 line-through' : 'text-gray-800'}`}>
                    {a.titulo}
                  </p>
                </div>
                <div>
                  {a.evaluado ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-inner">
                      ✓
                    </div>
                  ) : (
                    <button onClick={() => navigate(`/evaluar/${a.codigo}`)} className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-colors whitespace-nowrap">
                      Evaluar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default ScannerDashboard;