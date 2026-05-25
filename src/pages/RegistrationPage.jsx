import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// URL base de producción
const API_URL = "https://acofi-backend.onrender.com";

function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombres_apellidos: '',
    documento_identidad: '',
    institucion: '',
    correo: '',
    ciudad_seleccionada: '',
    ciudad_otra: '',
    cargo: '',
    nombre_trabajo: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  // Lista actualizada con todas las ciudades proporcionadas
  const ciudadesColombia = [
    'Arauca', 'Armenia', 'Barranquilla', 'Bogotá D.C.', 'Bucaramanga', 
    'Cali', 'Cartagena de Indias', 'Cúcuta', 'Florencia', 'Ibagué', 
    'Inírida', 'Leticia', 'Manizales', 'Medellín', 'Mitú', 
    'Mocoa', 'Montería', 'Neiva', 'Pasto', 'Pereira', 
    'Popayán', 'Puerto Carreño', 'Quibdó', 'Riohacha', 'San Andrés', 
    'San José del Guaviare', 'Santa Marta', 'Sincelejo', 'Tunja', 
    'Valledupar', 'Villavicencio', 'Yopal'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    // Determinar el valor final de la ciudad
    const ciudadFinal = formData.ciudad_seleccionada === 'Otra' 
      ? formData.ciudad_otra 
      : formData.ciudad_seleccionada;

    if (!ciudadFinal) {
      setMensaje({ tipo: 'error', texto: 'Por favor, seleccione o escriba una ciudad.' });
      setCargando(false);
      return;
    }

    const datosParaEnviar = {
      nombres_apellidos: formData.nombres_apellidos,
      documento_identidad: formData.documento_identidad,
      institucion: formData.institucion,
      correo: formData.correo,
      ciudad: ciudadFinal,
      cargo: formData.cargo,
      nombre_trabajo: formData.nombre_trabajo
    };

    try {
      const respuesta = await axios.post(`${API_URL}/api/estudiantes/registro`, datosParaEnviar);
      setMensaje({ tipo: 'exito', texto: respuesta.data.mensaje });
      
      // Limpiar formulario
      setFormData({
        nombres_apellidos: '',
        documento_identidad: '',
        institucion: '',
        correo: '',
        ciudad_seleccionada: '',
        ciudad_otra: '',
        cargo: '',
        nombre_trabajo: ''
      });

      // Redirigir al inicio después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3500);

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ocurrió un error al procesar la inscripción.';
      setMensaje({ tipo: 'error', texto: errorMsg });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 md:p-10 rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl md:text-3xl font-bold text-blue-950 mb-2 text-center">Formulario de asistencia</h2>
      <p className="text-gray-500 text-center mb-8 text-sm md:text-base px-2">I Encuentro Regional de Investigación e Innovación en Ingeniería ACOFI 2026</p>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg font-medium text-center text-sm md:text-base ${
          mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombres y Apellidos</label>
          <input
            type="text"
            name="nombres_apellidos"
            required
            value={formData.nombres_apellidos}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Documento de Identidad</label>
          <input
            type="text"
            name="documento_identidad"
            required
            value={formData.documento_identidad}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            placeholder="Cédula o Tarjeta de Identidad"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Institución</label>
          <input
            type="text"
            name="institucion"
            required
            value={formData.institucion}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            placeholder="Nombre de la Universidad o Institución"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
          <input
            type="email"
            name="correo"
            required
            value={formData.correo}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad</label>
            <select
              name="ciudad_seleccionada"
              required
              value={formData.ciudad_seleccionada}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            >
              <option value="">Seleccione una ciudad</option>
              {ciudadesColombia.map((ciudad) => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
              <option value="Otra">Otra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cargo</label>
            <select
              name="cargo"
              required
              value={formData.cargo}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
            >
              <option value="">Seleccione su cargo</option>
              <option value="Lider de semillero">Lider de semillero</option>
              <option value="Estudiante 1">Estudiante 1</option>
              <option value="Estudiante 2">Estudiante 2</option>
            </select>
          </div>
        </div>

        {formData.ciudad_seleccionada === 'Otra' && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Escriba el nombre de la Ciudad</label>
            <input
              type="text"
              name="ciudad_otra"
              required={formData.ciudad_seleccionada === 'Otra'}
              value={formData.ciudad_otra}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all text-sm md:text-base"
              placeholder="¿Qué ciudad?"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del trabajo que representa</label>
          <textarea
            name="nombre_trabajo"
            required
            rows="3"
            value={formData.nombre_trabajo}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-900 focus:border-transparent outline-none transition-all resize-none text-sm md:text-base"
            placeholder="Debe ser el mismo enviado en la carta de notificación de la tercera fase"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full md:w-1/3 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors text-center text-sm md:text-base"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={cargando}
            className="w-full md:w-2/3 px-4 py-3 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-semibold shadow-lg transition-colors text-center disabled:opacity-50 text-sm md:text-base"
          >
            {cargando ? 'Registrando...' : 'Enviar Inscripción'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrationPage;