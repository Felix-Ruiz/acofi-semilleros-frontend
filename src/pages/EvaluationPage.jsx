import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// URL base de producción
const API_URL = "https://acofi-backend.onrender.com";

function EvaluationPage() {
  const { codigoQR } = useParams(); // Captura el código si vienen desde el QR
  const navigate = useNavigate();
  const location = useLocation();
  
  const [ponencias, setPonencias] = useState([]);
  const [formData, setFormData] = useState({
    // PUNTO 1 SOLUCIONADO: Tomamos los datos de la sesión para no pedirlos de nuevo
    nombres_evaluador: localStorage.getItem('usuario_nombre') || '',
    documento_evaluador: localStorage.getItem('usuario_documento') || '',
    correo_evaluador: '',
    titulo_poster: '',
    codigo_poster: codigoQR || '',
    respuestas: {
      q6: '',
      q7: '',
      q8: '',
      q9: '',
      q10: ''
    },
    comentarios: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  // Asegurar que si el estado de React se recarga, los datos sigan ahí
  useEffect(() => {
    const nombre = localStorage.getItem('usuario_nombre');
    const doc = localStorage.getItem('usuario_documento');
    if (nombre && doc) {
      setFormData(prev => ({ ...prev, nombres_evaluador: nombre, documento_evaluador: doc }));
    }
  }, []);

  // Cargar lista de ponencias aprobadas y proteger ruta
  useEffect(() => {
    // Si escaneó el QR sin estar logueado, lo mandamos al login guardando esta URL
    if (!localStorage.getItem('usuario_logueado')) {
      navigate(`/login?redirect=${location.pathname}`);
      return;
    }

    const cargarPonencias = async () => {
      try {
        const respuesta = await axios.get(`${API_URL}/api/admin/ponencias`);
        const aprobadas = respuesta.data.filter(p => p.estado === 'aceptada');
        setPonencias(aprobadas);

        // Si vinieron desde un código QR, intentamos autocompletar el título
        if (codigoQR) {
          const ponenciaEncontrada = aprobadas.find(p => p.codigo === codigoQR);
          if (ponenciaEncontrada) {
            setFormData(prev => ({ ...prev, titulo_poster: ponenciaEncontrada.titulo }));
          }
        }
      } catch (error) {
        console.error("Error al cargar ponencias", error);
      }
    };
    cargarPonencias();
  }, [codigoQR, navigate, location]);

  const handleCodigoChange = (e) => {
    const codigoIngresado = e.target.value;
    let tituloEncontrado = '';

    const ponenciaEncontrada = ponencias.find(p => p.codigo === codigoIngresado);
    if (ponenciaEncontrada) {
      tituloEncontrado = ponenciaEncontrada.titulo;
    }

    setFormData({
      ...formData,
      codigo_poster: codigoIngresado,
      titulo_poster: tituloEncontrado
    });
  };

  const handleGeneralChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRubricaChange = (pregunta, valor) => {
    setFormData({
      ...formData,
      respuestas: { ...formData.respuestas, [pregunta]: valor }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    if (!formData.titulo_poster) {
      setMensaje({ tipo: 'error', texto: 'Código de póster inválido. No se encontró ninguna ponencia con ese código.' });
      setCargando(false);
      return;
    }

    const payload = {
      documento_evaluador: formData.documento_evaluador,
      ponencia_codigo: formData.codigo_poster,
      respuestas: {
        ...formData.respuestas,
        comentarios: formData.comentarios
      }
    };

    try {
      const respuesta = await axios.post(`${API_URL}/api/evaluaciones/calificar`, payload);
      setMensaje({ tipo: 'exito', texto: respuesta.data.mensaje });
      setTimeout(() => navigate('/escanear'), 3000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'Error al enviar evaluación.' });
    } finally {
      setCargando(false);
    }
  };

  const FilaRubrica = ({ num, titulo, descripcion, stateKey }) => (
    <div className="flex flex-col md:flex-row items-center border-b border-gray-100 py-6 hover:bg-gray-50 transition-colors rounded-lg px-2">
      <div className="w-full md:w-1/2 mb-4 md:mb-0 pr-4">
        <h4 className="text-lg font-semibold text-blue-900 mb-1">{num}. {titulo}</h4>
        <p className="text-gray-600">{descripcion}</p>
      </div>
      <div className="w-full md:w-1/2 flex justify-between px-2 md:px-8">
        {[10, 20, 30, 40, 50].map(puntos => (
          <label key={puntos} className="flex flex-col items-center cursor-pointer group">
            <span className="text-xs text-gray-400 mb-2 md:hidden">{puntos} pts</span>
            <input 
              type="radio" 
              name={stateKey} 
              value={puntos} 
              required
              checked={formData.respuestas[stateKey] === String(puntos)}
              onChange={() => handleRubricaChange(stateKey, String(puntos))}
              className="w-5 h-5 text-blue-800 border-gray-300 focus:ring-blue-800 cursor-pointer"
            />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4 text-center">Rúbrica de Evaluación</h2>
      <p className="text-gray-500 text-center mb-10 text-lg">
        Encuentro Regional de Investigación e Innovación en Ingeniería ACOFI 2026
      </p>

      {mensaje.texto && (
        <div className={`p-4 mb-8 rounded-lg font-medium text-center ${
          mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECCIÓN 1: DATOS DEL EVALUADOR Y PONENCIA */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
          <h3 className="text-xl font-bold text-gray-800 border-b pb-2">Datos de Identificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">1. Nombre y apellidos del evaluador</label>
              {/* PUNTO 1 SOLUCIONADO: Campo inyectado y bloqueado (readOnly) para que no editen */}
              <input type="text" name="nombres_evaluador" readOnly value={formData.nombres_evaluador} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-200 text-gray-700 outline-none cursor-not-allowed font-medium" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">2. Número de documento de identidad</label>
              <input type="text" name="documento_evaluador" readOnly value={formData.documento_evaluador} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-200 text-gray-700 outline-none cursor-not-allowed font-mono font-medium" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">3. Código del poster</label>
              <input 
                type="text" 
                name="codigo_poster" 
                required 
                value={formData.codigo_poster} 
                onChange={handleCodigoChange} 
                placeholder="Escriba el código numérico de la ponencia" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none font-mono font-bold text-blue-900" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">4. Título del poster</label>
              <input 
                type="text" 
                name="titulo_poster" 
                readOnly 
                value={formData.titulo_poster} 
                placeholder="El título aparecerá automáticamente al ingresar un código válido"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 outline-none cursor-not-allowed" 
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: RÚBRICA */}
        <div className="pt-4">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mb-8">
            <p className="font-semibold text-blue-900 mb-4">La evaluación de cada poster debe ser realizada de acuerdo a los siguientes conceptos:</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><strong className="text-blue-900">(10 puntos)</strong> Se recomienda replantear con acompañamiento del tutor.</li>
              <li><strong className="text-blue-900">(20 puntos)</strong> Propuesta con debilidades que requieren ajustes conceptuales o metodológicos.</li>
              <li><strong className="text-blue-900">(30 puntos)</strong> Buena propuesta con elementos para afinar o profundizar.</li>
              <li><strong className="text-blue-900">(40 puntos)</strong> Propuesta sólida y bien estructurada pero puede mejorar.</li>
              <li><strong className="text-blue-900">(50 puntos)</strong> Excelente base para continuar el proceso investigativo.</li>
            </ul>
          </div>

          <div className="hidden md:flex justify-end px-10 mb-2">
            <div className="w-1/2 flex justify-between text-sm font-semibold text-gray-400">
              <span>10 puntos</span>
              <span>20 puntos</span>
              <span>30 puntos</span>
              <span>40 puntos</span>
              <span>50 puntos</span>
            </div>
          </div>

          <FilaRubrica num="5" titulo="Título" descripcion="Es claro, preciso y refleja el tema y enfoque investigativo." stateKey="q6" />
          <FilaRubrica num="6" titulo="Estructura" descripcion="Se muestra claramente el problema, justificación, antecedentes y objetivos" stateKey="q7" />
          <FilaRubrica num="7" titulo="Resultados esperados / Hipótesis" descripcion="Plantea de manera lógica los resultados esperados y las hipótesis." stateKey="q8" />
          <FilaRubrica num="8" titulo="Metodología" descripcion="Describe con claridad el enfoque metodológico y su coherencia." stateKey="q9" />
          <FilaRubrica num="9" titulo="Conclusiones" descripcion="Coherentes con los objetivos y resultados esperados y se proponen ideas de avance." stateKey="q10" />
        </div>

        {/* SECCIÓN 3: COMENTARIOS */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">10. Tiene algún comentario sobre la/el/los estudiantes, la exposición o el poster:</label>
          <textarea name="comentarios" rows="4" value={formData.comentarios} onChange={handleGeneralChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 outline-none resize-none" placeholder="Escriba sus observaciones aquí..."></textarea>
        </div>

        <button type="submit" disabled={cargando} className="w-full py-4 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-bold text-lg shadow-lg transition-colors disabled:opacity-50 mt-4">
          {cargando ? 'Guardando...' : 'Enviar Evaluación'}
        </button>

        <p className="text-center text-xs text-gray-500 mt-8">
          Este Control de Registro cumple con la política de tratamiento de datos de ACOFI que puede ser consultada <a href="https://www.acofi.edu.co/la-asociacion/politica-sobre-proteccion-de-datos/" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">AQUÍ</a>.
        </p>
      </form>
    </div>
  );
}

export default EvaluationPage;