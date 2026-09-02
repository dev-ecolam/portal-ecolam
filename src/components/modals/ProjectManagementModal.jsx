import React, { useState, useEffect } from "react";
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';

export const ProjectManagementModal = ({ project, onClose, onUpdate, userRole }) => {
    // Inicializamos el formulario con los datos relacionales
    const [formData, setFormData] = useState({
        prioridad: project.prioridad || "1 - Normal",
        fecha_entrega_interna: project.fecha_entrega_interna ? project.fecha_entrega_interna.split('T')[0] : '',
        notas_supervisor: project.notas_supervisor || '',
        precio_cotizacion_cliente: project.precio_cotizacion_cliente || '',
        costo_proveedor: project.costo_proveedor || '',
        cotizacion_cliente_ref: project.cotizacion_cliente_ref || '',
        po_cliente_ref: project.po_cliente_ref || '',
        cotizacion_proveedor_ref: project.cotizacion_proveedor_ref || '',
    });
    
    const [loading, setLoading] = useState(false);
    const [logEntries, setLogEntries] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Estado especial para la reactivación
    const [motivoReactivacion, setMotivoReactivacion] = useState('');

    const esProyectoCompletado = project.estado === 'completado';

    // Cargar bitácoras desde SQL (ACTUALIZADO CON LAS COLUMNAS DE HOY)
    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            const { data, error } = await supabase
                .from('bitacoras_proyectos')
                .select('*, usuarios(nombre)')
                .eq('proyecto_id', project.id)
                .order('creado_en', { ascending: false });
            
            if (!error && data) setLogEntries(data);
            setLoadingLogs(false);
        };
        fetchLogs();
    }, [project.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // ==========================================
    // LÓGICA DE GUARDADO NORMAL
    // ==========================================
    const handleSave = async () => {
        setLoading(true);
        const updatePayload = {};

        if (userRole === 'supervisor') {
            updatePayload.prioridad = formData.prioridad;
            updatePayload.fecha_entrega_interna = formData.fecha_entrega_interna || null;
            updatePayload.notas_supervisor = formData.notas_supervisor;
        } else if (userRole === 'administrador') {
            updatePayload.precio_cotizacion_cliente = Number(formData.precio_cotizacion_cliente) || 0;
            updatePayload.costo_proveedor = Number(formData.costo_proveedor) || 0;
            updatePayload.cotizacion_cliente_ref = formData.cotizacion_cliente_ref;
            updatePayload.po_cliente_ref = formData.po_cliente_ref;
            updatePayload.cotizacion_proveedor_ref = formData.cotizacion_proveedor_ref;

            // Lógica Inteligente de Activación:
            if ((project.estado || '').toLowerCase() === 'cotizacion' && formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '') {
                updatePayload.estado = 'activo';
                if (!project.fecha_activacion) {
                    updatePayload.fecha_activacion = new Date().toISOString();
                }
            }
        }

        try {
            if (Object.keys(updatePayload).length > 0) {
                const { error } = await supabase
                    .from('proyectos_v2')
                    .update(updatePayload)
                    .eq('id', project.id);
                
                if (error) throw error;
            }
            
            toast.success("Proyecto actualizado correctamente.");
            onUpdate();
            onClose();
        } catch (err) {
            toast.error("Error al guardar los cambios.");
            console.error("Error al guardar:", err);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LÓGICA DE REACTIVACIÓN (Solo Admin)
    // ==========================================
    const handleReactivar = async () => {
        if (!motivoReactivacion.trim()) return toast.error("Escribe el motivo de la reactivación.");
        setLoading(true);

        try {
            const nuevasInstrucciones = `[REACTIVADO: ${new Date().toLocaleDateString()}]\nMOTIVO: ${motivoReactivacion}\n\n--- Instrucciones Anteriores ---\n${project.notas_supervisor || project.comentarios_apertura || ''}`;

            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    estado: 'activo', 
                    estado_dependencia: 'Pendiente', 
                    notas_supervisor: nuevasInstrucciones,
                    es_entrega_preliminar: false, 
                    esperando_acuse: false // Reiniciamos esta bandera también
                })
                .eq('id', project.id);

            if (error) throw error;
            
            toast.success("¡Proyecto reactivado! Devuelto al técnico.");
            onUpdate();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al reactivar el proyecto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-border">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Gestionar Proyecto</h3>
                        <p className="text-accent font-bold text-sm">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
                </div>
                
                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                    
                    {/* SI ES UN PROYECTO COMPLETADO Y ES ADMIN -> VISTA DE REACTIVACIÓN */}
                    {esProyectoCompletado && userRole === 'administrador' ? (
                        <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-xl space-y-4">
                            <h4 className="font-bold text-destructive text-lg">Este proyecto está completado y cerrado.</h4>
                            <p className="text-sm text-muted-foreground">Si la dependencia solicitó información extra o hubo un cambio, puedes reactivarlo. Volverá al tablero del técnico asignado.</p>
                            
                            <div>
                                <label className="block text-sm font-bold mb-2">Instrucciones para el Técnico (Motivo de Reactivación)</label>
                                <textarea 
                                    value={motivoReactivacion} 
                                    onChange={e => setMotivoReactivacion(e.target.value)} 
                                    rows="4" 
                                    placeholder="Ej. Hay que responder un resolutivo de Protección Civil..."
                                    className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-destructive outline-none text-sm"
                                ></textarea>
                            </div>
                        </div>
                    ) : (
                        /* VISTA NORMAL (EDICIÓN Y GESTIÓN) */
                        <>
                            {userRole === 'supervisor' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-1">Prioridad</label>
                                            <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full p-2 border border-border rounded-md bg-background">
                                                <option value="1 - Normal">Normal</option>
                                                <option value="2 - Alta">Alta</option>
                                                <option value="3 - Urgente">Urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-1">Fecha Límite Interna</label>
                                            <input type="date" name="fecha_entrega_interna" value={formData.fecha_entrega_interna} onChange={handleChange} className="w-full p-2 border border-border rounded-md bg-background"/>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Notas/Instrucciones del Supervisor</label>
                                        <textarea name="notas_supervisor" value={formData.notas_supervisor} onChange={handleChange} rows="3" className="w-full p-2 border border-border rounded-md bg-background"></textarea>
                                    </div>
                                </div>
                            )}

                            {userRole === 'administrador' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Precio Cliente (con IVA)</label>
                                            <input type="number" name="precio_cotizacion_cliente" value={formData.precio_cotizacion_cliente} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Costo Proveedor</label>
                                            <input type="number" name="costo_proveedor" value={formData.costo_proveedor} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background"/>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                                        <label className="block text-sm font-bold text-accent mb-2">Orden de Compra (PO Cliente)</label>
                                        <input type="text" name="po_cliente_ref" value={formData.po_cliente_ref} onChange={handleChange} placeholder="Ej. PO-998273" className="w-full px-3 py-2 border border-border rounded-md bg-background"/>
                                        {(!project.po_cliente_ref && formData.po_cliente_ref) && (
                                            <p className="text-xs text-accent mt-2 font-bold">⚠️ Al guardar, este proyecto pasará a estado Activo.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Ref. Cotización Cliente</label>
                                            <input type="text" name="cotizacion_cliente_ref" value={formData.cotizacion_cliente_ref} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Ref. Cotización Proveedor</label>
                                            <input type="text" name="cotizacion_proveedor_ref" value={formData.cotizacion_proveedor_ref} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background"/>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visor de Bitácoras del Técnico */}
                            <div className="pt-4 border-t border-border mt-6">
                                <label className="block text-sm font-bold mb-2 text-primary">Historial de Bitácoras (Técnico)</label>
                                <div className="bg-muted/20 border border-border rounded-lg p-4 h-48 overflow-y-auto space-y-3">
                                    {loadingLogs ? <p className="text-sm text-muted-foreground animate-pulse">Cargando bitácora...</p> : 
                                        logEntries.length > 0 ? logEntries.map(entry => (
                                        <div key={entry.id} className="text-sm bg-background border border-border p-3 rounded-lg shadow-sm">
                                            <p className="text-foreground whitespace-pre-wrap font-medium">{entry.mensaje}</p>
                                            <p className="text-muted-foreground mt-2 text-xs font-bold text-right border-t border-border pt-1">
                                                {entry.usuarios?.nombre} - {new Date(entry.creado_en).toLocaleString('es-MX')}
                                            </p>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground text-center pt-4">El técnico aún no ha reportado avances.</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <button onClick={onClose} className="px-5 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                    
                    {esProyectoCompletado && userRole === 'administrador' ? (
                        <button onClick={handleReactivar} disabled={loading} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                            {loading ? 'Reactivando...' : 'Reactivar Proyecto'}
                        </button>
                    ) : (
                        <button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectManagementModal;