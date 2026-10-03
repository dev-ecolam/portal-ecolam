import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { UploadCloud, CheckSquare } from 'lucide-react';

export const ModalFinalizarTarea = ({ project, currentUser, onClose, onFinalized }) => {
    const [pdfFile, setPdfFile] = useState(null);
    const [notasSupervisor, setNotasSupervisor] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinalizar = async () => {
        if (!pdfFile) return toast.error("Es obligatorio subir el PDF del estudio finalizado.");

        setLoading(true);
        try {
            // 1. ELIMINAR EL PDF ANTERIOR (Si existe, ej. el Preliminar)
            if (project.url_estudio_r2) {
                const urlParts = project.url_estudio_r2.split('/public/documentos_proyectos/');
                if (urlParts.length > 1) {
                    const oldFilePath = urlParts[1];
                    // Borrado silencioso del archivo viejo en la nube
                    await supabase.storage.from('documentos_proyectos').remove([oldFilePath]);
                }
            }

            // 2. SUBIR EL NUEVO PDF DEFINITIVO
            const ext = pdfFile.name.split('.').pop();
            const filePath = `estudios/${project.npu}_${Date.now()}.${ext}`;
            
            const { error: uploadError } = await supabase.storage
                .from('documentos_proyectos')
                .upload(filePath, pdfFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos_proyectos')
                .getPublicUrl(filePath);

            // 3. ACTUALIZAR PROYECTO A "REVISIÓN"
            const { error: dbError } = await supabase
                .from('proyectos_v2')
                .update({
                    url_estudio_r2: publicUrl, // Aquí sobrescribe la ruta vieja con la nueva
                    estado_operativo: 'Revisión',
                    fecha_fin_tecnico_real: new Date().toISOString()
                })
                .eq('id', project.id);

            if (dbError) throw dbError;

            // 4. REGISTRO EN BITÁCORA
            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: currentUser.id,
                mensaje: `✅ Nuevo Estudio subido a revisión.\nArchivo: ${pdfFile.name}\n${notasSupervisor ? `Notas: ${notasSupervisor}` : ''}`
            }]);

            toast.success("Tarea finalizada y nuevo documento enviado a revisión.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar a revisión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in-95">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" /> Enviar a Revisión
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Sube el documento (.pdf). Si ya existía un preliminar, este nuevo archivo lo reemplazará por completo.</p>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                        <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <UploadCloud className="w-4 h-4 mr-2" />
                            Estudio / Reporte (.pdf) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="file" 
                            accept=".pdf"
                            onChange={e => setPdfFile(e.target.files[0])}
                            className="w-full text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-blue-800 file:bg-blue-200 hover:file:bg-blue-300 cursor-pointer"
                        />
                        {pdfFile && (
                            <div className="mt-3 text-xs font-bold text-emerald-700 flex items-center">
                                ✅ {pdfFile.name}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Notas para el Supervisor (Opcional)</label>
                        <textarea 
                            value={notasSupervisor} 
                            onChange={e => setNotasSupervisor(e.target.value)} 
                            rows="3" 
                            placeholder="Aclaraciones, observaciones sobre el estudio..."
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
                        ></textarea>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 border-t border-border/50 pt-4">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleFinalizar} disabled={loading} className="bg-accent text-white hover:bg-accent/90 font-bold py-2.5 px-6 rounded-lg shadow-md transition-colors">
                        {loading ? 'Enviando...' : 'Subir y Enviar'}
                    </button>
                </div>
            </div>
        </div>
    );
};