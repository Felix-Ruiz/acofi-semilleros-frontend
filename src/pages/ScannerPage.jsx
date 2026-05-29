import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "https://acofi-backend.onrender.com";

function ScannerPage() {
  const navigate = useNavigate();
  const [errorLectura, setErrorLectura] = useState('');

  // ⚠️ NUEVOS ESTADOS PARA EL DASHBOARD DEL EVALUADOR
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargandoAsignaciones, setCargandoAsignaciones] = useState(false);
  
  const usuarioLogueado = localStorage.getItem('usuario_logueado') === 'true';
  const usuarioTipo = localStorage.getItem('usuario_tipo');
  const usuarioDoc = localStorage.getItem('usuario_documento');
  const usuarioNombre = localStorage.getItem('usuario_nombre');

  // ⚠️ EFECTO: Cargar las asignaciones si quien escanea es un evaluador logueado
  useEffect(() => {
    if (usuarioLogueado && usuarioTipo === 'evaluador' && usuarioDoc) {
      const cargarAsignaciones = async () => {
        setCargandoAsignaciones(true);
        try {
          const res = await axios.get(`${API_URL}/api/admin/evaluador_dashboard/${usuarioDoc}`);
          setAsignaciones(res.data.asignaciones || []);
        } catch (error) {
          console.error("Error cargando dashboard:", error);
        } finally {
          setCargandoAsignaciones(false);
        }
      };
      cargarAsignaciones();
    }
  }, [usuarioLogueado, usuarioTipo, usuarioDoc]);

  useEffect(() => {
    // 1. Iniciar el escáner sin forzar nada para que pida permisos primero
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = (decodedText) => {
      scanner.clear();
      try {
        // ⚠️ SOLUCIÓN: Buscar inteligentemente el código sin importar si es un redirect
        const textoString = String(decodedText);
        const match = textoString.match(/evaluar\/(\d+)/);
        
        let codigo = null;
        if (match) {
          codigo = match[1]; // Atrapa el número después de "evaluar/"
        } else if (/^\d+$/.test(textoString)) {
          codigo = textoString; // Por si el QR llegara a tener solo el número puro
        }

        if (codigo) {
          navigate(`/evaluar/${codigo}`);
        } else {
          setErrorLectura("El código QR no pertenece a una ponencia válida.");
        }
      } catch (e) {
        setErrorLectura("Formato de QR inválido.");
      }
    };

    scanner.render(onScanSuccess, () => {});

    // 2. LOGICA DE CONMUTACION:
    // Esperamos 1.5 segundos a que la cámara inicie y el select esté presente en el DOM
    const forceRearCamera = () => {
      const cameraSelect = document.getElementsByTagName("select")[0];
      if (cameraSelect) {
        // Buscamos opciones que indiquen cámara trasera
        let rearCameraIndex = -1;
        for (let i = 0; i < cameraSelect.options.length; i++) {
          const text = cameraSelect.options[i].text.toLowerCase();
          if (text.includes("back") || text.includes("rear") || text.includes("environment")) {
            rearCameraIndex = i;
            break;
          }
        }
        
        if (rearCameraIndex !== -1) {
          cameraSelect.selectedIndex = rearCameraIndex;
          cameraSelect.dispatchEvent(new Event('change'));
        }
      }
    };

    const timer = setTimeout(forceRearCamera, 1500);

    return () => {
      clearTimeout(timer);
      scanner.clear().catch(console.error);
    };
  }, [navigate]);

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center my-6">
      
      {/* ⚠️ PANEL SUPERIOR SI ES EVALUADOR */}
      {usuarioLogueado && usuarioTipo === 'evaluador' && (
        <div className="w-full bg-blue-950 rounded-2xl p-6 text-white shadow-md mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black mb-1">¡Hola, {usuarioNombre}!</h1>
            <p className="text-blue-200 text-sm">Dashboard del Evaluador Oficial</p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }} 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <h2 className="text-3xl font-bold text-blue-950 mb-4 text-center">Escanear Ponencia</h2>
      <p className="text-gray-500 text-center mb-8">
        El sistema intentará activar la cámara trasera automáticamente en un momento.
      </p>

      {errorLectura && (
        <div className="w-full p-4 mb-6 rounded-lg font-medium text-center bg-red-50 text-red-700 border border-red-200">
          {errorLectura}
        </div>
      )}

      <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-blue-100 shadow-inner mb-8"></div>

      {/* ⚠️ LISTA DE ASIGNACIONES (DASHBOARD) */}
      {usuarioLogueado && usuarioTipo === 'evaluador' && (
        <div className="w-full mt-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4 px-2 border-b pb-2">
            Mis Asignaciones ({asignaciones.filter(a => a.evaluado).length}/{asignaciones.length})
          </h3>
          
          {cargandoAsignaciones ? (
            <p className="text-center text-gray-400 py-6 font-medium animate-pulse">Cargando tus tareas...</p>
          ) : asignaciones.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center shadow-sm">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="text-gray-500 text-sm font-medium">No tienes ponencias asignadas por el momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {asignaciones.map((a, i) => (
                <div key={i} className={`p-4 md:p-5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${a.evaluado ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-gray-200 shadow-sm hover:border-blue-300'}`}>
                  <div className="flex-1">
                    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full ${a.evaluado ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'} mb-2 inline-block`}>
                      CÓDIGO {a.codigo}
                    </span>
                    <p className={`text-sm font-bold line-clamp-2 ${a.evaluado ? 'text-emerald-900 line-through opacity-70' : 'text-gray-800'}`}>
                      {a.titulo}
                    </p>
                  </div>
                  <div>
                    {a.evaluado ? (
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-inner" title="Evaluado">
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
      )}

      {/* Si no está logueado, solo mostramos el botón de volver (al estudiante no le mostramos dashboard) */}
      {(!usuarioLogueado || usuarioTipo !== 'evaluador') && (
        <button
          onClick={() => navigate('/')}
          className="mt-8 px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors w-full md:w-auto"
        >
          Volver al Inicio
        </button>
      )}
    </div>
  );
}

export default ScannerPage;