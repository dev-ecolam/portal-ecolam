import React, { useState} from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// =========================================================================
// MODAL DE ASIGNACIÓN (Un solo técnico, sin arreglo de IDs)
// =========================================================================
const AssignProjectModal = ({ project, technicians, onClose, onFinalized }) => {
    const [selectedTechnicianId, setSelectedTechnicianId] = useState(project.tecnico_id || '');
    const [deliveryDate, setDeliveryDate] = useState(project.fecha_entrega_interna ? project.fecha_entrega_interna.split('T')[0] : '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!selectedTechnicianId) return toast.error("Debes seleccionar un técnico.");
        if (!deliveryDate) return toast.error("Debes establecer una fecha límite interna.");
        
        setLoading(true);
        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    tecnico_id: selectedTechnicianId,
                    fecha_entrega_interna: new Date(deliveryDate).toISOString(),
                    // Si el proyecto era "nuevo", al asignarlo lo pasamos automáticamente a activo
                    estado: 'activo' 
                })
                .eq('id', project.id);
            
            if (error) throw error;
            toast.success("Proyecto asignado correctamente.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error("Error asignando:", error);
            toast.error("Hubo un error al asignar el proyecto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold mb-1 text-primary">Asignar Proyecto</h3>
                <p className="text-sm font-semibold text-accent mb-4">NPU: {project.npu}</p>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2">Técnico Asignado</label>
                        <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2 bg-muted/30 space-y-1">
                            {technicians.map(tech => (
                                <label key={tech.id} className="flex items-center p-2 hover:bg-background rounded cursor-pointer transition-colors">
                                    <input
                                        type="radio"
                                        name="technician"
                                        value={tech.id}
                                        checked={selectedTechnicianId === tech.id}
                                        onChange={(e) => setSelectedTechnicianId(e.target.value)}
                                        className="h-4 w-4 text-accent border-muted focus:ring-accent"
                                    />
                                    <span className="ml-3 text-sm font-medium">{tech.nombre}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Fecha Límite de Entrega (Interna)</label>
                        <input 
                            type="date" 
                            value={deliveryDate} 
                            onChange={e => setDeliveryDate(e.target.value)} 
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Guardando...' : 'Guardar Asignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignProjectModal;