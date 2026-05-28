import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "https://acofi-backend.onrender.com";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ documento: '', pin: '', correo: '', password: '' });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);
  const [esAdmin, setEsAdmin] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const respuesta = await axios.post(`${API_URL}/api/login`, formData);
      
      // Guardamos la sesión
      localStorage.setItem('usuario_logueado', 'true');
      localStorage.setItem('usuario_nombre', respuesta.data.nombre);
      localStorage.setItem('usuario_tipo', respuesta.data.tipo_usuario);
      localStorage.setItem('usuario_id', respuesta.data.id); 
      localStorage.setItem('usuario_documento', formData.documento || ''); 
      localStorage.setItem('usuario_correo', respuesta.data.correo || ''); 
      
      // Rescatamos el ticket del QR si existe
      const qrPendiente = localStorage.getItem('url_post_login');

      if (qrPendiente) {
        localStorage.removeItem('url_post_login');
        navigate(qrPendiente); // Redirección nativa y suave al QR
      } else if (respuesta.data.tipo_usuario === 'admin') {
        navigate('/admin'); // Redirección nativa y suave al Panel de Admin
      } else if (respuesta.data.tipo_usuario === 'estudiante') {
        navigate('/mi-ponencia');
      } else {
        navigate('/escanear'); 
      }
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: error.response?.data?.error || 'Error de conexión. Intente nuevamente.' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center mt-10">
      <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-blue-950 mb-6">Acceso {esAdmin ? 'Administrador' : 'al Sistema'}</h2>
      
      <button type="button" onClick={() => setEsAdmin(!esAdmin)} className="text-xs text-blue-600 hover:underline mb-6 font-semibold">
        {esAdmin ? '¿Eres evaluador o estudiante?' : '¿Eres administrador del evento?'}
      </button>

      {mensaje.texto && (
        <div className={`w-full p-4 mb-6 rounded-lg font-medium text-center text-sm ${
          mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {esAdmin ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" name="correo" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
              <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Documento</label>
              <input type="text" name="documento" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" placeholder="Ej: 1023456789" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">PIN de Acceso</label>
              <input type="password" name="pin" required onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none tracking-widest text-lg font-mono" placeholder="••••" maxLength="4" />
            </div>
          </>
        )}
        <button type="submit" disabled={cargando} className="w-full py-3.5 bg-blue-900 text-white rounded-xl hover:bg-blue-800 font-bold shadow-md transition-colors disabled:opacity-50 mt-4">
          {cargando ? 'Verificando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;