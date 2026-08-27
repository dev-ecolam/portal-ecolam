import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Send } from 'lucide-react';


// ========================================================
// MODAL DE GESTIÓN (Asignar # Proyecto, Guías, etc.)
// ========================================================
export const ManageEcotechProjectModal = ({ project, onClose, onFinalized }) => {
    // Estados Formulario
    const [labProjectNumber, setLabProjectNumber] = useState(project.ecotech_num_proyecto || '');
    const [pdfCotizacionFile, setPdfCotizacionFile] = useState(null); // Nuevo: Archivo PDF
    
    const [guiaEnvio, setGuiaEnvio] = useState(project.ecotech_guia_envio || '');
    const [guiaRegreso, setGuiaRegreso] = useState(project.ecotech_guia_regreso || '');
    const [notes, setNotes] = useState(project.notas_proveedor || '');
    
    const [loading, setLoading] = useState(false);
    
    const currentStatus = project.ecotech_estatus || 'Pendiente de Solicitud';

    // Función genérica para actualizar estados rápidos
    const handleUpdateStatus = async (updateData) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('proyectos_v2').update(updateData).eq('id', project.id);
            if (error) throw error;
            toast.success("Estado actualizado.");
            onFinalized();
            onClose();
        } catch (err) {
            toast.error("Error al actualizar.");
        } finally {
            setLoading(false);
        }
    };

    // Botón Principal: Guardar Cambios Manuales (Números y Guías)
    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            let pdfUrl = project.ecotech_pdf_proyecto;

            // Si subieron un PDF de la cotización, lo guardamos en Storage
            if (pdfCotizacionFile) {
                const path = `${project.id}/ecotech_cotizacion_${Date.now()}.pdf`;
                await supabase.storage.from('evidencias').upload(path, pdfCotizacionFile);
                const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
                pdfUrl = data.publicUrl;
            }

            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    ecotech_num_proyecto: labProjectNumber,
                    ecotech_pdf_proyecto: pdfUrl,
                    ecotech_guia_envio: guiaEnvio,
                    ecotech_guia_regreso: guiaRegreso,
                    notas_proveedor: notes,
                    // Si ya le asignó un número, lo pasamos automáticamente a "Asignado - Esperando Muestras"
                    ecotech_estatus: (!project.ecotech_num_proyecto && labProjectNumber) ? 'En Proceso' : currentStatus
                })
                .eq('id', project.id);

            if (error) throw error;
            toast.success("Información guardada.");
            onFinalized();
            onClose();
        } catch (err) {
            toast.error("No se pudieron guardar los cambios.");
        } finally { 
            setLoading(false); 
        }
    };

    // Botón Rápido: Finalizar
    const handleFinishProject = () => {
        if (!guiaRegreso) return toast.error("Por favor, introduce primero el número de Guía de Regreso en el formulario.");
        
        handleUpdateStatus({ 
            ecotech_estatus: 'Terminado',
            estado: 'activo' // Opcional: Esto lo regresa al Kanban del Técnico para que cierre el ciclo
        });
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-xl border border-border max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-primary">Gestionar: {project.npu}</h3>
                        <p className="text-sm font-bold text-accent mt-1">Estatus actual: {currentStatus}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                {/* Si el Técnico ya envió sus datos, los mostramos aquí */}
                {project.ecotech_solicitud_enviada && (
                    <div className="bg-muted/30 p-4 rounded-xl border border-border mb-6 space-y-2 text-sm">
                        <h4 className="font-bold text-foreground">📌 Solicitud del Técnico</h4>
                        <p><span className="font-bold text-muted-foreground">Fechas Visita:</span> {project.ecotech_fechas_visita || 'No especificadas'}</p>
                        <p><span className="font-bold text-muted-foreground">Puntos/Día:</span> {project.ecotech_puntos_dia || 'No especificados'}</p>
                    </div>
                )}

                <div className="space-y-5">
                    {/* Sección 1: Asignación de Número (Respuesta de Ecotech) */}
                    <div className="p-5 border border-border rounded-xl bg-background space-y-4">
                        <h4 className="font-bold flex items-center text-primary"><FileText className="w-4 h-4 mr-2"/> 1. Asignación Laboratorio</h4>
                        <div>
                            <label className="block text-sm font-bold mb-1">Número de Proyecto Asignado</label>
                            <input type="text" placeholder="Ej. ECO-2026-891" value={labProjectNumber} onChange={e => setLabProjectNumber(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"/>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 text-muted-foreground">Subir Cotización/Acuse PDF (Opcional)</label>
                            <input type="file" accept=".pdf" onChange={e => setPdfCotizacionFile(e.target.files[0])} className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-3 file:py-1.5 cursor-pointer"/>
                            {project.ecotech_pdf_proyecto && <p className="text-xs text-green-600 font-bold mt-2">✓ PDF guardado anteriormente</p>}
                        </div>
                    </div>

                    {/* Sección 2: Logística de Muestras */}
                    <div className="p-5 border border-border rounded-xl bg-background space-y-4">
                        <h4 className="font-bold flex items-center text-primary"><Send className="w-4 h-4 mr-2"/> 2. Logística y Envío</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Guía de Envío (Hielera)</label>
                                <input type="text" value={guiaEnvio} onChange={e => setGuiaEnvio(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Guía de Regreso</label>
                                <input type="text" value={guiaRegreso} onChange={e => setGuiaRegreso(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none"/>
                            </div>
                        </div>
                    </div>

                    {/* Sección 3: Notas Adicionales */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Notas y Observaciones del Proveedor</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" className="w-full px-4 py-3 border border-border rounded-lg bg-background outline-none focus:border-accent"></textarea>
                    </div>
                </div>

                {/* Acciones */}
                <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3">
                    
                    {currentStatus !== 'Terminado' ? (
                        <button onClick={handleFinishProject} disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                            Marcar como Terminado
                        </button>
                    ) : (
                        <span className="text-sm font-bold text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> Proyecto Terminado</span>
                    )}

                    <div className="flex w-full md:w-auto gap-3">
                        <button onClick={onClose} disabled={loading} className="flex-1 md:flex-none px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cerrar</button>
                        <button onClick={handleSaveChanges} disabled={loading} className="flex-1 md:flex-none bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                            {loading ? 'Guardando...' : 'Guardar Información'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};