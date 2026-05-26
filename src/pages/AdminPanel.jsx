import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = "https://acofi-backend.onrender.com";

function AdminPanel() {
  const [ponencias, setPonencias] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [evaluadores, setEvaluadores] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [vistaActual, setVistaActual] = useState('ponencias');
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [filtroPonencias, setFiltroPonencias] = useState('');
  const [filtroEvaluadores, setFiltroEvaluadores] = useState('');
  const [filtroEstudiantes, setFiltroEstudiantes] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  
  const [registroAbierto, setRegistroAbierto] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalModo, setModalModo] = useState('crear');
  const [modalEntidad, setModalEntidad] = useState('ponencia');
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, entidad: '', id: null });

  const [formPonencia, setFormPonencia] = useState({ titulo: '', estudiante_nombre: '', estudiante_documento: '', estudiante_institucion: '', estudiante_correo: '', estudiante_ciudad: '', estudiante_cargo: '' });
  const [formEvaluador, setFormEvaluador] = useState({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', cargo: '', evento_id: '1' });
  
  // NUEVO: Formulario exclusivo para estudiantes individuales
  const [formEstudiante, setFormEstudiante] = useState({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', ciudad: '', cargo: '', nombre_trabajo: '' });

  const urlRegistroEvaluador = `${window.location.origin}/registro-evaluador`;
  const ciudadesColombia = ['Arauca', 'Armenia', 'Barranquilla', 'Bogotá D.C.', 'Bucaramanga', 'Cali', 'Cartagena de Indias', 'Cúcuta', 'Florencia', 'Ibagué', 'Inírida', 'Leticia', 'Manizales', 'Medellín', 'Mitú', 'Mocoa', 'Montería', 'Neiva', 'Pasto', 'Pereira', 'Popayán', 'Puerto Carreño', 'Quibdó', 'Riohacha', 'San Andrés', 'San José del Guaviare', 'Santa Marta', 'Sincelejo', 'Tunja', 'Valledupar', 'Villavicencio', 'Yopal'];
  const eventosDisponibles = [{ id: 1, nombre: "Barranquilla, Atlántico" }, { id: 2, nombre: "Bogotá, Distrito Capital" }, { id: 3, nombre: "Pereira, Risaralda" }];

  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (vistaActual === 'ponencias') {
        const res = await axios.get(`${API_URL}/api/admin/ponencias`);
        setPonencias(res.data);
        const configRes = await axios.get(`${API_URL}/api/admin/configuracion`);
        setRegistroAbierto(configRes.data.registro_abierto);
      } else if (vistaActual === 'estudiantes') {
        const res = await axios.get(`${API_URL}/api/admin/estudiantes`);
        setEstudiantes(res.data);
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

  const toggleInscripciones = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/configuracion/toggle`);
      setRegistroAbierto(res.data.registro_abierto);
      setMensaje({ tipo: 'exito', texto: res.data.mensaje });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cambiar el estado de inscripciones.' });
    }
  };

  const borrarTodos = async (entidad) => {
    const confirmacion = window.confirm(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\n¿Estás absolutamente seguro de que deseas eliminar TODOS los registros de ${entidad.toUpperCase()}?\n\nEsta acción borrará recursos físicos de Cloudinary. NO SE PUEDE DESHACER.`);
    if (!confirmacion) return;
    
    const confirmacion2 = window.prompt(`Para confirmar, escribe exactamente la palabra "ELIMINAR"`);
    if (confirmacion2 !== "ELIMINAR") {
        setMensaje({ tipo: 'error', texto: 'Operación cancelada.' });
        return;
    }

    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: `Vaciando registros masivos...` });
    try {
      await axios.delete(`${API_URL}/api/admin/borrar_todos/${entidad}`);
      setMensaje({ tipo: 'exito', texto: `Se han eliminado todos los registros correctamente.` });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al ejecutar vaciado masivo.' });
    } finally {
      setProcesandoAccion(false);
    }
  };

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
      setMensaje({ tipo: 'error', texto: 'Error al procesar eliminación.' });
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

  // NUEVO: Soporte extendido para editar estudiantes individuales
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
    } else if (entidad === 'estudiante') {
      setFormEstudiante({
        nombres_apellidos: item.nombres_apellidos,
        documento_identidad: item.documento_identidad,
        institucion: item.institucion,
        correo: item.correo,
        ciudad: item.ciudad,
        cargo: item.cargo,
        nombre_trabajo: item.nombre_trabajo
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
    let urlBase = `${API_URL}/api/admin/ponencias`;
    let payload = formPonencia;

    if (modalEntidad === 'evaluador') {
      urlBase = `${API_URL}/api/admin/evaluadores`;
      payload = formEvaluador;
    } else if (modalEntidad === 'estudiante') {
      urlBase = `${API_URL}/api/admin/estudiantes`;
      payload = formEstudiante;
    }

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

  const cargarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: 'Procesando archivo, validando códigos... Por favor espere.' });
    try {
      await axios.post(`${API_URL}/api/admin/cargar_excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensaje({ tipo: 'exito', texto: 'Excel cargado y grupos procesados correctamente.' });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'Error al cargar Excel' });
    } finally {
      setProcesandoAccion(false);
      e.target.value = null;
    }
  };

  const enviarCorreos = async (id_ponencia = null) => {
    const confirmacion = window.confirm(id_ponencia ? "¿Enviar correo a los integrantes de este grupo?" : "¿Está seguro de enviar masivamente los QRs a TODOS los estudiantes aprobados?");
    if (!confirmacion) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: 'Enviando correos, por favor espere...' });
    try {
      const payload = id_ponencia ? { id_ponencia } : {};
      const res = await axios.post(`${API_URL}/api/admin/enviar_qrs`, payload);
      setMensaje({ tipo: 'exito', texto: res.data.mensaje });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error al enviar los correos.' });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // NUEVO: Envío individual a un integrante aislado desde la pestaña de Estudiantes
  const enviarCorreoIndividualEstudiante = async (id) => {
    const confirmacion = window.confirm("¿Enviar credencial digital (QR + PIN) de manera exclusiva a este estudiante?");
    if (!confirmacion) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: 'Despachando correo individual a Brevo...' });
    try {
      const res = await axios.post(`${API_URL}/api/admin/enviar_qr_estudiante/${id}`);
      setMensaje({ tipo: 'exito', texto: res.data.mensaje });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'No se pudo despachar el correo.' });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const ponenciasMostradas = ponencias.filter(p => 
    p.titulo.toLowerCase().includes(filtroPonencias.toLowerCase()) ||
    p.estudiante_nombre.toLowerCase().includes(filtroPonencias.toLowerCase()) ||
    (p.codigo && p.codigo.includes(filtroPonencias))
  );

  const evaluadoresMostrados = evaluadores.filter(e => 
    e.nombres_apellidos.toLowerCase().includes(filtroEvaluadores.toLowerCase()) ||
    e.documento_identidad.includes(filtroEvaluadores) ||
    e.correo.toLowerCase().includes(filtroEvaluadores.toLowerCase())
  );

  const estudiantesMostrados = estudiantes.filter(e => 
    e.nombres_apellidos.toLowerCase().includes(filtroEstudiantes.toLowerCase()) ||
    e.documento_identidad.includes(filtroEstudiantes) ||
    e.nombre_trabajo.toLowerCase().includes(filtroEstudiantes.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto bg-white p-4 md:p-10 rounded-2xl shadow-xl border border-gray-100 w-full overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b pb-4 gap-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center md:text-left">Panel de Administración</h2>
          <button 
            onClick={toggleInscripciones}
            className={`px-3 py-1 rounded-full font-bold text-xs shadow-xs transition-colors border ${
              registroAbierto 
                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
            }`}
          >
            Inscripciones Estudiantes: {registroAbierto ? '🟢 ABIERTAS' : '🔴 CERRADAS'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <label className={`px-3 py-2 text-white text-xs md:text-sm rounded-lg font-medium transition-colors cursor-pointer ${procesandoAccion ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
            {procesandoAccion ? 'Procesando...' : 'Subir Excel'}
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={cargarExcel} disabled={procesandoAccion} />
          </label>
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
          <button onClick={() => setVistaActual('ponencias')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'ponencias' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ponencias / Grupos</button>
          <button onClick={() => setVistaActual('estudiantes')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'estudiantes' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Estudiantes</button>
          <button onClick={() => setVistaActual('evaluadores')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'evaluadores' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Evaluadores</button>
          <button onClick={() => setVistaActual('ranking')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'ranking' ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ranking</button>
          <button onClick={() => setVistaActual('qr')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${vistaActual === 'qr' ? 'bg-blue-950 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>QR Evaluadores</button>
        </div>

        {vistaActual === 'ponencias' && (
          <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
            <input type="text" placeholder="Buscar título, integrante, código..." value={filtroPonencias} onChange={(e) => setFiltroPonencias(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-900" />
            <button onClick={() => enviarCorreos()} disabled={procesandoAccion} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-colors text-sm w-full md:w-auto whitespace-nowrap">✉️ Enviar Todos los QRs</button>
            <button onClick={() => borrarTodos('ponencias')} disabled={procesandoAccion} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition-colors text-sm w-full md:w-auto whitespace-nowrap">🗑️ Borrar Todo</button>
          </div>
        )}

        {vistaActual === 'estudiantes' && (
          <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
            <input type="text" placeholder="Buscar estudiante o documento..." value={filtroEstudiantes} onChange={(e) => setFiltroEstudiantes(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-900" />
          </div>
        )}

        {vistaActual === 'evaluadores' && (
          <div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
            <input type="text" placeholder="Buscar evaluador, documento, correo..." value={filtroEvaluadores} onChange={(e) => setFiltroEvaluadores(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-blue-900" />
            <button onClick={() => abrirCrearModal('evaluador')} className="px-4 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 shadow-md transition-colors text-sm w-full md:w-auto whitespace-nowrap">+ Añadir Evaluador</button>
            <button onClick={() => borrarTodos('evaluadores')} disabled={procesandoAccion} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition-colors text-sm w-full md:w-auto whitespace-nowrap">🗑️ Borrar Todo</button>
          </div>
        )}
      </div>

      {cargando ? (
        <div className="text-center py-12"><p className="text-blue-900 font-bold text-lg animate-pulse">Cargando datos del servidor...</p></div>
      ) : (
        <div className="w-full overflow-x-auto pb-4">
          
          {/* VISTA PONENCIAS */}
          {vistaActual === 'ponencias' && (
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-blue-950 text-white text-sm">
                  <th className="p-4 font-semibold rounded-tl-xl w-1/3">Trabajo</th>
                  <th className="p-4 font-semibold w-1/4">Integrantes / Institución</th>
                  <th className="p-4 font-semibold w-1/6">Estado</th>
                  <th className="p-4 font-semibold w-1/6">Código / QR</th>
                  <th className="p-4 font-semibold text-center rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ponenciasMostradas.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4"><p className="font-semibold text-gray-800">{p.titulo}</p></td>
                    <td className="p-4"><p className="text-gray-800 font-medium">{p.estudiante_nombre}</p><p className="text-xs text-gray-500 mt-1">{p.estudiante_institucion}</p></td>
                    <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{p.estado}</span></td>
                    <td className="p-4">{p.codigo ? ( <div className="flex flex-col items-start"><span className="font-mono bg-gray-200 px-2 py-1 rounded text-gray-800 font-bold block mb-1">{p.codigo}</span><a href={p.url_qr} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">Ver QR</a></div> ) : <span className="text-gray-400 italic text-xs">Sin asignar</span>}</td>
                    <td className="p-4 text-center space-y-1">
                      {p.estado === 'pendiente' && <button onClick={() => aprobarPonencia(p.id)} className="block w-full px-2 py-1.5 bg-blue-600 text-white rounded text-xs font-medium">Aprobar</button>}
                      {p.estado === 'aceptada' && ( <> <a href={`/evaluar/${p.codigo}`} target="_blank" rel="noopener noreferrer" className="block w-full px-2 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-medium text-center">📝 Evaluar</a> <button onClick={() => enviarCorreos(p.id)} disabled={procesandoAccion} className="block w-full px-2 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-medium">✉️ Grupo QR</button> </> )}
                      <button onClick={() => requestingEliminacion('ponencias', p.id)} className="block w-full px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* NUEVO: ACCIONES COMPLETAS EN LA VISTA ESTUDIANTES */}
          {vistaActual === 'estudiantes' && (
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-blue-950 text-white text-sm">
                  <th className="p-4 font-semibold rounded-tl-xl w-1/4">Nombre del Estudiante</th>
                  <th className="p-4 font-semibold">Documento / PIN</th>
                  <th className="p-4 font-semibold w-1/4">Institución / Rol</th>
                  <th className="p-4 font-semibold w-1/4">Proyecto al que Pertenece</th>
                  <th className="p-4 font-semibold text-center rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estudiantesMostrados.map((e) => (
                  <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4"><p className="font-semibold text-gray-800">{e.nombres_apellidos}</p><p className="text-xs text-gray-500">{e.correo}</p></td>
                    <td className="p-4"><span className="text-gray-700 font-mono block">{e.documento_identidad}</span><span className="block mt-1 text-xs font-bold text-blue-800 bg-blue-50 w-max px-2 py-0.5 rounded">PIN: {e.pin_acceso || 'N/A'}</span></td>
                    <td className="p-4"><p className="text-gray-800 font-medium">{e.institucion}</p><p className="text-xs text-gray-500">{e.cargo} | <span className="italic text-blue-900">{e.ciudad}</span></p></td>
                    <td className="p-4"><p className="text-xs font-medium text-gray-700">{e.nombre_trabajo}</p></td>
                    <td className="p-4 text-center space-y-1">
                      <button onClick={() => enviarCorreoIndividualEstudiante(e.id)} disabled={procesandoAccion} className="block w-full px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-xs font-medium hover:bg-indigo-100">✉️ Enviar QR</button>
                      <button onClick={() => abrirEditarModal('estudiante', e)} className="block w-full px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">Editar</button>
                      <button onClick={() => solicitarEliminacion('estudiantes', e.id)} className="block w-full px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-100">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* VISTA EVALUADORES */}
          {vistaActual === 'evaluadores' && (
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-blue-950 text-white text-sm">
                  <th className="p-4 font-semibold rounded-tl-xl w-1/3">Nombre del Evaluador</th>
                  <th className="p-4 font-semibold">Documento / PIN</th>
                  <th className="p-4 font-semibold w-1/3">Institución / Cargo</th>
                  <th className="p-4 font-semibold text-center rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evaluadoresMostrados.map((e) => (
                  <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4"><p className="font-semibold text-gray-800">{e.nombres_apellidos}</p><p className="text-xs text-gray-500">{e.correo}</p></td>
                    <td className="p-4"><span className="text-gray-700 font-mono block">{e.documento_identidad}</span><span className="block mt-1 text-xs font-bold text-blue-800 bg-blue-50 w-max px-2 py-0.5 rounded">PIN: {e.pin_acceso || 'N/A'}</span></td>
                    <td className="p-4"><p className="text-gray-800 font-medium">{e.institucion}</p><p className="text-xs text-gray-500">{e.cargo} | <span className="italic text-blue-900">{e.evento.split(',')[0]}</span></p></td>
                    <td className="p-4 text-center space-y-1">
                      <button onClick={() => abrirEditarModal('evaluador', e)} className="block w-full px-2 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">Editar</button>
                      <button onClick={() => solicitarEliminacion('evaluadores', e.id)} className="block w-full px-2 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-xs font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* RANKING */}
          {vistaActual === 'ranking' && (
            <table className="w-full text-left border-collapse min-w-175">
              <thead>
                <tr className="bg-amber-600 text-white text-sm">
                  <th className="p-4 font-semibold rounded-tl-xl text-center">Puesto</th>
                  <th className="p-4 font-semibold">Trabajo y Equipo</th>
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
          )}

          {vistaActual === 'qr' && (
            <div className="flex flex-col items-center justify-center py-10 px-4 bg-gray-50 rounded-xl border border-gray-200 w-full">
              <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-4 text-center">Registro de Evaluadores</h3>
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-gray-200 mb-6 flex justify-center">
                <QRCodeSVG value={urlRegistroEvaluador} size={200} level="H" />
              </div>
              <p className="text-xs text-gray-500 font-mono bg-white px-3 py-2 rounded border border-gray-200 text-center break-all w-full max-w-md">{urlRegistroEvaluador}</p>
            </div>
          )}

        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {modalConfirmacion.abierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border-t-4 border-red-600 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta acción borrará permanentemente sus datos técnicos.</p>
            <div className="flex flex-col md:flex-row justify-center gap-3">
              <button onClick={() => setModalConfirmacion({ abierto: false, entidad: '', id: null })} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold w-full md:w-auto">Cancelar</button>
              <button onClick={confirmarEliminacion} className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-md w-full md:w-auto">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR DINÁMICO EXTENDIDO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 border max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-6 capitalize">{modalModo} {modalEntidad}</h3>
            
            <form onSubmit={guardarModal} className="space-y-4">
              {modalEntidad === 'ponencia' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Título del Trabajo / Póster</label>
                    <input type="text" required value={formPonencia.titulo} onChange={(e) => setFormPonencia({...formPonencia, titulo: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombre del Estudiante</label>
                      <input type="text" required value={formPonencia.estudiante_nombre} onChange={(e) => setFormPonencia({...formPonencia, estudiante_nombre: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cédula</label>
                      <input type="text" required value={formPonencia.estudiante_documento} onChange={(e) => setFormPonencia({...formPonencia, estudiante_documento: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                </>
              )}

              {/* INTERFAZ INYECTADA PARA ESTUDIANTES INDIVIDUALES */}
              {modalEntidad === 'estudiante' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombre del Estudiante</label>
                      <input type="text" required value={formEstudiante.nombres_apellidos} onChange={(e) => setFormEstudiante({...formEstudiante, nombres_apellidos: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cédula / Documento</label>
                      <input type="text" required value={formEstudiante.documento_identidad} onChange={(e) => setFormEstudiante({...formEstudiante, documento_identidad: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Institución / Universidad</label>
                      <input type="text" required value={formEstudiante.institucion} onChange={(e) => setFormEstudiante({...formEstudiante, institucion: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Correo Electrónico</label>
                      <input type="email" required value={formEstudiante.correo} onChange={(e) => setFormEstudiante({...formEstudiante, correo: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Ciudad</label>
                      <select required value={formEstudiante.ciudad} onChange={(e) => setFormEstudiante({...formEstudiante, ciudad: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm bg-white">
                        {ciudadesColombia.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Cargo</label>
                      <select required value={formEstudiante.cargo} onChange={(e) => setFormEstudiante({...formEstudiante, cargo: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm bg-white">
                        <option value="Lider de semillero">Lider de semillero</option>
                        <option value="Estudiante 1">Estudiante 1</option>
                        <option value="Estudiante 2">Estudiante 2</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Asignar a Trabajo (Debe coincidir para agrupar QR)</label>
                    <textarea required rows="2" value={formEstudiante.nombre_trabajo} onChange={(e) => setFormEstudiante({...formEstudiante, nombre_trabajo: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm resize-none" />
                  </div>
                </>
              )}

              {modalEntidad === 'evaluador' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Nombre del Evaluador</label>
                      <input type="text" required value={formEvaluador.nombres_apellidos} onChange={(e) => setFormEvaluador({...formEvaluador, nombres_apellidos: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Documento</label>
                      <input type="text" required value={formEvaluador.documento_identidad} onChange={(e) => setFormEvaluador({...formEvaluador, documento_identidad: e.target.value})} className="w-full px-3 py-2 border rounded-lg outline-none text-sm" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 bg-blue-900 text-white rounded-lg text-sm font-bold shadow-md">Guardar Información</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;