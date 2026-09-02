import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AlertCircle, CheckCircle2, FileText, UploadCloud, FolderOpen, Calendar as CalendarIcon, LayoutKanban, Clock } from 'lucide-react';

// Modales y Componentes
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import ProjectCard from '../components/tecnico/ProjectCard';
import { ProjectLogModal } from '../components/tecnico/ProjectLogModal';
import { ManageTaskModal } from '../components/tecnico/ManageTaskModal';
import { ModalSolicitarEcotech } from '../components/tecnico/ModalSolicitarEcotech';
// Nota: Si ya no usas GenerateNotaModal porque metimos DFlip, puedes quitarlo. Lo dejo por si acaso.
import { ClientDossierPanel } from '../components/tecnico/ClientDossierPanel';
import { AgendaTecnicoPanel } from '../components/tecnico/AgendaTecnicoPanel'; // Asegúrate de tener este archivo creado

const TecnicoDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null);
    
    // NUEVO: Estado para las pestañas
    const [activeTab, setActiveTab] = useState('home'); // 'home' | 'proyectos'
    
    const [modalProject, setModalProject] = useState(null);
    const [modalType, setModalType] = useState(''); 
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showDossier, setShowDossier] = useState(false);

    const fetchProjects = async (userId) => {
        setLoadingProjects(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .eq('tecnico_id', userId)
                .in('estado', ['activo', 'aprobado_supervisor'])
                .order('fecha_entrega_interna', { ascending: true }); 
            
            if (error) throw error;
            setProjects(data || []);
            
            if (activeProject) {
                const updatedActive = data?.find(p => p.id === activeProject.id);
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

    const handleSoftFinish = async (projectId) => {
        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ fecha_fin_tecnico_real: new Date().toISOString() })
                .eq('id', projectId);
                
            if (error) throw error;
            toast.success("Parte técnica finalizada.");
            fetchProjects(currentUser.id);
        } catch (err) {
            toast.error("Error al finalizar la tarea técnica.");
        }
        setConfirmingAction(null);
    };

    return (
        <DashboardLayout>
            {/* ENCABEZADO Y PESTAÑAS */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-6">Mi Área de Trabajo</h1>
                
                <div className="flex space-x-2 border-b border-border">
                    <button 
                        onClick={() => setActiveTab('home')}
                        className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'home' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                    >
                        <CalendarIcon className="w-4 h-4 mr-2" /> Resumen y Agenda
                    </button>
                    <button 
                        onClick={() => setActiveTab('proyectos')}
                        className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'proyectos' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                    >
                        <LayoutKanban className="w-4 h-4 mr-2" /> Mis Proyectos
                        {projects.length > 0 && (
                            <span className="ml-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px]">
                                {projects.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ========================================================= */}
            {/* PESTAÑA 1: HOME / AGENDA Y RESUMEN */}
            {/* ========================================================= */}
            {activeTab === 'home' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* ALERTA: ACUSES PENDIENTES */}
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
                                        <button 
                                            onClick={() => { setModalProject(p); setModalType('subir_acuse'); }}
                                            className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto"
                                        >
                                            Subir Acuse
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AGENDA Y SEGUIMIENTO PROVEEDORES (Componente Extraído) */}
                    {currentUser && (
                        <AgendaTecnicoPanel 
                            userId={currentUser.id} 
                            proyectosConProveedores={projects.filter(p => p.esperando_proveedor)}
                        />
                    )}
                </div>
            )}


            {/* ========================================================= */}
            {/* PESTAÑA 2: KANBAN DE PROYECTOS */}
            {/* ========================================================= */}
            {activeTab === 'proyectos' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* COLUMNA IZQUIERDA: KANBAN DE PROYECTOS */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-foreground">Tareas Pendientes</h2>
                        </div>

                        {loadingProjects ? (
                            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
                        ) : projects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projects.map(project => (
                                    <ProjectCard 
                                        key={project.id} 
                                        project={project} 
                                        isActive={activeProject?.id === project.id}
                                        onSelect={() => {
                                            setActiveProject(project);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
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

                    {/* COLUMNA DERECHA: HERRAMIENTAS DEL PROYECTO ACTIVO */}
                    <div className="sticky top-8 h-fit">
                        {activeProject ? (
                            <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-foreground mb-1">Herramientas de Trabajo</h3>
                                    <p className="text-sm text-muted-foreground">Opciones para el NPU {activeProject.npu}</p>
                                </div>

                                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center mb-2">
                                        <AlertCircle className="w-4 h-4 mr-2" /> Instrucciones
                                    </h4>
                                    <p className="text-sm text-amber-900/80 dark:text-amber-200/80 whitespace-pre-wrap">
                                        {activeProject.notas_supervisor || activeProject.comentarios_apertura || "No hay instrucciones adicionales."}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-border">
                                    {/* Botón de Expediente Común para todos */}
                                    <button 
                                        onClick={() => setShowDossier(true)} 
                                        className="w-full flex items-center justify-center py-3 px-4 border-2 border-primary rounded-lg shadow-sm text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 transition-colors mb-3"
                                    >
                                        <FolderOpen className="w-4 h-4 mr-2" /> 
                                        Ver Expediente del Cliente
                                    </button>

                                    {/* LÓGICA ESPECIAL ECOTECH vs PROYECTO NORMAL */}
                                    {activeProject.proveedor_nombre?.toLowerCase().includes('ecotech') ? (
                                        
                                        !activeProject.ecotech_num_proyecto ? (
                                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg space-y-3 mt-4">
                                                <p className="text-sm text-orange-800 font-bold">⚠️ Requiere Número de Proyecto Ecotech</p>
                                                {activeProject.ecotech_solicitud_enviada ? (
                                                    <p className="text-xs text-orange-600 flex items-center font-bold">
                                                        <Clock className="w-4 h-4 mr-1"/> Solicitud enviada. Esperando asignación...
                                                    </p>
                                                ) : (
                                                    <button 
                                                        onClick={() => { setModalProject(activeProject); setModalType('solicitar_ecotech'); }}
                                                        className="w-full bg-orange-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-orange-700 transition-colors"
                                                    >
                                                        Generar Solicitud a Ecotech
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3 mt-4">
                                                <p className="text-xs font-bold text-green-700 bg-green-50 p-2 rounded border border-green-200">
                                                    ✓ No. Ecotech asignado: {activeProject.ecotech_num_proyecto}
                                                </p>
                                                
                                                {/* NUEVO: BOTÓN PARA QUE EL TÉCNICO VEA LA COTIZACIÓN DE ECOTECH */}
                                                {activeProject.ecotech_pdf_proyecto && (
                                                    <a href={activeProject.ecotech_pdf_proyecto} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center py-2 px-4 border border-accent/30 bg-accent/5 text-accent rounded-lg shadow-sm text-sm font-bold hover:bg-accent/10 transition-colors">
                                                        <FileText className="w-4 h-4 mr-2" /> Ver PDF (Cotización Ecotech)
                                                    </a>
                                                )}

                                                <button onClick={() => { setModalProject(activeProject); setModalType('log'); }} className="w-full flex items-center justify-center py-3 px-4 border border-border rounded-lg shadow-sm text-sm font-bold bg-background hover:bg-muted">
                                                    <FileText className="w-4 h-4 mr-2" /> Abrir Bitácora
                                                </button>
                                                
                                                <button onClick={() => { setModalProject(activeProject); setModalType('finalizar_ecotech'); }} className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold bg-blue-600 text-white hover:bg-blue-700">
                                                    <UploadCloud className="w-4 h-4 mr-2" /> Enviar Hojas a Ecotech
                                                </button>
                                            </div>
                                        )

                                    ) : (
                                        /* PROYECTO NORMAL */
                                        <>
                                            <button 
                                                onClick={() => { setModalProject(activeProject); setModalType('log'); }} 
                                                className="w-full flex items-center justify-center py-3 px-4 border border-border rounded-lg shadow-sm text-sm font-bold bg-background hover:bg-muted"
                                            >
                                                <FileText className="w-4 h-4 mr-2" /> Abrir Bitácora
                                            </button>
                                            <button 
                                                onClick={() => { setModalProject(activeProject); setModalType('task'); }} 
                                                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <UploadCloud className="w-4 h-4 mr-2" /> Subir Evidencia para Revisión
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card border border-border p-8 rounded-xl shadow-sm text-center">
                                <h2 className="text-xl font-bold text-primary mb-2">Selecciona un Proyecto</h2>
                                <p className="text-sm text-muted-foreground">Haz clic en un proyecto de tu lista para ver sus herramientas e instrucciones.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODALES */}
            {modalProject && modalType === 'log' && (
                <ProjectLogModal project={modalProject} userId={currentUser?.id} onClose={() => setModalProject(null)} />
            )}
            
            {modalProject && modalType === 'task' && (
                <ManageTaskModal project={modalProject} onClose={() => setModalProject(null)} onFinalized={() => fetchProjects(currentUser?.id)} />
            )}

            {confirmingAction && (
                <ConfirmationModal {...confirmingAction} onCancel={() => setConfirmingAction(null)} />
            )}
            {modalProject && modalType === 'solicitar_ecotech' && (
                <ModalSolicitarEcotech 
                    project={modalProject} 
                    onClose={() => setModalProject(null)} 
                    onFinalized={() => fetchProjects(currentUser?.id)} 
                />
            )}

            {/* Asegúrate de tener también el de finalizar_ecotech si no lo habías agregado: */}
            {modalProject && modalType === 'finalizar_ecotech' && (
                <ModalFinalizarEcotech 
                    project={modalProject} 
                    onClose={() => setModalProject(null)} 
                    onFinalized={() => fetchProjects(currentUser?.id)} 
                />
            )}

            {/* Panel del Expediente */}
            {showDossier && activeProject?.clientes && (
                <ClientDossierPanel 
                    clienteId={activeProject.cliente_id} 
                    clienteNombre={activeProject.clientes.nombre_empresa}
                    currentUser={currentUser}
                    onClose={() => setShowDossier(false)} 
                />
            )}
        </DashboardLayout>
    );
};

export default TecnicoDashboard;