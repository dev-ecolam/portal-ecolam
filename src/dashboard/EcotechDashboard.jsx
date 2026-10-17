import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { CheckCircle2, Kanban } from 'lucide-react';

import { EcotechProjectsTable } from '@/components/ecotech/EcotechProjectsTable';

const EcotechDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pendientes');

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Se realiza una sola consulta eficiente
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select(`
                    *, 
                    plantas(nombre_planta, nombre_comercial), 
                    servicios(nombre_servicio),
                    proveedores!inner(nombre_proveedor, proveedor_id_numerico),
                    logistica_ecotech(*)
                `)
                .ilike('proveedores.nombre_proveedor', '%Ecotech%')
                .or('ecotech_num_proyecto.not.is.null,ecotech_solicitud_enviada.eq.true') 
                .order('fecha_apertura', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error fetching projects for Ecotech: ", error);
            toast.error("Error al cargar los proyectos de Ecotech.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Separación de proyectos en memoria (Súper rápido para el cliente)
    const getLogisticaStatus = (p) => {
        if (!p.logistica_ecotech) return null;
        return Array.isArray(p.logistica_ecotech) ? p.logistica_ecotech[0]?.estatus : p.logistica_ecotech?.estatus;
    };

    const pendientes = projects.filter(p => getLogisticaStatus(p) !== 'Terminado');
    const terminados = projects.filter(p => getLogisticaStatus(p) === 'Terminado');

    const currentData = activeTab === 'pendientes' ? pendientes : terminados;

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary">Portal Aliado: Ecotech</h1>
                <p className="text-muted-foreground mt-1">Gestión de números de proyecto, muestras y logística de guías.</p>
            </div>
            
            {/* PESTAÑAS DEL DASHBOARD */}
            <div className="flex border-b border-border mb-6">
                <button 
                    onClick={() => setActiveTab('pendientes')} 
                    className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'pendientes' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <Kanban className="w-4 h-4 mr-2" /> 
                    Pendientes
                    <span className="ml-2 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{pendientes.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('terminados')} 
                    className={`flex items-center px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'terminados' ? 'border-green-600 text-green-700' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> 
                    Terminados
                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">{terminados.length}</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div></div>
            ) : projects.length === 0 ? (
                <div className="bg-card p-12 rounded-xl border border-border text-center shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-bold text-foreground">Sin proyectos</p>
                    <p className="text-muted-foreground">Actualmente no hay proyectos asignados a Ecotech en el sistema.</p>
                </div>
            ) : (
                <EcotechProjectsTable 
                    projects={currentData} 
                    activeTab={activeTab} 
                    onUpdateProject={fetchProjects} 
                />
            )}
        </DashboardLayout>
    );
};

export default EcotechDashboard;