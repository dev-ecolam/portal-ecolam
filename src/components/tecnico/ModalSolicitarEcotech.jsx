import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export const ModalSolicitarEcotech = ({ project, onClose, onFinalized }) => {
    const [fechasVisita, setFechasVisita] = useState('');
    const [puntosDia, setPuntosDia] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSolicitar = async () => {
        if (!fechasVisita.trim() || !puntosDia.trim()) {
            return toast.error("Por favor, llena las fechas y los puntos por día.");
        }
        setLoading(true);

        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    ecotech_solicitud_enviada: true,
                    ecotech_fechas_visita: fechasVisita,
                    ecotech_puntos_dia: puntosDia
                })
                .eq('id', project.id);

            if (error) throw error;
            
            toast.success("Solicitud enviada a Ecotech exitosamente.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al enviar la solicitud.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold text-primary mb-2">Solicitar Número Ecotech</h3>
                <p className="text-sm text-muted-foreground mb-6">El encargado de Ecotech recibirá esta información para tramitar tu número de proyecto.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Fecha(s) de visita a planta</label>
                        <input 
                            type="text" 
                            placeholder="Ej. Del 12 al 14 de Octubre" 
                            value={fechasVisita} 
                            onChange={e => setFechasVisita(e.target.value)} 
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">Cantidad de Puntos por Día</label>
                        <input 
                            type="text" 
                            placeholder="Ej. 15 puntos diarios" 
                            value={puntosDia} 
                            onChange={e => setPuntosDia(e.target.value)} 
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent text-sm"
                        />
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSolicitar} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
};