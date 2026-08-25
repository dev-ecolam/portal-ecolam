import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

// ==========================================
// MODAL PARA GENERAR NOTA (jsPDF puro)
// ==========================================
const GenerateNotaModal = ({ project, onClose, onFinalized }) => {
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);

    const generateAndSaveNota = async () => {
        setLoading(true);
        try {
            const pdfDoc = new jsPDF();
            const numeroNota = `${new Date().getFullYear()}-${project.npu}`; // Formato simple para la nota

            // Aquí puedes volver a poner todo el formato visual del PDF (Logo, coordenadas, etc.)
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setFontSize(16);
            pdfDoc.text("NOTA DE ENTREGA", 105, 55, { align: 'center' });
            pdfDoc.setFontSize(11);
            pdfDoc.setFont("helvetica", "normal");
            pdfDoc.text(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 20, 75);
            pdfDoc.text(`PROYECTO: ${project.npu}`, 20, 85);
            pdfDoc.text(`CLIENTE: ${project.clientes?.nombre_empresa}`, 20, 95);
            pdfDoc.text(`SERVICIO: ${project.servicios?.nombre_servicio}`, 20, 105);
            pdfDoc.text("Comentarios Finales:", 20, 125);
            const splitComments = pdfDoc.splitTextToSize(comments, 170);
            pdfDoc.text(splitComments, 20, 132);
            
            // 1. Descargamos el PDF en la compu del técnico
            pdfDoc.save(`Nota_Entrega_${numeroNota}.pdf`);

            // 2. Cerramos el proyecto en la base de datos
            await supabase
                .from('proyectos_v2')
                .update({ estado: 'terminado' })
                .eq('id', project.id);

            toast.success("Nota generada y proyecto terminado oficialmente.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al generar el PDF.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-primary mb-2">Generar Nota de Entrega</h3>
                <p className="text-sm text-muted-foreground mb-6">El proyecto ha sido aprobado. Agrega tus comentarios finales para imprimir en la nota.</p>
                
                <textarea 
                    value={comments} 
                    onChange={e => setComments(e.target.value)} 
                    rows="3" 
                    placeholder="Ej. Se entregó el dictamen ergonómico en físico..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background mb-6"
                ></textarea>
                
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancelar</button>
                    <button onClick={generateAndSaveNota} disabled={loading} className="bg-accent text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md">
                        {loading ? 'Generando...' : 'Descargar PDF y Finalizar Proyecto'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateNotaModal;