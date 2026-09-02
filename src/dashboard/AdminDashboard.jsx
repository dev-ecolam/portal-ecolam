import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useUser } from '../context/UserContext';
import { ProjectManagementModal } from '../components/modals/ProjectManagementModal';
import { ProjectsTable } from '../components/shared/ProjectsTable';

import UserManagement from '../components/admin/UserManagement';
import ServiceManagement from '../components/admin/ServiceManagement';
import NewProjectForm from '../components/admin/NewProjectForm';
import { DataManagement } from '../components/shared/DataManagement';
import DashboardLayout from '../components/layout/DashboardLayout';
import { HistorialProyectosTable } from '../components/admin/HistorialProyectosTable';

const AdminDashboard = ({ selectedRole }) => {
    const { userData, user } = useUser();
    const [view, setView] = useState('projects');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [managedProject, setManagedProject] = useState(null);

    const refreshData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes:usuarios(nombre), servicios(nombre_servicio, servicio_id_numerico), plantas(nombre_planta, planta_id_numerico), proveedores(nombre_proveedor, proveedor_id_numerico)')
                .order('fecha_apertura', { ascending: false });
            
            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error("Error al cargar proyectos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    return (
        <DashboardLayout>
            <div>
                {/* BARRA DE NAVEGACIÓN SUPERIOR */}
                <div className="mb-6 border-b border-border">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setView('projects')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'projects' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Proyectos</button>
                        <button onClick={() => setView('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'users' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Clientes</button>
                        <button onClick={() => setView('plantas')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'plantas' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Plantas</button>
                        <button onClick={() => setView('services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'services' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Servicios</button>
                        <button onClick={() => setView('providers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'providers' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Proveedores</button>
                        <button onClick={() => setView('archivo')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors ${view === 'archivo' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Archivo Histórico</button>
                    </nav>
                </div>
                
                {/* RENDERIZADO CONDICIONAL DE PESTAÑAS */}
                {view === 'projects' && (
                    <div className="animate-in fade-in duration-300">
                        <NewProjectForm onProjectAdded={refreshData} />
                        <h2 className="text-2xl font-bold text-foreground my-6">Todos los Proyectos</h2>
                        {loading ? <p className="animate-pulse text-muted-foreground">Cargando tabla...</p> : 
                            <ProjectsTable 
                                projects={projects} 
                                onUpdateProject={refreshData} 
                                userRole="administrador" 
                                selectedRole={selectedRole} 
                                onManageClick={setManagedProject} 
                            />
                        }
                    </div>
                )}

                {view === 'users' && (
                    <div className="animate-in fade-in duration-300">
                        <UserManagement onUserAdded={() => {}} />
                    </div>
                )}

                {view === 'plantas' && (
                    <div className="animate-in fade-in duration-300">
                        <DataManagement tableName="plantas" title="Plantas" nameColumn="nombre_planta" idColumn="planta_id_numerico" padding={3} />
                    </div>
                )}

                {view === 'services' && (
                    <div className="animate-in fade-in duration-300">
                        <ServiceManagement />
                    </div>
                )}
                
                {view === 'providers' && (
                    <div className="animate-in fade-in duration-300">
                        <DataManagement tableName="proveedores" title="Proveedores" nameColumn="nombre_proveedor" idColumn="proveedor_id_numerico" padding={2} />
                    </div>
                )}

                {view === 'archivo' && (
                    <div className="animate-in fade-in duration-300">
                        <HistorialProyectosTable />
                    </div>
                )}
                
                {/* MODALES FLOTANTES */}
                {managedProject && 
                    <ProjectManagementModal 
                        project={managedProject} 
                        onClose={() => setManagedProject(null)} 
                        onUpdate={refreshData} 
                        user={user} 
                        userData={userData} 
                        userRole="administrador" 
                    />
                }
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
