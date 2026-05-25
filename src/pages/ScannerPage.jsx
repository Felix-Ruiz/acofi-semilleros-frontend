import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

function ScannerPage() {
  const navigate = useNavigate();
  const [errorLectura, setErrorLectura] = useState('');

  useEffect(() => {
    // 1. Configuración del escáner (aquí solo va la parte visual y de rendimiento)
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }
      },
      false
    );

    // 2. Función que se ejecuta cuando el QR se lee con éxito
    const onScanSuccess = (decodedText) => {
      scanner.clear();
      try {
        const url = new URL(decodedText);
        const partesPath = url.pathname.split('/');
        const codigo = partesPath[partesPath.length - 1];
        
        if (codigo) {
          navigate(`/evaluar/${codigo}`);
        } else {
          setErrorLectura("El código QR no tiene el formato correcto.");
        }
      } catch (e) {
        setErrorLectura("Formato de QR inválido. Asegúrese de leer el QR oficial de la ponencia.");
      }
    };

    const onScanFailure = (error) => {};

    // 3. Iniciar el escáner y FORZAR la cámara trasera
    // Utilizamos el objeto config para indicar el facingMode correcto
    scanner.render(onScanSuccess, onScanFailure);

    // TRUCO: Intentamos forzar la cámara trasera buscando el elemento de selección
    // que la librería inyecta automáticamente.
    try {
      const cameraSelect = document.getElementsByTagName("select")[0];
      if (cameraSelect) {
        // Buscamos la opción que contenga "back" o "environment"
        for (let i = 0; i < cameraSelect.options.length; i++) {
          if (cameraSelect.options[i].text.toLowerCase().includes("back") || 
              cameraSelect.options[i].text.toLowerCase().includes("environment")) {
            cameraSelect.selectedIndex = i;
            cameraSelect.dispatchEvent(new Event('change'));
            break;
          }
        }
      }
    } catch (e) {
      console.warn("No se pudo autoseleccionar la cámara trasera automáticamente.");
    }

    return () => {
      scanner.clear().catch(error => {
        console.error("Error deteniendo el escáner", error);
      });
    };
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center">
      <h2 className="text-3xl font-bold text-blue-950 mb-4 text-center">Escanear Ponencia</h2>
      <p className="text-gray-500 text-center mb-8">
        Enfoque el código QR del póster con su cámara para acceder a la rúbrica de evaluación.
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