import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react'; // Importamos el icono actualizado
import {ConfirmationModal} from '../ui/UIComponents';
import {ActionWithReasonModal} from '../ui/UIComponents';

// ==========================================
// TABLA DE REVISIÓN FINAL (SUPERVISOR)
// ==========================================
const ReviewProjectsTable = ({ projects, onUpdateProject, currentUser }) => {
    const [confirmingAction, setConfirmingAction] = useState(null);

    const handleApprove = async () => {
        if (!confirmingAction) return;
        const { project } = confirmingAction.payload;
        
        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ 
                    estado_operativo: 'Aprobado',
                    notas_supervisor: 'APROBADO: El estudio es correcto. Por favor genera la nota de entrega y sube el paquete final.',
                    notas_leidas: false // <-- ESTO ENCIENDE LA NOTIFICACIÓN DEL TÉCNICO
                })
                .eq('id', project.id);
            
            if (error) throw error;
            
            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: currentUser?.id,
                mensaje: `✅ Estudio Aprobado. Listo para generar nota de entrega y empaquetar finales.`
            }]);

            toast.success("Estudio aprobado. El técnico ha sido notificado para finalizar la entrega.");
            setConfirmingAction(null);
            if(onUpdateProject) onUpdateProject();
        } catch (err) {
            console.error(err);
            toast.error("Error al aprobar el proyecto.");
        }
    };

    const handleReject = async (reason) => {
        if (!confirmingAction || !reason.trim()) return toast.error("El motivo es obligatorio.");
        const { project } = confirmingAction.payload;

        try {
            if (project.url_estudio_r2) {
                const urlParts = project.url_estudio_r2.split('/public/documentos_proyectos/');
                if (urlParts.length > 1) {
                    const filePath = urlParts[1];
                    await supabase.storage.from('documentos_proyectos').remove([filePath]);
                }
            }

            const { error } = await supabase
                .from('proyectos_v2')
                .update({ 
                    estado_operativo: 'En Proceso', 
                    notas_supervisor: `RECHAZADO: ${reason}`,
                    url_estudio_r2: null,
                    notas_leidas: false // <-- ESTO ENCIENDE LA NOTIFICACIÓN DEL TÉCNICO
                })
                .eq('id', project.id);
            
            if (error) throw error;

            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: currentUser?.id,
                mensaje: `❌ Estudio Rechazado. Motivo: ${reason}. El PDF subido fue eliminado permanentemente.`
            }]);

            toast.success("PDF eliminado y proyecto devuelto al técnico.");
            setConfirmingAction(null);
            if(onUpdateProject) onUpdateProject();
        } catch (err) {
            console.error(err);
            toast.error("Error al rechazar el proyecto.");
        }
    };

    return (
        <>
            <div className="overflow-x-auto bg-card rounded-lg border border-border shadow-sm">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">NPU / Servicio</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Planta</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Estudio PDF</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {projects.map(project => (
                             <tr key={project.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3">
                                    <p className="whitespace-nowrap text-sm font-bold text-primary">{project.npu}</p>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5 max-w-[200px] truncate">{project.nombre_estudio}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">{project.plantas?.nombre_planta || 'Sin planta'}</td>
                                
                                {/* Celda de Evidencia (PDF) */}
                                <td className="px-6 py-4 text-sm">
                                    {project.url_estudio_r2 ? (
                                        <a 
                                            href={`/visor.html?pdf=${encodeURIComponent(project.url_estudio_r2)}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-accent font-bold hover:underline flex items-center bg-accent/10 px-3 py-2 rounded-lg w-max transition-colors hover:bg-accent/20"
                                        >
                                            <BookOpen className="w-4 h-4 mr-2" />
                                            Revisar en Visor 3D
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground italic text-xs">Sin archivo PDF</span>
                                    )}
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-4">
                                        <button 
                                            onClick={() => setConfirmingAction({ action: 'approve', payload: { project }, title: 'Aprobar Estudio', message: '¿El PDF es correcto? El técnico será notificado para generar la nota de entrega y subir el paquete final (.rar).'})} 
                                            className="text-green-600 hover:text-green-700 font-bold transition-colors"
                                        >
                                            Aprobar
                                        </button>
                                        <button 
                                            onClick={() => setConfirmingAction({ action: 'reject', payload: { project }, title: 'Rechazar Estudio', message: 'El archivo PDF se eliminará permanentemente de la nube. Escribe las instrucciones para el técnico.', confirmText: 'Borrar PDF y Devolver', confirmColor: 'bg-orange-500'})} 
                                            className="text-destructive hover:text-destructive/80 font-bold transition-colors"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Asegúrate de importar y tener disponibles estos componentes modales en el archivo original */}
            {confirmingAction?.action === 'approve' && <ConfirmationModal title={confirmingAction.title} message={confirmingAction.message} onConfirm={handleApprove} onCancel={() => setConfirmingAction(null)} />}
            {confirmingAction?.action === 'reject' && <ActionWithReasonModal title={confirmingAction.title} message={confirmingAction.message} onConfirm={handleReject} onCancel={() => setConfirmingAction(null)} confirmText={confirmingAction.confirmText} confirmColor={confirmingAction.confirmColor} />}
        </>
    );
};

export default ReviewProjectsTable;