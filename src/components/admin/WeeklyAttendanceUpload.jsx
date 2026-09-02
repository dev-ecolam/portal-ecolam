import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { processAttendanceFile, analyzeWeeklyAttendance } from '../../utils/attendanceLogic';
import { toast } from 'sonner';

export const WeeklyAttendanceUpload = () => {
    const [file, setFile] = useState(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);

    const handlePreview = async () => {
        if (!file || !startDate || !endDate) return toast.warning("Selecciona el archivo USB y las fechas.");
        
        setLoading(true);
        try {
            const rawLogs = await processAttendanceFile(file);
            
            // Traemos usuarios que tengan un ID de reloj asignado y las vacaciones aprobadas
            const [usersRes, permRes] = await Promise.all([
                supabase.from('usuarios').select('id, nombre, id_reloj, horario_laboral').not('id_reloj', 'is', null),
                supabase.from('ausencias_vacaciones').select('*').eq('estado', 'Aprobado')
            ]);

            const report = analyzeWeeklyAttendance(rawLogs, usersRes.data, permRes.data, startDate, endDate);
            setPreviewData(report);
            toast.success("Cálculo completado. Revisa la tabla inferior.");

        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el archivo del reloj.");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        if (!previewData) return;
        if (!window.confirm("¿Estás seguro de publicar estas asistencias en la base de datos oficial? Esta acción afectará la nómina.")) return;

        setLoading(true);
        try {
            const registrosAInsertar = [];

            // Aplanamos el arreglo para insertar fila por fila en SQL
            previewData.forEach(emp => {
                emp.dias.forEach(dia => {
                    // No guardamos días libres vacíos (sin incidencias ni asistencias extra) para no saturar la BD
                    if (dia.estado !== 'Descanso') { 
                        registrosAInsertar.push({
                            usuario_id: emp.usuario_id,
                            fecha: dia.fecha,
                            hora_entrada: dia.hora_entrada,
                            hora_salida: dia.hora_salida,
                            minutos_retardo: dia.minutos_retardo || 0,
                            estado: dia.estado
                        });
                    }
                });
            });

            // Upsert: Si ya existía un registro ese día para ese empleado, lo actualiza (evita duplicados)
            const { error } = await supabase.from('asistencias').upsert(registrosAInsertar, { onConflict: 'usuario_id, fecha' });
            
            if (error) throw error;

            toast.success("Asistencias registradas exitosamente en el sistema oficial.");
            setPreviewData(null); // Limpiamos la vista después de guardar

        } catch (error) {
            toast.error("Error al guardar asistencias en Supabase.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper para obtener el nombre del día a partir de una fecha "YYYY-MM-DD"
    const getDayName = (dateString) => {
        const date = new Date(dateString + 'T12:00:00'); // Evita desfase de zona horaria
        return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][date.getDay()];
    };

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
                <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Inicio Semana (Lun)</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Fin Semana (Dom)</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"/>
                </div>
                <div>
                    <label className="block text-sm font-bold text-muted-foreground mb-1">Archivo de Reloj (.txt)</label>
                    <input type="file" accept=".txt" onChange={e => setFile(e.target.files[0])} className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20 cursor-pointer"/>
                </div>
                <button 
                    onClick={handlePreview} 
                    disabled={loading}
                    className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Procesando...' : 'Analizar Datos'}
                </button>
            </div>

            {previewData && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-bold text-primary">Previsualización de Incidencias Semanales</p>
                        <p className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">{previewData.length} Empleados procesados</p>
                    </div>

                    {/* LA TABLA DE PREVISUALIZACIÓN */}
                    <div className="overflow-x-auto border border-border rounded-xl mb-6">
                        <table className="min-w-full text-sm divide-y divide-border">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase">Empleado</th>
                                    <th className="px-4 py-3 text-left font-bold text-muted-foreground uppercase">Resumen de Incidencias</th>
                                    <th className="px-4 py-3 text-center font-bold text-muted-foreground uppercase">Detalle Diario</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {previewData.map((emp) => (
                                    <tr key={emp.usuario_id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 align-top min-w-[150px]">
                                            <p className="font-bold text-foreground">{emp.nombre}</p>
                                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">ID Reloj: {emp.idReloj}</p>
                                        </td>
                                        
                                        <td className="px-4 py-3 align-top min-w-[200px]">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {emp.resumen.retardos > 0 && <span className="bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded text-xs font-bold shadow-sm">Retardos: {emp.resumen.retardos}</span>}
                                                    {emp.resumen.faltas > 0 && <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded text-xs font-bold shadow-sm">Faltas: {emp.resumen.faltas}</span>}
                                                    {emp.resumen.sinSalida > 0 && <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded text-xs font-bold shadow-sm">Sin Salida: {emp.resumen.sinSalida}</span>}
                                                </div>
                                                
                                                {emp.resumen.totalHorasExtra > 0 && (
                                                    <div>
                                                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold shadow-sm inline-flex items-center">
                                                            ⭐ {emp.resumen.totalHorasExtra} Hrs Extra Totales
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {emp.resumen.incidencias === 0 && emp.resumen.totalHorasExtra === 0 && (
                                                    <span className="text-green-600 text-xs font-bold flex items-center">✅ Semana Limpia</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-start overflow-x-auto pb-2">
                                                {emp.dias.map((dia, idx) => (
                                                    <div key={idx} className={`flex flex-col items-center min-w-[70px] p-2 rounded-lg border ${dia.horasExtra > 0 ? 'bg-blue-50/50 border-blue-200' : dia.estado === 'Falta' ? 'bg-red-50/50 border-red-200' : 'bg-muted/10 border-border'}`}>
                                                        
                                                        {/* Día y Fecha */}
                                                        <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                                                            {getDayName(dia.fecha)} {dia.fecha.slice(8,10)}
                                                        </div>

                                                        {/* Icono de Estado */}
                                                        <div className="text-xl mb-1 cursor-help" title={dia.estado}>
                                                            {dia.horasExtra > 0 ? '⭐' : 
                                                             (dia.estado.includes('Asistencia') || dia.estado === 'Justificado' || dia.estado === 'Vacaciones') ? '✅' : 
                                                             dia.estado === 'Falta' ? '❌' : 
                                                             dia.estado === 'Retardo' ? '⚠️' : 
                                                             dia.estado === 'Descanso' ? '💤' : '❓'}
                                                        </div>

                                                        {/* Horas (Solo si no es Descanso vacío ni falta total sin checada) */}
                                                        <div className="text-[10px] text-foreground font-medium text-center leading-tight">
                                                            <div>{dia.hora_entrada || '--:--'}</div>
                                                            <div className="text-muted-foreground/50 scale-75">▼</div>
                                                            <div>{dia.hora_salida || '--:--'}</div>
                                                        </div>

                                                        {/* Insignia de Horas extra en el día */}
                                                        {dia.horasExtra > 0 && (
                                                            <div className="mt-1.5">
                                                                <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                                                                    +{dia.horasExtra}h
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                        <button 
                            onClick={handlePublish} 
                            className="bg-green-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all animate-pulse"
                        >
                            Confirmar y Guardar Asistencias
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};