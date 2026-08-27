import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { CheckCircle2 } from 'lucide-react';

import { EcotechProjectsTable } from '@/components/ecotech/EcotechProjectsTable';


export const EcotechDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .ilike('proveedor_nombre', '%Ecotech%')
                .or('ecotech_estatus.neq.Terminado,ecotech_estatus.is.null')
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

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-primary">Portal Aliado: Ecotech</h1>
                <p className="text-muted-foreground mt-1">Gestión de números de proyecto, muestras y logística de guías.</p>
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
                <EcotechProjectsTable projects={projects} onUpdateProject={fetchProjects} />
            )}
        </DashboardLayout>
    );
};
