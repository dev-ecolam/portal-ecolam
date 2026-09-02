import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { formatDate } from '../../utils/helpers';
import { ConfirmationModal } from '../ui/UIComponents';
import { StatusBadge } from '../ui/UIComponents';

export const ProjectsTable = ({ projects, userRole, supervisorView, onManageClick, onAssignClick, onUpdateProject }) => {
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
                p.clientes?.nombre_empresa?.toLowerCase().includes(search) || 
                p.servicios?.nombre_servicio?.toLowerCase().includes(search) ||
                p.servicios?.dependencia?.toLowerCase().includes(search)
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
                estado: 'activo', 
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
                <div className="mb-4 flex flex-col md:flex-row justify-between items-center">
                    <input
                        type="text"
                        placeholder="Buscar por NPU, cliente, servicio o dependencia..."
                        className="w-full md:w-1/3 px-3 py-2 border border-border rounded-md mb-2 md:mb-0 bg-background"
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                    <div className="flex items-center">
                        <span className="text-sm mr-2 font-medium">Mostrar:</span>
                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border border-border rounded-md bg-background">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>
            )}
            
            <div className="overflow-x-auto bg-card rounded-lg shadow-sm border border-border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Fecha Alta</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">NPU</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Servicio</th>
                            
                            {userRole === 'administrador' && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Proveedor</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Precio</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Costo</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Ref. PO</th>
                                </>
                            )}

                            {userRole === 'supervisor' && supervisorView === 'techDetail' && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Prioridad</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Días Hábiles (Reg/Est)</th>
                                </>
                            )}
                            
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                        {currentItems.map(project => {
                            const isExpanded = expandedRowId === project.id;
                            // Obtenemos los nombres desde los JOINs de Supabase
                            const clienteNombre = project.clientes?.nombre_empresa || '---';
                            const servicioNombre = project.servicios?.nombre_servicio || '---';
                            const proveedorNombre = project.proveedores?.nombre_proveedor || '---';
                            const estadoVisual = (project.estado || '').toLowerCase();

                            return (
                                <React.Fragment key={project.id}>
                                    <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(project.fecha_apertura)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-primary">{project.npu}</td>
                                        <td className="px-4 py-2 text-sm">{clienteNombre}</td>
                                        <td className="px-4 py-2 text-sm">{servicioNombre}</td>
                                        
                                        {userRole === 'administrador' && (
                                            <>
                                                <td className="px-4 py-2 text-sm">{proveedorNombre}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">${(project.precio_cotizacion_cliente || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-destructive">${(project.costo_proveedor || 0).toFixed(2)}</td>
                                                <td className="px-4 py-2 text-xs">
                                                    {project.po_cliente_ref ? <span className="font-bold text-accent">{project.po_cliente_ref}</span> : <span className="text-muted-foreground">Sin PO</span>}
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

                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full capitalize 
                                                ${estadoVisual === 'activo' ? 'bg-amber-100 text-amber-800' : 
                                                  estadoVisual === 'terminado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {project.estado}
                                            </span>
                                        </td>
                                        
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap items-center gap-3">
                                                {estadoVisual === 'cotizacion' && (
                                                    <button onClick={() => handleActivateProject(project.id)} className="text-green-600 text-sm font-medium hover:underline">Activar</button>
                                                )}
                                                <button onClick={() => onManageClick(project)} className="text-primary text-sm font-medium hover:underline">Gestionar</button>
                                                <button onClick={() => handleToggleRow(project.id)} className="text-muted-foreground text-sm hover:text-foreground">
                                                    {isExpanded ? 'Ocultar' : 'Detalles'}
                                                </button>
                                                {estadoVisual !== 'terminado' && userRole === 'administrador' && (
                                                    <button onClick={() => promptDeleteProject(project.id, project.npu)} className="text-destructive text-sm font-medium hover:underline">Borrar</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr> 
                                    
                                    {isExpanded && (
                                        <tr className="bg-muted/20 border-b-2 border-primary/20">
                                            <td colSpan="10" className="p-4 md:p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                                    <div className="space-y-2">
                                                        <p><span className="font-bold">Cliente:</span> {clienteNombre}</p>
                                                        <p><span className="font-bold">Fecha de Activación:</span> {project.fecha_activacion ? formatDate(project.fecha_activacion) : <span className="text-amber-600">Aún en Cotización</span>}</p>
                                                        <p><span className="font-bold">Límite Interno:</span> {formatDate(project.fecha_entrega_interna)}</p>
                                                    </div>
                                                    
                                                    <div className="bg-accent/10 p-3 rounded-md border border-accent/20 col-span-1 md:col-span-2">
                                                        <p className="font-bold text-accent">Comentarios de Apertura</p>
                                                        <p className="text-foreground whitespace-pre-wrap mt-1">{project.comentarios_apertura || 'Sin instrucciones específicas.'}</p>
                                                    </div>

                                                    <div className="col-span-full">
                                                        <p className="font-bold">Notas del Supervisor:</p>
                                                        <p className="text-muted-foreground whitespace-pre-wrap">{project.notas_supervisor || 'No hay notas.'}</p>
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
            
            <div className="mt-4 flex justify-between items-center px-2">
                <span className="text-sm text-muted-foreground font-medium">Página {currentPage} de {totalPages || 1}</span>
                <div className="flex gap-2">
                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded-md bg-background disabled:opacity-50">Anterior</button>
                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded-md bg-background disabled:opacity-50">Siguiente</button>
                </div>
            </div>
            
            {confirmingAction && <ConfirmationModal {...confirmingAction} onCancel={() => setConfirmingAction(null)} />}
        </>
    );
};