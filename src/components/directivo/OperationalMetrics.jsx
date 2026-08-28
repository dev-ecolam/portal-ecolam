import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const OperationalMetrics = ({ data }) => {
    const { projects, technicians } = data;

    const metrics = useMemo(() => {
        const currentYear = new Date().getFullYear();
        let kpis = { totalTerminados: 0, aTiempo: 0, atrasados: 0, avgDeliveryDays: 0, totalDaysAcc: 0 };
        
        // Inicializar datos por técnico para la gráfica
        const techRevenueData = {};
        technicians.forEach(t => { 
            techRevenueData[t.id] = { label: t.nombre.split(' ')[0], data: Array(12).fill(0) }; 
        });

        projects.forEach(p => {
            const fechaApertura = p.fecha_apertura ? new Date(p.fecha_apertura) : null;
            const fechaTermino = p.fecha_fin_tecnico_real ? new Date(p.fecha_fin_tecnico_real) : null;
            const fechaLimite = p.fecha_entrega_interna ? new Date(p.fecha_entrega_interna) : null;

            if (fechaTermino && fechaTermino.getFullYear() === currentYear) {
                kpis.totalTerminados++;

                // Evaluar si fue a tiempo o atrasado
                if (fechaLimite) {
                    if (fechaTermino <= fechaLimite) kpis.aTiempo++;
                    else kpis.atrasados++;
                }

                // Evaluar días de entrega promedio
                if (fechaApertura) {
                    const days = Math.ceil((fechaTermino - fechaApertura) / (1000 * 60 * 60 * 24));
                    kpis.totalDaysAcc += days;
                }

                // Sumar al técnico para la gráfica
                if (p.tecnico_id && techRevenueData[p.tecnico_id]) {
                    const month = fechaTermino.getMonth();
                    techRevenueData[p.tecnico_id].data[month] += (Number(p.precio_cotizacion_cliente) || 0);
                }
            }
        });

        kpis.avgDeliveryDays = kpis.totalTerminados > 0 ? (kpis.totalDaysAcc / kpis.totalTerminados).toFixed(1) : 0;
        kpis.onTimePercentage = kpis.totalTerminados > 0 ? Math.round((kpis.aTiempo / kpis.totalTerminados) * 100) : 0;

        return {
            kpis,
            techChart: {
                labels: monthNames,
                datasets: Object.values(techRevenueData).map((tech, index) => ({
                    ...tech,
                    borderColor: chartColors[index % chartColors.length],
                    backgroundColor: chartColors[index % chartColors.length] + '33',
                    fill: true,
                    tension: 0.3
                }))
            }
        };
    }, [projects, technicians]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center"><Clock className="w-4 h-4 mr-1"/> Tiempo Promedio (Entrega Real)</p>
                    <h3 className="text-3xl font-black text-foreground">{metrics.kpis.avgDeliveryDays} <span className="text-lg font-medium text-muted-foreground">días</span></h3>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500"/> Entregas a Tiempo (SLA)</p>
                    <div className="flex items-end gap-3">
                        <h3 className={`text-3xl font-black ${metrics.kpis.onTimePercentage >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                            {metrics.kpis.onTimePercentage}%
                        </h3>
                        <p className="text-sm font-bold text-muted-foreground mb-1">{metrics.kpis.aTiempo} de {metrics.kpis.totalTerminados} proyectos</p>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center"><XCircle className="w-4 h-4 mr-1 text-red-500"/> Entregas Atrasadas</p>
                    <h3 className="text-3xl font-black text-destructive">{metrics.kpis.atrasados}</h3>
                </div>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-4">Valor Entregado por Técnico (Producción Mensual)</h3>
                <div className="h-80">
                    <Line 
                        data={metrics.techChart} 
                        options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } },
                            scales: { y: { beginAtZero: true } }
                        }} 
                    />
                </div>
            </div>
        </div>
    );
};