import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, FileText, UploadCloud, FolderOpen, Calendar as CalendarIcon, Kanban, Clock, Play, Pause, CheckSquare } from 'lucide-react';

import DashboardLayout from '../components/layout/DashboardLayout';
import { ConfirmationModal } from '../components/ui/UIComponents';
import ProjectCard from '../components/tecnico/ProjectCard';
import { ProjectLogModal } from '../components/tecnico/ProjectLogModal';
import { ManageTaskModal } from '../components/tecnico/ManageTaskModal';
import { ModalSolicitarEcotech } from '../components/tecnico/ModalSolicitarEcotech';
import { ClientDossierPanel } from '../components/tecnico/ClientDossierPanel';
import { AgendaTecnicoPanel } from '../components/tecnico/AgendaTecnicoPanel';
import PauseProjectModal from '../components/tecnico/PauseProjectModal';
import { ModalFinalizarTarea } from '../components/tecnico/ModalFinalizarTarea';
import GenerateNotaModal from '@/components/tecnico/GenerateNotaModal';


const TecnicoDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [modalProject, setModalProject] = useState(null);
    const [modalType, setModalType] = useState(''); 
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showDossier, setShowDossier] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showEcotechSolicitar, setShowEcotechSolicitar] = useState(false);
    const [showEcotechFinalizar, setShowEcotechFinalizar] = useState(false);
    const [showGenerateNota, setShowGenerateNota] = useState(false);
    const [showFinalizarTarea, setShowFinalizarTarea] = useState(false);

    const fetchProjects = async (userId) => {
        setLoadingProjects(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, plantas(nombre_planta), servicios(nombre_servicio), proveedores(nombre_proveedor, proveedor_id_numerico)')
                .eq('tecnico_id', userId)
                .in('estado', ['Activo', 'activo', 'aprobado_supervisor']);
            
            if (error) throw error;
            
            const todayStr = new Date().toDateString();
            const updatesToPendiente = [];
            
            const processedData = data.map(p => {
                let currentStatus = p.estado_operativo || 'Pendiente';
                
                if (currentStatus === 'En Proceso' && p.ultimo_inicio_proceso) {
                    const lastStartStr = new Date(p.ultimo_inicio_proceso).toDateString();
                    if (lastStartStr !== todayStr) {
                        currentStatus = 'Pendiente';
                        updatesToPendiente.push(p.id);
                    }
                }
                return { ...p, estado_operativo: currentStatus };
            });

            // Ejecutamos las actualizaciones silenciosas en BD si hubo reseteos
            if (updatesToPendiente.length > 0) {
                supabase.from('proyectos_v2')
                    .update({ estado_operativo: 'Pendiente' })
                    .in('id', updatesToPendiente)
                    .then(() => console.log(`Reseteados ${updatesToPendiente.length} proyectos a Pendiente.`));
            }

            setProjects(processedData);
            
            if (activeProject) {
                const updatedActive = processedData.find(p => p.id === activeProject.id);
                if (updatedActive) setActiveProject(updatedActive);
                else setActiveProject(null);
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
            toast.error("Error al cargar tus proyectos.");
        } finally {
            setLoadingProjects(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setCurrentUser(session.user);
                fetchProjects(session.user.id);
            }
        };
        init();
    }, []);

    // ORDENAMIENTO INTELIGENTE DEL KANBAN
    const orderedProjects = useMemo(() => {
        const orderWeight = {
            'En Proceso': 1,
            'Pendiente': 2,
            'Pendiente Fase 2': 3,
            'Pausado': 4,
            'Revisión': 5
        };

        return [...projects].sort((a, b) => {
            const weightA = orderWeight[a.estado_operativo] || 99;
            const weightB = orderWeight[b.estado_operativo] || 99;
            if (weightA !== weightB) return weightA - weightB;
            // Si tienen el mismo estado, ordenamos por fecha de entrega (más urgente primero)
            return new Date(a.fecha_entrega_interna || '2099-01-01') - new Date(b.fecha_entrega_interna || '2099-01-01');
        });
    }, [projects]);

    // MANEJADORES DE ESTADO OPERATIVO
    const handleStartWork = async (projectId) => {
        setIsUpdatingStatus(true);
        try {
            const { error } = await supabase.from('proyectos_v2')
                .update({ 
                    estado_operativo: 'En Proceso',
                    ultimo_inicio_proceso: new Date().toISOString()
                })
                .eq('id', projectId);
            if (error) throw error;
            
            toast.success("Trabajo iniciado. Reloj corriendo.");
            fetchProjects(currentUser.id);
        } catch (err) {
            toast.error("Error al iniciar trabajo.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    
    const handleSoftFinish = async (projectId) => {
        setIsUpdatingStatus(true);
        try {
            const { error } = await supabase.from('proyectos_v2')
                .update({ 
                    estado_operativo: 'Pausado', // Lo pausamos porque ahora espera al proveedor
                    fecha_fin_tecnico_real: new Date().toISOString()
                })
                .eq('id', projectId);
                
            if (error) throw error;
            
            // Dejamos huella en bitácora
            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: projectId,
                usuario_id: currentUser.id,
                mensaje: `⏳ Parte técnica finalizada. Proyecto en espera de proveedor.`
            }]);

            toast.success("Parte técnica finalizada.");
            fetchProjects(currentUser.id);
        } catch (err) {
            toast.error("Error al finalizar la tarea técnica.");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Función para seleccionar proyecto y marcar notificaciones como leídas
    const handleSelectProject = async (project) => {
        setActiveProject(project);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const isNew = project.estado_operativo === 'Pendiente' && !project.ultimo_inicio_proceso;
        const hasNotes = !!project.notas_supervisor;
        const isRejected = project.estado_operativo === 'Rechazado' || project.estado === 'Rechazado';
        const needsAttention = (isNew || hasNotes || isRejected) && !project.notas_leidas;

        if (needsAttention) {
            // 1. ACTUALIZACIÓN OPTIMISTA: Apagamos el punto en pantalla
            setProjects(prev => prev.map(p => p.id === project.id ? { ...p, notas_leidas: true } : p));
            
            // 2. Actualizamos en la base de datos esperando la respuesta
            const { error } = await supabase.from('proyectos_v2')
                .update({ notas_leidas: true })
                .eq('id', project.id);
                
            // 3. LA TRAMPA: Si falla por debajo, nos avisará en pantalla
            if (error) {
                console.error("Error al apagar notificación:", error);
                toast.error(`Error BD: ${error.message}`);
                // Revertimos el optimismo si falló
                setProjects(prev => prev.map(p => p.id === project.id ? { ...p, notas_leidas: false } : p));
            }
        }
    };

    // Calculamos cuántos proyectos requieren atención para el contador de la pestaña
    const notificacionesCount = projects.filter(p => {
        const isNew = p.estado_operativo === 'Pendiente' && !p.ultimo_inicio_proceso;
        const hasNotes = !!p.notas_supervisor;
        const isRejected = p.estado_operativo === 'Rechazado' || p.estado === 'Rechazado';
        return (isNew || hasNotes || isRejected) && !p.notas_leidas;
    }).length;

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-6">Mi Área de Trabajo</h1>
                
                <div className="flex space-x-2 border-b border-border">
                    <button onClick={() => setActiveTab('home')} className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'home' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                        <CalendarIcon className="w-4 h-4 mr-2" /> Resumen y Agenda
                    </button>
                    <button onClick={() => setActiveTab('proyectos')} className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'proyectos' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                        <Kanban className="w-4 h-4 mr-2" /> Mis Proyectos
                        {notificacionesCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                                {notificacionesCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* PESTAÑA 1: HOME */}
            {activeTab === 'home' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* NUEVO: ALERTA DE PROYECTOS RECIÉN ASIGNADOS */}
                    {projects.filter(p => p.estado_operativo === 'Pendiente' && !p.ultimo_inicio_proceso).length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                            <h3 className="text-blue-800 font-bold mb-2 flex items-center">
                                <AlertCircle className="w-5 h-5 mr-2" /> Tienes Nuevas Asignaciones
                            </h3>
                            <p className="text-sm text-blue-700">
                                Se te han asignado {projects.filter(p => p.estado_operativo === 'Pendiente' && !p.ultimo_inicio_proceso).length} proyecto(s) nuevo(s). Revisa la pestaña de "Mis Proyectos" para comenzar.
                            </p>
                        </div>
                    )}

                    {/* Alerta de Acuses (Mantenemos la que ya tenías) */}
                    {projects.filter(p => p.esperando_acuse).length > 0 && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                            <div className="flex items-center mb-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                                <h3 className="text-red-800 font-bold">Urgente: Pendientes de Acuse y Vigencia</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {projects.filter(p => p.esperando_acuse).map(p => (
                                    <div key={p.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-3 rounded-lg border border-red-100 shadow-sm">
                                        <div className="mb-3 sm:mb-0">
                                            <p className="font-bold text-sm text-gray-800">{p.npu}</p>
                                            <p className="text-xs text-gray-500">{p.clientes?.nombre_empresa}</p>
                                        </div>
                                        <button onClick={() => { setModalProject(p); setModalType('subir_acuse'); }} className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto">
                                            Subir Acuse
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {currentUser && <AgendaTecnicoPanel userId={currentUser.id} proyectosConProveedores={projects.filter(p => p.esperando_proveedor)} />}
                </div>
            )}

            {/* PESTAÑA 2: KANBAN DE PROYECTOS */}
            {activeTab === 'proyectos' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-8 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* COLUMNA IZQUIERDA: LISTA DE PROYECTOS */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground">Tareas Asignadas</h2>
                        </div>

                        {loadingProjects ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
                        ) : orderedProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {orderedProjects.map(project => (
                                    <ProjectCard 
                                        key={project.id} 
                                        project={project} 
                                        isActive={activeProject?.id === project.id}
                                        onSelect={() => handleSelectProject(project)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-muted/30 p-10 rounded-xl text-center border border-border border-dashed">
                                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground font-medium">No tienes proyectos activos asignados.</p>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: HERRAMIENTAS Y CONTROLES OPERATIVOS */}
                    <div className="sticky top-8 h-fit">
                        {activeProject ? (
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                                
                                {/* CABECERA Y ESTADO */}
                                <div className="border-b border-border pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">{activeProject.npu}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">{activeProject.servicios?.nombre_servicio}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                                            ${activeProject.estado_operativo === 'En Proceso' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                              activeProject.estado_operativo === 'Pausado' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                              'bg-muted text-muted-foreground border border-border'}`}>
                                            {activeProject.estado_operativo || 'Pendiente'}
                                        </span>
                                    </div>
                                </div>

                                {/* CONTROLES DE TIEMPO Y EJECUCIÓN (UNIFICADOS) */}
                                <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Controles de Ejecución</p>
                                    
                                    {/* 1. ESTADOS PARA INICIAR (Pendiente o Pausado) */}
                                    {(activeProject.estado_operativo === 'Pendiente' || activeProject.estado_operativo === 'Pendiente Fase 2' || activeProject.estado_operativo === 'Pausado') && (
                                        <button 
                                            onClick={() => handleStartWork(activeProject.id)} 
                                            disabled={isUpdatingStatus}
                                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                        >
                                            <Play className="w-4 h-4 mr-2" /> Iniciar Trabajo
                                        </button>
                                    )}

                                    {/* 2. ESTADO APROBADO (Prioridad máxima de cierre) */}
                                    {activeProject.estado_operativo === 'Aprobado' && (
                                        <button 
                                            onClick={() => { setModalProject(activeProject); setShowGenerateNota(true); }} 
                                            disabled={isUpdatingStatus}
                                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            <FileText className="w-4 h-4 mr-2" /> Generar Nota de Entrega
                                        </button>
                                    )}

                                    {/* 3. ESTADO EN PROCESO (Lógica de Proveedores y Finalización) */}
                                    {activeProject.estado_operativo === 'En Proceso' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {/* El botón de pausar siempre está disponible si está en proceso */}
                                            <button 
                                                onClick={() => { setModalProject(activeProject); setModalType('pausar'); }}
                                                disabled={isUpdatingStatus}
                                                className="w-full flex items-center justify-center py-3 px-4 border border-amber-500/30 rounded-lg text-sm font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                                            >
                                                <Pause className="w-4 h-4 mr-2" /> Pausar
                                            </button>
                                            
                                            {/* Ruteo según el proveedor */}
                                            {activeProject.proveedores?.proveedor_id_numerico === '01' ? (
                                                /* FLUJO ECOTECH */
                                                !activeProject.ecotech_solicitud_enviada ? (
                                                    <button 
                                                        onClick={() => setShowEcotechSolicitar(true)}
                                                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-orange-600 text-white hover:bg-orange-700"
                                                    >
                                                        Solicitar Folio Ecotech
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setShowEcotechFinalizar(true)}
                                                        className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700"
                                                    >
                                                        Subir Campo (Ecotech)
                                                    </button>
                                                )
                                            ) : activeProject.proveedores?.proveedor_id_numerico && activeProject.proveedores.proveedor_id_numerico !== '00' ? (
                                                /* FLUJO OTROS PROVEEDORES (Soft Finish) */
                                                <button 
                                                    onClick={() => handleSoftFinish(activeProject.id)} 
                                                    disabled={isUpdatingStatus || activeProject.fecha_fin_tecnico_real}
                                                    className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    <CheckSquare className="w-4 h-4 mr-2" /> Fin. Parte Técnica
                                                </button>
                                            ) : (
                                                /* FLUJO INTERNO / SIN PROVEEDOR (Subir PDF Final) */
                                                <button 
                                                    onClick={() => setShowFinalizarTarea(true)} 
                                                    disabled={isUpdatingStatus}
                                                    className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    <CheckSquare className="w-4 h-4 mr-2" /> Finalizar Tarea
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* 4. ESTADOS BLOQUEADOS (Ej. 'Revisión', 'Atrasado', etc. que no sean los de arriba) */}
                                    {!['Pendiente', 'Pendiente Fase 2', 'Pausado', 'En Proceso', 'Aprobado'].includes(activeProject.estado_operativo) && (
                                        <div className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-muted text-muted-foreground border border-border">
                                            Proyecto en {activeProject.estado_operativo}
                                        </div>
                                    )}
                                </div>

                                {/* NOTAS E INSTRUCCIONES SEPARADAS */}
                                <div className="space-y-3 mb-4">
                                    {activeProject.comentarios_apertura && (
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Notas de Apertura (Admin)</h4>
                                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                                {activeProject.comentarios_apertura}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {activeProject.notas_supervisor && (
                                        <div className="bg-accent/5 border-l-4 border-accent p-4 rounded-r-xl">
                                            <h4 className="text-xs font-bold text-accent uppercase mb-1">Instrucciones del Supervisor</h4>
                                            <p className="text-sm text-foreground whitespace-pre-wrap">
                                                {activeProject.notas_supervisor}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* HERRAMIENTAS GENERALES */}
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <button onClick={() => setShowDossier(true)} className="w-full flex items-center justify-center py-2.5 px-4 border-2 border-primary rounded-lg text-sm font-bold text-primary hover:bg-primary/5 transition-colors mb-2">
                                        <FolderOpen className="w-4 h-4 mr-2" /> Ver Expediente del Cliente
                                    </button>

                                    {/* Ecotech: Mostrar el número de folio y PDF si ya existen, sin duplicar botones de acción */}
                                    {activeProject.proveedores?.proveedor_id_numerico === '01' && activeProject.ecotech_num_proyecto && (
                                        <div className="space-y-3 bg-green-50 p-3 rounded-lg border border-green-200">
                                            <p className="text-xs font-bold text-green-700">✓ No. Ecotech: {activeProject.ecotech_num_proyecto}</p>
                                            {activeProject.ecotech_pdf_proyecto && (
                                                <a href={activeProject.ecotech_pdf_proyecto} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center py-2 px-4 border border-accent/30 bg-accent/5 text-accent rounded-lg text-sm font-bold hover:bg-accent/10">
                                                    <FileText className="w-4 h-4 mr-2" /> Cotización Ecotech
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Botón de Bitácora para todos */}
                                    <button onClick={() => { setModalProject(activeProject); setModalType('log'); }} className="w-full flex items-center justify-center py-2.5 px-4 border border-border rounded-lg text-sm font-bold bg-background hover:bg-muted">
                                        <FileText className="w-4 h-4 mr-2" /> Abrir Bitácora
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center">
                                <h2 className="text-xl font-bold text-primary mb-2">Selecciona un Proyecto</h2>
                                <p className="text-sm text-muted-foreground">Haz clic en tu lista para ver las herramientas operativas.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALES */}
            {modalProject && modalType === 'log' && <ProjectLogModal project={modalProject} userId={currentUser?.id} onClose={() => setModalProject(null)} />}
            {modalProject && modalType === 'task' && <ManageTaskModal project={modalProject} onClose={() => setModalProject(null)} onFinalized={() => fetchProjects(currentUser?.id)} />}
            {modalProject && modalType === 'pausar' && <PauseProjectModal project={modalProject} userId={currentUser?.id} onClose={() => setModalProject(null)} onFinalized={() => fetchProjects(currentUser?.id)} />}
            {modalProject && modalType === 'solicitar_ecotech' && <ModalSolicitarEcotech project={modalProject} onClose={() => setModalProject(null)} onFinalized={() => fetchProjects(currentUser?.id)} />}
            {/* INYECCIÓN DE NUEVOS MODALES */}
            
            {showDossier && activeProject && (
                <ClientDossierPanel 
                    plantaId={activeProject.planta_id} 
                    plantaNombre={activeProject.plantas?.nombre_planta} 
                    currentUser={currentUser}
                    onClose={() => setShowDossier(false)} 
                />
            )}

            {showEcotechFinalizar && activeProject && (
                <ModalFinalizarEcotech 
                    project={activeProject} 
                    onClose={() => setShowEcotechFinalizar(false)} 
                    onFinalized={() => {
                        setShowEcotechFinalizar(false);
                        fetchProjects(currentUser.id);
                    }} 
                />
            )}
            
            {showEcotechSolicitar && activeProject && (
                <ModalSolicitarEcotech 
                    project={activeProject} 
                    onClose={() => setShowEcotechSolicitar(false)} 
                    onFinalized={() => {
                        setShowEcotechSolicitar(false);
                        fetchProjects(currentUser.id);
                    }} 
                />
            )}


            {/* Modal para Subir PDF y enviar a revisión (Proyectos Internos) */}
            {showFinalizarTarea && activeProject && (
                <ModalFinalizarTarea 
                    project={activeProject} 
                    currentUser={currentUser}
                    onClose={() => setShowFinalizarTarea(false)} 
                    onFinalized={() => {
                        setShowFinalizarTarea(false);
                        fetchProjects(currentUser.id);
                    }} 
                />
            )}

            {/* Modal para Generar Nota de Entrega y Subir .rar (Proyectos Aprobados) */}
            {showGenerateNota && modalProject && (
                <GenerateNotaModal 
                    project={modalProject} 
                    currentUser={currentUser}
                    onClose={() => setShowGenerateNota(false)} 
                    onFinalized={() => {
                        setShowGenerateNota(false);
                        fetchProjects(currentUser.id); // Refresca los proyectos para que desaparezca el terminado
                    }} 
                />
            )}
            {confirmingAction && <ConfirmationModal {...confirmingAction} onCancel={() => setConfirmingAction(null)} />}
        </DashboardLayout>
    );
};

export default TecnicoDashboard;