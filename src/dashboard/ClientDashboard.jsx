import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useUser } from '../context/UserContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import ClientProjectsList from '@/components/client/ClientProjectsList';
import ProjectsShelf from '@/components/client/ProjectsShelf';
import HeyzineViewerModal from '@/components/modals/HeyzineViewerModal';

const ClientDashboard = () => {
    const { user } = useUser();
    
    // Plantas asociadas al cliente (JSONB parseado)
    const plantas = Array.isArray(user?.plantasAsociadas) ? user.plantasAsociadas : [];
    
    // Estados de UI y Datos
    const [plantaSeleccionada, setPlantaSeleccionada] = useState(plantas.length > 0 ? plantas[0] : null);
    const [projects, setProjects] = useState([]);
    const [shelfProjects, setShelfProjects] = useState([]);
    const [clientView, setClientView] = useState('shelf');
    const [modalUrl, setModalUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProjects = async () => {
            if (!plantaSeleccionada) return;
            
            setIsLoading(true);
            try {
                // Consulta relacional usando planta_id (en lugar de cliente_id)
                const { data: fetchedProjects, error: dbError } = await supabase
                    .from('proyectos_v2')
                    .select('*, plantas(nombre_planta)')
                    .eq('planta_id', plantaSeleccionada.id)
                    .in('estado', ['Activo', 'Terminado', 'Cotización']); // Filtro opcional de estados

                if (dbError) throw dbError;

                setProjects(fetchedProjects || []);

                // Lógica del mapa para la estantería (solo terminados con URL)
                const latestProjectsMap = new Map();
                (fetchedProjects || []).forEach(project => {
                    if (project.estado === 'Terminado' && project.url_estudio_r2) {
                        const serviceId = project.nombre_estudio; 
                        const existingProject = latestProjectsMap.get(serviceId);
                        
                        const currentProjDate = project.fecha_apertura ? new Date(project.fecha_apertura).getTime() : 0;
                        const existingProjDate = existingProject && existingProject.fecha_apertura ? new Date(existingProject.fecha_apertura).getTime() : 0;

                        if (!existingProject || (currentProjDate > existingProjDate)) {
                            latestProjectsMap.set(serviceId, project);
                        }
                    }
                });

                setShelfProjects(Array.from(latestProjectsMap.values()));
            } catch (err) {
                console.error("Error al cargar proyectos desde PostgreSQL:", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, [plantaSeleccionada]); // Se recarga si cambia la planta seleccionada

    if (!plantas || plantas.length === 0) {
        return (
            <DashboardLayout>
                <div className="p-8 text-center animate-in fade-in">
                    <h2 className="text-2xl font-bold text-primary mb-2">Sin plantas asignadas</h2>
                    <p className="text-muted-foreground">Comunícate con el administrador para que asigne una planta a tu cuenta.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="w-full animate-in fade-in">
                
                {/* Cabecera y Selector de Planta */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-3xl font-bold text-primary">Mis Proyectos</h2>
                    
                    {plantas.length > 1 && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-muted-foreground">Planta:</label>
                            <select 
                                className="p-2 border border-border rounded-lg shadow-sm bg-card text-foreground focus:ring-2 focus:ring-accent outline-none"
                                value={plantaSeleccionada.id}
                                onChange={(e) => {
                                    const seleccion = plantas.find(p => p.id === e.target.value);
                                    setPlantaSeleccionada(seleccion);
                                }}
                            >
                                {plantas.map((planta) => (
                                    <option key={planta.id} value={planta.id}>
                                        {planta.nombre_planta || planta.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="mb-6 border-b border-border">
                    <nav className="-mb-px flex space-x-8">
                        <button onClick={() => setClientView('shelf')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${clientView === 'shelf' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                            Estantería Visual
                        </button>
                        <button onClick={() => setClientView('list')} className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${clientView === 'list' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}>
                            Lista Detallada
                        </button>
                    </nav>
                </div>
                
                {isLoading ? (
                    <div className="text-center py-10 font-medium text-muted-foreground animate-pulse">Cargando proyectos de la planta...</div>
                ) : error ? (
                    <div className="text-center py-10 text-destructive">Error al cargar proyectos. Intenta recargar la página.</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12 bg-muted rounded-lg border border-dashed border-border">
                        <p className="text-muted-foreground">Aún no hay proyectos activos o terminados para mostrar en esta planta.</p>
                    </div>
                ) : clientView === 'shelf' ? (
                    <ProjectsShelf projects={shelfProjects} onOpenModal={setModalUrl} />
                ) : (
                    <ClientProjectsList projects={projects} onOpenModal={setModalUrl} />
                )}

                {modalUrl && <HeyzineViewerModal url={modalUrl} onClose={() => setModalUrl(null)} />}
            </div>
        </DashboardLayout>    
    );
};

export default ClientDashboard;