import React, { useState} from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// ==========================================
// TABLA DE REVISIÓN FINAL (SUPERVISOR)
// ==========================================
const ReviewProjectsTable = ({ projects, onUpdateProject }) => {
    const [confirmingAction, setConfirmingAction] = useState(null);

    const handleApprove = async () => {
        if (!confirmingAction) return;
        const { project } = confirmingAction.payload;
        
        try {
            // CAMBIO CLAVE AQUÍ: 
            // En lugar de pasarlo a 'terminado', lo pasamos a 'activo' y encendemos la alerta de acuse.
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ 
                    estado: 'activo', // Lo regresamos a la cancha del técnico
                    esperando_acuse: true // ESTO enciende el banner rojo en el TecnicoDashboard
                })
                .eq('id', project.id);
            
            if (error) throw error;
            toast.success("Proyecto aprobado. El técnico ha sido notificado para subir el Acuse.");
            setConfirmingAction(null);
            onUpdateProject();
        } catch (err) {
            console.error(err);
            toast.error("Error al aprobar el proyecto.");
        }
    };

    const handleReject = async (reason) => {
        if (!confirmingAction || !reason.trim()) return toast.error("El motivo es obligatorio.");
        const { project } = confirmingAction.payload;

        try {
            // 1. Borrar el archivo de Supabase Storage (usamos el path que guardó el técnico)
            if (project.path_evidencia) {
                await supabase.storage.from('evidencias').remove([project.path_evidencia]);
            }

            // 2. Regresar a activo y limpiar las URLs
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ 
                    estado: 'activo', 
                    notas_supervisor: `RECHAZADO: ${reason}`,
                    url_evidencia: null,
                    path_evidencia: null // Limpiamos el path
                })
                .eq('id', project.id);
            
            if (error) throw error;
            toast.success("Evidencia eliminada y proyecto devuelto al técnico.");
            setConfirmingAction(null);
            onUpdateProject();
        } catch (err) {
            toast.error("Error al rechazar el proyecto.");
        }
    };

    return (
        <>
            <div className="overflow-x-auto bg-card rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">NPU</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Evidencia</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {projects.map(project => (
                             <tr key={project.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">{project.npu}</td>
                                <td className="px-6 py-4 text-sm">{project.clientes?.nombre_empresa}</td>
                                {/* Celda de Evidencia en ReviewProjectsTable.jsx */}
                                <td className="px-6 py-4 text-sm">
                                    {project.url_evidencia ? (
                                        <a 
                                            href={`/visor.html?pdf=${encodeURIComponent(project.url_evidencia)}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-accent font-bold hover:underline flex items-center bg-accent/10 px-3 py-2 rounded-lg w-max"
                                        >
                                            {/* Importa el icono BookOpen de lucide-react */}
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                            Revisar en Visor 3D
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">Sin archivo</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex space-x-4">
                                        <button 
                                            onClick={() => setConfirmingAction({ action: 'approve', payload: { project }, title: 'Aprobar Proyecto', message: '¿Estás seguro? El técnico será notificado para generar la nota de entrega.'})} 
                                            className="text-green-600 hover:underline font-bold"
                                        >
                                            Aprobar
                                        </button>
                                        <button 
                                            onClick={() => setConfirmingAction({ action: 'reject', payload: { project }, title: 'Rechazar Proyecto', message: 'El archivo PDF se eliminará permanentemente. Escribe el motivo del rechazo.', confirmText: 'Borrar y Devolver', confirmColor: 'bg-orange-500'})} 
                                            className="text-destructive hover:underline font-bold"
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
            
            {confirmingAction?.action === 'approve' && <ConfirmationModal title={confirmingAction.title} message={confirmingAction.message} onConfirm={handleApprove} onCancel={() => setConfirmingAction(null)} />}
            {confirmingAction?.action === 'reject' && <ActionWithReasonModal title={confirmingAction.title} message={confirmingAction.message} onConfirm={handleReject} onCancel={() => setConfirmingAction(null)} confirmText={confirmingAction.confirmText} confirmColor={confirmingAction.confirmColor} />}
        </>
    );
};

export default ReviewProjectsTable;