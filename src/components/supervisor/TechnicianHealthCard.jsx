import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabase/client';
import { Calendar } from 'lucide-react';

const TechnicianHealthCard = ({ techData }) => {
    const { id, nombre, proyectosActivos, aTiempo, porVencer, atrasados } = techData;
    const [eventosHoy, setEventosHoy] = useState([]);
    
    // Cálculo de eficiencia
    const aTiempoTotal = aTiempo + porVencer;
    const totalEvaluables = aTiempoTotal + atrasados;
    const eficiencia = totalEvaluables > 0 ? Math.round((aTiempoTotal / totalEvaluables) * 100) : 100;

    const getBarColor = (eff) => {
        if (eff >= 80) return 'bg-green-500';
        if (eff >= 60) return 'bg-amber-400';
        return 'bg-destructive';
    };

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
        <div className="bg-card p-4 rounded-xl flex flex-col space-y-3 relative overflow-hidden h-full border border-border shadow-sm">
            
            {/* Cabecera con Nombre y Porcentaje de Eficiencia */}
            <div className="flex justify-between items-center pr-2">
                <h3 className="text-sm font-bold text-foreground truncate pr-2">{nombre}</h3>
                <span className={`text-xs font-black ${eficiencia >= 80 ? 'text-green-600' : eficiencia >= 60 ? 'text-amber-600' : 'text-destructive'}`}>
                    {eficiencia}%
                </span>
            </div>
            
            {/* Barra de progreso visual de Eficiencia */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-500 ${getBarColor(eficiencia)}`} style={{ width: `${eficiencia}%` }}></div>
            </div>

            {/* Total de Proyectos Activos */}
            <div className="bg-muted/30 border border-border rounded-lg px-3 py-2 flex justify-between items-center mt-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total de Proyectos Activos</span>
                <span className="text-sm font-black text-primary">{proyectosActivos}</span>
            </div>

            {/* KPI a 3 Columnas (Estatus de tiempo técnico) */}
            <div className="grid grid-cols-3 gap-2 text-center mt-1">
                <div className="bg-green-50 border border-green-100 rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-lg font-bold text-green-700 leading-none">{aTiempo}</p>
                    <p className="text-[9px] uppercase text-green-800 font-bold tracking-tighter mt-1">A Tiempo</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-lg font-bold text-amber-600 leading-none">{porVencer}</p>
                    <p className="text-[9px] uppercase text-amber-700 font-bold tracking-tighter mt-1">Vence Pronto</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-2 flex flex-col justify-center">
                    <p className="text-lg font-bold text-destructive leading-none">{atrasados}</p>
                    <p className="text-[9px] uppercase text-destructive font-bold tracking-tighter mt-1">Atrasado</p>
                </div>
            </div>

            {/* Resumen de Agenda */}
            <div className="pt-3 border-t border-border mt-2 flex-grow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center mb-1.5">
                    <Calendar className="w-3 h-3 mr-1.5 text-accent"/> Agenda Hoy
                </p>
                {eventosHoy.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">Sin eventos programados</p>
                ) : (
                    <ul className="space-y-1.5">
                        {eventosHoy.map((ev, i) => (
                            <li key={i} className="text-[11px] text-foreground truncate font-medium bg-muted/50 px-2 py-1.5 rounded border border-border/50">
                                • {ev.titulo}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default TechnicianHealthCard;