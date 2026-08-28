import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { Search, UploadCloud, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export const AttendancePanel = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Hoy por defecto

    useEffect(() => {
        fetchAttendance();
    }, [dateFilter]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            // Traemos las asistencias del día seleccionado
            const { data, error } = await supabase
                .from('asistencias')
                .select('*, usuarios(nombre, horario_laboral)')
                .eq('fecha', dateFilter)
                .order('hora_entrada', { ascending: true });

            if (error) throw error;
            setAttendance(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar asistencias.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (estado, minutosRetardo) => {
        if (estado === 'Falta') return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold border border-red-200">Falta</span>;
        if (estado === 'Justificado') return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold border border-blue-200">Justificado</span>;
        if (estado === 'Retardo') return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold border border-orange-200">Retardo ({minutosRetardo} min)</span>;
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200">A Tiempo</span>;
    };

    return (
        <div className="space-y-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-primary">Control de Asistencias Diarias</h2>
                    <p className="text-sm text-muted-foreground">Monitoreo de puntualidad basado en el Artículo 804 LFT.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground block mb-1">Día a consultar</label>
                        <input 
                            type="date" 
                            value={dateFilter} 
                            onChange={e => setDateFilter(e.target.value)}
                            className="px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"
                        />
                    </div>
                    {/* Botón para subir CSV de Reloj Checador Biométrico */}
                    <button className="bg-accent text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center shadow-sm mt-5">
                        <UploadCloud className="w-4 h-4 mr-2"/> Importar Checador
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Empleado</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Entrada</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Salida</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Estatus</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? <tr><td colSpan="5" className="text-center py-8">Cargando datos del día...</td></tr> : 
                        attendance.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No hay registros para este día. ¿Ya importaste el reporte?</td></tr> :
                        attendance.map(record => (
                            <tr key={record.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 font-bold text-primary">{record.usuarios?.nombre}</td>
                                <td className="px-6 py-4 text-center font-medium">{record.hora_entrada || '--:--'}</td>
                                <td className="px-6 py-4 text-center font-medium">{record.hora_salida || '--:--'}</td>
                                <td className="px-6 py-4 text-center">
                                    {getStatusBadge(record.estado, record.minutos_retardo)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-sm font-bold text-accent hover:underline">Justificar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};