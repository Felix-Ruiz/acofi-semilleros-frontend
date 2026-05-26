import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = "https://acofi-backend.onrender.com";

function AdminLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ correo: '', password: '' });
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      const respuesta = await axios.post(`${API_URL}/api/login`, formData);
      
      // Guardamos credenciales específicas de administrador
      localStorage.setItem('admin_logueado', 'true');
      localStorage.setItem('usuario_nombre', respuesta.data.nombre);
      
      navigate('/admin'); // Redirección directa al panel de gestión
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        value: error.response?.data?.error || 'Credenciales de administrador incorrectas.' 
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center mt-10">
      <div className="w-16 h-16 bg-gray-100 text-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-200">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 text-center">Mesa de Control</h2>
      <p className="text-gray-500 text-center mb-8 text-sm">
        Área exclusiva para el personal administrativo y TI de ACOFI.
      </p>

      {mensaje.value && (
        <div className="w-full p-4 mb-6 rounded-lg font-medium text-center text-sm bg-red-50 text-red-700 border border-red-200">
          {mensaje.value}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Correo Institucional</label>
          <input 
            type="email" 
            name="correo" 
            required 
            value={formData.correo} 
            onChange={handleChange} 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            placeholder="ejemplo@acofi.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña de Seguridad</label>
          <input 
            type="password" 
            name="password" 
            required 
            value={formData.password} 
            onChange={handleChange} 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-800 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando} 
          className="w-full py-3.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 font-bold shadow-md transition-colors disabled:opacity-50 mt-4"
        >
          {cargando ? 'Validando Firma...' : 'Ingresar al Panel'}
        </button>
      </form>
    </div>
  );
}

export default AdminLoginPage;