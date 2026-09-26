import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabase/client';
import { formatDate } from '../../utils/helpers';
import { ConfirmationModal } from '../ui/UIComponents';

const ProjectLogs = ({ projectId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.from('bitacoras_proyectos')
            .select('*, usuarios(nombre)')
            .eq('proyecto_id', projectId)
            .order('creado_en', { ascending: false })
            .then(({ data }) => {
                setLogs(data || []);
                setLoading(false);
            });
    }, [projectId]);

    if (loading) return <p className="text-xs text-muted-foreground animate-pulse">Cargando bitácora...</p>;
    if (logs.length === 0) return <p className="text-xs text-muted-foreground italic">El técnico aún no ha reportado avances.</p>;

    return (
        <div className="bg-background rounded-lg border border-border p-3 max-h-40 overflow-y-auto space-y-2">
            {logs.map(l => (
                <div key={l.id} className="text-xs pb-2 border-b border-border last:border-0 last:pb-0">
                    <span className="font-bold text-primary">{l.usuarios?.nombre}:</span> {l.mensaje}
                    <span className="text-[10px] text-muted-foreground ml-2 font-mono">({new Date(l.creado_en).toLocaleString('es-MX')})</span>
                </div>
            ))}
        </div>
    );
};

export const ProjectsTable = ({ projects, userRole, supervisorView, onManageClick, onUpdateProject }) => {
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [confirmingAction, setConfirmingAction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleToggleRow = (projectId) => {
        setExpandedRowId(prevId => (prevId === projectId ? null : projectId));
    }; 
    
    const projectsWithMetrics = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);

        return projects.map(p => {
            const start = new Date(p.fecha_activacion || p.fecha_apertura);
            start.setHours(0,0,0,0);
            
            const diffTrans = today - start;
            const diasTranscurridos = Math.max(0, Math.floor(diffTrans / (1000 * 60 * 60 * 24)));

            let timeStatus = 'A Tiempo';
            let diasAtraso = 0;
            let sortValue = 3;

            if (p.fecha_entrega_interna) {
                const datePart = p.fecha_entrega_interna.substring(0, 10);
                const limit = new Date(`${datePart}T00:00:00`);
                limit.setHours(0,0,0,0);
                
                const diffLimit = limit - today;
                const daysToLimit = Math.ceil(diffLimit / (1000 * 60 * 60 * 24));

                if (daysToLimit < 0) {
                    timeStatus = 'Atrasado';
                    diasAtraso = Math.abs(daysToLimit);
                    sortValue = 1;
                } else if (daysToLimit <= 7) {
                    timeStatus = 'Vence Pronto';
                    sortValue = 2;
                }
            }

            return { ...p, diasTranscurridos, diasAtraso, timeStatus, sortValue };
        });
    }, [projects]);

    const filteredProjects = useMemo(() => {
        let result = projectsWithMetrics;

        if (userRole === 'administrador' && searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.npu?.toLowerCase().includes(search) || 
                p.nombre_estudio?.toLowerCase().includes(search) ||
                p.plantas?.nombre_planta?.toLowerCase().includes(search)
            );
        }

        if (userRole === 'supervisor' && supervisorView === 'techDetail') {
            result.sort((a, b) => a.sortValue - b.sortValue);
        }

        return result;
    }, [projectsWithMetrics, userRole, supervisorView, searchTerm]);

    const currentItems = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    const handleActivateProject = async (projectId) => {
        try {
            await supabase.from('proyectos_v2').update({ estado: 'Activo', fecha_activacion: new Date().toISOString() }).eq('id', projectId);
            if (onUpdateProject) onUpdateProject();
        } catch (error) {
            console.error("Error al activar:", error);
        }
    };

    const handleDeleteProject = async () => {
        if (!confirmingAction) return;
        try {
            const { error } = await supabase.from('proyectos_v2').delete().eq('id', confirmingAction.id);
            if (error) throw error;
            
            if (onUpdateProject) onUpdateProject();
        } catch (error) {
            console.error("Error al borrar:", error);
            alert("Error al eliminar el proyecto.");
        } finally {
            setConfirmingAction(null);
        }
    };

    return (
        <>
            {userRole === 'administrador' && (
                <div className="mb-4 flex justify-between items-center gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por NPU, Estudio o Planta..."
                        className="w-1/2 px-4 py-2 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm"
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
            )}
            
            <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            {/* Cambio principal de columnas para Supervisor */}
                            {userRole === 'supervisor' && supervisorView === 'techDetail' ? (
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Temporalidad</th>
                            ) : (
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Fecha Alta</th>
                            )}

                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">NPU / Estudio</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Planta</th>
                            
                            {userRole === 'administrador' && (
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Finanzas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Notas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Estado</th>
                                </>
                            )}

                            {userRole === 'supervisor' && supervisorView === 'techDetail' && (
                                <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Estatus Operativo</th>
                            )}
                            
                            <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>

                    <tbody className="bg-card divide-y divide-border">
                        {currentItems.length === 0 ? (
                            <tr><td colSpan="8" className="text-center py-8 text-muted-foreground italic">No hay proyectos.</td></tr>
                        ) : currentItems.map(project => {
                            const isExpanded = expandedRowId === project.id;
                            const plantaNombre = project.plantas?.nombre_planta || '---';

                            return (
                                <React.Fragment key={project.id}>
                                    <tr className={`hover:bg-muted/30 transition-colors ${isExpanded ? 'bg-muted/50' : ''}`}>
                                        
                                        {userRole === 'supervisor' && supervisorView === 'techDetail' ? (
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block w-max
                                                        ${project.timeStatus === 'Atrasado' ? 'bg-destructive/20 text-destructive' : 
                                                          project.timeStatus === 'Vence Pronto' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                        {project.timeStatus}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                                                        {project.diasTranscurridos} días
                                                        {project.diasAtraso > 0 && <span className="text-destructive font-bold ml-1">({project.diasAtraso} de atraso)</span>}
                                                    </span>
                                                </div>
                                            </td>
                                        ) : (
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{formatDate(project.fecha_apertura)}</td>
                                        )}

                                        <td className="px-4 py-3">
                                            <p className="whitespace-nowrap text-sm font-bold text-primary">{project.npu}</p>
                                            <p className="text-xs font-medium text-muted-foreground mt-0.5 max-w-[200px] truncate">{project.nombre_estudio}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium">{plantaNombre}</td>
                                        
                                        {userRole === 'administrador' && (
                                            <>
                                                <td className="px-4 py-3">
                                                    <p className="whitespace-nowrap text-xs font-bold text-green-600">V: ${(project.precio_cotizacion_cliente || 0).toLocaleString()}</p>
                                                    <p className="whitespace-nowrap text-xs font-bold text-destructive">C: ${(project.costo_proveedor || 0).toLocaleString()}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground italic line-clamp-2">{project.comentarios_apertura || "Sin notas."}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 text-[11px] uppercase font-bold rounded-full bg-amber-100 text-amber-800">{project.estado}</span>
                                                </td>
                                            </>
                                        )}

                                        {userRole === 'supervisor' && supervisorView === 'techDetail' && (
                                            <td className="px-4 py-3">
                                                <span className="whitespace-nowrap px-2 py-1 text-[11px] uppercase font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                                    {project.estado_operativo || 'Pendiente'}
                                                </span>
                                            </td>
                                        )}

                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-wrap items-center justify-end gap-3">
                                                {project.estado?.toLowerCase() === 'cotización' && userRole === 'administrador' && (
                                                    <button onClick={() => handleActivateProject(project.id)} className="text-green-600 text-sm font-bold hover:underline">Activar</button>
                                                )}
                                                <button onClick={() => onManageClick(project)} className="text-primary text-sm font-bold hover:underline">Gestionar</button>
                                                <button onClick={() => handleToggleRow(project.id)} className="text-muted-foreground text-sm font-medium hover:text-foreground">
                                                    {isExpanded ? 'Ocultar' : 'Detalles'}
                                                </button>
                                                
                                                {/* BOTÓN DE BORRAR PARA ADMIN */}
                                                {userRole === 'administrador' && (
                                                    <button onClick={() => setConfirmingAction(project)} className="text-destructive text-sm font-bold hover:underline">
                                                        Borrar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr> 
                                    
                                    {isExpanded && (
                                        <tr className="bg-muted/10 border-b-2 border-primary/20">
                                            <td colSpan="8" className="p-4 md:p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    
                                                    {/* COLUMNA IZQUIERDA COMPARTIDA: Datos del Proyecto */}
                                                    
                                                    <div className="space-y-4">
                                                        <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                            <p className="font-bold text-primary text-xs uppercase mb-1">Servicio a Realizar:</p>
                                                            <p className="text-sm text-foreground whitespace-pre-wrap">{project.nombre_estudio}</p>
                                                        </div>
                                                        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                                                            <p className="font-bold text-accent text-xs uppercase mb-1">Notas de Apertura</p>
                                                            <p className="text-sm text-foreground whitespace-pre-wrap">{project.comentarios_apertura || 'Sin instrucciones de apertura.'}</p>
                                                        </div>
                                                        <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border">
                                                            <div>
                                                                <p className="font-bold text-primary text-xs uppercase mb-1">Límite Interno</p>
                                                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                                                    {project.fecha_entrega_interna ? new Date(project.fecha_entrega_interna).toLocaleDateString('es-MX') : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                                                                <div>
                                                                    <p className="font-bold text-primary text-xs uppercase mb-1">Días Meta</p>
                                                                    <p cclassName="text-sm text-foreground whitespace-pre-wrap">{project.dias_asignados_tecnico || 0} hábiles</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-primary text-xs uppercase mb-1">Trabajados</p>
                                                                    <p className="text-sm text-foreground whitespace-pre-wrap">{project.dias_reales_trabajados || 0} hábiles</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* COLUMNA DERECHA CONDICIONAL: Admin vs Supervisor */}
                                                    <div className="flex flex-col space-y-4">
                                                        {userRole === 'administrador' ? (
                                                            /* VISTA ADMINISTRADOR: Logística y Proveedores */
                                                            <>
                                                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                                    <p className="font-bold text-primary text-xs uppercase mb-1">Proveedor Asignado</p>
                                                                    {/* LEYENDO LA TABLA CRUZADA CORRECTAMENTE: */}
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {project.proveedores?.nombre_proveedor || '00 - Interno'}
                                                                    </p>
                                                                </div>
                                                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                                    <p className="font-bold text-primary text-xs uppercase mb-1">Estatus Operativo</p>
                                                                    <p className="text-sm font-medium text-foreground">{project.estado_operativo || 'Pendiente'}</p>
                                                                </div>
                                                                {project.fecha_vencimiento && (
                                                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                                                        <p className="font-bold text-green-700 text-xs uppercase mb-1">Vencimiento Legal</p>
                                                                        <p className="text-sm font-medium text-green-900">{formatDate(project.fecha_vencimiento)}</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            /* VISTA SUPERVISOR: Instrucciones y Operación */
                                                            <>
                                                                <div className="bg-muted/30 p-4 rounded-lg border border-border">
                                                                    <p className="font-bold text-primary text-xs uppercase mb-1">Tus Instrucciones</p>
                                                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{project.notas_supervisor || 'No has dejado instrucciones.'}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-primary text-xs uppercase mb-2">Bitácora del Técnico</p>
                                                                    <ProjectLogs projectId={project.id} />
                                                                </div>
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
            {/* Modal de confirmación para eliminar proyecto */}
            {confirmingAction && (
                <ConfirmationModal
                    title="Eliminar Proyecto Definitivamente"
                    message={`¿Estás completamente seguro de que deseas eliminar el proyecto ${confirmingAction.npu}? Esta acción borrará permanentemente sus bitácoras, agenda y referencias, y no se puede deshacer.`}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setConfirmingAction(null)}
                    confirmText="Sí, Eliminar Proyecto"
                    cancelText="Cancelar"
                    variant="danger"
                />
            )}
        </>
    );
};