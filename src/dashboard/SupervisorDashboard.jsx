import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import TechnicianHealthCard from '@/components/supervisor/TechnicianHealthCard';
import AssignProjectModal from '@/components/supervisor/AssignProjectModal';
import ReviewProjectsTable from '@/components/supervisor/ReviewProjectsTable';

// Componentes UI Reutilizables (Asegúrate de que las rutas coincidan con tu estructura)
import { ProjectManagementModal } from '../components/ui/ProjectManagementModal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { ActionWithReasonModal } from '../components/ui/ActionWithReasonModal';
import { ProjectsTable } from '../components/shared/ProjectsTable';
import DashboardLayout from '../components/layout/DashboardLayout';

const SupervisorDashboard = () => {
    const [view, setView] = useState('new');
    const [allProjects, setAllProjects] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [vacationRequests, setVacationRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para Modales
    const [modalProject, setModalProject] = useState(null);
    const [assignModalProject, setAssignModalProject] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Traer proyectos (Excluimos cotizaciones y archivados)
            const { data: projects } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .not('estado', 'in', '("cotizacion", "archivado")')
                .order('fecha_apertura', { ascending: false });

            // 2. Traer técnicos activos
            const { data: techs } = await supabase
                .from('usuarios')
                .select('*')
                .eq('activo', true)
                .or('rol.eq.tecnico,roles.cs.{"tecnico"}');

            // 3. Traer solicitudes de vacaciones (Si ya tienes la tabla)
            const { data: vacations } = await supabase
                .from('solicitudes_vacaciones')
                .select('*')
                .eq('estado', 'pendiente_supervisor')
                .catch(() => ({ data: [] })); // Por si aún no creas la tabla

            setAllProjects(projects || []);
            setTechnicians(techs || []);
            setVacationRequests(vacations || []);
        } catch (err) {
            console.error("Error fetching supervisor data:", err);
            toast.error("Error al cargar los datos del dashboard.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Memoizamos los cálculos para no saturar el render
    const processedData = useMemo(() => {
        if (technicians.length === 0) return { healthData: [], newProjects: [], reviewProjects: [], projectsByTechnician: {} };

        const projectsByTechnician = {};
        const reviewProjects = [];
        const newProjects = [];

        // Clasificación inicial
        allProjects.forEach(p => {
            const estado = (p.estado || '').toLowerCase();
            
            if (estado === 'activo' && !p.tecnico_id) {
                newProjects.push(p);
            } else if (estado === 'en_revision') {
                reviewProjects.push(p);
            }

            if (p.tecnico_id && (estado === 'activo' || estado === 'en_revision')) {
                if (!projectsByTechnician[p.tecnico_id]) projectsByTechnician[p.tecnico_id] = [];
                projectsByTechnician[p.tecnico_id].push(p);
            }
        });

        // Métricas de Salud del Técnico (Carga por Fechas Límite)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const healthData = technicians.map(tech => {
            const techProjects = projectsByTechnician[tech.id] || [];
            
            let aTiempo = 0;
            let porVencer = 0;
            let atrasados = 0;

            techProjects.forEach(p => {
                if (!p.fecha_entrega_interna) {
                    aTiempo++; // Si no tiene fecha, no está atrasado
                    return;
                }
                const deadline = new Date(p.fecha_entrega_interna);
                deadline.setHours(0,0,0,0);
                const diffTime = deadline - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < 0) atrasados++;
                else if (diffDays <= 3) porVencer++;
                else aTiempo++;
            });

            // Contar los terminados este año
            const terminadosEsteAno = allProjects.filter(p => 
                p.tecnico_id === tech.id && 
                p.estado === 'terminado' &&
                new Date(p.fecha_apertura).getFullYear() === today.getFullYear()
            ).length;

            return {
                id: tech.id,
                nombre: tech.nombre,
                proyectosActivos: techProjects.length,
                proyectosEntregados: terminadosEsteAno,
                aTiempo,
                porVencer,
                atrasados
            };
        });

        return { healthData, newProjects, reviewProjects, projectsByTechnician };
    }, [allProjects, technicians]);

    return (
        <DashboardLayout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primary">Panel de Supervisión</h1>
                <button onClick={fetchData} className="text-sm font-medium text-accent hover:underline">
                    Actualizar Datos
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,3fr] gap-8">
                    
                    {/* COLUMNA IZQUIERDA: Menú y Tarjetas de Técnicos */}
                    <div className="space-y-6">
                        <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-2">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Gestión General</h2>
                            
                            <button onClick={() => setView('new')} className={`w-full p-3 rounded-lg text-left transition-all flex justify-between items-center ${view === 'new' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}>
                                <span className="font-semibold">Nuevos por Asignar</span>
                                {processedData.newProjects.length > 0 && <span className="px-2 py-0.5 text-xs font-bold bg-destructive text-white rounded-full">{processedData.newProjects.length}</span>}
                            </button>
                            
                            <button onClick={() => setView('review')} className={`w-full p-3 rounded-lg text-left transition-all flex justify-between items-center ${view === 'review' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}>
                                <span className="font-semibold">Revisión Final</span>
                                {processedData.reviewProjects.length > 0 && <span className="px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">{processedData.reviewProjects.length}</span>}
                            </button>
                            
                            <button onClick={() => setView('vacations')} className={`w-full p-3 rounded-lg text-left transition-all flex justify-between items-center ${view === 'vacations' ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted'}`}>
                                <span className="font-semibold">Solicitudes Vacaciones</span>
                                {vacationRequests.length > 0 && <span className="px-2 py-0.5 text-xs font-bold bg-destructive text-white rounded-full">{vacationRequests.length}</span>}
                            </button>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1">Equipo Técnico</h2>
                            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                                {processedData.healthData.map(tech => (
                                    <button key={tech.id} onClick={() => setView(tech.id)} className={`w-full text-left transition-all rounded-xl border ${view === tech.id ? 'border-accent shadow-md ring-1 ring-accent' : 'border-border hover:border-accent/50'}`}>
                                        <TechnicianHealthCard techData={tech} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* COLUMNA DERECHA: Área de Trabajo (Tablas) */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-1 min-h-[600px]">
                        {view === 'new' && (
                            <div className="p-4">
                                <h3 className="text-xl font-bold mb-4">Proyectos Pendientes de Asignación</h3>
                                <ProjectsTable 
                                    projects={processedData.newProjects} 
                                    userRole="supervisor" 
                                    supervisorView="new" 
                                    onAssignClick={setAssignModalProject} 
                                />
                            </div>
                        )}
                        
                        {view === 'review' && (
                            <div className="p-4">
                                <h3 className="text-xl font-bold mb-4">Proyectos en Revisión Final</h3>
                                <ReviewProjectsTable projects={processedData.reviewProjects} onUpdateProject={fetchData} />
                            </div>
                        )}
                        
                        {view === 'vacations' && (
                            <div className="p-4">
                                <h3 className="text-xl font-bold mb-4">Gestión de Vacaciones</h3>
                                {/* <VacationRequestsTable requests={vacationRequests} viewerRole="supervisor" onActionComplete={fetchData} /> */}
                                <p className="text-muted-foreground">Módulo de vacaciones en construcción.</p>
                            </div>
                        )}

                        {/* Vista individual del técnico seleccionado */}
                        {processedData.healthData.find(t => t.id === view) && (
                            <div className="p-4">
                                <h3 className="text-xl font-bold mb-4">
                                    Proyectos asignados a {processedData.healthData.find(t => t.id === view).nombre}
                                </h3>
                                <ProjectsTable
                                    projects={processedData.projectsByTechnician[view] || []}
                                    userRole="supervisor"
                                    supervisorView="techDetail"
                                    onManageClick={setModalProject}
                                    onAssignClick={setAssignModalProject}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Modales */}
            {modalProject && <ProjectManagementModal project={modalProject} onClose={() => setModalProject(null)} onUpdate={fetchData} userRole="supervisor" />}
            {assignModalProject && <AssignProjectModal project={assignModalProject} technicians={technicians} onClose={() => setAssignModalProject(null)} onFinalized={fetchData} />}
        </DashboardLayout>
    );
};

export default SupervisorDashboard;