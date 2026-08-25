import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// ==========================================
// MODAL DE FINALIZACIÓN (Subir PDF a Supabase Storage y cambiar a en_revision)
// ==========================================
const ManageTaskModal = ({ project, onClose, onFinalized }) => {
    const [comments, setComments] = useState('');
    const [evidenceFile, setEvidenceFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleCompleteTask = async () => {
        if (!evidenceFile) return toast.error("Debes subir el archivo PDF de evidencia.");
        setLoading(true);

        try {
            // 1. Subir archivo al Storage de Supabase
            // En el handleCompleteTask del ManageTaskModal, modifica el update payload:
            const filePath = `${project.id}/${fileName}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('evidencias')
                .upload(filePath, evidenceFile); // <-- Subimos el archivo

            const { data: { publicUrl } } = supabase.storage.from('evidencias').getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('proyectos_v2')
                .update({
                    estado: 'en_revision',
                    comentarios_tecnico: comments,
                    url_evidencia: publicUrl,
                    path_evidencia: filePath, // <-- GUARDAMOS ESTO PARA QUE EL SUPERVISOR PUEDA BORRARLO
                    fecha_fin_tecnico_real: new Date().toISOString()
                })
                .eq('id', project.id);
            
            if (updateError) throw updateError;
            
            toast.success("Proyecto enviado a revisión exitosamente.");
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
                <h3 className="text-xl font-bold text-primary mb-2">Finalizar Proyecto: {project.npu}</h3>
                <p className="text-sm text-muted-foreground mb-6">El supervisor revisará tu evidencia para aprobarla o rechazarla.</p>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2">Comentarios para el Supervisor</label>
                        <textarea 
                            value={comments} 
                            onChange={e => setComments(e.target.value)} 
                            rows="3" 
                            placeholder="Detalles sobre el cierre del proyecto..."
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Subir Evidencia Técnica (PDF)</label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={(e) => setEvidenceFile(e.target.files[0])} 
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        />
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleCompleteTask} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Subiendo...' : 'Enviar a Revisión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageTaskModal;