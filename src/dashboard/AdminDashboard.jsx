import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { useUser } from '../context/UserContext';
import { ProjectManagementModal } from '../components/modals/ProjectManagementModal';
import { ProjectsTable } from '../components/shared/ProjectsTable';
import { UserManagement } from '../components/admin/UserManagement';
import { ServiceManagement } from '../components/admin/ServiceManagement';
import { NewProjectForm } from '../components/admin/NewProjectForm';
import { DataManagement } from '../components/shared/DataManagement';
import DashboardLayout from '../components/layout/DashboardLayout';
import { HistorialProyectosTable } from '../components/admin/HistorialProyectosTable';

export const AdminDashboard = ({ selectedRole }) => {
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
                .select('*, clientes(nombre_empresa, cliente_id_numerico), servicios(nombre_servicio, servicio_id_numerico), proveedores(nombre_proveedor, proveedor_id_numerico)')
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
                <div>
                    <div className="mb-6 border-b border-border">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setView('projects')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'projects' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground'}`}>Proyectos</button>
                            <button onClick={() => setView('users')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'users' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground'}`}>Usuarios</button>
                            <button onClick={() => setView('services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'services' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground'}`}>Servicios</button>
                            <button onClick={() => setView('providers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${view === 'providers' ? 'border-accent text-primary' : 'border-transparent text-muted-foreground'}`}>Proveedores</button>
                            <button onClick={() => setView('archivo')}>Archivo Histórico</button>
                        </nav>
                    </div>
                    
                    {view === 'users' && <UserManagement onUserAdded={() => {}} />}
                    
                    {view === 'projects' && (
                        <>
                            <NewProjectForm onProjectAdded={refreshData} />
                            <h2 className="text-2xl font-bold text-gray-800 my-6">Todos los Proyectos</h2>
                            {loading ? <p className="animate-pulse">Cargando tabla...</p> : 
                                <ProjectsTable 
                                    projects={projects} 
                                    onUpdateProject={refreshData} 
                                    userRole="administrador" 
                                    selectedRole={selectedRole} 
                                    onManageClick={setManagedProject} 
                                />
                            }
                        </>
                    )}

                    {view === 'services' && <ServiceManagement />}
                    
                    {view === 'providers' && (
                        <DataManagement 
                            collectionName="proveedores" 
                            title="Proveedores" 
                            fields={['nombre_proveedor', 'proveedor_id_numerico']} 
                            placeholderTexts={['Nombre del Proveedor', 'ID Numérico (ej: 01)']} 
                        />
                    )}
                    
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

                    {view === 'archivo' && <HistorialProyectosTable />}
                </div>
            </div>
        </DashboardLayout>
    );
};


