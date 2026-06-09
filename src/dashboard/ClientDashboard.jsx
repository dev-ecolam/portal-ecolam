import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

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
                const q = query(collection(db, "proyectos"), where("clienteId", "==", activeClientId));
                const querySnapshot = await getDocs(q);
                
                const fetchedProjects = [];
                querySnapshot.forEach((doc) => {
                    fetchedProjects.push({ id: doc.id, ...doc.data() });
                });

                setProjects(fetchedProjects);

                const latestProjectsMap = new Map();
                fetchedProjects.forEach(project => {
                    if (project.estadoCliente === 'Terminado' && project.urlHeyzine) {
                        const serviceId = project.servicioNombre; 
                        const existingProject = latestProjectsMap.get(serviceId);
                        const currentProjDate = project.fechaApertura ? new Date(project.fechaApertura).getTime() : 0;
                        const existingProjDate = existingProject && existingProject.fechaApertura ? new Date(existingProject.fechaApertura).getTime() : 0;

                        if (!existingProject || (currentProjDate > existingProjDate)) {
                            latestProjectsMap.set(serviceId, project);
                        }
                    }
                });

                setShelfProjects(Array.from(latestProjectsMap.values()));
            } catch (err) {
                console.error("Error al cargar proyectos:", err);
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
    );
};

const ClientProjectsList = ({ projects, onOpenModal }) => {
    const [activeAccordion, setActiveAccordion] = useState(null); 
    const groupedProjects = projects.reduce((acc, project) => {
        const key = project.dependencia || 'Sin Dependencia';
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
    }, {});

    const toggleAccordion = (key) => setActiveAccordion(activeAccordion === key ? null : key);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-MX') : '---';
    const getStatusClass = (estado) => estado === 'Activo' ? 'bg-amber-100 text-amber-800' : 'bg-accent/20 text-primary';
    
    return (
        <div className="space-y-4">
            {Object.entries(groupedProjects).map(([dependencia, projs]) => (
                <div key={dependencia} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <button onClick={() => toggleAccordion(dependencia)} className="w-full p-5 text-left font-bold text-lg text-primary flex justify-between items-center hover:bg-muted transition">
                        <span>{dependencia} <span className="text-sm font-normal text-muted-foreground ml-2">({projs.length})</span></span>
                        <span className={`transform transition-transform duration-300 ${activeAccordion === dependencia ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {activeAccordion === dependencia && (
                        <ul className="divide-y divide-border border-t border-border">
                            {projs.map(project => (
                                <li key={project.id} className="p-4 md:px-6 md:py-4 flex flex-col md:flex-row md:items-center hover:bg-muted/50">
                                    <div className="flex-1 mb-2 md:mb-0"><span className="text-sm font-semibold text-foreground">{project.servicioNombre}</span></div>
                                    <div className="w-full md:w-40 mb-2 md:mb-0"><span className="text-sm text-muted-foreground">{formatDate(project.fechaApertura)}</span></div>
                                    <div className="w-full md:w-32 mb-2 md:mb-0">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClass(project.estadoCliente)}`}>
                                            {project.estadoCliente}
                                        </span>
                                    </div>
                                    <div className="w-full md:w-40 flex items-center gap-3">
                                        {project.urlHeyzine && (
                                            <button onClick={() => onOpenModal(project.urlHeyzine)} className="text-sm font-medium text-primary hover:text-accent transition-colors">
                                                Ver Proyecto
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
};

const ProjectsShelf = ({ projects, onOpenModal }) => {
    const coverTemplateUrl = "https://firebasestorage.googleapis.com/v0/b/portal-evelsa.firebasestorage.app/o/portada%20Carpetas.jpeg?alt=media&token=417eb65c-1694-4efc-9e2a-55528d43a8d6";

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {projects.map(project => (
                <button key={project.id} className="group text-left focus:outline-none flex flex-col" onClick={() => onOpenModal(project.urlHeyzine)}>
                    <div className="relative pt-[141%] bg-muted rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden border border-border">
                        <img src={coverTemplateUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <h4 className="font-bold text-sm md:text-base leading-tight drop-shadow-md">{project.clienteNombre || "Proyecto"}</h4>
                            <div className="w-8 h-0.5 bg-accent my-2"></div>
                            <p className="text-xs text-gray-200 line-clamp-2">{project.servicioNombre}</p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

const HeyzineViewerModal = ({ url, onClose }) => (
    <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
        <div className="bg-card rounded-2xl shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 bg-muted border-b border-border">
                <h3 className="text-lg font-bold text-primary">Visor Interactivo</h3>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-background hover:bg-destructive hover:text-destructive-foreground transition-colors text-xl font-bold">&times;</button>
            </div>
            <div className="flex-grow bg-background">
                <iframe src={url} title="Visor" className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
            </div>
        </div>
    </div>
);