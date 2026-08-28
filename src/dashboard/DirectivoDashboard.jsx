import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import DashboardLayout from '../components/layout/DashboardLayout';
import { FinancialMetrics } from '../components/directivo/FinancialMetrics';
import { OperationalMetrics } from '../components/directivo/OperationalMetrics';

export const DirectivoDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rawData, setRawData] = useState({ projects: [], invoices: [], technicians: [] });
    const [view, setView] = useState('kpis');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Descargamos todo de golpe y optimizado
                const [projRes, invRes, techRes] = await Promise.all([
                    supabase.from('proyectos_v2').select('id, npu, estado, precio_cotizacion_cliente, fecha_apertura, fecha_entrega_interna, fecha_fin_tecnico_real, tecnico_id'),
                    supabase.from('facturas').select('id, tipo, monto, fecha_emision, fecha_promesa_pago, fecha_pago_real, estado'),
                    supabase.from('usuarios').select('id, nombre').eq('rol', 'tecnico')
                ]);

                if (projRes.error) throw projRes.error;
                if (invRes.error) throw invRes.error;

                setRawData({
                    projects: projRes.data || [],
                    invoices: invRes.data || [],
                    technicians: techRes.data || []
                });
            } catch (err) {
                console.error("Error al obtener datos:", err);
                setError("Error de conexión con la base de datos.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
    if (error) return <div className="text-center py-20 text-destructive font-bold">{error}</div>;

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-black text-primary">Inteligencia de Negocio</h1>
                <p className="text-muted-foreground mt-1">Métricas clave, P&L y salud operativa en tiempo real.</p>
            </div>

            {/* Pestañas */}
            <div className="mb-8 border-b border-border flex space-x-6">
                <button onClick={() => setView('kpis')} className={`pb-3 font-bold text-sm transition-colors ${view === 'kpis' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                    Dashboard Financiero (P&L)
                </button>
                <button onClick={() => setView('operativo')} className={`pb-3 font-bold text-sm transition-colors ${view === 'operativo' ? 'border-b-2 border-accent text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                    Rendimiento Operativo (Técnicos)
                </button>
            </div>

            <div className="animate-in fade-in duration-500">
                {view === 'kpis' && <FinancialMetrics data={rawData} />}
                {view === 'operativo' && <OperationalMetrics data={rawData} />}
            </div>
        </DashboardLayout>
    );
};