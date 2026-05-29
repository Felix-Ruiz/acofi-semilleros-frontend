import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const API_URL = "https://acofi-backend.onrender.com";

function AdminPanel() {
  const [autorizado, setAutorizado] = useState(false);
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

  // Estados de Modales Clásicos
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalModo, setModalModo] = useState('crear');
  const [modalEntidad, setModalEntidad] = useState('ponencia');
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [modalConfirmacion, setModalConfirmacion] = useState({ abierto: false, entidad: '', id: null });

  // ⚠️ NUEVO: Estados para el Modal de Asignar Ponencias a Evaluadores
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false);
  const [evaluadorAAsignar, setEvaluadorAAsignar] = useState(null);
  const [ponenciasSeleccionadas, setPonenciasSeleccionadas] = useState([]);

  const [formPonencia, setFormPonencia] = useState({ titulo: '', estudiante_nombre: '', estudiante_documento: '', estudiante_institucion: '', estudiante_correo: '', estudiante_ciudad: '', estudiante_cargo: '' });
  const [formEvaluador, setFormEvaluador] = useState({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', cargo: '', evento_id: '1' });
  const [formEstudiante, setFormEstudiante] = useState({ nombres_apellidos: '', documento_identidad: '', institucion: '', correo: '', ciudad: '', cargo: '', nombre_trabajo: '' });

  const urlRegistroEvaluador = `${window.location.origin}/registro-evaluador`;
  const ciudadesColombia = ['Arauca', 'Armenia', 'Barranquilla', 'Bogotá D.C.', 'Bucaramanga', 'Cali', 'Cartagena de Indias', 'Cúcuta', 'Florencia', 'Ibagué', 'Inírida', 'Leticia', 'Manizales', 'Medellín', 'Mitú', 'Mocoa', 'Montería', 'Neiva', 'Pasto', 'Pereira', 'Popayán', 'Puerto Carreño', 'Quibdó', 'Riohacha', 'San Andrés', 'San José del Guaviare', 'Santa Marta', 'Sincelejo', 'Tunja', 'Valledupar', 'Villavicencio', 'Yopal'];
  const eventosDisponibles = [{ id: 1, nombre: "Barranquilla, Atlántico" }, { id: 2, nombre: "Bogotá, Distrito Capital" }, { id: 3, nombre: "Pereira, Risaralda" }];

  // ⚠️ SEGURIDAD: Expulsar si no es admin (soluciona la fuga de seguridad visual)
  useEffect(() => {
    if (localStorage.getItem('usuario_tipo') !== 'admin') {
      window.location.href = '/login'; 
      return;
    }
    setAutorizado(true);
    if (vistaActual !== 'qr') cargarDatos();
    else setCargando(false);
  }, [vistaActual]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      if (vistaActual === 'ponencias') {
        const res = await axios.get(`${API_URL}/api/admin/ponencias`);
        setPonencias(res.data);
        const configRes = await axios.get(`${API_URL}/api/admin/configuracion`);
        setRegistroAbierto(configRes.data.registro_abierto);
      } else if (vistaActual === 'estudiantes' || vistaActual === 'asistencia') {
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
    setMensaje({ tipo: '', texto: 'Aprobando ponencia y generando QR...' });
    try {
      const respuesta = await axios.post(`${API_URL}/api/admin/aceptar_ponencia/${id}`);
      setMensaje({ tipo: 'exito', texto: `¡Ponencia aprobada! Código asignado: ${respuesta.data.codigo_asignado}` });
      cargarDatos();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'Error al aprobar la ponencia' });
    }
  };

  const toggleAsistencia = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    setEstudiantes(estudiantes.map(e => e.id === id ? { ...e, asistencia: nuevoEstado } : e));
    try {
      await axios.put(`${API_URL}/api/admin/estudiantes/${id}/asistencia`, { asistencia: nuevoEstado });
    } catch (error) {
      setEstudiantes(estudiantes.map(e => e.id === id ? { ...e, asistencia: estadoActual } : e));
      setMensaje({ tipo: 'error', texto: 'Error al guardar la asistencia en la base de datos.' });
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
        const respuesta = await axios.post(urlBase, payload);
        const textoExito = respuesta.data.pin 
          ? `${respuesta.data.mensaje} | PIN DE ACCESO: ${respuesta.data.pin}` 
          : respuesta.data.mensaje || 'Registro creado exitosamente.';
        setMensaje({ tipo: 'exito', texto: textoExito });
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
    setMensaje({ tipo: '', texto: 'Procesando archivo masivo... Esto garantizará que se guarden todos los estudiantes sin omitir a ninguno.' });
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

  const enviarCorreoIndividualEstudiante = async (id) => {
    const confirmacion = window.confirm("¿Enviar credencial digital (QR + PIN) de manera exclusiva a este estudiante?");
    if (!confirmacion) return;
    setProcesandoAccion(true);
    setMensaje({ tipo: '', texto: 'Despachando correo individual...' });
    try {
      const res = await axios.post(`${API_URL}/api/admin/enviar_qr_estudiante/${id}`);
      setMensaje({ tipo: 'exito', texto: res.data.mensaje });
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.error || 'No se pudo despachar el correo.' });
    } finally {
      setProcesandoAccion(false);
    }
  };

  // ⚠️ NUEVAS FUNCIONES PARA ASIGNAR PONENCIAS
  const abrirAsignacion = async (evaluador) => {
    setEvaluadorAAsignar(evaluador);
    setPonenciasSeleccionadas(evaluador.ponencias_asignadas || []); 
    setModalAsignarAbierto(true);
    // Cargamos ponencias aprobadas para mostrarlas en el modal
    if (ponencias.length === 0) {
      const res = await axios.get(`${API_URL}/api/admin/ponencias`);
      setPonencias(res.data.filter(p => p.estado === 'aceptada'));
    }
  };

  const togglePonenciaSeleccionada = (codigo) => {
    setPonenciasSeleccionadas(prev => 
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    );
  };

  const guardarAsignacion = async () => {
    setProcesandoAccion(true);
    try {
      await axios.post(`${API_URL}/api/admin/evaluadores/${evaluadorAAsignar.id}/asignar`, {
        ponencias_codigos: ponenciasSeleccionadas
      });
      setMensaje({ tipo: 'exito', texto: 'Ponencias asignadas y correo enviado exitosamente al evaluador.' });
      setModalAsignarAbierto(false);
      cargarDatos(); 
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo asignar las ponencias.' });
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

  const totalAsistentes = estudiantes.filter(e => e.asistencia).length;
  const porcentajeAsistencia = estudiantes.length > 0 ? Math.round((totalAsistentes / estudiantes.length) * 100) : 0;

  if (!autorizado) return null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full font-sans">
      
      {/* ⚠️ SIDEBAR LATERAL PROFESIONAL */}
      <div className="w-64 bg-blue-950 text-white flex flex-col shadow-2xl z-20 shrink-0">
        <div className="p-6 border-b border-blue-900">
          <h2 className="text-2xl font-bold tracking-wider">ADMIN ACOFI</h2>
          <p className="text-blue-300 text-xs mt-1">Panel de Control General</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {[
              { id: 'ponencias', icon: '📄', label: 'Proyectos & QRs' },
              { id: 'estudiantes', icon: '🎓', label: 'Estudiantes' },
              { id: 'asistencia', icon: '✅', label: 'Check-in Aforo' },
              { id: 'evaluadores', icon: '🧑‍🏫', label: 'Evaluadores' },
              { id: 'ranking', icon: '🏆', label: 'Ranking Oficial' },
              { id: 'qr', icon: '📲', label: 'QR Portal Evaluador' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setVistaActual(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${vistaActual === item.id ? 'bg-blue-800 text-white shadow-md' : 'text-blue-200 hover:bg-blue-900 hover:text-white'}`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-blue-900">
          <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors">
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* ⚠️ HEADER SUPERIOR CON MENÚ DESPLEGABLE DE DESCARGAS */}
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex flex-col md:flex-row justify-between items-center z-10 shadow-sm gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800 capitalize">Gestión de {vistaActual}</h1>
            <button onClick={toggleInscripciones} className={`px-4 py-1.5 rounded-full font-bold text-xs shadow-sm transition-colors border ${registroAbierto ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}>
              Registro: {registroAbierto ? '🟢 ABIERTO' : '🔴 CERRADO'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de Excel Subir */}
            <label className={`px-4 py-2 text-white text-sm rounded-lg font-bold transition-colors cursor-pointer shadow-md flex items-center gap-2 ${procesandoAccion ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}>
              📁 Subir Excel DB
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={cargarExcel} disabled={procesandoAccion} />
            </label>

            {/* Menú Desplegable (Dropdown) Elegante */}
            <div className="relative group">
              <button className="px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 shadow-md flex items-center gap-2">
                📥 Descargar Reportes <span>▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right z-50">
                <div className="py-2 flex flex-col">
                  <button onClick={() => descargarExcel('estudiantes')} className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">Reporte Estudiantes</button>
                  <button onClick={() => descargarExcel('evaluadores')} className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">Reporte Evaluadores</button>
                  <button onClick={() => descargarExcel('ponencias')} className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">Reporte Ponencias</button>
                  <button onClick={() => descargarExcel('evaluaciones')} className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-t border-gray-100">Resultados Finales</button>
                  <button onClick={() => descargarExcel('asistencia')} className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-t border-gray-100">Asistencia Aforo</button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO INTERNO DESLIZABLE */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
          
          {mensaje.texto && (
            <div className={`p-4 mb-6 rounded-xl font-bold text-center text-sm md:text-base shadow-sm ${mensaje.tipo === 'exito' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {mensaje.texto}
            </div>
          )}

          {/* BARRA DE HERRAMIENTAS DE BUSCADORES */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            {vistaActual === 'ponencias' && (
              <>
                <input type="text" placeholder="🔍 Buscar título, integrante, código..." value={filtroPonencias} onChange={(e) => setFiltroPonencias(e.target.value)} className="w-full md:w-1/3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-900 bg-gray-50" />
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => enviarCorreos()} disabled={procesandoAccion} className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-colors text-sm">✉️ Enviar Todos QRs</button>
                  <button onClick={() => borrarTodos('ponencias')} disabled={procesandoAccion} className="flex-1 md:flex-none px-5 py-2.5 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors text-sm">🗑️ Purgar Todo</button>
                </div>
              </>
            )}
            {(vistaActual === 'estudiantes' || vistaActual === 'asistencia') && (
              <input type="text" placeholder="🔍 Buscar estudiante, documento o proyecto..." value={filtroEstudiantes} onChange={(e) => setFiltroEstudiantes(e.target.value)} className="w-full md:w-1/2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-900 bg-gray-50" />
            )}
            {vistaActual === 'evaluadores' && (
              <>
                <input type="text" placeholder="🔍 Buscar evaluador, documento, correo..." value={filtroEvaluadores} onChange={(e) => setFiltroEvaluadores(e.target.value)} className="w-full md:w-1/3 px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-900 bg-gray-50" />
                <div className="flex gap-2 w-full md:w-auto">
                  <button onClick={() => abrirCrearModal('evaluador')} className="flex-1 md:flex-none px-5 py-2.5 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 shadow-md transition-colors text-sm">+ Nuevo Evaluador</button>
                  <button onClick={() => borrarTodos('evaluadores')} disabled={procesandoAccion} className="flex-1 md:flex-none px-5 py-2.5 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition-colors text-sm">🗑️ Purgar Todo</button>
                </div>
              </>
            )}
          </div>

          {cargando ? (
            <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-900"></div></div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              
              {/* ⚠️ VISTA PONENCIAS: ENUMERADA */}
              {vistaActual === 'ponencias' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-800px">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold text-center w-12 border-b border-gray-200">#</th>
                      <th className="p-4 font-bold border-b border-gray-200">Trabajo Evaluativo</th>
                      <th className="p-4 font-bold border-b border-gray-200">Integrantes & Institución</th>
                      <th className="p-4 font-bold border-b border-gray-200 text-center">Estado</th>
                      <th className="p-4 font-bold border-b border-gray-200">Acceso QR</th>
                      <th className="p-4 font-bold border-b border-gray-200 text-center">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ponenciasMostradas.map((p, index) => (
                      <tr key={p.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                        <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                        <td className="p-4"><p className="font-bold text-gray-800 line-clamp-2">{p.titulo}</p></td>
                        <td className="p-4"><p className="text-gray-800 font-medium line-clamp-1">{p.estudiante_nombre}</p><p className="text-xs text-gray-500 mt-0.5">{p.estudiante_institucion}</p></td>
                        <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.estado}</span></td>
                        <td className="p-4">{p.codigo ? ( <div className="flex flex-col items-start"><span className="font-mono bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-blue-900 font-bold block mb-1">{p.codigo}</span><a href={p.url_qr} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 font-bold underline">Ver QR</a></div> ) : <span className="text-gray-400 italic text-xs">Sin asignar</span>}</td>
                        <td className="p-4 text-center space-y-1.5">
                          {p.estado === 'pendiente' && <button onClick={() => aprobarPonencia(p.id)} className="block w-full px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">Aprobar</button>}
                          {p.estado === 'aceptada' && ( <> <button onClick={() => enviarCorreos(p.id)} disabled={procesandoAccion} className="block w-full px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors">✉️ Grupo QR</button> </> )}
                          <button onClick={() => solicitarEliminacion('ponencias', p.id)} className="block w-full px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {/* ⚠️ VISTA ESTUDIANTES: ENUMERADA */}
              {vistaActual === 'estudiantes' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-800px">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold text-center w-12 border-b border-gray-200">#</th>
                      <th className="p-4 font-bold border-b border-gray-200">Estudiante</th>
                      <th className="p-4 font-bold border-b border-gray-200">Identificación</th>
                      <th className="p-4 font-bold border-b border-gray-200">Filiación</th>
                      <th className="p-4 font-bold border-b border-gray-200">Proyecto</th>
                      <th className="p-4 font-bold text-center border-b border-gray-200">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {estudiantesMostrados.map((e, index) => (
                      <tr key={e.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                        <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                        <td className="p-4"><p className="font-bold text-gray-800">{e.nombres_apellidos}</p><p className="text-xs text-gray-500 mt-0.5">{e.correo}</p></td>
                        <td className="p-4"><span className="text-gray-600 font-mono font-medium block">{e.documento_identidad}</span><span className="block mt-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-100 w-max px-2 py-0.5 rounded-full">PIN: {e.pin_acceso || 'N/A'}</span></td>
                        <td className="p-4"><p className="text-gray-800 font-bold">{e.institucion}</p><p className="text-xs text-gray-500 mt-0.5">{e.cargo} • <span className="text-blue-700">{e.ciudad}</span></p></td>
                        <td className="p-4"><p className="text-xs font-semibold text-gray-600 line-clamp-2">{e.nombre_trabajo}</p></td>
                        <td className="p-4 text-center space-y-1.5">
                          <button onClick={() => enviarCorreoIndividualEstudiante(e.id)} disabled={procesandoAccion} className="block w-full px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors">✉️ QR</button>
                          <button onClick={() => abrirEditarModal('estudiante', e)} className="block w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors">Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {/* ⚠️ VISTA ASISTENCIA: ENUMERADA */}
              {vistaActual === 'asistencia' && (
                <div>
                  <div className="bg-gray-50 px-6 py-5 border-b border-gray-200 flex flex-wrap gap-8 justify-center md:justify-start">
                    <div><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Inscritos</p><p className="text-3xl font-black text-gray-800">{estudiantes.length}</p></div>
                    <div className="border-l border-gray-300 pl-8"><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Asistentes</p><p className="text-3xl font-black text-emerald-600">{totalAsistentes}</p></div>
                    <div className="border-l border-gray-300 pl-8"><p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Aforo Total</p><p className="text-3xl font-black text-blue-600">{porcentajeAsistencia}%</p></div>
                  </div>
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-700px">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                        <th className="p-4 font-bold text-center w-12 border-b border-gray-200">#</th>
                        <th className="p-4 font-bold border-b border-gray-200">Estudiante</th>
                        <th className="p-4 font-bold border-b border-gray-200">Documento</th>
                        <th className="p-4 font-bold border-b border-gray-200">Institución</th>
                        <th className="p-4 font-bold text-center border-b border-gray-200">Marcar Presencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {estudiantesMostrados.map((e, index) => (
                        <tr key={e.id} className={`transition-colors text-sm ${e.asistencia ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}>
                          <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                          <td className="p-4"><p className={`font-bold ${e.asistencia ? 'text-emerald-900' : 'text-gray-800'}`}>{e.nombres_apellidos}</p></td>
                          <td className="p-4"><span className="text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded">{e.documento_identidad}</span></td>
                          <td className="p-4"><p className="text-gray-600 font-medium">{e.institucion}</p></td>
                          <td className="p-4 text-center">
                            <button onClick={() => toggleAsistencia(e.id, e.asistencia)} className={`w-14 h-7 rounded-full relative transition-colors duration-300 focus:outline-none shadow-inner ${e.asistencia ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                              <span className={`absolute top-1/2 -translate-y-1/2 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${e.asistencia ? 'translate-x-7' : 'translate-x-0'}`}></span>
                            </button>
                            <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-widest ${e.asistencia ? 'text-emerald-600' : 'text-gray-400'}`}>{e.asistencia ? 'PRESENTE' : 'AUSENTE'}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}

              {/* ⚠️ VISTA EVALUADORES: CON BOTÓN DE ASIGNAR */}
              {vistaActual === 'evaluadores' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-800px">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold border-b border-gray-200">Evaluador Registrado</th>
                      <th className="p-4 font-bold border-b border-gray-200">Credenciales</th>
                      <th className="p-4 font-bold border-b border-gray-200">Institución / Sede</th>
                      <th className="p-4 font-bold text-center border-b border-gray-200">Asignaciones</th>
                      <th className="p-4 font-bold text-center border-b border-gray-200">Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {evaluadoresMostrados.map((e) => (
                      <tr key={e.id} className="hover:bg-blue-50/50 transition-colors text-sm">
                        <td className="p-4"><p className="font-bold text-gray-800">{e.nombres_apellidos}</p><p className="text-xs text-gray-500 mt-0.5">{e.correo}</p></td>
                        <td className="p-4"><span className="text-gray-600 font-mono font-medium block">{e.documento_identidad}</span><span className="block mt-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-100 w-max px-2 py-0.5 rounded-full">PIN: {e.pin_acceso || 'N/A'}</span></td>
                        <td className="p-4"><p className="text-gray-800 font-bold">{e.institucion}</p><p className="text-xs text-gray-500 mt-0.5">{e.cargo} • <span className="text-blue-700">{e.evento.split(',')[0]}</span></p></td>
                        <td className="p-4 text-center">
                            <span className="text-xl font-black text-indigo-600 bg-indigo-50 w-10 h-10 inline-flex items-center justify-center rounded-xl border border-indigo-100">
                                {e.ponencias_asignadas ? e.ponencias_asignadas.length : 0}
                            </span>
                        </td>
                        <td className="p-4 text-center space-y-1.5">
                          <button onClick={() => abrirAsignacion(e)} className="block w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">🎯 Asignar Ponencias</button>
                          <button onClick={() => abrirEditarModal('evaluador', e)} className="block w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold transition-colors">Editar</button>
                          <button onClick={() => solicitarEliminacion('evaluadores', e.id)} className="block w-full px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {/* ⚠️ RANKING CON VISIBILIDAD DE EVALUADORES */}
              {vistaActual === 'ranking' && (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-800px">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold text-center border-b border-gray-200 w-24">Puesto</th>
                      <th className="p-4 font-bold border-b border-gray-200">Proyecto Evaluado</th>
                      <th className="p-4 font-bold border-b border-gray-200 text-center">Evaluado Por</th>
                      <th className="p-4 font-bold text-center border-b border-gray-200">Promedio General</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ranking.map((item, idx) => (
                      <tr key={item.id} className={`text-sm ${idx === 0 ? 'bg-amber-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-black text-lg shadow-sm ${idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="p-4"><p className="font-bold text-gray-800 line-clamp-2">{item.titulo}</p><p className="text-xs text-gray-500 mt-1">Autor: {item.estudiante_nombre} • Código: <span className="font-mono bg-gray-200 px-1 rounded text-gray-700 font-bold">{item.codigo}</span></p></td>
                        <td className="p-4 text-center">
                          {item.evaluadores_nombres && item.evaluadores_nombres.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              {item.evaluadores_nombres.map((ev, i) => <span key={i} className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold border border-blue-100">{ev}</span>)}
                            </div>
                          ) : <span className="text-xs italic text-gray-400 font-medium">Sin evaluar</span>}
                        </td>
                        <td className="p-4 text-center"><span className="bg-blue-950 text-white px-4 py-2 rounded-xl font-black text-base shadow-md inline-block">{item.promedio}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}

              {vistaActual === 'qr' && (
                <div className="flex flex-col items-center justify-center py-16 px-4 w-full">
                  <h3 className="text-2xl font-black text-blue-950 mb-6 text-center">Registro Público de Evaluadores</h3>
                  <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 mb-6 flex justify-center">
                    <QRCodeSVG value={urlRegistroEvaluador} size={240} level="H" />
                  </div>
                  <p className="text-sm text-gray-500 font-mono bg-gray-100 px-4 py-2.5 rounded-lg border border-gray-200 text-center break-all w-full max-w-lg shadow-inner">{urlRegistroEvaluador}</p>
                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* ⚠️ NUEVO: MODAL DE ASIGNACIÓN DE PONENCIAS */}
      {modalAsignarAbierto && evaluadorAAsignar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-bold text-blue-950 mb-1">Asignar Proyectos</h3>
            <p className="text-sm text-gray-500 mb-6 border-b pb-4">Selecciona los proyectos que el evaluador <strong>{evaluadorAAsignar.nombres_apellidos}</strong> deberá calificar.</p>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-2">
              {ponencias.map(p => (
                <label key={p.id} className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors ${ponenciasSeleccionadas.includes(p.codigo) ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                  <input type="checkbox" checked={ponenciasSeleccionadas.includes(p.codigo)} onChange={() => togglePonenciaSeleccionada(p.codigo)} className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600" />
                  <div>
                    <p className={`text-sm font-bold line-clamp-1 ${ponenciasSeleccionadas.includes(p.codigo) ? 'text-indigo-900' : 'text-gray-800'}`}>{p.titulo}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">CÓDIGO: {p.codigo}</p>
                  </div>
                </label>
              ))}
              {ponencias.length === 0 && <p className="text-center text-gray-400 py-10 text-sm font-medium">No hay ponencias aprobadas en el sistema.</p>}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button onClick={() => setModalAsignarAbierto(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">Cancelar</button>
              <button onClick={guardarAsignacion} disabled={procesandoAccion} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center gap-2">
                {procesandoAccion ? 'Enviando...' : 'Guardar y Notificar ✉️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES CLÁSICOS */}
      {modalConfirmacion.abierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border-t-4 border-red-600 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-gray-500 text-sm mb-6">Esta acción borrará permanentemente sus datos técnicos.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setModalConfirmacion({ abierto: false, entidad: '', id: null })} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold w-full transition-colors">Cancelar</button>
              <button onClick={confirmarEliminacion} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md w-full transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col max-h-[90vh]">
            <h3 className="text-xl md:text-2xl font-bold text-blue-950 mb-6 capitalize pb-4 border-b">{modalModo} {modalEntidad}</h3>
            <div className="overflow-y-auto pr-2">
              <form id="modalForm" onSubmit={guardarModal} className="space-y-4">
                {modalEntidad === 'ponencia' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Título del Trabajo / Póster</label>
                      <input type="text" required value={formPonencia.titulo} onChange={(e) => setFormPonencia({...formPonencia, titulo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Nombre del Estudiante</label>
                        <input type="text" required value={formPonencia.estudiante_nombre} onChange={(e) => setFormPonencia({...formPonencia, estudiante_nombre: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Cédula</label>
                        <input type="text" required value={formPonencia.estudiante_documento} onChange={(e) => setFormPonencia({...formPonencia, estudiante_documento: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                    </div>
                  </>
                )}

                {modalEntidad === 'estudiante' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Nombre del Estudiante</label>
                        <input type="text" required value={formEstudiante.nombres_apellidos} onChange={(e) => setFormEstudiante({...formEstudiante, nombres_apellidos: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Cédula / Documento</label>
                        <input type="text" required value={formEstudiante.documento_identidad} onChange={(e) => setFormEstudiante({...formEstudiante, documento_identidad: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Institución / Universidad</label>
                        <input type="text" required value={formEstudiante.institucion} onChange={(e) => setFormEstudiante({...formEstudiante, institucion: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Correo Electrónico</label>
                        <input type="email" required value={formEstudiante.correo} onChange={(e) => setFormEstudiante({...formEstudiante, correo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Ciudad</label>
                        <select required value={formEstudiante.ciudad} onChange={(e) => setFormEstudiante({...formEstudiante, ciudad: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm">
                          {ciudadesColombia.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Cargo</label>
                        <select required value={formEstudiante.cargo} onChange={(e) => setFormEstudiante({...formEstudiante, cargo: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm">
                          <option value="Lider de semillero">Lider de semillero</option>
                          <option value="Estudiante 1">Estudiante 1</option>
                          <option value="Estudiante 2">Estudiante 2</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Asignar a Trabajo</label>
                      <textarea required rows="2" value={formEstudiante.nombre_trabajo} onChange={(e) => setFormEstudiante({...formEstudiante, nombre_trabajo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm resize-none" />
                    </div>
                  </>
                )}

                {modalEntidad === 'evaluador' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Nombre del Evaluador</label>
                        <input type="text" required value={formEvaluador.nombres_apellidos} onChange={(e) => setFormEvaluador({...formEvaluador, nombres_apellidos: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Documento</label>
                        <input type="text" required value={formEvaluador.documento_identidad} onChange={(e) => setFormEvaluador({...formEvaluador, documento_identidad: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Institución de Procedencia</label>
                        <input type="text" required value={formEvaluador.institucion} onChange={(e) => setFormEvaluador({...formEvaluador, institucion: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Correo de Contacto</label>
                        <input type="email" required value={formEvaluador.correo} onChange={(e) => setFormEvaluador({...formEvaluador, correo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Cargo Académico</label>
                        <input type="text" required value={formEvaluador.cargo} onChange={(e) => setFormEvaluador({...formEvaluador, cargo: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Evento Sede</label>
                        <select value={formEvaluador.evento_id} onChange={(e) => setFormEvaluador({...formEvaluador, evento_id: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 text-sm">
                          {eventosDisponibles.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">Cancelar</button>
              <button type="submit" form="modalForm" className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-bold shadow-md transition-colors">Guardar Información</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminPanel;