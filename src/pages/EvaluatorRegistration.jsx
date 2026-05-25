import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// URL base de producción
const API_URL = "https://acofi-backend.onrender.com";

function EvaluatorRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombres_apellidos: '',
    documento_identidad: '',
    institucion: '',
    correo: '',
    cargo: '',
    evento_id: ''
  });

  const [eventos, setEventos] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  // Cargar los eventos/ciudades desde el backend al abrir la página
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const respuesta = await axios.get(`${API_URL}/api/eventos/`);
        setEventos(respuesta.data);
      } catch (error) {
        console.error("Error al cargar eventos", error);
      }
    };
    cargarEventos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const respuesta = await axios.post(`${API_URL}/api/evaluadores/registro`, formData);
      setMensaje({ tipo: 'exito', texto: respuesta.data.mensaje });
      
      setFormData({
        nombres_apellidos: '',
        documento_identidad: '',
        institucion: '',
        correo: '',
        cargo: '',
        evento_id: ''
      });

      setTimeout(() => {
        navigate('/');
      }, 3500);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al procesar el registro.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-3xl font-bold text-blue-950 mb-2 text-center">Registro de Evaluadores</h2>
      <p className="text-gray-500 text-center mb-8">Complete sus datos para habilitarse como evaluador del semillero</p>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg font-medium text-center ${
          mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombres y Apellidos</label>
          <input
            type="text"
            name="nombres_apellidos"
            required
            value={formData.nombres_apellidos}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            placeholder="Ej: María Gómez"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Documento de Identidad</label>
          <input
            type="text"
            name="documento_identidad"
            required
            value={formData.documento_identidad}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            placeholder="Cédula de Ciudadanía"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Institución</label>
          <input
            type="text"
            name="institucion"
            required
            value={formData.institucion}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            placeholder="Universidad o Entidad"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico</label>
          <input
            type="email"
            name="correo"
            required
            value={formData.correo}
            onChange={handleChange}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo</label>
            <input
              type="text"
              name="cargo"
              required
              value={formData.cargo}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
              placeholder="Ej: Docente Investigador"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">¿En qué ciudad participará?</label>
            <select
              name="evento_id"
              required
              value={formData.evento_id}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all"
            >
              <option value="">Seleccione el evento</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre} | {evento.fecha}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-1/3 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="w-2/3 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-semibold shadow-lg transition-colors text-center disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Registrarme como Evaluador'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EvaluatorRegistration;