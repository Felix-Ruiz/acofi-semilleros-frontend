import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

function ScannerPage() {
  const navigate = useNavigate();
  const [errorLectura, setErrorLectura] = useState('');

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
        const url = new URL(decodedText);
        const partesPath = url.pathname.split('/');
        const codigo = partesPath[partesPath.length - 1];
        if (codigo) navigate(`/evaluar/${codigo}`);
        else setErrorLectura("El código QR no tiene el formato correcto.");
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
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-blue-950 mb-4 text-center">Escanear Ponencia</h2>
      <p className="text-gray-500 text-center mb-8">
        El sistema intentará activar la cámara trasera automáticamente en un momento.
      </p>

      {errorLectura && (
        <div className="w-full p-4 mb-6 rounded-lg font-medium text-center bg-red-50 text-red-700 border border-red-200">
          {errorLectura}
        </div>
      )}

      <div id="qr-reader" className="w-full max-w-sm overflow-hidden rounded-xl border-2 border-blue-100 shadow-inner"></div>

      <button
        onClick={() => navigate('/')}
        className="mt-8 px-8 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-semibold transition-colors w-full md:w-auto"
      >
        Volver al Inicio
      </button>
    </div>
  );
}

export default ScannerPage;