import React, { useState, useEffect } from "react";
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';

export const ProjectManagementModal = ({ project, onClose, onUpdate, userRole }) => {
    const [formData, setFormData] = useState({
        // Compartidos / Supervisor
        prioridad: project.prioridad || "1 - Normal",
        fecha_entrega_interna: project.fecha_entrega_interna ? project.fecha_entrega_interna.split('T')[0] : '',
        notas_supervisor: project.notas_supervisor || '',
        tecnico_id: project.tecnico_id || '', 
        
        // Administrador (Logística y Finanzas)
        proveedor_id: project.proveedor_id || '',
        estado: project.estado || 'Cotización',
        comentarios_apertura: project.comentarios_apertura || '',
        precio_cotizacion_cliente: project.precio_cotizacion_cliente || '',
        costo_proveedor: project.costo_proveedor || '',
        cotizacion_cliente_ref: project.cotizacion_cliente_ref || '',
        po_cliente_ref: project.po_cliente_ref || '',
        cotizacion_proveedor_ref: project.cotizacion_proveedor_ref || '',
        
        // Documentos PDF
        url_cotizacion_cliente: project.url_cotizacion_cliente || '',
        url_po_cliente: project.url_po_cliente || '',
        url_cotizacion_proveedor: project.url_cotizacion_proveedor || '',
        url_po_proveedor: project.url_po_proveedor || ''
    });
    
    const [loading, setLoading] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [logEntries, setLogEntries] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);
    const [motivoReactivacion, setMotivoReactivacion] = useState('');
    
    // Estados nuevos para Supervisor
    const [activeTechs, setActiveTechs] = useState([]);
    const [nuevosDias, setNuevosDias] = useState('');
    // Control visual para desplegar la zona de peligro
    const [showReassign, setShowReassign] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    // Acción A: Solo guarda la nota
    const handleUpdateNote = async () => {
        setLoadingAction(true);
        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ notas_supervisor: formData.notas_supervisor })
                .eq('id', project.id);
            if (error) throw error;
            toast.success("Nota actualizada correctamente.");
            onFinalized(); // Refresca el dashboard
        } catch (error) {
            toast.error("Error al actualizar la nota.");
        } finally {
            setLoadingAction(false);
        }
    };
    
    // ==========================================
    // ACCIÓN: GESTIONAR ASIGNACIÓN Y TIEMPOS
    // ==========================================
    const handleReassign = async () => {
        if (!asignarDias || asignarDias <= 0) {
            return toast.error("Debes asignar una cantidad válida de días hábiles.");
        }

        setLoadingAction(true);
        try {
            // 1. Calcular la nueva fecha de entrega del proyecto (saltando fines de semana)
            let date = new Date();
            let daysAdded = 0;
            const totalDays = parseInt(asignarDias, 10);

            while (daysAdded < totalDays) {
                date.setDate(date.getDate() + 1);
                if (date.getDay() !== 0 && date.getDay() !== 6) daysAdded++;
            }
            const nuevaFechaLimite = date.toISOString().split('T')[0];

            const updatePayload = {
                dias_asignados_tecnico: totalDays,
                fecha_entrega_interna: nuevaFechaLimite
            };

            // 2. Si realmente se cambió de técnico, aplicamos la auditoría de métricas
            if (selectedTech && selectedTech !== project.tecnico_id) {
                
                // A) Guardar el historial matemático del técnico saliente (Penalización)
                if (project.tecnico_id) {
                    await supabase.from('rendimiento_tecnicos').insert([{
                        tecnico_id: project.tecnico_id,
                        proyecto_id: project.id,
                        npu_proyecto: project.npu,
                        dias_asignados: project.dias_asignados_tecnico || 0,
                        dias_trabajados_reales: project.dias_reales_trabajados || 0,
                        resultado: 'Reasignado (Penalización)'
                    }]);
                }

                // B) Dejar evidencia de texto en la bitácora del proyecto (para contexto humano)
                const nombreViejo = project.usuarios?.nombre || 'Técnico anterior';
                const nombreNuevo = activeTechs.find(t => t.id === selectedTech)?.nombre || 'Nuevo Técnico';
                const bitacoraMensaje = `⚠️ REASIGNACIÓN DE PROYECTO\nEl técnico ${nombreViejo} fue relevado. Consumió ${project.dias_reales_trabajados || 0} días de los ${project.dias_asignados_tecnico || 0} asignados.\nAsignado a: ${nombreNuevo} (Meta: ${totalDays} días nuevos).`;

                await supabase.from('bitacoras_proyectos').insert([{
                    proyecto_id: project.id,
                    autor_id: currentUser.id, // ID del supervisor que hizo el cambio
                    mensaje: bitacoraMensaje
                }]);

                // C) Reiniciar los contadores de ejecución para el nuevo técnico
                updatePayload.tecnico_id = selectedTech;
                updatePayload.dias_reales_trabajados = 0; 
                updatePayload.estado_operativo = 'Pendiente'; 
                updatePayload.ultimo_inicio_proceso = null;
            }

            // 3. Actualizar la tabla principal del proyecto
            const { error } = await supabase
                .from('proyectos_v2')
                .update(updatePayload)
                .eq('id', project.id);
                
            if (error) throw error;
            
            toast.success(selectedTech !== project.tecnico_id ? "Proyecto reasignado y métricas registradas." : "Tiempos actualizados correctamente.");
            setShowReassign(false);
            onFinalized();
        } catch (error) {
            toast.error("Error al actualizar la asignación.");
            console.error(error);
        } finally {
            setLoadingAction(false);
        }
    };

    const esProyectoCompletado = project.estado?.toLowerCase() === 'completado' || project.estado?.toLowerCase() === 'terminado';

    useEffect(() => {
        if (userRole === 'supervisor') {
            // 1. Cargar Historial de Bitácoras
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

            // 2. Cargar Técnicos Activos para Reasignación
            supabase.from('usuarios')
                .select('id, nombre')
                .eq('estado_empleado', 'Activo')
                .or('rol.eq.tecnico,roles.cs.{"tecnico"}')
                .then(({ data }) => setActiveTechs(data || []));
        }
        if (userRole === 'administrador') {
            supabase.from('proveedores')
                .select('id, nombre')
                .then(({ data }) => setProveedores(data || []));
        }
    }, [project.id, userRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Subida de archivos al Bucket
    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(fieldName);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${project.npu}_${fieldName}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos_proyectos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('documentos_proyectos')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, [fieldName]: publicUrlData.publicUrl }));
            toast.success('Documento subido con éxito');
        } catch (error) {
            console.error(error);
            toast.error('Error al subir el documento PDF');
        } finally {
            setUploadingDoc(null);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        const updatePayload = {};

        if (userRole === 'supervisor') {
            updatePayload.prioridad = formData.prioridad;
            updatePayload.fecha_entrega_interna = formData.fecha_entrega_interna || null;
            updatePayload.notas_supervisor = formData.notas_supervisor;
            
            // Lógica de Reasignación de Técnico
            if (formData.tecnico_id !== project.tecnico_id && formData.tecnico_id !== '') {
                updatePayload.tecnico_id = formData.tecnico_id;
                updatePayload.dias_asignados_tecnico = parseInt(nuevosDias, 10) || 0;
                updatePayload.estado_operativo = 'Pendiente';
            }

        } else if (userRole === 'administrador') {
            // Campos Logísticos
            updatePayload.proveedor_id = formData.proveedor_id;
            updatePayload.estado = formData.estado;
            updatePayload.comentarios_apertura = formData.comentarios_apertura;
            
            // Campos Financieros
            updatePayload.precio_cotizacion_cliente = Number(formData.precio_cotizacion_cliente) || 0;
            updatePayload.costo_proveedor = Number(formData.costo_proveedor) || 0;
            updatePayload.cotizacion_cliente_ref = formData.cotizacion_cliente_ref;
            updatePayload.po_cliente_ref = formData.po_cliente_ref;
            updatePayload.cotizacion_proveedor_ref = formData.cotizacion_proveedor_ref;
            
            // URLs de documentos
            updatePayload.url_cotizacion_cliente = formData.url_cotizacion_cliente;
            updatePayload.url_po_cliente = formData.url_po_cliente;
            updatePayload.url_cotizacion_proveedor = formData.url_cotizacion_proveedor;
            updatePayload.url_po_proveedor = formData.url_po_proveedor;

            // Lógica Inteligente de Activación:
            if ((project.estado || '').toLowerCase() === 'cotización' && formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '') {
                updatePayload.estado = 'Activo';
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

    const handleReactivar = async () => {
        if (!motivoReactivacion.trim()) return toast.error("Escribe el motivo de la reactivación.");
        setLoading(true);

        try {
            const nuevasInstrucciones = `[REACTIVADO: ${new Date().toLocaleDateString()}]\nMOTIVO: ${motivoReactivacion}\n\n--- Instrucciones Anteriores ---\n${project.notas_supervisor || project.comentarios_apertura || ''}`;

            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    estado: 'Activo', 
                    estado_dependencia: 'Pendiente', 
                    notas_supervisor: nuevasInstrucciones,
                    es_entrega_preliminar: false, 
                    esperando_acuse: false
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

    // Helper para renderizar los campos de subida de PDF
    const renderDocUpload = (label, fieldName) => (
        <div className="flex items-center justify-between bg-muted/10 p-3 rounded-lg border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
            <div className="flex items-center gap-3">
                {formData[fieldName] ? (
                    <a href={formData[fieldName]} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline">
                        Ver Archivo
                    </a>
                ) : (
                    <span className="text-xs text-muted-foreground italic">Faltante</span>
                )}
                
                <label className={`cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm ${uploadingDoc === fieldName ? 'bg-muted text-muted-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>
                    {uploadingDoc === fieldName ? 'Subiendo...' : (formData[fieldName] ? 'Reemplazar' : 'Subir PDF')}
                    <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, fieldName)}
                        disabled={uploadingDoc === fieldName}
                    />
                </label>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in duration-200">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Gestionar Proyecto</h3>
                        <p className="text-accent font-bold text-sm">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
                </div>
                
                <div className="space-y-5 overflow-y-auto pr-2 flex-1">
                    
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
                        <>
                            {/* VISTA SUPERVISOR */}
                            {userRole === 'supervisor' && (
                                <div className="space-y-6 animate-in fade-in">
                                    
                                    <div className="bg-muted/10 border border-border p-5 rounded-xl shadow-sm">
                                        <label className="block text-xs font-bold mb-3 text-primary uppercase tracking-wider">Notas / Instrucciones al Técnico</label>
                                        <textarea 
                                            name="notas_supervisor" 
                                            value={formData.notas_supervisor || ''} 
                                            onChange={handleChange} 
                                            rows="4" 
                                            placeholder="Agrega instrucciones, requerimientos o detalles específicos para el técnico..." 
                                            className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-accent resize-none mb-3"
                                        ></textarea>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={handleUpdateNote} 
                                                disabled={loadingAction}
                                                className="bg-accent text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {loadingAction ? 'Guardando...' : 'Guardar Nota'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-muted/10 border border-border p-5 rounded-xl shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-xs font-bold text-primary uppercase tracking-wider">Cambiar de Técnico</p>
                                                <p className="text-[11px] text-muted-foreground mt-1">Reasigna el proyecto o modifica los tiempos de entrega.</p>
                                            </div>
                                            {!showReassign && (
                                                <button 
                                                    onClick={() => setShowReassign(true)}
                                                    className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 ml-4 shadow-sm"
                                                >
                                                    Modificar
                                                </button>
                                            )}
                                        </div>

                                        {showReassign && (
                                            <div className="border-t border-border pt-5 mt-4 space-y-5 animate-in fade-in slide-in-from-top-2">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label className="block text-[11px] font-bold mb-1.5 text-muted-foreground uppercase">Nuevo Técnico</label>
                                                        <select 
                                                            name="tecnico_id" 
                                                            value={formData.tecnico_id} 
                                                            onChange={handleChange} 
                                                            className="w-full p-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-accent"
                                                        >
                                                            <option value={project.tecnico_id || ''}>Mantener actual...</option>

                                                            {activeTechs
                                                                .filter(t => t.id !== project.tecnico_id)
                                                                .map(t => (
                                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                                ))
                                                            }
                                                        </select>
                                                    </div>

                                                    {formData.tecnico_id !== project.tecnico_id && formData.tecnico_id !== '' ? (
                                                        <div>
                                                            <label className="block text-[11px] font-bold mb-1.5 text-accent uppercase">Días Asignados al Nuevo Tecnico</label>
                                                            <input type="number" min="1" value={nuevosDias} onChange={e => setNuevosDias(e.target.value)} placeholder="Ej. 3" className="w-full p-2.5 border border-accent/50 rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-accent"/>
                                                            <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight">Dias de trabajo para este proyecto.</p>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label className="block text-[11px] font-bold mb-1.5 text-muted-foreground uppercase">Extender/Modificar Fecha</label>
                                                            <input type="date" name="fecha_entrega_interna" value={formData.fecha_entrega_interna} onChange={handleChange} className="w-full p-2.5 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-accent"/>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex justify-end gap-3 pt-3">
                                                    <button onClick={() => setShowReassign(false)} className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                                                        Cancelar
                                                    </button>
                                                    <button onClick={handleReassign} disabled={loadingAction} className="bg-orange-500 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50">
                                                        {loadingAction ? 'Aplicando...' : 'Confirmar Cambios'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* =======================
                                VISTA ADMINISTRADOR
                            ======================== */}
                            {userRole === 'administrador' && (
                                <div className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Precio Cliente (con IVA)</label>
                                            <input type="number" name="precio_cotizacion_cliente" value={formData.precio_cotizacion_cliente} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Costo Proveedor</label>
                                            <input type="number" name="costo_proveedor" value={formData.costo_proveedor} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                                        <label className="block text-sm font-bold text-accent mb-2">Orden de Compra (PO Cliente)</label>
                                        <input type="text" name="po_cliente_ref" value={formData.po_cliente_ref} onChange={handleChange} placeholder="Ej. PO-998273" className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                                        {(!project.po_cliente_ref && formData.po_cliente_ref) && (
                                            <p className="text-xs text-accent mt-2 font-bold"> Este proyecto pasará a estado Activo.</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Ref. Cotización Cliente</label>
                                            <input type="text" name="cotizacion_cliente_ref" value={formData.cotizacion_cliente_ref} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold mb-1 text-muted-foreground">Ref. Cotización Proveedor</label>
                                            <input type="text" name="cotizacion_proveedor_ref" value={formData.cotizacion_proveedor_ref} onChange={handleChange} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                                        </div>
                                    </div>

                                    {/* MÓDULO DE SUBIDA DE PDFS */}
                                    <div className="space-y-3 mt-6 border-t border-border pt-4">
                                        <h4 className="font-bold text-sm text-primary uppercase">Documentos de Respaldo (PDF)</h4>
                                        {renderDocUpload('Cotización Cliente', 'url_cotizacion_cliente')}
                                        {renderDocUpload('Orden de Compra (PO) Cliente', 'url_po_cliente')}
                                        {renderDocUpload('Cotización Proveedor', 'url_cotizacion_proveedor')}
                                        {renderDocUpload('Orden de Compra (PO) Proveedor', 'url_po_proveedor')}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border bg-card">
                    {userRole === 'administrador' ? (
                        <div className="flex justify-end gap-3 mt-4 pt-6 pb-2 border-t border-border bg-card">
                            <button onClick={onClose} className="px-5 py-2 rounded-lg font-bold text-muted-foreground hover:bg-muted transition-colors text-sm">
                                Cancelar
                            </button>
                            
                            {esProyectoCompletado ? (
                                <button onClick={handleReactivar} disabled={loading || uploadingDoc} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md text-sm disabled:opacity-50">
                                    {loading ? 'Reactivando...' : 'Reactivar Proyecto'}
                                </button>
                            ) : (
                                <button onClick={handleSave} disabled={loading || uploadingDoc} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md text-sm disabled:opacity-50">
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 pt-4 pb-2 border-t border-border flex justify-end bg-card">
                            <button 
                                onClick={onClose} 
                                className="px-8 py-2 bg-muted-foreground/10 text-muted-foreground font-bold rounded-lg hover:bg-muted-foreground/20 transition-colors shadow-sm text-sm"
                            >
                                Salir
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};