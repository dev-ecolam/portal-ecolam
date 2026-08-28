
/**
 * Parseo Nativo de XML de Facturas CFDI (SAT) SIN LIBRERÍAS EXTERNAS
 */
export const parseInvoiceXML = (xmlText) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
        if (!comprobante) return null;

        const timbre = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0];
        
        const subtotal = parseFloat(comprobante.getAttribute("SubTotal") || 0);
        const total = parseFloat(comprobante.getAttribute("Total") || 0);
        const iva = total - subtotal; // Forma más rápida y segura de obtener el impuesto final

        return {
            folio: comprobante.getAttribute("Folio") || 'S/F',
            fechaEmision: comprobante.getAttribute("Fecha"),
            subtotal: subtotal,
            iva: iva,
            monto: total,
            uuid: timbre ? timbre.getAttribute("UUID") : 'No-Encontrado'
        };
    } catch (error) {
        console.error("Error nativo al parsear XML:", error);
        return null;
    }
};

// ==========================================
// UTILIDADES GLOBALES (Adaptado a Supabase/SQL)
// ==========================================

const TIMEZONE = 'America/Ciudad_Juarez';

/**
 * Convierte cualquier formato de fecha (String ISO, Date) a un objeto Date nativo.
 */
const parseSafeDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    // Manejo de strings ISO de Supabase (ej. "2026-10-15" o "2026-10-15T14:30:00Z")
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Formato de fecha corto (DD/MM/YYYY)
 */
export const formatDate = (dateInput) => {
    const date = parseSafeDate(dateInput);
    if (!date) return '-';

    return new Intl.DateTimeFormat('es-MX', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};

/**
 * Formato de fecha y hora para bitácoras
 */
export const formatDateTime = (dateInput) => {
    const date = parseSafeDate(dateInput);
    if (!date) return '-';
    
    return new Intl.DateTimeFormat('es-MX', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
};

/**
 * Calcula días hábiles entre dos fechas, excluyendo fines de semana y festivos (Supabase)
 */
export const calculateBusinessDays = (startDate, endDate, holidays = []) => {
    const start = parseSafeDate(startDate);
    const end = parseSafeDate(endDate);
    if (!start || !end || end < start) return 0;

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const exactHolidays = new Set();
    const recurringHolidays = new Set();

    holidays.forEach(h => {
        const hDate = parseSafeDate(h.fecha);
        if (hDate) {
            const year = hDate.getFullYear();
            const month = String(hDate.getMonth() + 1).padStart(2, '0');
            const day = String(hDate.getDate()).padStart(2, '0');
            
            if (h.repetir_anualmente || h.repetirAnualmente) {
                recurringHolidays.add(`${month}-${day}`);
            } else {
                exactHolidays.add(`${year}-${month}-${day}`);
            }
        }
    });

    let count = 0;
    let current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        
        const currentDateStr = `${current.getFullYear()}-${month}-${day}`;
        const currentMonthDay = `${month}-${day}`;

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Domingo (0) o Sábado (6)
        const isHoliday = exactHolidays.has(currentDateStr) || recurringHolidays.has(currentMonthDay);

        if (!isWeekend && !isHoliday) count++;
        
        current.setDate(current.getDate() + 1);
    }

    return count;
};

/**
 * Suma días hábiles a una fecha de inicio
 */
export const addBusinessDays = (startDate, daysToAdd) => {
    const currentDate = parseSafeDate(startDate);
    if (!currentDate) return null;
    
    let addedDays = 0;
    while (addedDays < daysToAdd) {
        currentDate.setDate(currentDate.getDate() + 1);
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            addedDays++;
        }
    }
    return currentDate;
};


/**
 * Cálculo Avanzado de Vacaciones (Reforma LFT "Vacaciones Dignas" México)
 */
export const calculateVacationBalance = (fechaIngresoInput, historialVacaciones = []) => {
    const ingreso = parseSafeDate(fechaIngresoInput);
    if (!ingreso) return { disponibles: 0, antiguedad: 0, proporcionales: 0 };

    const hoy = new Date();
    ingreso.setHours(0,0,0,0);
    hoy.setHours(0,0,0,0);

    // 1. Calcular Antigüedad Real en Años Cumplidos
    let antiguedad = hoy.getFullYear() - ingreso.getFullYear();
    const mesDiferencia = hoy.getMonth() - ingreso.getMonth();
    if (mesDiferencia < 0 || (mesDiferencia === 0 && hoy.getDate() < ingreso.getDate())) {
        antiguedad--;
    }

    // 2. Tabla de Ley (Nueva Reforma 2023 LFT)
    const getDiasLey = (anioServicio, esReforma) => {
        if (esReforma) {
            if (anioServicio === 1) return 12;
            if (anioServicio === 2) return 14;
            if (anioServicio === 3) return 16;
            if (anioServicio === 4) return 18;
            if (anioServicio === 5) return 20;
            if (anioServicio >= 6 && anioServicio <= 10) return 22;
            if (anioServicio >= 11 && anioServicio <= 15) return 24;
            return 24 + Math.floor((anioServicio - 11) / 5) * 2;
        } else {
            // Ley Vieja (Antes de 2023)
            if (anioServicio === 1) return 6;
            if (anioServicio === 2) return 8;
            if (anioServicio === 3) return 10;
            if (anioServicio === 4) return 12;
            if (anioServicio >= 5 && anioServicio <= 9) return 14;
            return 14 + Math.floor((anioServicio - 10) / 5) * 2;
        }
    };

    // 3. Sumar todos los años COMPLETOS trabajados
    let diasGanadosCompletos = 0;
    for (let i = 1; i <= antiguedad; i++) {
        const anioAniversario = ingreso.getFullYear() + i;
        const esReforma = anioAniversario >= 2023; 
        diasGanadosCompletos += getDiasLey(i, esReforma);
    }

    // 4. Calcular Días Proporcionales del Año en Curso
    const anioCalendarioActual = hoy.getFullYear();
    const diasCorrespondientesEsteAno = getDiasLey(antiguedad + 1, anioCalendarioActual >= 2023);
    
    const ultimoAniversario = new Date(ingreso);
    ultimoAniversario.setFullYear(ingreso.getFullYear() + antiguedad);
    
    const diasTranscurridos = (hoy.getTime() - ultimoAniversario.getTime()) / (1000 * 3600 * 24);
    
    // Usamos 365.25 para diluir el efecto de años bisiestos
    const diasProporcionales = (diasTranscurridos / 365.25) * diasCorrespondientesEsteAno;
    
    // 5. Restar los días ya tomados en el sistema
    const diasTomados = historialVacaciones.reduce((acc, curr) => {
        // En Supabase, la columna será dias_habiles o dias. Validamos ambas.
        const descuento = curr.dias_habiles || curr.dias || 0;
        return acc + Number(descuento);
    }, 0);

    const totalGanadoHastaHoy = diasGanadosCompletos + diasProporcionales;

    return {
        disponibles: parseFloat((totalGanadoHastaHoy - diasTomados).toFixed(2)),
        antiguedad: Math.max(0, antiguedad),
        ganadosCompletos: diasGanadosCompletos,
        proporcionales: parseFloat(diasProporcionales.toFixed(2)),
        tomados: diasTomados
    };
};

// ==========================================
// CUSTOM HOOKS PARA REACT (Timer & Countdown)
// ==========================================
import { useState, useEffect } from 'react';

export const useCountdown = (endTimeInput) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const end = parseSafeDate(endTimeInput);
        if (!end) {
            setTimeLeft(0);
            return;
        }

        const endTimestamp = end.getTime();
        const interval = setInterval(() => {
            const remaining = endTimestamp - Date.now();
            setTimeLeft(remaining > 0 ? remaining : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, [endTimeInput]);

    const formatTime = (ms) => {
        if (ms <= 0) return "00:00";
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return formatTime(timeLeft);
};

export const useTimer = (startTimeInput) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        const start = parseSafeDate(startTimeInput);
        if (!start) {
            setElapsedTime(0);
            return;
        }

        const startTimestamp = start.getTime();
        const interval = setInterval(() => {
            setElapsedTime(Date.now() - startTimestamp);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTimeInput]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    return formatTime(elapsedTime);
};