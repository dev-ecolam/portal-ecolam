import React, { useState, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { CheckSquare, FileArchive, Calendar, ArrowLeftRight } from 'lucide-react';

const GenerateNotaModal = ({ project, currentUser, onClose, onFinalized }) => {
    const [tipoEntrega, setTipoEntrega] = useState('final'); // 'preliminar' | 'final'
    const [fechaVencimiento, setFechaVencimiento] = useState(''); // <-- ACTUALIZADO
    const [comments, setComments] = useState('');
    const [editableFile, setEditableFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const formatearFecha = () => {
        const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
        const fecha = new Date();
        return `${fecha.getDate().toString().padStart(2, '0')} DE ${meses[fecha.getMonth()]} DE ${fecha.getFullYear()}`;
    };

    // --- EVENTOS DRAG & DROP (Solo se usan si es Final) ---
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.toLowerCase().endsWith('.zip') || file.name.toLowerCase().endsWith('.rar')) {
                setEditableFile(file);
            } else {
                toast.error("Formato no válido. Por favor, suelta un archivo .zip o .rar");
            }
        }
    };
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) setEditableFile(e.target.files[0]);
    };

    const generateAndSaveNota = async () => {
        // Validaciones estrictas según el tipo de entrega
        if (tipoEntrega === 'final') {
            if (!editableFile) return toast.error("Para el cierre final es obligatorio adjuntar el archivo editable (.zip/.rar).");
            if (!fechaVencimiento) return toast.error("Debes definir la fecha de vencimiento para la entrega final."); // <-- ACTUALIZADO
        }

        setLoading(true);
        try {
            // 1. SUBIR EDITABLE (SOLO SI ES FINAL)
            if (tipoEntrega === 'final') {
                const servicioNombre = project.servicios?.nombre_servicio || 'Servicio_General';
                const nombreBase = `Editable_${servicioNombre.replace(/\s+/g, '_')}`;
                const ext = editableFile.name.split('.').pop();
                const filePath = `editables_${project.npu}/${nombreBase}_${Date.now()}.${ext}`;

                const { error: uploadError } = await supabase.storage.from('documentos_clientes').upload(filePath, editableFile);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('documentos_clientes').getPublicUrl(filePath);

                await supabase.from('documentos_clientes').insert([{
                    planta_id: project.planta_id || null,
                    nombre_archivo: nombreBase,
                    categoria: 'Editable',
                    url_archivo: publicUrl,
                    path_archivo: filePath,
                    subido_por: currentUser?.id || null
                }]);
            }

            // 2. OBTENER CONSECUTIVO DE LA NOTA
            const anioActual = new Date().getFullYear();
            
            const { data: consecutivoActual, error: countError } = await supabase
                .rpc('incrementar_contador_notas', { anio_actual: anioActual });

            if (countError) {
                console.error("Error al generar folio:", countError);
                throw new Error("Fallo al generar el número consecutivo de la nota.");
            }
            
            const numeroNota = `${anioActual}-${consecutivoActual.toString().padStart(4, '0')}`;
            const fechaFormateada = formatearFecha();

            // 3. GENERAR EL PDF ECOLAM
            const pdfDoc = new jsPDF();
            
            pdfDoc.setTextColor(0, 102, 204);
            pdfDoc.setFontSize(22);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("ecolam", 20, 25);
            
            pdfDoc.setTextColor(120, 120, 120);
            pdfDoc.setFontSize(10);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text("consultoria | seguridad | ergonomia", 20, 31);
            
            pdfDoc.setTextColor(0, 102, 204);
            pdfDoc.setFontSize(10);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("CUMPLIMIENTO QUE", 20, 38);
            pdfDoc.text("GENERA CONFIANZA", 20, 43);

            pdfDoc.setTextColor(0, 0, 0);
            pdfDoc.setFontSize(18);
            const tituloNota = tipoEntrega === 'preliminar' ? "NOTA (PRELIMINAR)" : "NOTA DE ENTREGA";
            pdfDoc.text(tituloNota, 190, 25, { align: 'right' });
            
            pdfDoc.setFontSize(14);
            pdfDoc.setTextColor(100, 100, 100);
            pdfDoc.text(numeroNota, 190, 33, { align: 'right' });
            
            pdfDoc.setFontSize(9);
            pdfDoc.text("FECHA", 190, 43, { align: 'right' });
            pdfDoc.setTextColor(0, 0, 0);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text(fechaFormateada, 190, 48, { align: 'right' });

            pdfDoc.setFillColor(240, 240, 240);
            pdfDoc.rect(20, 55, 170, 8, 'F');
            pdfDoc.setFontSize(10);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("DATOS DEL CLIENTE", 25, 60.5);

            pdfDoc.text(project.plantas?.nombre_comercial || project.plantas?.nombre_planta || 'Cliente sin registrar', 25, 72);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text(project.plantas?.nombre_planta || '', 25, 78);
            const contacto = project.plantas?.contacto_encargado ? `Atn. ${project.plantas.contacto_encargado}` : '';
            pdfDoc.text(contacto, 25, 84);
            pdfDoc.text(project.plantas?.puesto_contacto || '', 25, 90);

            const introText = "Por medio de la presente, hacemos entrega formal del reporte correspondiente al servicio o programa descrito a continuación, realizado en las instalaciones de su empresa.";
            const splitIntro = pdfDoc.splitTextToSize(introText, 170);
            pdfDoc.text(splitIntro, 20, 105);

            pdfDoc.setFillColor(240, 240, 240);
            pdfDoc.rect(20, 120, 170, 8, 'F');
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.text("DESCRIPCIÓN", 25, 125.5);
            pdfDoc.text("CANTIDAD", 160, 125.5);

            pdfDoc.setFont("helvetica", "normal");
            const nombreServicioFinal = tipoEntrega === 'preliminar' ? `[PRELIMINAR] ${project.servicios?.nombre_servicio}` : project.servicios?.nombre_servicio;
            pdfDoc.text(nombreServicioFinal || 'Servicio General', 25, 137);
            pdfDoc.text("1", 168, 137);
            pdfDoc.setDrawColor(200, 200, 200);
            pdfDoc.line(20, 143, 190, 143);

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setTextColor(0, 0, 0);
            pdfDoc.text("COMENTARIOS:", 20, 155);
            pdfDoc.setFont("helvetica", "normal");
            const finalComments = comments.trim() ? comments : `Fecha del informe ${fechaFormateada.toLowerCase()}`;
            const splitComments = pdfDoc.splitTextToSize(finalComments, 170);
            pdfDoc.text(splitComments, 20, 162);

            pdfDoc.setDrawColor(0, 0, 0);
            pdfDoc.line(65, 230, 145, 230);
            pdfDoc.text("Nombre y firma de quien recibe", 105, 235, { align: 'center' });

            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setTextColor(0, 102, 204);
            pdfDoc.text("(656) 550 4406   |   www.ecolam.mx   |   ventas@ecolam.mx", 105, 285, { align: 'center' });
            
            pdfDoc.save(`${tipoEntrega === 'preliminar' ? 'Preliminar' : 'Nota_Entrega'}_${numeroNota}.pdf`);

            // 4. LÓGICA DE REACTIVACIÓN O CIERRE
            const updatePayload = {
                estado: tipoEntrega === 'preliminar' ? 'activo' : 'terminado',
                estado_operativo: tipoEntrega === 'preliminar' ? 'En Proceso' : 'Terminado',
            };

            if (tipoEntrega === 'final') {
                updatePayload.fecha_vencimiento = fechaVencimiento; // <-- ACTUALIZADO
            } else {
                updatePayload.notas_supervisor = 'Reporte Preliminar entregado al cliente. El proyecto se reactivó para trabajar en la versión Final.';
                updatePayload.notas_leidas = false;
            }

            await supabase.from('proyectos_v2').update(updatePayload).eq('id', project.id);

            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: currentUser?.id,
                mensaje: tipoEntrega === 'preliminar' 
                    ? `📝 Nota Preliminar #${numeroNota} generada. El proyecto vuelve a estar 'En Proceso'.` 
                    : `📦 Proyecto Terminado. Archivo editable subido y Nota #${numeroNota} generada con vencimiento el ${fechaVencimiento}.` // <-- ACTUALIZADO
            }]);

            toast.success(tipoEntrega === 'preliminar' ? "Nota preliminar lista. Proyecto reactivado." : "Proyecto finalizado con éxito.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar. Revisa tu conexión.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in-95">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" /> Emisión de Nota de Entrega
                </h3>
                <p className="text-sm text-muted-foreground mb-5">Configura los detalles de la entrega hacia el cliente.</p>
                
                {/* SELECTORES DE TIPO DE ENTREGA Y VENCIMIENTO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase flex items-center">
                            <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Tipo de Entrega
                        </label>
                        <select 
                            value={tipoEntrega} 
                            onChange={e => setTipoEntrega(e.target.value)}
                            className="w-full px-4 py-2.5 border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-accent text-sm font-medium"
                        >
                            <option value="preliminar">Avance / Preliminar</option>
                            <option value="final">Cierre / Entrega Final</option>
                        </select>
                    </div>

                    {tipoEntrega === 'final' ? (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1" /> Vencimiento del Estudio {/* <-- ACTUALIZADO */}
                            </label>
                            <input 
                                type="date" 
                                value={fechaVencimiento} // <-- ACTUALIZADO
                                onChange={e => setFechaVencimiento(e.target.value)} // <-- ACTUALIZADO
                                className="w-full px-4 py-2.5 border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-accent text-sm"
                            />
                        </div>
                    ) : (
                        <div className="flex items-end pb-2 animate-in fade-in">
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 w-full leading-tight">
                                Nota: El archivo editable no es requerido en esta fase. El proyecto regresará al técnico.
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-4 mb-6">
                    {/* ZONA DE ARRASTRAR Y SOLTAR (OCULTA SI ES PRELIMINAR) */}
                    {tipoEntrega === 'final' && (
                        <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors animate-in fade-in ${
                                isDragging ? 'border-accent bg-accent/10' : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                            }`}
                        >
                            <input 
                                type="file" 
                                accept=".zip,.rar"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden" 
                            />
                            <FileArchive className={`w-8 h-8 mx-auto mb-2 transition-colors ${isDragging ? 'text-accent' : 'text-blue-500'}`} />
                            
                            {editableFile ? (
                                <div className="text-sm font-bold text-emerald-700 bg-emerald-100 p-2 rounded-lg">
                                    ✅ Listo: {editableFile.name}
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-blue-800 mb-1 pointer-events-none">Arrastra tu archivo editable aquí</p>
                                    <p className="text-xs text-blue-600 pointer-events-none">o haz clic para explorar (.zip, .rar)</p>
                                </>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase">Comentarios Adicionales (Opcional)</label>
                        <textarea 
                            value={comments} 
                            onChange={e => setComments(e.target.value)} 
                            rows="2" 
                            placeholder="Aclaraciones para la nota..."
                            className="w-full px-4 py-3 border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-accent text-sm resize-none"
                        ></textarea>
                    </div>
                </div>
                
                <div className="flex justify-end space-x-3 border-t border-border/50 pt-4">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={generateAndSaveNota} disabled={loading} className="bg-accent text-white hover:bg-accent/90 font-bold py-2 px-6 rounded-lg shadow-md transition-colors">
                        {loading ? 'Procesando...' : (tipoEntrega === 'preliminar' ? 'Emitir Preliminar' : 'Terminar Proyecto')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateNotaModal;