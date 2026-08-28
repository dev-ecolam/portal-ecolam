import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { DollarSign, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const FinancialMetrics = ({ data }) => {
    const { projects, invoices } = data;

    const metrics = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthlyCashFlowData = Array(12).fill(0).map(() => ({ ingresos: 0, cogs: 0, opex: 0, utilidad: 0 }));
        
        let kpis = { totalCobradoYTD: 0, totalPagadoProvYTD: 0, totalOpExYTD: 0, utilidadNetaYTD: 0, carteraVencida: 0 };

        invoices.forEach(inv => {
            const monto = Number(inv.monto) || 0;
            const fechaEmision = inv.fecha_emision ? new Date(inv.fecha_emision) : null;
            const fechaPago = inv.fecha_pago_real ? new Date(inv.fecha_pago_real) : null;
            const fechaPromesa = inv.fecha_promesa_pago ? new Date(inv.fecha_promesa_pago) : null;

            // Cartera Vencida
            if (inv.tipo === 'cliente' && inv.estado === 'Pendiente' && fechaPromesa && fechaPromesa < today) {
                kpis.carteraVencida += monto;
            }

            // Cashflow
            const fechaContable = fechaPago || fechaEmision; 
            if (fechaContable && fechaContable.getFullYear() === currentYear && (inv.estado === 'Pagada' || inv.tipo === 'gasto_operativo')) {
                const month = fechaContable.getMonth();
                if (inv.tipo === 'cliente') { monthlyCashFlowData[month].ingresos += monto; kpis.totalCobradoYTD += monto; }
                else if (inv.tipo === 'proveedor') { monthlyCashFlowData[month].cogs += monto; kpis.totalPagadoProvYTD += monto; }
                else if (inv.tipo === 'gasto_operativo') { monthlyCashFlowData[month].opex += monto; kpis.totalOpExYTD += monto; }
            }
        });

        monthlyCashFlowData.forEach(m => m.utilidad = m.ingresos - m.cogs - m.opex);
        kpis.utilidadNetaYTD = kpis.totalCobradoYTD - kpis.totalPagadoProvYTD - kpis.totalOpExYTD;

        return {
            kpis,
            cashFlowChart: {
                labels: monthNames,
                datasets: [
                    { label: 'Ingresos', data: monthlyCashFlowData.map(m => m.ingresos), backgroundColor: 'rgba(34, 197, 94, 0.8)' },
                    { label: 'Costos Proveedor', data: monthlyCashFlowData.map(m => m.cogs), backgroundColor: 'rgba(239, 68, 68, 0.8)' },
                    { label: 'OpEx', data: monthlyCashFlowData.map(m => m.opex), backgroundColor: 'rgba(249, 115, 22, 0.8)' },
                    { type: 'line', label: 'Utilidad Neta', data: monthlyCashFlowData.map(m => m.utilidad), borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 3, tension: 0.3 }
                ]
            }
        };
    }, [projects, invoices]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center"><DollarSign className="w-4 h-4 mr-1 text-green-500"/> Ingresos Cobrados (YTD)</p>
                    <h3 className="text-3xl font-black">${metrics.kpis.totalCobradoYTD.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</h3>
                </div>
                
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center"><Activity className="w-4 h-4 mr-1 text-orange-500"/> Egresos (Prov + OpEx)</p>
                    <h3 className="text-3xl font-black">${(metrics.kpis.totalPagadoProvYTD + metrics.kpis.totalOpExYTD).toLocaleString('es-MX', { minimumFractionDigits: 0 })}</h3>
                </div>

                <div className={`p-6 rounded-2xl shadow-sm border ${metrics.kpis.utilidadNetaYTD >= 0 ? 'bg-primary/5 border-primary/20' : 'bg-destructive/5 border-destructive/20'}`}>
                    <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center"><TrendingUp className="w-4 h-4 mr-1"/> Utilidad Neta (EBITDA)</p>
                    <h3 className={`text-3xl font-black ${metrics.kpis.utilidadNetaYTD >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        ${metrics.kpis.utilidadNetaYTD.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </h3>
                </div>

                <div className="bg-destructive/5 p-6 rounded-2xl shadow-sm border border-destructive/20">
                    <p className="text-xs font-bold text-destructive uppercase mb-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> Cartera Vencida</p>
                    <h3 className="text-3xl font-black text-destructive">${metrics.kpis.carteraVencida.toLocaleString('es-MX', { minimumFractionDigits: 0 })}</h3>
                </div>
            </div>

            <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
                <h3 className="font-bold text-lg mb-4">Estado de Resultados Mensual (P&L)</h3>
                <div className="h-80">
                    <Bar 
                        data={metrics.cashFlowChart} 
                        options={{ responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }} 
                    />
                </div>
            </div>
        </div>
    );
};