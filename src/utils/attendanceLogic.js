// src/utils/attendanceLogic.js

const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
};

const DIAS_KEYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

export const processAttendanceFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n'); 
            const records = [];

            lines.forEach((line) => {
                const cleanLine = line.trim();
                if (!cleanLine || cleanLine.startsWith("No") || cleanLine.startsWith("[source")) return;

                const parts = cleanLine.split(/\s+/);

                if (parts.length >= 6) {
                    try {
                        const userIdRaw = parts[2]; 
                        const userId = parseInt(userIdRaw, 10).toString();
                        const timeStr = parts[parts.length - 1]; 
                        const dateStr = parts[parts.length - 2]; 
                        
                        // Formateamos para Supabase (YYYY-MM-DD)
                        const fechaFormateada = dateStr.replace(/\//g, '-');
                        
                        records.push({
                            userId: userId,
                            fecha: fechaFormateada,
                            hora: timeStr,
                        });
                    } catch (err) {
                        console.warn("Línea ignorada por error de formato:", cleanLine);
                    }
                }
            });
            resolve(records);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};

export const analyzeWeeklyAttendance = (rawLogs, employees, permissions, startDateStr, endDateStr) => {
    const report = [];
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T23:59:59');

    const daysOfWeek = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        daysOfWeek.push(new Date(d).toISOString().split('T')[0]); 
    }

    employees.forEach(emp => {
        // En Supabase podrías tener el idReloj guardado en la DB, asumo que existe.
        if (!emp.id_reloj && !emp.idReloj) return;
        const empIdReloj = emp.id_reloj || emp.idReloj;

        const empReport = {
            usuario_id: emp.id,
            nombre: emp.nombre,
            idReloj: empIdReloj,
            dias: [],
            resumen: { retardos: 0, faltas: 0, incidencias: 0, sinSalida: 0, totalHorasExtra: 0 }
        };

        const empIdString = String(empIdReloj).trim();
        const toleranciaMinutos = emp.horario_laboral?.tolerancia ? Number(emp.horario_laboral.tolerancia) : 15;

        daysOfWeek.forEach(diaStr => {
            const fechaObj = new Date(diaStr + 'T12:00:00');
            const diaIndex = fechaObj.getDay(); 
            const nombreDiaKey = DIAS_KEYS[diaIndex];
            const configDia = emp.horario_laboral?.[nombreDiaKey] || { activo: true, entrada: '08:00', salida: '17:00' };
            const esDiaLaboral = configDia.activo;
            const horaEntradaOficial = configDia.entrada;
            const horaSalidaOficial = configDia.salida;

            const logsDelDia = rawLogs.filter(log => {
                return String(log.userId).trim() === empIdString && log.fecha === diaStr;
            }).sort((a, b) => a.hora.localeCompare(b.hora));

            const entradaReal = logsDelDia.length > 0 ? logsDelDia[0].hora : null;
            const salidaReal = logsDelDia.length > 1 ? logsDelDia[logsDelDia.length - 1].hora : null;

            // Revisamos si tiene permisos aprobados en Supabase
            const permisoDia = permissions.find(p => 
                p.usuario_id === emp.id && 
                p.estado === 'Aprobado' &&
                diaStr >= p.fecha_inicio && 
                diaStr <= p.fecha_fin
            );

            let estatus = 'Asistencia';
            let minutosRetardo = 0;
            let horasExtraDia = 0;

            if (entradaReal && salidaReal) {
                const minsEntrada = timeToMinutes(entradaReal);
                const minsSalida = timeToMinutes(salidaReal);

                if (!esDiaLaboral) {
                    const duracion = minsSalida - minsEntrada;
                    if (duracion > 60) horasExtraDia = Math.floor(duracion / 60);
                } else {
                    const minsSalidaOficial = timeToMinutes(horaSalidaOficial);
                    if (minsSalida > minsSalidaOficial) {
                        const extra = minsSalida - minsSalidaOficial;
                        if (extra >= 60) horasExtraDia = Math.floor(extra / 60);
                    }
                }
            }
            
            if (permisoDia) {
                estatus = permisoDia.tipo === 'vacaciones' ? 'Vacaciones' : 'Justificado';
            }
            else if (!esDiaLaboral) { 
                estatus = entradaReal ? 'Asistencia Extra' : 'Descanso'; 
            }
            else if (!entradaReal) {
                estatus = 'Falta';
                empReport.resumen.faltas++;
                empReport.resumen.incidencias++;
            }
            else if (entradaReal && !salidaReal) {
                estatus = 'Sin Salida';
                empReport.resumen.sinSalida++;
                empReport.resumen.incidencias++;
            }
            else {
                const minsEntrada = timeToMinutes(entradaReal);
                const minsEntradaOficial = timeToMinutes(horaEntradaOficial);
                
                if (minsEntrada > (minsEntradaOficial + toleranciaMinutos)) {
                    estatus = 'Retardo';
                    minutosRetardo = minsEntrada - minsEntradaOficial;
                    empReport.resumen.retardos++;
                    empReport.resumen.incidencias++;
                }
            }

            empReport.resumen.totalHorasExtra += horasExtraDia;

            // Formato final para inyectar en la tabla de Supabase ('asistencias')
            empReport.dias.push({
                fecha: diaStr,
                hora_entrada: entradaReal,
                hora_salida: salidaReal,
                minutos_retardo: minutosRetardo,
                estado: estatus,
                horasExtra: horasExtraDia
            });
        });

        report.push(empReport);
    });

    return report;
};