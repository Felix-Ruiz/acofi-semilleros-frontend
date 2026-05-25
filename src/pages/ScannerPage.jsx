import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

function ScannerPage() {
  const navigate = useNavigate();
  const [errorLectura, setErrorLectura] = useState('');

  useEffect(() => {
    // Configuración del escáner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    // Función que se ejecuta cuando el QR se lee con éxito
    const onScanSuccess = (decodedText) => {
      // Limpiamos el escáner para detener la cámara
      scanner.clear();
      
      // Los QRs que generó nuestro admin tienen la forma: https://subdominio.acofiapps.com/evaluar/123
      // Necesitamos extraer el número final (el código) para navegar a la rúbrica dentro de nuestra app
      try {
        const url = new URL(decodedText);
        const partesPath = url.pathname.split('/');
        const codigo = partesPath[partesPath.length - 1]; // Obtiene el último elemento (ej. '123')
        
        if (codigo) {
          navigate(`/evaluar/${codigo}`);
        } else {
          setErrorLectura("El código QR no tiene el formato correcto.");
        }
      } catch (e) {
        // Si no es una URL válida, asumimos que quizás leyeron un texto plano y no nuestro QR
        setErrorLectura("Formato de QR inválido. Asegúrese de leer el QR oficial de la ponencia.");
      }
    };

    // Función para manejar fallos de lectura continuos (es normal mientras enfoca)
    const onScanFailure = (error) => {
      // No mostramos errores de enfoque para no saturar al usuario
    };

    // Iniciar el escáner
    scanner.render(onScanSuccess, onScanFailure);

    // Función de limpieza al desmontar el componente (salir de la página)
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

      {/* Contenedor donde la librería inyectará el video de la cámara */}
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