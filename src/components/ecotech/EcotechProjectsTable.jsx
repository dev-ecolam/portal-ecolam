import React, { useState, useMemo } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { ManageEcotechProjectModal } from './ManageEcotechProjectModal';

export const EcotechProjectsTable = ({ projects, onUpdateProject }) => {
    const [modalProject, setModalProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Estado para ocultar el punto rojo tras pasar el ratón
    const [viewedAlerts, setViewedAlerts] = useState(new Set());

    const getLogistica = (project) => {
        if (!project.logistica_ecotech) return {};
        return Array.isArray(project.logistica_ecotech) ? project.logistica_ecotech[0] || {} : project.logistica_ecotech;
    };

    const getProjectDisplayStatus = (project) => {
        const logistica = getLogistica(project);
        const estatus = logistica.estatus || 'Pendiente de Solicitud';
        
        if (estatus === 'Terminado') return { text: 'Terminado', class: 'bg-green-100 text-green-800 border border-green-200' };
        if (project.ecotech_hojas_campo_url && estatus === 'En Proceso') return { text: 'Muestras Recibidas (Dig)', class: 'bg-blue-100 text-blue-800 font-bold' };

        return { text: estatus, class: 'bg-muted text-muted-foreground font-medium border border-border' };
    };

    const getDaysElapsed = (dateString) => {
        if (!dateString) return 0;
        const diff = new Date() - new Date(dateString);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const getTimeStatus = (project, logistica) => {
        if (logistica.estatus === 'Terminado') {
            return { text: 'Logística Cerrada', class: 'bg-green-50 text-green-700 border-green-200' };
        }
        
        if (logistica.fecha_envio_fisico) {
            const days = getDaysElapsed(logistica.fecha_envio_fisico);
            return { text: `${days} días desde envío`, class: days > 15 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-purple-50 text-purple-700 border-purple-200' };
        }
        
        if (logistica.fecha_recepcion_digital) {
            const days = getDaysElapsed(logistica.fecha_recepcion_digital);
            return { text: `${days} días desde exp. digital`, class: days > 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200' };
        }
        
        if (logistica.fecha_asignacion) {
            const days = getDaysElapsed(logistica.fecha_asignacion);
            return { text: `${days} días desde asignación`, class: days > 30 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-muted text-muted-foreground border-border' };
        }
        
        if (logistica.fecha_solicitud) {
            const days = getDaysElapsed(logistica.fecha_solicitud);
            return { text: `${days} días desde solicitud`, class: days > 2 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200' };
        }
        
        const openDays = getDaysElapsed(project.fecha_apertura);
        return { text: `${openDays} días activo`, class: 'bg-muted text-muted-foreground border-border' };
    };

    const needsAttention = (project) => {
        const logistica = getLogistica(project);
        if (project.ecotech_solicitud_enviada && !project.ecotech_num_proyecto) return true;
        if (project.ecotech_hojas_campo_url && !logistica.guia_envio) return true;
        return false;
    };

    const handleRowHover = (projectId) => {
        if (!viewedAlerts.has(projectId)) {
            setViewedAlerts(prev => new Set(prev).add(projectId));
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => 
            (project.npu?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.plantas?.nombre_comercial?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.plantas?.nombre_planta?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.servicios?.nombre_servicio?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [projects, searchTerm]);

    const sortedProjects = useMemo(() => {
        return [...filteredProjects].sort((a, b) => {
            const attentionA = needsAttention(a);
            const attentionB = needsAttention(b);

            if (attentionA && !attentionB) return -1;
            if (!attentionA && attentionB) return 1;

            const timeA = new Date(a.fecha_apertura).getTime();
            const timeB = new Date(b.fecha_apertura).getTime();
            return timeA - timeB; 
        });
    }, [filteredProjects]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Buscar por NPU o planta..."
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-1 focus:ring-accent outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="flex items-center">
                    <span className="text-sm font-bold text-muted-foreground mr-2">Mostrar:</span>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    >
                        <option value={10}>10 filas</option>
                        <option value={25}>25 filas</option>
                        <option value={50}>50 filas</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase whitespace-nowrap">NPU</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase min-w-[200px]">Cliente y Servicio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase min-w-[220px]">Info del Proyecto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Cronómetro</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Estatus</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {currentItems.map(project => {
                            const displayStatus = getProjectDisplayStatus(project);
                            const logistica = getLogistica(project);
                            // Verificamos si necesita atención y si NO lo hemos visto aún
                            const showDot = needsAttention(project) && !viewedAlerts.has(project.id);
                            const timeStatus = getTimeStatus(project, logistica);
                            
                            return (
                                <tr 
                                    key={project.id} 
                                    className="hover:bg-muted/30 transition-colors"
                                    onMouseEnter={() => handleRowHover(project.id)}
                                >
                                    {/* COLUMNA 1: NPU AISLADO */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <p className="font-bold text-primary">{project.npu}</p>
                                            <div className={`w-2.5 h-2.5 bg-red-500 rounded-full ml-2 transition-opacity duration-300 ${showDot ? 'opacity-100 animate-pulse' : 'opacity-0'}`} title="Requiere Acción"></div>
                                        </div>
                                    </td>
                                    
                                    {/* COLUMNA 2: CLIENTE Y SERVICIO JUNTOS */}
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-foreground">{project.plantas?.nombre_comercial || project.plantas?.nombre_planta}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{project.servicios?.nombre_servicio}</p>
                                    </td>
                                    
                                    {/* COLUMNA 3: DETALLES DEL PROYECTO */}
                                    <td className="px-6 py-4">
                                        {project.ecotech_num_proyecto ? (
                                            <div className="text-sm space-y-1.5">
                                                <p className="flex justify-between items-center bg-muted/50 px-2 py-1 rounded">
                                                    <span className="font-bold text-muted-foreground text-[10px] uppercase">N. Lab:</span> 
                                                    <span className="font-bold text-foreground">{project.ecotech_num_proyecto}</span>
                                                </p>
                                                {project.ecotech_puntos_dia && (
                                                    <p className="flex justify-between items-center">
                                                        <span className="font-bold text-muted-foreground text-[10px] uppercase">Puntos:</span> 
                                                        <span>{project.ecotech_puntos_dia}</span>
                                                    </p>
                                                )}
                                                {logistica.guia_envio && (
                                                    <p className="flex justify-between items-center">
                                                        <span className="font-bold text-muted-foreground text-[10px] uppercase">Envío:</span> 
                                                        <span className="font-mono text-xs">{logistica.guia_envio}</span>
                                                    </p>
                                                )}
                                                {logistica.guia_regreso && (
                                                    <p className="flex justify-between items-center">
                                                        <span className="font-bold text-muted-foreground text-[10px] uppercase">Regreso:</span> 
                                                        <span className="font-mono text-xs">{logistica.guia_regreso}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-block text-xs text-orange-600 font-bold bg-orange-50 px-3 py-1.5 rounded border border-orange-200">
                                                {project.ecotech_solicitud_enviada ? 'Solicitud Recibida' : 'Esperando al Técnico'}
                                            </span>
                                        )}
                                    </td>

                                    {/* COLUMNA 4: CRONÓMETRO */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-block whitespace-nowrap text-[11px] font-bold px-2.5 py-1.5 rounded-md border ${timeStatus.class}`}>
                                            {timeStatus.text}
                                        </span>
                                    </td>
                                    
                                    {/* COLUMNA 5: ESTATUS */}
                                    <td className="px-6 py-4">
                                        <span className={`inline-block whitespace-nowrap px-3 py-1 text-xs rounded-full ${displayStatus.class}`}>
                                            {displayStatus.text}
                                        </span>
                                    </td>
                                    
                                    {/* COLUMNA 6: ACCIONES */}
                                    <td className="px-6 py-4 text-right space-y-2">
                                        <button 
                                            onClick={() => setModalProject(project)} 
                                            className="w-full bg-accent/10 text-accent hover:bg-accent hover:text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-colors whitespace-nowrap"
                                        >
                                            Gestionar
                                        </button>
                                        
                                        {project.ecotech_hojas_campo_url && (
                                            <a 
                                                href={project.ecotech_hojas_campo_url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="w-full flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors mt-2 whitespace-nowrap"
                                            >
                                                <ExternalLink className="w-3 h-3 mr-1" /> Ver Digital
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                <span>Página {currentPage} de {totalPages || 1}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50">Anterior</button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50">Siguiente</button>
                </div>
            </div>
            
            {modalProject && <ManageEcotechProjectModal project={modalProject} onClose={() => setModalProject(null)} onFinalized={onUpdateProject} />}
        </div>
    );
};