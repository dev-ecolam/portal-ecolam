import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';

const PauseProjectModal = ({ project, userId, onClose, onFinalized }) => {
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePause = async () => {
        if (!motivo.trim()) return toast.error("Debes justificar el motivo de la pausa.");
        setLoading(true);
        try {
            // 1. Guardar en bitácora
            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                usuario_id: userId,
                mensaje: `⚠️ PROYECTO PAUSADO: ${motivo}`
            }]);
            
            // 2. Cambiar estado
            const { error } = await supabase.from('proyectos_v2')
                .update({ estado_operativo: 'Pausado' })
                .eq('id', project.id);
                
            if (error) throw error;
            toast.success("Proyecto pausado correctamente.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al pausar el proyecto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-lg font-bold text-primary mb-2">Pausar Proyecto</h3>
                <p className="text-sm text-muted-foreground mb-4">El reloj de tiempo de ejecución se detendrá. Debes justificar el motivo (ej. Esperando respuesta del cliente).</p>
                <textarea 
                    value={motivo} 
                    onChange={e => setMotivo(e.target.value)} 
                    placeholder="Motivo de la pausa..." 
                    rows="4" 
                    className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent mb-4"
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancelar</button>
                    <button onClick={handlePause} disabled={loading} className="px-4 py-2 text-sm font-bold bg-amber-500 text-white hover:bg-amber-600 rounded-lg shadow-sm">
                        {loading ? 'Pausando...' : 'Confirmar Pausa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PauseProjectModal;