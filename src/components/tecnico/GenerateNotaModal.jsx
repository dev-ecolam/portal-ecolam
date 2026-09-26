import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { FileArchive, FileText, CheckSquare } from 'lucide-react';

const GenerateNotaModal = ({ project, currentUser, onClose, onFinalized }) => {
    const [comments, setComments] = useState('');
    const [editableFile, setEditableFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateAndSaveNota = async () => {
        // Validación estricta del editable
        if (!editableFile) {
            return toast.error("Es obligatorio subir el archivo editable (.rar o .zip) antes de finalizar.");
        }

        setLoading(true);
        try {
            // 1. LÓGICA DE REEMPLAZO AUTOMÁTICO DEL EDITABLE
            const nombreBase = `Editable_${project.servicios?.nombre_servicio?.replace(/\s+/g, '_')}`;
            
            // Buscar si ya existe un editable para este servicio en esta planta
            const { data: existingDocs } = await supabase
                .from('documentos_clientes')
                .select('id, path_archivo')
                .eq('planta_id', project.planta_id)
                .eq('categoria', 'Editable')
                .like('nombre_archivo', `${nombreBase}%`); // Busca coincidencias

            if (existingDocs && existingDocs.length > 0) {
                // Borrar los archivos físicos del Storage
                const pathsToDelete = existingDocs.map(d => d.path_archivo);
                await supabase.storage.from('documentos_clientes').remove(pathsToDelete);
                
                // Borrar los registros de la base de datos
                const idsToDelete = existingDocs.map(d => d.id);
                await supabase.from('documentos_clientes').delete().in('id', idsToDelete);
            }

            // 2. SUBIR EL NUEVO EDITABLE
            const ext = editableFile.name.split('.').pop();
            const timestamp = Date.now();
            const filePath = `${project.planta_id}/${nombreBase}_${timestamp}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos_clientes')
                .upload(filePath, editableFile);
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos_clientes')
                .getPublicUrl(filePath);

            // Registrar el nuevo editable en la base de datos
            await supabase.from('documentos_clientes').insert([{
                planta_id: project.planta_id,
                nombre_archivo: `${nombreBase}_${timestamp}`,
                categoria: 'Editable',
                url_archivo: publicUrl,
                path_archivo: filePath,
                subido_por: currentUser?.id || null
            }]);

            // 3. GENERAR EL PDF DE LA NOTA
            const pdfDoc = new jsPDF();
            const numeroNota = `${new Date().getFullYear()}-${project.npu}`;

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(16);
            pdfDoc.text("NOTA DE ENTREGA FINAL", 105, 55, { align: 'center' });
            pdfDoc.setFontSize(11);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 20, 75);
            pdfDoc.text(`PROYECTO: ${project.npu}`, 20, 85);
            pdfDoc.text(`PLANTA: ${project.plantas?.nombre_planta || 'N/A'}`, 20, 95);
            pdfDoc.text(`SERVICIO: ${project.servicios?.nombre_servicio}`, 20, 105);
            pdfDoc.text("Comentarios Finales:", 20, 125);
            const splitComments = pdfDoc.splitTextToSize(comments, 170);
            pdfDoc.text(splitComments, 20, 132);
            
            pdfDoc.save(`Nota_Entrega_${numeroNota}.pdf`);

            // 4. MARCAR PROYECTO COMO TERMINADO
            await supabase
                .from('proyectos_v2')
                .update({ estado: 'terminado' })
                .eq('id', project.id);

            toast.success("Editable guardado, nota generada y proyecto terminado oficialmente.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el cierre. Revisa los archivos y tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" /> Cierre Final de Proyecto
                </h3>
                <p className="text-sm text-muted-foreground mb-6">El proyecto ha sido aprobado. Para finalizar, debes adjuntar los archivos editables y emitir la nota de entrega.</p>
                
                {/* ZONA DE SUBIDA OBLIGATORIA */}
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                    <label className="block text-sm font-bold text-amber-800 mb-2 flex items-center">
                        <FileArchive className="w-4 h-4 mr-2" />
                        Archivo Editable (.rar / .zip) <span className="text-red-500 ml-1">*</span>
                    </label>
                    <p className="text-[11px] text-amber-700 mb-3">
                        Al subir este archivo, se reemplazará automáticamente cualquier versión anterior de este mismo servicio para ahorrar espacio.
                    </p>
                    <input 
                        type="file" 
                        accept=".rar,.zip"
                        onChange={e => setEditableFile(e.target.files[0])}
                        className="w-full text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-amber-800 file:bg-amber-200 hover:file:bg-amber-300 cursor-pointer"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Comentarios para la Nota</label>
                    <textarea 
                        value={comments} 
                        onChange={e => setComments(e.target.value)} 
                        rows="3" 
                        placeholder="Ej. Se entregó el dictamen ergonómico en físico..."
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background outline-none focus:ring-1 focus:ring-accent text-sm"
                    ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={generateAndSaveNota} disabled={loading} className="bg-accent text-white hover:bg-accent/90 font-bold py-2 px-6 rounded-lg shadow-md flex items-center transition-colors">
                        {loading ? 'Procesando...' : <><FileText className="w-4 h-4 mr-2"/> Guardar y Terminar</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateNotaModal;