import React, { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import { ManageEcotechProjectModal } from './ManageEcotechProjectModal';

// ========================================================
// TABLA PRINCIPAL DE GESTIÓN ECOTECH
// ========================================================
export const EcotechProjectsTable = ({ projects, onUpdateProject }) => {
    const [modalProject, setModalProject] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Lógica para determinar el color y texto del estatus
    const getProjectDisplayStatus = (project) => {
        const estatus = project.ecotech_estatus || 'Pendiente de Solicitud';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (estatus === 'Terminado') {
            return { text: 'Terminado', class: 'bg-green-100 text-green-800 border border-green-200' };
        }

        // Si ya se envió digitalmente (PPT y Hojas) por parte del técnico
        if (project.ecotech_hojas_campo_url && estatus === 'En Proceso') {
            // Suponiendo que el límite del lab sean 15 días desde que se envía
            return { text: 'Muestras Recibidas (Dig)', class: 'bg-blue-100 text-blue-800 font-bold' };
        }

        return { text: estatus, class: 'bg-muted text-muted-foreground font-medium border border-border' };
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => 
            (project.npu?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.clientes?.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (project.servicios?.nombre_servicio?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [projects, searchTerm]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Controles Superiores */}
            <div className="p-4 border-b border-border flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Buscar por NPU, cliente o servicio..."
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
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">NPU / Cliente</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Servicio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Info Técnica</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Archivos Muestreo</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Logística (Guías)</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Estatus Interno</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {currentItems.map(project => {
                            const displayStatus = getProjectDisplayStatus(project);
                            return (
                                <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{project.npu}</p>
                                        <p className="text-sm text-muted-foreground">{project.clientes?.nombre_empresa}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium">{project.servicios?.nombre_servicio}</td>
                                    
                                    <td className="px-6 py-4">
                                        {project.ecotech_num_proyecto ? (
                                            <div className="text-sm">
                                                <p><span className="font-bold text-muted-foreground text-xs">NO. PROY:</span> {project.ecotech_num_proyecto}</p>
                                                {project.ecotech_puntos_dia && <p><span className="font-bold text-muted-foreground text-xs">PUNTOS:</span> {project.ecotech_puntos_dia}</p>}
                                                {project.ecotech_pdf_proyecto && (
                                                    <a href={project.ecotech_pdf_proyecto} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center mt-1">
                                                        <FileText className="w-3 h-3 mr-1"/> Ver PDF Cotización
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-200">
                                                {project.ecotech_solicitud_enviada ? 'Solicitud Recibida' : 'Sin Solicitud del Técnico'}
                                            </span>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        {project.ecotech_hojas_campo_url || project.ecotech_ppt_url ? (
                                            <div className="flex flex-col gap-1">
                                                {project.ecotech_hojas_campo_url && <a href={project.ecotech_hojas_campo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Hojas Campo (PDF)</a>}
                                                {project.ecotech_ppt_url && <a href={project.ecotech_ppt_url} target="_blank" rel="noreferrer" className="text-xs text-orange-600 hover:underline">Plano (PPT)</a>}
                                            </div>
                                        ) : <span className="text-xs text-muted-foreground">No enviados por el técnico</span>}
                                    </td>

                                    <td className="px-6 py-4 text-sm">
                                        <p><span className="font-bold text-muted-foreground text-xs">ENVÍO:</span> {project.ecotech_guia_envio || '---'}</p>
                                        <p><span className="font-bold text-muted-foreground text-xs">REGRESO:</span> {project.ecotech_guia_regreso || '---'}</p>
                                    </td>
                                    
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-xs rounded-full ${displayStatus.class}`}>
                                            {displayStatus.text}
                                        </span>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setModalProject(project)} 
                                            className="bg-accent/10 text-accent hover:bg-accent hover:text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                        >
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
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