import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { formatDate } from '../../utils/helpers';
import { ConfirmationModal } from '../ui/UIComponents';

export const ProjectsTable = ({ projects, userRole, supervisorView, onManageClick, onUpdateProject }) => {
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggleRow = (projectId) => {
        setExpandedRowId(prevId => (prevId === projectId ? null : projectId));
    }; 
    
    // Filtrado inteligente leyendo de las tablas relacionadas (JOINs)
    const filteredProjects = userRole === 'administrador'
        ? projects.filter(p => {
            const search = searchTerm.toLowerCase();
            return (
                p.npu?.toLowerCase().includes(search) || 
                p.nombre_estudio?.toLowerCase().includes(search) ||
                p.plantas?.nombre_planta?.toLowerCase().includes(search) || 
                p.servicios?.nombre_servicio?.toLowerCase().includes(search)
            );
        })
        : projects;

    const currentItems = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Activar proyecto manualmente
    const handleActivateProject = async (projectId) => {
        try {
            await supabase.from('proyectos_v2').update({ 
                estado: 'Activo', 
                fecha_activacion: new Date().toISOString() 
            }).eq('id', projectId);
            
            if (onUpdateProject) onUpdateProject();
        } catch (error) {
            console.error("Error al activar:", error);
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            await supabase.from('proyectos_v2').delete().eq('id', projectId);
            setConfirmingAction(null);
            if (onUpdateProject) onUpdateProject();
        } catch (error) {
            console.error("Error al borrar:", error);
        }
    };

    const promptDeleteProject = (projectId, projectNpu) => {
        setConfirmingAction({
            title: "Confirmar Eliminación",
            message: `¿Estás seguro de que quieres borrar el proyecto ${projectNpu}? Esta acción no se puede deshacer.`,
            onConfirm: () => handleDeleteProject(projectId),
            confirmText: "Sí, Borrar",
            confirmColor: "bg-red-600"
        });
    };

    return (
        <>
            {userRole === 'administrador' && (
                <div className="mb-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por NPU, Estudio, Planta o Servicio..."
                        className="w-full md:w-1/2 px-4 py-2 border border-border rounded-lg bg-background shadow-sm outline-none focus:ring-2 focus:ring-accent"
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">Mostrar:</span>
                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-1.5 border border-border rounded-lg bg-background shadow-sm outline-none">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            )}
            
            <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha Alta</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">NPU / Estudio</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Planta</th>
                            
                            {userRole === 'administrador' && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Proveedor</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Finanzas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Ref. PO</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Notas</th>
                                </>
                            )}

                            {userRole === 'supervisor' && supervisorView === 'techDetail' && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Prioridad</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Días Hábiles</th>
                                </>
                            )}
                            
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-8 text-muted-foreground italic">No se encontraron proyectos activos.</td></tr>
                        ) : currentItems.map(project => {
                            const isExpanded = expandedRowId === project.id;
                            const plantaNombre = project.plantas?.nombre_planta || '---';
                            const proveedorNombre = project.proveedores?.nombre_proveedor || project.proveedor_nombre || '---';
                            const estadoVisual = (project.estado || '').toLowerCase();

                            return (
                                <React.Fragment key={project.id}>
                                    <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{formatDate(project.fecha_apertura)}</td>
                                        <td className="px-4 py-3">
                                            <p className="whitespace-nowrap text-sm font-bold text-primary">{project.npu}</p>
                                            <p className="text-xs font-medium text-muted-foreground mt-0.5">{project.nombre_estudio}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{plantaNombre}</td>
                                        
                                        {userRole === 'administrador' && (
                                            <>
                                                <td className="px-4 py-3 text-sm">{proveedorNombre}</td>
                                                <td className="px-4 py-3">
                                                    <p className="whitespace-nowrap text-xs font-bold text-primary-600">C: ${(project.precio_cotizacion_cliente || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                                    <p className="whitespace-nowrap text-xs font-bold text-destructive">P: ${(project.costo_proveedor || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs">
                                                    {project.po_cliente_ref ? <span className="font-bold text-primary">{project.po_cliente_ref}</span> : <span className="text-muted-foreground">Sin PO</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs text-muted-foreground italic max-w-[150px] break-words line-clamp-2" title={project.comentarios_apertura}>
                                                        {project.comentarios_apertura || "Sin notas."}
                                                    </p>
                                                </td>
                                            </>
                                        )}

                                        {userRole === 'supervisor' && supervisorView === 'techDetail' && (
                                            <>
                                                <td className="px-4 py-3 text-sm">{project.prioridad || '1 - Normal'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="font-bold">{project.dias_habiles_registrados || 0}</span> / <span className="text-muted-foreground">{project.dias_habiles_estimados || 0}</span>
                                                </td>
                                            </>
                                        )}

                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 inline-flex text-[11px] uppercase font-bold rounded-full 
                                                ${estadoVisual === 'activo' ? 'bg-amber-100 text-amber-800' : 
                                                  estadoVisual === 'terminado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {project.estado}
                                            </span>
                                        </td>
                                        
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                {estadoVisual === 'cotización' && userRole === 'administrador' && (
                                                    <button onClick={() => handleActivateProject(project.id)} className="text-green-600 text-sm font-bold hover:underline">Activar</button>
                                                )}
                                                
                                                <button onClick={() => onManageClick(project)} className="text-primary text-sm font-bold hover:underline">Gestionar</button>
                                                
                                                {/* Botón de Detalles SOLO PARA SUPERVISORES */}
                                                {userRole === 'supervisor' && (
                                                    <button onClick={() => handleToggleRow(project.id)} className="text-muted-foreground text-sm font-medium hover:text-foreground">
                                                        {isExpanded ? 'Ocultar' : 'Detalles'}
                                                    </button>
                                                )}

                                                {estadoVisual !== 'terminado' && userRole === 'administrador' && (
                                                    <button onClick={() => promptDeleteProject(project.id, project.npu)} className="text-destructive text-sm font-bold hover:underline">Borrar</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr> 
                                    
                                    {/* Panel Expandible SOLO PARA SUPERVISORES */}
                                    {isExpanded && userRole === 'supervisor' && (
                                        <tr className="bg-muted/10 border-b-2 border-primary/20">
                                            <td colSpan="10" className="p-4 md:p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                    <div className="space-y-2 border-r border-border pr-4">
                                                        <p><span className="font-bold text-muted-foreground uppercase text-xs">Planta:</span> <br/>{plantaNombre}</p>
                                                        <p><span className="font-bold text-muted-foreground uppercase text-xs">Fecha de Activación:</span> <br/>{project.fecha_activacion ? formatDate(project.fecha_activacion) : <span className="text-amber-600 font-medium">Aún en Cotización</span>}</p>
                                                        <p><span className="font-bold text-muted-foreground uppercase text-xs">Límite Interno:</span> <br/>{formatDate(project.fecha_entrega_interna) || 'No asignado'}</p>
                                                    </div>
                                                    
                                                    <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 col-span-1 md:col-span-2">
                                                        <p className="font-bold text-accent text-xs uppercase mb-1">Comentarios de Apertura</p>
                                                        <p className="text-foreground whitespace-pre-wrap">{project.comentarios_apertura || 'Sin instrucciones específicas de apertura.'}</p>
                                                        
                                                        {project.notas_supervisor && (
                                                            <>
                                                                <div className="w-full h-px bg-border my-3"></div>
                                                                <p className="font-bold text-primary text-xs uppercase mb-1">Notas del Supervisor</p>
                                                                <p className="text-muted-foreground whitespace-pre-wrap">{project.notas_supervisor}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {!confirmingAction && totalPages > 0 && (
                <div className="mt-4 flex justify-between items-center px-2">
                    <span className="text-sm text-muted-foreground font-medium">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-2">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-1.5 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors text-sm font-medium">Anterior</button>
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-1.5 border border-border rounded-lg bg-background hover:bg-muted disabled:opacity-50 transition-colors text-sm font-medium">Siguiente</button>
                    </div>
                </div>
            )}
            
            {confirmingAction && <ConfirmationModal {...confirmingAction} onCancel={() => setConfirmingAction(null)} />}
        </>
    );
};