import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// ==========================================
// MODAL DE BITÁCORA (Actualizado a Supabase)
// ==========================================
const ProjectLogModal = ({ project, userId, onClose }) => {
    const [logEntries, setLogEntries] = useState([]);
    const [newNote, setNewNote] = useState('');
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
        setSubmitting(true);
        try {
            const { error } = await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: userId,
                mensaje: newNote
            }]);
            
            if (error) throw error;
            setNewNote('');
            // Recargar bitácora
            const { data } = await supabase.from('bitacoras_proyectos').select('*, usuarios(nombre)').eq('proyecto_id', project.id).order('creado_en', { ascending: true });
            setLogEntries(data || []);
        } catch (err) {
            toast.error("Error al guardar la nota.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col border border-border">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Bitácora del Proyecto</h3>
                        <p className="text-sm text-muted-foreground">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto border border-border rounded-lg p-4 space-y-4 mb-4 bg-muted/20">
                    {loading ? <p className="text-center text-muted-foreground">Cargando bitácora...</p> : logEntries.length === 0 ? <p className="text-center text-muted-foreground">No hay entradas aún.</p> :
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

                <div className="pt-2">
                    <textarea 
                        value={newNote} 
                        onChange={e => setNewNote(e.target.value)} 
                        placeholder="Escribe lo que avanzaste hoy..." 
                        rows="3" 
                        className="w-full p-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none mb-2"
                    />
                    <button 
                        onClick={handleSubmitNote} 
                        disabled={submitting || !newNote.trim()} 
                        className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {submitting ? 'Guardando...' : 'Añadir a la Bitácora'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectLogModal;