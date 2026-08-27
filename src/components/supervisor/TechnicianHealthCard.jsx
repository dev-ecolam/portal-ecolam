import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';
import { Calendar } from 'lucide-react';

export const TechnicianHealthCard = ({ techData }) => {
    const { id, nombre, proyectosActivos, aTiempo, porVencer, atrasados } = techData;
    const [eventosHoy, setEventosHoy] = useState([]);

    useEffect(() => {
        const fetchEventosHoy = async () => {
            const hoyStr = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('agenda_tecnicos')
                .select('titulo, tipo')
                .eq('tecnico_id', id)
                .in('fecha_evento', [hoyStr]) // Solo traemos lo de HOY
                .limit(2);
            
            if (data) setEventosHoy(data);
        };
        fetchEventosHoy();
    }, [id]);

    return (
        <div className="bg-card p-4 rounded-xl flex flex-col space-y-3 relative overflow-hidden h-full">
            {atrasados > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-destructive"></div>}
            
            <h3 className="text-lg font-bold text-foreground truncate pr-4">{nombre}</h3>
            
            {/* KPI Originales */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded p-2">
                    <p className="text-lg font-bold text-primary">{proyectosActivos}</p>
                    <p className="text-[9px] uppercase text-muted-foreground font-bold">Activos</p>
                </div>
                <div className="bg-muted rounded p-2">
                    <p className="text-lg font-bold text-amber-600">{porVencer}</p>
                    <p className="text-[9px] uppercase text-muted-foreground font-bold">Vencen pronto</p>
                </div>
                <div className="bg-destructive/10 rounded p-2">
                    <p className="text-lg font-bold text-destructive">{atrasados}</p>
                    <p className="text-[9px] uppercase text-destructive font-bold">Atrasados</p>
                </div>
            </div>
            
            {/* NUEVO: Resumen de Agenda */}
            <div className="pt-3 border-t border-border mt-2 flex-grow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center mb-1">
                    <Calendar className="w-3 h-3 mr-1"/> Agenda Hoy
                </p>
                {eventosHoy.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin eventos programados</p>
                ) : (
                    <ul className="space-y-1">
                        {eventosHoy.map((ev, i) => (
                            <li key={i} className="text-xs text-foreground truncate font-medium bg-muted/50 px-2 py-1 rounded">
                                • {ev.titulo}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};