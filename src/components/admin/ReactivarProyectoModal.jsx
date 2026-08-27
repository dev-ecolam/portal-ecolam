import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export const ReactivarProyectoModal = ({ project, onClose, onFinalized }) => {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleReactivar = async () => {
        if (!motivo.trim()) return toast.error("Debes escribir el motivo de la reactivación.");
        setLoading(true);

        try {
            // Guardamos el motivo en los comentarios de apertura para que el técnico lo vea como instrucción
            const nuevasInstrucciones = `[REACTIVADO: ${new Date().toLocaleDateString()}] ${motivo}\n\nInstrucciones originales: ${project.comentarios_apertura || ''}`;

            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    estado: 'activo', // Vuelve al Kanban del técnico
                    estado_dependencia: 'Pendiente', // Reiniciamos el estatus de dependencia
                    comentarios_apertura: nuevasInstrucciones,
                    es_entrega_preliminar: false, // Por defecto no es preliminar hasta que el técnico lo marque
                    // Si quieres, puedes limpiar el pdf del cliente para que no se confundan, o dejarlo como historial.
                    // url_pdf_cliente: null 
                })
                .eq('id', project.id);

            if (error) throw error;
            
            toast.success("¡Proyecto reactivado! Ya está en el Kanban del Técnico.");
            onFinalized();
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
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold text-primary mb-2">Reactivar Proyecto</h3>
                <p className="text-sm text-accent font-bold mb-4">NPU: {project.npu}</p>
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-6">
                    <p className="text-xs text-blue-800 font-medium">
                        El proyecto volverá al estado <b>Activo</b> y aparecerá inmediatamente en el tablero del técnico asignado (<b>{project.tecnicos?.nombre || 'El técnico'}</b>). Todos los acuses y PDFs anteriores se conservarán en el historial.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">Motivo de Reactivación (Instrucción para el Técnico)</label>
                        <textarea 
                            value={motivo} 
                            onChange={e => setMotivo(e.target.value)} 
                            rows="4" 
                            placeholder="Ej. Protección civil emitió requerimiento extra. Hay que contestar el resolutivo anexo."
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none text-sm"
                        ></textarea>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleReactivar} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Reactivando...' : 'Reactivar Proyecto'}
                    </button>
                </div>
            </div>
        </div>
    );
};