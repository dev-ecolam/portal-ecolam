import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import DashboardLayout from '../components/layout/DashboardLayout';
import ClientProjectsList from '@/components/client/ClientProjectsList';
import ProjectsShelf from '@/components/client/ProjectsShelf';
import HeyzineViewerModal from '@/components/modals/HeyzineViewerModal';

export const ClientDashboard = ({ selectedClientProfile }) => {
    const [projects, setProjects] = useState([]);
    const [shelfProjects, setShelfProjects] = useState([]);
    const [clientView, setClientView] = useState('shelf');
    const [modalUrl, setModalUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const activeClientId = selectedClientProfile?.id;

    useEffect(() => {
        const fetchProjects = async () => {
            if (!activeClientId) return;
            setIsLoading(true);
            try {
                // 2. Consulta Relacional: Trae el proyecto y hace un JOIN con la tabla clientes
                const { data: fetchedProjects, error: dbError } = await supabase
                    .from('proyectos_v2')
                    .select('*, clientes(nombre_empresa)')
                    .eq('cliente_id', activeClientId);

                if (dbError) throw dbError;

                setProjects(fetchedProjects || []);

                // 3. Lógica del mapa adaptada a los nuevos campos de la base de datos SQL
                const latestProjectsMap = new Map();
                (fetchedProjects || []).forEach(project => {
                    // estadoCliente -> estado | urlHeyzine -> url_estudio_r2
                    if (project.estado === 'Terminado' && project.url_estudio_r2) {
                        const serviceId = project.nombre_estudio; 
                        const existingProject = latestProjectsMap.get(serviceId);
                        
                        // fechaApertura -> fecha_apertura
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
    }, [activeClientId]);

    if (isLoading) return <div className="text-center py-10 font-medium text-muted-foreground animate-pulse">Cargando tus proyectos...</div>;
    if (error) return <div className="text-center py-10 text-destructive">Error al cargar proyectos. Intenta recargar la página.</div>;

    const displayName = selectedClientProfile?.planta || selectedClientProfile?.nombreCompleto || "Cliente";

    return (
        <DashboardLayout>
            <div className="w-full">
                <h2 className="text-3xl font-bold text-primary mb-6">Proyectos de {displayName}</h2>
                <div className="w-full">
                    <h2 className="text-3xl font-bold text-primary mb-6">Proyectos de {displayName}</h2>
                    
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
                    
                    {projects.length === 0 ? (
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
            </div>
        </DashboardLayout>    
    );
};
