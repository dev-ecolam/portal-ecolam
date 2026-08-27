import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export const ManageTaskModal = ({ project, onClose, onFinalized }) => {
    const [comments, setComments] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [esPreliminar, setEsPreliminar] = useState(false); // NUEVO ESTADO
    const [loading, setLoading] = useState(false);

    const handleCompleteTask = async () => {
        if (!evidenceFile) return toast.error("Debes subir el archivo PDF final.");
        setLoading(true);

        try {
            const fileExt = evidenceFile.name.split('.').pop();
            const fileName = `${project.npu}_FINAL_${Date.now()}.${fileExt}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(`${project.id}/${fileName}`, evidenceFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(`${project.id}/${fileName}`);

            const { error: updateError } = await supabase
                .from('proyectos_v2')
                .update({
                    estado: 'en_revision',
                    comentarios_tecnico: comments,
                    url_evidencia: publicUrl, // Este será el PDF maestro (Flipbook)
                    url_pdf_cliente: publicUrl, // Lo copiamos aquí también por si el cliente entra directo
                    path_evidencia: `${project.id}/${fileName}`,
                    fecha_fin_tecnico_real: new Date().toISOString(),
                    es_entrega_preliminar: esPreliminar // GUARDAMOS SI ES PRELIMINAR
                })
                .eq('id', project.id);
            
            if (updateError) throw updateError;
            
            toast.success("Proyecto enviado al supervisor exitosamente.");
            onFinalized();
            onClose();
        } catch (err) {
            console.error("Error al completar la tarea:", err);
            toast.error("Error al subir evidencia. Revisa tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-primary mb-2">Entregar Proyecto: {project.npu}</h3>
                
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg mb-6">
                    <p className="text-xs text-amber-800 dark:text-amber-400 font-bold">
                        ⚠️ Importante: Asegúrate de agregar los "Marcadores" (Bookmarks) al PDF en Acrobat antes de subirlo. El supervisor lo revisará en formato Revista 3D.
                    </p>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2">Comentarios para el Supervisor</label>
                        <textarea 
                            value={comments} 
                            onChange={e => setComments(e.target.value)} 
                            rows="2" 
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Subir PDF Final</label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={(e) => setEvidenceFile(e.target.files[0])} 
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                    </div>
                    
                    {/* NUEVO: Checkbox de Fase Preliminar */}
                    <div className="flex items-start bg-muted/30 p-3 rounded-lg border border-border">
                        <div className="flex items-center h-5">
                            <input
                                id="preliminar"
                                type="checkbox"
                                checked={esPreliminar}
                                onChange={(e) => setEsPreliminar(e.target.checked)}
                                className="w-4 h-4 text-accent bg-background border-border rounded focus:ring-accent"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="preliminar" className="font-bold text-foreground cursor-pointer">Es una entrega Preliminar (Fase 1)</label>
                            <p className="text-muted-foreground text-xs mt-1">Marca esto si el proyecto requerirá regresar a tu Kanban después de entregarlo a la dependencia (ej. esperar un resolutivo para contestarlo).</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleCompleteTask} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Enviando...' : 'Enviar a Revisión Final'}
                    </button>
                </div>
            </div>
        </div>
    );
};