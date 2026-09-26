import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

export const ProjectLogModal = ({ project, userId, onClose }) => {
    const [mensaje, setMensaje] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Estados para la Agenda
    const [crearEvento, setCrearEvento] = useState(false);
    const [fechaEvento, setFechaEvento] = useState('');
    const [tipoEvento, setTipoEvento] = useState('visita');

    useEffect(() => {
        fetchLogs();
    }, [project.id]);

    const fetchLogs = async () => {
        const { data } = await supabase.from('bitacoras_proyectos')
            .select('*, usuarios(nombre)')
            .eq('proyecto_id', project.id)
            .order('creado_en', { ascending: false }); // Más recientes arriba
        if (data) setLogs(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return toast.error("El mensaje no puede estar vacío");
        if (!userId) return toast.error("Error de sesión. Recarga la página.");
        if (crearEvento && !fechaEvento) return toast.error("Selecciona una fecha para el evento.");
        
        setLoading(true);
        try {
            // 1. Guardar la Bitácora (Usamos usuario_id para evitar el error)
            const { error: logError } = await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: userId,
                mensaje: mensaje.trim()
            }]);
            
            if (logError) throw logError;

            // 2. Guardar en Agenda
            if (crearEvento) {
                const { error: agendaError } = await supabase.from('agenda_tecnicos').insert([{
                    tecnico_id: userId,
                    proyecto_id: project.id,
                    titulo: `[${project.npu}] - ${mensaje.substring(0, 30)}...`,
                    tipo: tipoEvento,
                    fecha_evento: fechaEvento
                }]);
                if (agendaError) throw agendaError;
                toast.success("Nota y evento guardados.");
            } else {
                toast.success('Nota guardada en bitácora');
            }
            
            // Limpiar formulario y recargar
            setMensaje('');
            setCrearEvento(false);
            setFechaEvento('');
            fetchLogs();
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar en bitácora');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-lg border border-border flex flex-col h-[600px]">
                <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Bitácora del Proyecto</h3>
                        <p className="text-sm text-muted-foreground">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2">
                    {logs.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-10">No hay registros aún.</p>
                    ) : logs.map(l => (
                        <div key={l.id} className="bg-muted/30 p-3 rounded-lg border border-border text-sm">
                            <span className="font-bold text-primary block text-xs mb-1">
                                {l.usuarios?.nombre || 'Usuario'} <span className="text-muted-foreground font-normal ml-2">{new Date(l.creado_en).toLocaleString('es-MX')}</span>
                            </span> 
                            <span className="whitespace-pre-wrap text-foreground">{l.mensaje}</span>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="mt-auto border-t border-border pt-4">
                    <textarea 
                        value={mensaje} 
                        onChange={e => setMensaje(e.target.value)} 
                        placeholder="Escribe el avance o nota aquí..." 
                        rows="2" 
                        className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent mb-3"
                    />
                    
                    {/* PANEL DE AGENDA */}
                    <div className="flex items-center gap-2 mb-3">
                        <input type="checkbox" id="agendar" checked={crearEvento} onChange={e => setCrearEvento(e.target.checked)} className="w-4 h-4 text-accent border-border rounded focus:ring-accent" />
                        <label htmlFor="agendar" className="text-sm font-bold text-foreground cursor-pointer flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-accent"/> Agendar en mi calendario
                        </label>
                    </div>

                    {crearEvento && (
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Fecha del Evento</label>
                                <input type="date" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-accent bg-background"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Actividad</label>
                                <select value={tipoEvento} onChange={e => setTipoEvento(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md text-sm outline-none focus:ring-1 focus:ring-accent bg-background">
                                    <option value="visita">Visita a Planta</option>
                                    <option value="llamada">Llamada / Seguimiento</option>
                                    <option value="tramite">Ingreso en Dependencia</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg text-sm transition-colors">Cerrar</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-sm shadow-sm disabled:opacity-50 transition-colors">
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};