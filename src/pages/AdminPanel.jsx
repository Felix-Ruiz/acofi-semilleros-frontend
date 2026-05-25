import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = "https://acofi-backend.onrender.com";

function AdminPanel() {
  const [ponencias, setPonencias] = useState([]);
  const [evaluadores, setEvaluadores] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [vistaActual, setVistaActual] = useState('ponencias');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalModo, setModalModo] = useState('crear');
  const [modalEntidad, setModalEntidad] = useState('ponencia');
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, entidad: '', id: null });

  const [formPonencia, setFormPonencia] = useState({ titulo: '', estudiante_nombre: '', estudiante_documento: '', estudiante_institucion: '', estudiante_correo: '', estudiante_ciudad: '', estudiante_cargo: '' });
  const [formEvaluador, setFormEvaluador] = useState({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', cargo: '', evento_id: '1' });

  // URL dinámica que detecta si estás en local o Vercel automáticamente
  const urlRegistroEvaluador = `${window.location.origin}/registro-evaluador`;

  const ciudadesColombia = ['Arauca', 'Armenia', 'Barranquilla', 'Bogotá D.C.', 'Bucaramanga', 'Cali', 'Cartagena de Indias', 'Cúcuta', 'Florencia', 'Ibagué', 'Inírida', 'Leticia', 'Manizales', 'Medellín', 'Mitú', 'Mocoa', 'Montería', 'Neiva', 'Pasto', 'Pereira', 'Popayán', 'Puerto Carreño', 'Quibdó', 'Riohacha', 'San Andrés', 'San José del Guaviare', 'Santa Marta', 'Sincelejo', 'Tunja', 'Valledupar', 'Villavicencio', 'Yopal'];
  const eventosDisponibles = [{ id: 1, nombre: "Barranquilla, Atlántico" }, { id: 2, nombre: "Bogotá, Distrito Capital" }, { id: 3, nombre: "Pereira, Risaralda" }];

  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (vistaActual === 'ponencias') {
        const res = await axios.get(`${API_URL}/api/admin/ponencias`);
        setPonencias(res.data);
      } else if (vistaActual === 'evaluadores') {
        const res = await axios.get(`${API_URL}/api/admin/evaluadores`);
        setEvaluadores(res.data);
      } else if (vistaActual === 'ranking') {
        const res = await axios.get(`${API_URL}/api/admin/ranking`);
        setRanking(res.data);
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los datos del servidor.' });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (vistaActual !== 'qr') cargarDatos();
    else setCargando(false);
  }, [vistaActual]);

  const aprobarPonencia = async (id) => {
    try {
      const respuesta = await axios.post(`${API_URL}/api/admin/aceptar_ponencia/${id}`);
      setMensaje({ tipo: 'exito', texto: `¡Ponencia aprobada! Código asignado: ${respuesta.data.codigo_asignado}` });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al aprobar la ponencia' });
    }
  };

  const solicitarEliminacion = (entidad, id) => {
    setModalConfirmacion({ abierto: true, entidad, id });
  };

  const confirmarEliminacion = async () => {
    const { entidad, id } = modalConfirmacion;
    setModalConfirmacion({ abierto: false, entidad: '', id: null });
    setMensaje({ tipo: '', texto: '' });
    
    try {
      await axios.delete(`${API_URL}/api/admin/${entidad}/${id}`);
      setMensaje({ tipo: 'exito', texto: 'Registro eliminado con éxito.' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al eliminar el registro.' });
    }
  };

  const abrirCrearModal = (entidad) => {
    setModalModo('crear');
    setModalEntidad(entidad);
    setIdSeleccionado(null);
    if (entidad === 'ponencia') {
      setFormPonencia({ titulo: '', estudiante_nombre: '', estudiante_documento: '', estudiante_institucion: '', estudiante_correo: '', estudiante_ciudad: '', estudiante_cargo: '' });
    } else {
      setFormEvaluador({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', cargo: '', evento_id: '1' });
    }
    setModalAbierto(true);
  };

  const abrirEditarModal = (entidad, item) => {
    setModalModo('editar');
    setModalEntidad(entidad);
    setIdSeleccionado(item.id);
    if (entidad === 'ponencia') {
      setFormPonencia({
        titulo: item.titulo,
        estudiante_nombre: item.estudiante_nombre,
        estudiante_documento: item.estudiante_documento,
        estudiante_institucion: item.estudiante_institucion,
        estudiante_correo: item.estudiante_correo,
        estudiante_ciudad: item.estudiante_ciudad,
        estudiante_cargo: item.estudiante_cargo
      });
    } else {
      setFormEvaluador({
        nombres_apellidos: item.nombres_apellidos,
        documento_identidad: item.documento_identidad,
        institucion: item.institucion,
        correo: item.correo,
        cargo: item.cargo,
        evento_id: String(item.evento_id)
      });
    }
    setModalAbierto(true);
  };

  const guardarModal = async (e) => {
    e.preventDefault();
    const urlBase = `${API_URL}/api/admin/${modalEntidad === 'ponencia' ? 'ponencias' : 'evaluadores'}`;
    const payload = modalEntidad === 'ponencia' ? formPonencia : formEvaluador;

    try {
      if (modalModo === 'crear') {
        await axios.post(urlBase, payload);
        setMensaje({ tipo: 'exito', texto: 'Registro creado exitosamente.' });
      } else {
        await axios.put(`${urlBase}/${idSeleccionado}`, payload);
        setMensaje({ tipo: 'exito', texto: 'Registro actualizado con éxito.' });
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'Ocurrió un error en la operación.' });
    }
  };

  const descargarExcel = (entidad) => {
    window.open(`${API_URL}/api/admin/exportar/${entidad}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto bg-white p-4 md:p-10 rounded-2xl shadow-xl border border-gray-100 w-full overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left">Panel de Administración</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => descargarExcel('estudiantes')} className="px-3 py-2 bg-green-600 text-white text-xs md:text-sm rounded-lg hover:bg-green-700 font-medium transition-colors">Excel Estudiantes</button>
          <button onClick={() => descargarExcel('evaluadores')} className="px-3 py-2 bg-green-600 text-white text-xs md:text-sm rounded-lg hover:bg-green-700 font-medium transition-colors">Excel Evaluadores</button>
          <button onClick={() => descargarExcel('ponencias')} className="px-3 py-2 bg-green-600 text-white text-xs md:text-sm rounded-lg hover:bg-green-700 font-medium transition-colors">Excel Ponencias</button>
          <button onClick={() => descargarExcel('evaluaciones')} className="px-3 py-2 bg-blue-700 text-white text-xs md:text-sm rounded-lg hover:bg-blue-800 font-bold transition-colors">Resultados Excel</button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`p-4 mb-6 rounded-lg font-medium text-center text-sm md:text-base ${mensaje.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{mensaje.texto}</div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 border-b pb-4">
        <div className="flex flex-wrap gap-2 justify-center w-full lg:w-auto">
          <button onClick={() => setVistaActual('ponencias')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'ponencias' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ponencias</button>
          <button onClick={() => setVistaActual('evaluadores')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'evaluadores' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Evaluadores</button>
          <button onClick={() => setVistaActual('ranking')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'ranking' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ranking</button>
          <button onClick={() => setVistaActual('qr')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'qr' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>QR Evaluadores</button>
        </div>

        {vistaActual === 'ponencias' && (
          <button onClick={() => abrirCrearModal('ponencia')} className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 shadow-md transition-colors text-sm w-full lg:w-auto">+ Añadir Ponencia</button>
        )}
        {vistaActual === 'evaluadores' && (
          <button onClick={() => abrirCrearModal('evaluador')} className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 shadow-md transition-colors text-sm w-full lg:w-auto">+ Añadir Evaluador</button>
        )}
      </div>

      {cargando ? (
        <div className="text-center py-12">
          <p className="text-blue-900 font-bold text-lg mb-2 animate-pulse">Conectando con la base de datos...</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">(Si es la primera vez que entra hoy, el servidor gratuito puede tardar hasta 50 segundos en despertar. Por favor, espere).</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto pb-4">
          
          {vistaActual === 'ponencias' && (
            ponencias.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200"><p className="text-gray-500 text-lg">Aún no hay ponencias.</p></div>
            ) : (
              <table className="w-full text-left border-collapse min-w-200">
                <thead>
                  <tr className="bg-blue-950 text-white text-sm">
                    <th className="p-4 font-semibold rounded-tl-xl w-1/3">Trabajo</th>
                    <th className="p-4 font-semibold w-1/4">Estudiante / Institución</th>
                    <th className="p-4 font-semibold w-1/6">Estado</th>
                    <th className="p-4 font-semibold w-1/6">Código / QR</th>
                    <th className="p-4 font-semibold text-center rounded-tr-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ponencias.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                      <td className="p-4"><p className="font-semibold text-gray-800">{p.titulo}</p></td>
                      <td className="p-4"><p className="text-gray-800 font-medium">{p.estudiante_nombre}</p><p className="text-xs text-gray-500">{p.estudiante_institucion}</p></td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.estado}</span></td>
                      <td className="p-4">
                        {p.codigo ? (
                          <div className="flex flex-col items-start">
                            <span className="font-mono bg-gray-200 px-2 py-1 rounded text-gray-800 font-bold block mb-1 text-center">{p.codigo}</span>
                            <a href={`${API_URL}${p.url_qr}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">Ver Código QR</a>
                          </div>
                        ) : <span className="text-gray-400 italic text-xs">Sin asignar</span>}
                      </td>
                      <td className="p-4 text-center space-y-1">
                        {p.estado === 'pendiente' && (
                          <button onClick={() => aprobarPonencia(p.id)} className="block w-full px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium transition-colors">Aprobar</button>
                        )}
                        <button onClick={() => abrirEditarModal('ponencia', p)} className="block w-full px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium transition-colors hover:bg-gray-200">Editar</button>
                        <button onClick={() => solicitarEliminacion('ponencias', p.id)} className="block w-full px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium transition-colors hover:bg-red-100">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {vistaActual === 'evaluadores' && (
            evaluadores.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200"><p className="text-gray-500 text-lg">Aún no hay evaluadores.</p></div>
            ) : (
              <table className="w-full text-left border-collapse min-w-200">
                <thead>
                  <tr className="bg-blue-950 text-white text-sm">
                    <th className="p-4 font-semibold rounded-tl-xl w-1/3">Nombre del Evaluador</th>
                    <th className="p-4 font-semibold">Documento</th>
                    <th className="p-4 font-semibold w-1/3">Institución / Cargo</th>
                    <th className="p-4 font-semibold text-center rounded-tr-xl">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {evaluadores.map((e) => (
                    <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                      <td className="p-4"><p className="font-semibold text-gray-800">{e.nombres_apellidos}</p><p className="text-xs text-gray-500">{e.correo}</p></td>
                      <td className="p-4 text-gray-700 font-mono">{e.documento_identidad}</td>
                      <td className="p-4"><p className="text-gray-800 font-medium">{e.institucion}</p><p className="text-xs text-gray-500">{e.cargo} | <span className="italic text-blue-900">{e.evento.split(',')[0]}</span></p></td>
                      <td className="p-4 text-center space-y-1">
                        <button onClick={() => abrirEditarModal('evaluador', e)} className="block w-full px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium transition-colors hover:bg-gray-200">Editar</button>
                        <button onClick={() => solicitarEliminacion('evaluadores', e.id)} className="block w-full px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium transition-colors hover:bg-red-100">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {vistaActual === 'ranking' && (
            ranking.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200"><p className="text-gray-500 text-lg">Sin datos para rankear.</p></div>
            ) : (
              <table className="w-full text-left border-collapse min-w-175">
                <thead>
                  <tr className="bg-amber-600 text-white text-sm">
                    <th className="p-4 font-semibold rounded-tl-xl text-center">Puesto</th>
                    <th className="p-4 font-semibold">Trabajo y Estudiante</th>
                    <th className="p-4 font-semibold text-center">Evaluaciones</th>
                    <th className="p-4 font-semibold text-center rounded-tr-xl">Promedio General</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((item, idx) => (
                    <tr key={item.id} className={`border-b border-gray-200 text-sm ${idx === 0 ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                      <td className="p-4 text-center font-bold text-gray-700 text-lg">{idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}</td>
                      <td className="p-4"><p className="font-semibold text-gray-800">{item.titulo}</p><p className="text-xs text-gray-500 mt-1">Por: {item.estudiante_nombre} | Código: <span className="font-mono bg-gray-200 px-1 rounded">{item.codigo}</span></p></td>
                      <td className="p-4 text-center font-medium text-gray-700">{item.num_evaluaciones} / 2</td>
                      <td className="p-4 text-center"><span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold border border-amber-200">{item.promedio} pts</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {vistaActual === 'qr' && (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-xl border border-gray-200 w-full min-w-full">
              <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4 text-center">Registro de Evaluadores</h3>
              <p className="text-gray-500 text-sm mb-6 text-center">Muestre este QR en la mesa principal para registrar a los jurados.</p>
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-200 mb-6 flex justify-center">
                <QRCodeSVG value={urlRegistroEvaluador} size={200} level="H" />
              </div>
              <p className="text-xs text-gray-500 font-mono bg-white px-3 py-2 rounded border border-gray-200 text-center break-all w-full max-w-md">{urlRegistroEvaluador}</p>
            </div>
          )}

        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {modalConfirmacion.abierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border-t-4 border-red-600 animate-fadeIn text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción es irreversible. Se borrarán permanentemente sus datos y todas las evaluaciones asociadas a este registro.
            </p>
            <div className="flex flex-col md:flex-row justify-center gap-3">
              <button onClick={() => setModalConfirmacion({ abierto: false, entidad: '', id: null })} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors w-full md:w-auto">Cancelar</button>
              <button onClick={confirmarEliminacion} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold shadow-md transition-colors w-full md:w-auto">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FLOTANTE DE FORMULARIO (CREATE / EDIT) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 border animate-fadeIn max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-2 capitalize">{modalModo} {modalEntidad === 'ponencia' ? 'Ponencia y Estudiante' : 'Evaluador'}</h3>
            <p className="text-gray-500 text-sm mb-6">Complete todos los datos requeridos corporativos.</p>
            
            <form onSubmit={guardarModal} className="space-y-4">
              {modalEntidad === 'ponencia' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Título del Trabajo / Póster</label>
                    <input type="text" required value={formPonencia.titulo} onChange={(e) => setFormPonencia({...formPonencia, titulo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombre del Estudiante</label>
                      <input type="text" required value={formPonencia.estudiante_nombre} onChange={(e) => setFormPonencia({...formPonencia, estudiante_nombre: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cédula / Identidad</label>
                      <input type="text" required value={formPonencia.estudiante_documento} onChange={(e) => setFormPonencia({...formPonencia, estudiante_documento: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Universidad / Institución</label>
                      <input type="text" required value={formPonencia.estudiante_institucion} onChange={(e) => setFormPonencia({...formPonencia, estudiante_institucion: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Correo Electrónico</label>
                      <input type="email" required value={formPonencia.estudiante_correo} onChange={(e) => setFormPonencia({...formPonencia, estudiante_correo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Ciudad Sede</label>
                      <select required value={formPonencia.estudiante_ciudad} onChange={(e) => setFormPonencia({...formPonencia, estudiante_ciudad: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm bg-white">
                        <option value="">Seleccione ciudad</option>
                        {ciudadesColombia.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cargo Rol</label>
                      <select required value={formPonencia.estudiante_cargo} onChange={(e) => setFormPonencia({...formPonencia, estudiante_cargo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm bg-white">
                        <option value="">Seleccione cargo</option>
                        <option value="Lider de semillero">Lider de semillero</option>
                        <option value="Estudiante 1">Estudiante 1</option>
                        <option value="Estudiante 2">Estudiante 2</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombres del Evaluador</label>
                      <input type="text" required value={formEvaluador.nombres_apellidos} onChange={(e) => setFormEvaluador({...formEvaluador, nombres_apellidos: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Documento Cédula</label>
                      <input type="text" required value={formEvaluador.documento_identidad} onChange={(e) => setFormEvaluador({...formEvaluador, documento_identidad: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Institución de Procedencia</label>
                      <input type="text" required value={formEvaluador.institucion} onChange={(e) => setFormEvaluador({...formEvaluador, institucion: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Correo de Contacto</label>
                      <input type="email" required value={formEvaluador.correo} onChange={(e) => setFormEvaluador({...formEvaluador, correo: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cargo Académico</label>
                      <input type="text" required value={formEvaluador.cargo} onChange={(e) => setFormEvaluador({...formEvaluador, cargo: e.target.value})} placeholder="Ej: Docente" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Evento Sede Encuentro</label>
                      <select value={formEvaluador.evento_id} onChange={(e) => setFormEvaluador({...formEvaluador, evento_id: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm bg-white">
                        {eventosDisponibles.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-sm transition-colors w-full md:w-auto">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-900 text-white rounded-lg hover:bg-blue-800 font-bold text-sm shadow-md transition-colors w-full md:w-auto">Guardar Información</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;