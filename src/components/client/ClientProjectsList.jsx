import React, { useState } from 'react';

const ClientProjectsList = ({ projects, onOpenModal }) => {
    const [activeAccordion, setActiveAccordion] = useState(null); 
    
    const groupedProjects = projects.reduce((acc, project) => {
        // Si tu tabla proyectos_v2 no tiene la columna dependencia, usamos un fallback temporal
        const key = project.dependencia || 'Estudios Técnicos';
        if (!acc[key]) acc[key] = [];
        acc[key].push(project);
        return acc;
    }, {});

    const toggleAccordion = (key) => setActiveAccordion(activeAccordion === key ? null : key);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('es-MX') : '---';
    const getStatusClass = (estado) => estado === 'Activo' || estado === 'activo' ? 'bg-amber-100 text-amber-800' : 'bg-accent/20 text-primary';
    
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
                                    <div className="flex-1 mb-2 md:mb-0"><span className="text-sm font-semibold text-foreground">{project.nombre_estudio}</span></div>
                                    <div className="w-full md:w-40 mb-2 md:mb-0"><span className="text-sm text-muted-foreground">{formatDate(project.fecha_apertura)}</span></div>
                                    <div className="w-full md:w-32 mb-2 md:mb-0">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusClass(project.estado)}`}>
                                            {project.estado}
                                        </span>
                                    </div>
                                    <div className="w-full md:w-40 flex items-center gap-3">
                                        {project.url_estudio_r2 && (
                                            <button onClick={() => onOpenModal(project.url_estudio_r2)} className="text-sm font-medium text-primary hover:text-accent transition-colors">
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

export default ClientProjectsList;