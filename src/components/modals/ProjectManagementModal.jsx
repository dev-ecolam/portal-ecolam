import React, { useState, useEffect } from "react";
import { supabase } from '../../supabase/client';
import { formatDate } from '../../utils/helpers';
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

    // Cargar bitácoras desde SQL
    useEffect(() => {
        const fetchLogs = async () => {
            setLoadingLogs(true);
            const { data, error } = await supabase
                .from('bitacoras_proyectos')
                .select('*')
                .eq('proyecto_id', project.id)
                .order('fecha', { ascending: false });
            
            if (!error && data) setLogEntries(data);
            setLoadingLogs(false);
        };
        fetchLogs();
    }, [project.id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
            // Si el proyecto era cotización, no tenía PO, y ahora el admin le escribió una PO, se activa.
            if ((project.estado || '').toLowerCase() === 'cotizacion' && formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '') {
                updatePayload.estado = 'activo';
                // Solo le ponemos fecha de activación si no tenía una antes
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-border">
                <h3 className="text-xl font-bold text-primary mb-4">Gestionar Proyecto: {project.npu}</h3>
                
                <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2">
                    
                    {userRole === 'supervisor' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Prioridad</label>
                                <select name="prioridad" value={formData.prioridad} onChange={handleChange} className="w-full p-2 border rounded bg-background">
                                    <option value="1 - Normal">Normal</option>
                                    <option value="2 - Alta">Alta</option>
                                    <option value="3 - Urgente">Urgente</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Fecha Límite Interna de Entrega</label>
                                <input type="date" name="fecha_entrega_interna" value={formData.fecha_entrega_interna} onChange={handleChange} className="w-full p-2 border rounded bg-background"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Notas del Supervisor</label>
                                <textarea name="notas_supervisor" value={formData.notas_supervisor} onChange={handleChange} rows="4" className="w-full p-2 border rounded bg-background"></textarea>
                            </div>
                        </div>
                    )}

                    {userRole === 'administrador' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Precio Cliente (con IVA)</label>
                                    <input type="number" name="precio_cotizacion_cliente" value={formData.precio_cotizacion_cliente} onChange={handleChange} className="w-full px-3 py-2 border rounded bg-background"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Costo Proveedor</label>
                                    <input type="number" name="costo_proveedor" value={formData.costo_proveedor} onChange={handleChange} className="w-full px-3 py-2 border rounded bg-background"/>
                                </div>
                            </div>
                            
                            <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                                <label className="block text-sm font-bold text-accent mb-2">Orden de Compra (PO Cliente)</label>
                                <input type="text" name="po_cliente_ref" value={formData.po_cliente_ref} onChange={handleChange} placeholder="Ingresar PO activa el proyecto automáticamente" className="w-full px-3 py-2 border rounded bg-background"/>
                                {(!project.po_cliente_ref && formData.po_cliente_ref) && (
                                    <p className="text-xs text-accent mt-2 font-medium">⚠️ Al guardar, este proyecto pasará a estado Activo.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Cotización Cliente</label>
                                    <input type="text" name="cotizacion_cliente_ref" value={formData.cotizacion_cliente_ref} onChange={handleChange} className="w-full px-3 py-2 border rounded bg-background"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Cotización Proveedor</label>
                                    <input type="text" name="cotizacion_proveedor_ref" value={formData.cotizacion_proveedor_ref} onChange={handleChange} className="w-full px-3 py-2 border rounded bg-background"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Visor de Bitácoras del Técnico */}
                    <div className="pt-4 border-t border-border mt-6">
                        <label className="block text-sm font-bold mb-2 text-primary">Historial de Bitácoras (Técnico)</label>
                        <div className="bg-muted/30 border border-border rounded-md p-3 h-48 overflow-y-auto space-y-3">
                            {loadingLogs ? <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p> : 
                                logEntries.length > 0 ? logEntries.map(entry => (
                                <div key={entry.id} className="text-xs border-b border-border pb-2">
                                    <p className="text-foreground whitespace-pre-wrap font-medium">{entry.descripcion_actividad}</p>
                                    {entry.url_evidencia_r2 && (
                                        <a href={entry.url_evidencia_r2} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline mt-1 inline-block">Ver evidencia adjunta</a>
                                    )}
                                    <p className="text-muted-foreground mt-1 text-right">{formatDate(entry.fecha)}</p>
                                </div>
                            )) : <p className="text-sm text-muted-foreground">Aún no hay reportes de técnicos.</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg font-bold text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagementModal;