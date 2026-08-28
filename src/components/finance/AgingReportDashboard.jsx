import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import { DollarSign, Clock, AlertTriangle } from 'lucide-react';

// ========================================================
// DASHBOARD COMPLETO (Antigüedad de Saldos NATIVO)
// ========================================================
export const AgingReportDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalPorCobrar: 0,
        totalVencido: 0,
        buckets: [
            { label: 'Al corriente (0-30 días)', days: 30, amount: 0, color: 'bg-green-500' },
            { label: 'Atraso leve (31-60 días)', days: 60, amount: 0, color: 'bg-yellow-500' },
            { label: 'Atraso grave (61-90 días)', days: 90, amount: 0, color: 'bg-orange-500' },
            { label: 'Crítico (+90 días)', days: 999, amount: 0, color: 'bg-red-600' },
        ]
    });

    useEffect(() => {
        const fetchAgingData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('facturas')
                    .select('monto, fecha_emision')
                    .eq('tipo', 'cliente')
                    .eq('estado', 'Pendiente');

                if (error) throw error;

                const today = new Date();
                let total = 0;
                let vencido = 0;
                let tempBuckets = [...metrics.buckets].map(b => ({ ...b, amount: 0 }));

                data.forEach(inv => {
                    const issueDate = new Date(inv.fecha_emision);
                    const diffDays = Math.ceil(Math.abs(today - issueDate) / (1000 * 60 * 60 * 24));
                    
                    total += Number(inv.monto);
                    if (diffDays > 30) vencido += Number(inv.monto);

                    if (diffDays <= 30) tempBuckets[0].amount += Number(inv.monto);
                    else if (diffDays <= 60) tempBuckets[1].amount += Number(inv.monto);
                    else if (diffDays <= 90) tempBuckets[2].amount += Number(inv.monto);
                    else tempBuckets[3].amount += Number(inv.monto);
                });

                setMetrics({ totalPorCobrar: total, totalVencido: vencido, buckets: tempBuckets });
            } catch (err) {
                toast.error("Error al calcular el reporte de saldos.");
            } finally {
                setLoading(false);
            }
        };
        fetchAgingData();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div></div>;

    const maxAmount = Math.max(...metrics.buckets.map(b => b.amount)) || 1; // Para escalar las barras

    return (
        <div className="space-y-6">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Total por Cobrar</p>
                        <h3 className="text-4xl font-black text-primary">${metrics.totalPorCobrar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-4 bg-accent/10 rounded-full"><DollarSign className="w-8 h-8 text-accent"/></div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-destructive uppercase tracking-wider mb-1">Monto Vencido (+30 días)</p>
                        <h3 className="text-4xl font-black text-destructive">${metrics.totalVencido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="p-4 bg-destructive/10 rounded-full"><AlertTriangle className="w-8 h-8 text-destructive"/></div>
                </div>
            </div>

            {/* Gráfica de Barras Nativa (Tailwind) */}
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm">
                <h3 className="text-xl font-bold text-primary mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-accent"/> Antigüedad de Saldos (Cartera Vencida)
                </h3>
                
                <div className="space-y-6">
                    {metrics.buckets.map((bucket, index) => {
                        const widthPercentage = (bucket.amount / maxAmount) * 100;
                        return (
                            <div key={index} className="relative">
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span className="text-foreground">{bucket.label}</span>
                                    <span className="text-muted-foreground">${bucket.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="w-full h-4 bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${bucket.color} transition-all duration-1000 ease-out`} 
                                        style={{ width: `${widthPercentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};