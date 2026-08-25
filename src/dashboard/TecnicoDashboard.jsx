import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AlertCircle, CheckCircle2, FileText, UploadCloud } from 'lucide-react';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import ProjectCard from '@/components/tecnico/ProjectCard';
import ProjectLogModal from '@/components/tecnico/ProjectLogModal';
import ManageTaskModal from '@/components/tecnico/ManageTaskModal';
import GenerateNotaModal from '@/components/tecnico/GenerateNotaModal';

export const TecnicoDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null); // El proyecto en el que está trabajando ahorita
    
    // Modales
    const [modalProject, setModalProject] = useState(null);
    const [modalType, setModalType] = useState(''); // 'log' o 'task'
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const fetchProjects = async (userId) => {
        setLoadingProjects(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .eq('tecnico_id', userId)
                .in('estado', ['activo', 'aprobado_supervisor'])
                .order('fecha_entrega_interna', { ascending: true }); // Ordenamos por fecha límite
            
            if (error) throw error;
            setProjects(data || []);
            
            // Si el técnico ya había seleccionado uno activo y recargó, actualizamos su info
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
            toast.success("Parte técnica finalizada. Ahora puedes generar la nota.");
            fetchProjects(currentUser.id);
        } catch (err) {
            toast.error("Error al finalizar la tarea técnica.");
        }
        setConfirmingAction(null);
    };

    return (
        <DashboardLayout>
            {/* BANNER DE TAREA ACTIVA (Simplificado, sin cronómetro) */}
            {activeProject ? (
                <div className="bg-accent text-primary p-6 rounded-xl shadow-md mb-8 flex flex-col md:flex-row justify-between items-center border border-accent/20">
                    <div>
                        <p className="font-bold text-sm uppercase tracking-wider opacity-80">Trabajando ahora en:</p>
                        <h2 className="text-2xl font-bold">{activeProject.npu} - {activeProject.servicios?.nombre_servicio}</h2>
                        <p className="text-primary/80 font-medium">{activeProject.clientes?.nombre_empresa}</p>
                    </div>
                    <button 
                        onClick={() => setActiveProject(null)} 
                        className="mt-4 md:mt-0 bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                    >
                        Pausar / Cambiar Proyecto
                    </button>
                </div>
            ) : (
                <div className="bg-card border border-border p-8 rounded-xl shadow-sm mb-8 text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">¿En qué vas a trabajar hoy?</h2>
                    <p className="text-muted-foreground">Selecciona un proyecto de tu lista para ver las instrucciones y abrir la bitácora.</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
                {/* COLUMNA IZQUIERDA: KANBAN DE PROYECTOS */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-foreground">Mis Tareas Asignadas</h2>
                        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-bold">{projects.length} pendientes</span>
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
                            <p className="text-sm text-muted-foreground/70 mt-1">¡Buen trabajo!</p>
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA: HERRAMIENTAS DEL PROYECTO ACTIVO */}
                <div className="sticky top-8 h-fit">
                    {activeProject && (
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">Herramientas de Trabajo</h3>
                                <p className="text-sm text-muted-foreground">Opciones para el NPU {activeProject.npu}</p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg">
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center mb-2">
                                    <AlertCircle className="w-4 h-4 mr-2" /> Instrucciones del Supervisor
                                </h4>
                                <p className="text-sm text-amber-900/80 dark:text-amber-200/80 whitespace-pre-wrap">
                                    {activeProject.notas_supervisor || activeProject.comentarios_apertura || "No hay instrucciones adicionales para este proyecto."}
                                </p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border">
    
                                {activeProject.estado === 'aprobado_supervisor' ? (
                                    // SI ESTÁ APROBADO: Solo mostramos el botón de generar nota
                                    <>
                                        <p className="text-center p-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200">
                                            ✓ Evidencia Aprobada por el Supervisor
                                        </p>
                                        <button 
                                            onClick={() => { setModalProject(activeProject); setModalType('nota_entrega'); }} 
                                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-bold bg-accent text-primary-foreground hover:bg-accent/90"
                                        >
                                            Generar Nota de Entrega y Finalizar
                                        </button>
                                    </>
                                ) : (
                                    // SI ESTÁ ACTIVO: Mostramos lo de siempre (Bitácora y Subir evidencia)
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
                    )}
                </div>
            </div>

            {/* Modales */}
            {modalProject && modalType === 'log' && (
                <ProjectLogModal 
                    project={modalProject} 
                    userId={currentUser?.id} 
                    onClose={() => setModalProject(null)} 
                />
            )}
            
            {modalProject && modalType === 'task' && (
                <ManageTaskModal 
                    project={modalProject} 
                    onClose={() => setModalProject(null)} 
                    onFinalized={() => fetchProjects(currentUser?.id)} 
                />
            )}

            {/* AQUÍ AGREGAS EL NUEVO MODAL DE LA NOTA DE ENTREGA */}
            {modalProject && modalType === 'nota_entrega' && (
                <GenerateNotaModal 
                    project={modalProject} 
                    onClose={() => setModalProject(null)} 
                    onFinalized={() => fetchProjects(currentUser?.id)} 
                />
            )}

            {confirmingAction && (
                <ConfirmationModal 
                    {...confirmingAction} 
                    onCancel={() => setConfirmingAction(null)} 
                />
            )}
        </DashboardLayout>
    );
};



