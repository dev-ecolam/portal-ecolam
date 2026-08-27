import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

export const ProjectLogModal = ({ project, userId, onClose }) => {
    const [logEntries, setLogEntries] = useState([]);
    const [newNote, setNewNote] = useState('');
    
    // Estados para la Agenda
    const [crearEvento, setCrearEvento] = useState(false);
    const [fechaEvento, setFechaEvento] = useState('');
    const [tipoEvento, setTipoEvento] = useState('visita');
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('bitacoras_proyectos')
                .select('*, usuarios(nombre)')
                .eq('proyecto_id', project.id)
                .order('creado_en', { ascending: true });
            
            if (!error && data) setLogEntries(data);
            setLoading(false);
        };
        fetchLogs();
    }, [project.id]);

    const handleSubmitNote = async () => {
        if (!newNote.trim()) return;
        if (crearEvento && !fechaEvento) return toast.error("Selecciona una fecha para el evento.");
        
        setSubmitting(true);
        try {
            // 1. Guardar la Bitácora
            const { error: logError } = await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: userId,
                mensaje: newNote
            }]);
            if (logError) throw logError;

            // 2. Guardar en Agenda (Si lo solicitó)
            if (crearEvento) {
                const { error: agendaError } = await supabase.from('agenda_tecnicos').insert([{
                    tecnico_id: userId,
                    proyecto_id: project.id,
                    titulo: `[${project.npu}] - ${newNote.substring(0, 30)}...`,
                    tipo: tipoEvento,
                    fecha_evento: fechaEvento
                }]);
                if (agendaError) throw agendaError;
                toast.success("Nota y evento guardados.");
            } else {
                toast.success("Nota guardada en bitácora.");
            }
            
            setNewNote('');
            setCrearEvento(false);
            setFechaEvento('');
            
            // Recargar bitácora
            const { data } = await supabase.from('bitacoras_proyectos').select('*, usuarios(nombre)').eq('proyecto_id', project.id).order('creado_en', { ascending: true });
            setLogEntries(data || []);
        } catch (err) {
            toast.error("Error al guardar.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-2xl h-[85vh] flex flex-col border border-border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Bitácora del Proyecto</h3>
                        <p className="text-sm text-muted-foreground">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto border border-border rounded-lg p-4 space-y-4 mb-4 bg-muted/20">
                    {loading ? <p className="text-center text-muted-foreground">Cargando...</p> : logEntries.length === 0 ? <p className="text-center text-muted-foreground">No hay entradas aún.</p> :
                        logEntries.map(entry => (
                            <div key={entry.id} className="p-3 bg-background border border-border rounded-lg shadow-sm">
                                <p className="text-sm text-foreground whitespace-pre-wrap">{entry.mensaje}</p>
                                <p className="text-xs text-muted-foreground mt-2 text-right font-medium">
                                    {entry.usuarios?.nombre} - {new Date(entry.creado_en).toLocaleString('es-MX')}
                                </p>
                            </div>
                        ))
                    }
                </div>

                <div className="pt-2 bg-muted/30 p-3 rounded-lg border border-border">
                    <textarea 
                        value={newNote} 
                        onChange={e => setNewNote(e.target.value)} 
                        placeholder="Ej. Se solicitó información. Visita programada..." 
                        rows="2" 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none mb-3 text-sm"
                    />
                    
                    {/* PANEL DE AGENDA */}
                    <div className="flex items-center gap-2 mb-4">
                        <input type="checkbox" id="agendar" checked={crearEvento} onChange={e => setCrearEvento(e.target.checked)} className="w-4 h-4 text-accent border-border rounded focus:ring-accent" />
                        <label htmlFor="agendar" className="text-sm font-bold text-foreground cursor-pointer flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-accent"/> Agendar en mi calendario
                        </label>
                    </div>

                    {crearEvento && (
                        <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-background rounded border border-border">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground">Fecha del Evento</label>
                                <input type="date" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm"/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground">Tipo de Actividad</label>
                                <select value={tipoEvento} onChange={e => setTipoEvento(e.target.value)} className="w-full px-3 py-1.5 border border-border rounded text-sm bg-background">
                                    <option value="visita">Visita a Planta</option>
                                    <option value="llamada">Llamada / Seguimiento</option>
                                    <option value="tramite">Ingreso en Dependencia</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmitNote} 
                        disabled={submitting || !newNote.trim()} 
                        className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {submitting ? 'Guardando...' : 'Guardar en Bitácora'}
                    </button>
                </div>
            </div>
        </div>
    );
};