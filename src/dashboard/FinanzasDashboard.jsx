import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AgingReportDashboard } from '@/components/finance/AgingReportDashboard';
import { InvoicesList } from '@/components/finance/InvoicesList';
import { PendingInvoicesTable } from '@/components/finance/PendingInvoicesTable';
import { FileText, DollarSign, AlertTriangle, TrendingUp, Wallet } from 'lucide-react';
import { OpExExpensesList } from '@/components/finance/OpExExpensesList';

const FinanzasDashboard = () => {
    const [view, setView] = useState('dashboard');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .or('necesita_factura.eq.true,estado.eq.Pendiente de Factura')
                .order('fecha_apertura', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (err) {
            console.error("Error al cargar proyectos:", err);
            toast.error("Error al cargar proyectos pendientes de facturación.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'pendientes') {
            fetchPendingProjects();
        } else {
            setLoading(false);
        }
    }, [view]);

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Panel de Finanzas</h1>
                    <p className="text-muted-foreground mt-1">Control de facturación, cuentas por cobrar y tesorería.</p>
                </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="mb-6 border-b border-border overflow-x-auto">
                <nav className="flex space-x-8 min-w-max px-2" aria-label="Tabs">
                    {[
                        { id: 'dashboard', label: 'Dashboard Financiero', icon: <TrendingUp className="w-4 h-4 mr-2"/> },
                        { id: 'pendientes', label: 'Pendientes de Facturar', icon: <AlertTriangle className="w-4 h-4 mr-2"/> },
                        { id: 'cobrar', label: 'Cuentas por Cobrar', icon: <DollarSign className="w-4 h-4 mr-2"/> },
                        { id: 'pagar', label: 'Cuentas por Pagar (Proveedores)', icon: <FileText className="w-4 h-4 mr-2"/> },
                        { id: 'gastos', label: 'Gastos Operativos (OpEx)', icon: <Wallet className="w-4 h-4 mr-2"/> }, // NUEVA PESTAÑA
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id)}
                            className={`flex items-center py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                                view === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Vistas Dinámicas */}
            <div className="animate-in fade-in duration-300">
                {view === 'dashboard' && <AgingReportDashboard />}
                {view === 'pendientes' && <PendingInvoicesTable projects={projects} loading={loading} onUpdate={fetchPendingProjects} />}
                {view === 'cobrar' && <InvoicesList invoiceType="cliente" />}
                {view === 'pagar' && <InvoicesList invoiceType="proveedor" />}
                {view === 'gastos' && <OpExExpensesList />} {/* NUEVO COMPONENTE */}
            </div>
        </DashboardLayout>
    );
};

export default FinanzasDashboard;