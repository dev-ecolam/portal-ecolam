import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Alert } from '../ui/Alert';

// ==============================================================================
// GESTIÓN DE SERVICIOS (Actualizado a Días Hábiles)
// ==============================================================================
const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [newItem, setNewItem] = useState({
        nombre_servicio: '', servicio_id_numerico: '', dependencia: '', dias_habiles_estimados: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchServices = async () => {
        const { data } = await supabase.from('servicios').select('*').eq('activo', true).order('nombre_servicio');
        setServices(data || []);
    };

    useEffect(() => { fetchServices(); }, []);

    const handleDesactivarServicio = async (servicioId) => {
        if (!window.confirm('¿Seguro que deseas dar de baja este servicio? Ya no aparecerá en nuevos proyectos.')) return;
        
        try {
            await supabase.from('servicios')
                .update({ activo: false, fecha_baja: new Date().toISOString() })
                .eq('id', servicioId);
            
            fetchServices(); // Refrescamos la tabla
        } catch (error) {
            console.error("Error al desactivar:", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        try {
            const { error } = await supabase.from('servicios').insert([{
                nombre_servicio: newItem.nombre_servicio,
                servicio_id_numerico: newItem.servicio_id_numerico,
                dependencia: newItem.dependencia,
                dias_habiles_estimados: Number(newItem.dias_habiles_estimados) || 0,
            }]);
            if (error) throw error;

            setSuccess(`¡Servicio '${newItem.nombre_servicio}' añadido con éxito!`);
            setNewItem({ nombre_servicio: '', servicio_id_numerico: '', dependencia: '', dias_habiles_estimados: '' });
            fetchServices();
        } catch (err) {
            setError(`Error al añadir: ${err.message}`);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-bold mb-4">Añadir Nuevo Servicio</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="nombre_servicio" value={newItem.nombre_servicio} onChange={handleChange} placeholder="Nombre del Servicio" className="w-full p-2 border rounded" required />
                    <input type="text" name="servicio_id_numerico" value={newItem.servicio_id_numerico} onChange={handleChange} placeholder="ID Numérico (ej: 0001)" className="w-full p-2 border rounded" required />
                    <input type="text" name="dependencia" value={newItem.dependencia} onChange={handleChange} placeholder="Dependencia" className="w-full p-2 border rounded" required />
                    <input type="number" name="dias_habiles_estimados" value={newItem.dias_habiles_estimados} onChange={handleChange} placeholder="Días Hábiles Estimados para Entrega" className="w-full p-2 border rounded bg-accent/10" required />

                    <Alert message={error} type="error" onClose={() => setError('')} />
                    <Alert message={success} type="success" onClose={() => setSuccess('')} />
                    <button type="submit" className="w-full bg-accent hover:bg-accent/80 text-primary-foreground font-bold py-2 px-4 rounded">Añadir Servicio</button>
                </form>
            </div>
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-bold mb-4">Servicios Activos</h3>
                <ul className="divide-y max-h-96 overflow-y-auto pr-2">
                    {services.map(s => (
                        <li key={s.id} className="py-3 flex justify-between items-center text-sm">
                            <div>
                                <span className="font-semibold">{s.nombre_servicio}</span>
                                <span className="text-muted-foreground ml-2">({s.servicio_id_numerico})</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="bg-muted px-2 py-1 rounded text-xs">{s.dias_habiles_estimados} días</span>
                                {/* BOTÓN DE BAJA */}
                                <button 
                                    onClick={() => handleDesactivarServicio(s.id)}
                                    className="text-xs text-destructive hover:underline"
                                >
                                    Dar de baja
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ServiceManagement;