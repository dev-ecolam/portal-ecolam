import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Alert } from '../components/UI/Alert';

export const UserDeactivationModal = ({ userToDeactivate, onClose, onSuccess }) => {
    const [activeProjects, setActiveProjects] = useState([]);
    const [availableSuccessors, setAvailableSuccessors] = useState([]);
    const [selectedSuccessor, setSelectedSuccessor] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDependencies = async () => {
            // 1. Buscar cuántos proyectos "vivos" tiene asignados este usuario
            const { data: projects } = await supabase
                .from('proyectos_v2')
                .select('id, npu, nombre_estudio')
                .eq('tecnico_id', userToDeactivate.id) // Asumiendo que guardas el técnico asignado en esta columna
                .in('estado', ['cotizacion', 'activo']);
            
            setActiveProjects(projects || []);

            // 2. Buscar técnicos activos para heredar los proyectos
            const { data: techs } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('activo', true)
                .neq('id', userToDeactivate.id) // Excluir al que estamos dando de baja
                .contains('roles', ['tecnico']); // Que tenga el rol de técnico

            setAvailableSuccessors(techs || []);
        };
        fetchDependencies();
    }, [userToDeactivate]);

    const handleDeactivate = async () => {
        if (activeProjects.length > 0 && !selectedSuccessor) {
            setError('Debes seleccionar un sucesor para reasignar los proyectos activos.');
            return;
        }

        setLoading(true);
        try {
            // PASO A: Reasignar los proyectos activos al sucesor
            if (activeProjects.length > 0) {
                const projectIds = activeProjects.map(p => p.id);
                const { error: updateError } = await supabase
                    .from('proyectos_v2')
                    .update({ tecnico_id: selectedSuccessor })
                    .in('id', projectIds);
                
                if (updateError) throw updateError;
            }

            // PASO B: Marcar al usuario como INACTIVO (Soft Delete)
            const { error: deactivateError } = await supabase
                .from('usuarios')
                .update({ 
                    activo: false, 
                    fecha_baja: new Date().toISOString() 
                })
                .eq('id', userToDeactivate.id);

            if (deactivateError) throw deactivateError;

            // PASO C: Aquí podrías llamar a una Edge Function para bloquear su Auth si es necesario.

            onSuccess();
        } catch (err) {
            setError(`Error en la baja: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-destructive mb-2">Dar de Baja a {userToDeactivate.nombre}</h3>
                
                <div className="space-y-4 my-4">
                    {activeProjects.length > 0 ? (
                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                            <p className="text-destructive font-bold mb-2">
                                ⚠️ Atención: Este usuario tiene {activeProjects.length} proyectos en curso.
                            </p>
                            <p className="text-sm text-foreground mb-3">Para proceder con la baja, debes reasignar estos proyectos a otro colaborador activo:</p>
                            
                            <select 
                                value={selectedSuccessor} 
                                onChange={(e) => setSelectedSuccessor(e.target.value)}
                                className="w-full p-2 border rounded bg-background"
                            >
                                <option value="">Selecciona un sucesor...</option>
                                {availableSuccessors.map(tech => (
                                    <option key={tech.id} value={tech.id}>{tech.nombre}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Este usuario no tiene proyectos activos pendientes. Puedes proceder con la baja de forma segura.</p>
                    )}
                    
                    <p className="text-xs text-muted-foreground border-l-2 border-accent pl-2">
                        * Los proyectos que este usuario ya terminó se conservarán a su nombre en el historial. 
                        El usuario ya no podrá iniciar sesión ni aparecerá en nuevas asignaciones.
                    </p>
                </div>

                <Alert message={error} type="error" onClose={() => setError('')} />

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg font-bold hover:bg-muted transition-colors">Cancelar</button>
                    <button 
                        onClick={handleDeactivate} 
                        disabled={loading || (activeProjects.length > 0 && !selectedSuccessor)} 
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : 'Confirmar Baja Definitiva'}
                    </button>
                </div>
            </div>
        </div>
    );
};