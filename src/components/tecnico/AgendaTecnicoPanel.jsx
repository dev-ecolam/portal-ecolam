import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Calendar, Clock, MapPin, Phone } from 'lucide-react';

export const AgendaTecnicoPanel = ({ userId, proyectosConProveedores }) => {
    const [eventos, setEventos] = useState([]);
    
    useEffect(() => {
        const fetchAgenda = async () => {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            
            const { data } = await supabase
                .from('agenda_tecnicos')
                .select('*')
                .eq('tecnico_id', userId)
                .gte('fecha_evento', hoy.toISOString().split('T')[0])
                .order('fecha_evento', { ascending: true })
                .limit(5); // Traemos los 5 más próximos
                
            if (data) setEventos(data);
        };
        fetchAgenda();
    }, [userId]);

    const getIcono = (tipo) => {
        if (tipo === 'visita') return <MapPin className="w-4 h-4 text-green-600" />;
        if (tipo === 'llamada') return <Phone className="w-4 h-4 text-blue-600" />;
        if (tipo === 'vacaciones') return <Calendar className="w-4 h-4 text-purple-600" />;
        return <Clock className="w-4 h-4 text-orange-600" />;
    };

    return (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="bg-muted/50 p-4 border-b border-border">
                <h2 className="text-lg font-bold text-primary flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-accent"/> Mi Agenda y Recordatorios
                </h2>
            </div>
            
            <div className="p-4 space-y-6">
                {/* 1. Calendario de Eventos */}
                <div>
                    <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3">Próximas Actividades</h3>
                    {eventos.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No tienes eventos programados para los próximos días.</p>
                    ) : (
                        <div className="space-y-2">
                            {eventos.map(ev => {
                                const esHoy = ev.fecha_evento === new Date().toISOString().split('T')[0];
                                return (
                                    <div key={ev.id} className={`flex items-start p-3 rounded-lg border ${esHoy ? 'bg-accent/5 border-accent/30' : 'bg-background border-border'}`}>
                                        <div className="mt-0.5 mr-3 p-2 bg-muted rounded-full">
                                            {getIcono(ev.tipo)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{ev.titulo}</p>
                                            <p className={`text-xs font-bold mt-1 ${esHoy ? 'text-accent' : 'text-muted-foreground'}`}>
                                                {esHoy ? 'HOY' : new Date(ev.fecha_evento).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 2. Seguimiento Proveedores (Movido aquí) */}
                {proyectosConProveedores?.length > 0 && (
                    <div className="pt-4 border-t border-border">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase mb-3 flex items-center">
                            <Clock className="w-4 h-4 mr-1"/> Seguimiento a Proveedores
                        </h3>
                        <div className="space-y-2">
                            {proyectosConProveedores.map(p => (
                                <div key={p.id} className="bg-blue-50/50 border border-blue-100 p-2 rounded flex justify-between items-center">
                                    <span className="text-sm font-bold text-blue-900">{p.npu}</span>
                                    <span className="text-xs text-blue-700">{p.proveedor_nombre || 'Asignado'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};