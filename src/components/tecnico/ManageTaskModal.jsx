import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { CheckSquare, Calendar, FileText } from 'lucide-react';

export const ManageTaskModal = ({ project, onClose, onFinalized }) => {
    const [tipoEntrega, setTipoEntrega] = useState('preliminar');
    const [fechaVencimiento, setFechaVencimiento] = useState('');
    const [comentarios, setComentarios] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setCurrentUser(data?.user));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (tipoEntrega === 'final' && !fechaVencimiento) {
            return toast.error("Debes indicar la fecha de vencimiento del documento final.");
        }

        setLoading(true);
        try {
            // 1. Actualizamos el proyecto
            const { error: updateError } = await supabase.from('proyectos_v2')
                .update({ 
                    estado_operativo: 'Revisión',
                    tipo_entrega: tipoEntrega,
                    fecha_vencimiento: tipoEntrega === 'final' ? fechaVencimiento : null
                })
                .eq('id', project.id);
                
            if (updateError) throw updateError;

            // 2. Dejamos el registro automático en la bitácora
            if (currentUser) {
                await supabase.from('bitacoras_proyectos').insert([{
                    proyecto_id: project.id,
                    usuario_id: currentUser.id,
                    mensaje: `🏁 Tarea enviada a Revisión. \nTipo de entrega: ${tipoEntrega.toUpperCase()}. \n${comentarios ? 'Notas: ' + comentarios : ''}`
                }]);
            }

            toast.success("Proyecto enviado a revisión exitosamente.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al finalizar la tarea.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary flex items-center">
                            <CheckSquare className="w-5 h-5 mr-2" /> Finalizar Tarea
                        </h3>
                        <p className="text-sm text-muted-foreground">{project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Selector de Tipo de Entrega */}
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">Tipo de Entregable</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                type="button"
                                onClick={() => setTipoEntrega('preliminar')}
                                className={`py-2 px-3 border rounded-lg text-sm font-bold transition-colors ${tipoEntrega === 'preliminar' ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                            >
                                Borrador / Preliminar
                            </button>
                            <button 
                                type="button"
                                onClick={() => setTipoEntrega('final')}
                                className={`py-2 px-3 border rounded-lg text-sm font-bold transition-colors ${tipoEntrega === 'final' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                            >
                                Documento Final
                            </button>
                        </div>
                    </div>

                    {/* Fecha de Vencimiento (Solo si es Final) */}
                    {tipoEntrega === 'final' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-green-700 uppercase mb-1 flex items-center">
                                <Calendar className="w-3.5 h-3.5 mr-1" /> Fecha de Vencimiento Legal
                            </label>
                            <input 
                                type="date" 
                                value={fechaVencimiento} 
                                onChange={e => setFechaVencimiento(e.target.value)} 
                                className="w-full p-2.5 border border-green-300 rounded-lg bg-green-50 text-green-900 text-sm outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    )}

                    {/* Comentarios Adicionales */}
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1" /> Notas para el Supervisor (Opcional)
                        </label>
                        <textarea 
                            value={comentarios} 
                            onChange={e => setComentarios(e.target.value)} 
                            placeholder="Ej. Se anexa documento en la carpeta compartida..." 
                            rows="2" 
                            className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm shadow-sm disabled:opacity-50">
                            {loading ? 'Enviando...' : 'Enviar a Revisión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};