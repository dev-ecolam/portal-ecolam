import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { Search, Trash2, X, Edit, XCircle } from 'lucide-react';
import { useUser } from '@/context/UserContext';

// ==============================================================================
// MODAL: Editar Cliente y Asignar Plantas
// ==============================================================================
const ManageClientModal = ({ isOpen, onClose, cliente, plantasDisponibles, onClientUpdated }) => {
    const [nombre, setNombre] = useState('');
    const [empresa, setEmpresa] = useState('');
    const [selectedPlantas, setSelectedPlantas] = useState([]);
    const [plantaSearch, setPlantaSearch] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen && cliente) {
            setNombre(cliente.nombre || '');
            setEmpresa(cliente.empresa || '');
            // Extraer solo los IDs del JSONB plantasAsociadas para el estado de los checkboxes
            const plantasAsignadas = Array.isArray(cliente.plantasAsociadas) 
                ? cliente.plantasAsociadas.map(p => p.id) 
                : [];
            setSelectedPlantas(plantasAsignadas);
            setPlantaSearch('');
        }
    }, [isOpen, cliente]);

    if (!isOpen || !cliente) return null;

    const handlePlantaToggle = (plantaId) => {
        setSelectedPlantas(prev => 
            prev.includes(plantaId) ? prev.filter(p => p !== plantaId) : [...prev, plantaId]
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Reconstruir el JSONB de plantas asociadas
            // Necesitamos guardar el objeto completo {id, nombre_planta} para facilitar consultas en el dashboard del cliente
            const plantasJSONB = plantasDisponibles
                .filter(p => selectedPlantas.includes(p.id))
                .map(p => ({ id: p.id, nombre_planta: p.nombre_planta }));

            const { error } = await supabase
                .from('usuarios')
                .update({ 
                    nombre: nombre.trim(),
                    empresa: empresa.trim(),
                    plantasAsociadas: plantasJSONB
                })
                .eq('id', cliente.id)
                .eq('estado_empleado', 'Activo');

            if (error) throw error;

            toast.success('Cliente actualizado correctamente');
            onClientUpdated(); // Refrescar la tabla
            onClose(); // Cerrar modal
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar el cliente');
        } finally {
            setIsSaving(false);
        }
    };

    const plantasSeleccionadasData = plantasDisponibles.filter(p => selectedPlantas.includes(p.id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-border bg-muted/30">
                    <h2 className="text-xl font-bold text-foreground">Editar Cliente: {cliente.nombre}</h2>
                    <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form id="edit-client-form" onSubmit={handleSave} className="space-y-6">
                        
                        {/* Datos Básicos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Nombre del Contacto</label>
                                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Empresa / Razón Social</label>
                                <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
                            </div>
                        </div>

                        {/* Asignación de Plantas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/10 border border-border rounded-lg p-4">
                            
                            {/* Lista de selección */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Asignar Plantas</label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar planta..." 
                                        value={plantaSearch}
                                        onChange={(e) => setPlantaSearch(e.target.value)}
                                        className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-sm bg-background focus:ring-1 focus:ring-accent outline-none"
                                    />
                                </div>
                                <div className="h-[200px] overflow-y-auto border border-border p-2 rounded-lg bg-background flex flex-col gap-1">
                                    {plantasDisponibles.filter(p => p.nombre_planta.toLowerCase().includes(plantaSearch.toLowerCase())).map(planta => (
                                        <label key={planta.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted p-1.5 rounded transition-colors">
                                            <input type="checkbox" checked={selectedPlantas.includes(planta.id)} onChange={() => handlePlantaToggle(planta.id)} className="rounded text-accent w-4 h-4" />
                                            <span><span className="font-mono text-muted-foreground mr-1">{planta.planta_id_numerico}</span> {planta.nombre_planta}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen */}
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">
                                    Plantas Seleccionadas ({selectedPlantas.length})
                                </label>
                                <div className="h-[235px] overflow-y-auto border border-border rounded-lg bg-background p-3 flex flex-wrap content-start gap-2">
                                    {plantasSeleccionadasData.length === 0 ? (
                                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground italic">
                                            Ninguna planta seleccionada
                                        </div>
                                    ) : (
                                        plantasSeleccionadasData.map(planta => (
                                            <div key={planta.id} className="bg-primary text-primary-foreground text-xs px-2.5 py-1.5 rounded-md font-bold flex items-center shadow-sm">
                                                {planta.nombre_planta}
                                                <button type="button" onClick={() => handlePlantaToggle(planta.id)} className="ml-2 hover:text-red-300 focus:outline-none">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-border bg-muted/30 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="edit-client-form" disabled={isSaving} className="px-8 py-2 rounded-lg text-sm font-bold bg-accent text-primary-foreground hover:bg-accent/90 transition-colors shadow-md disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==============================================================================
// COMPONENTE PRINCIPAL: UserManagement
// ==============================================================================
const UserManagement = ({ onUserAdded }) => {
    const { userData } = useUser();
    
    // Estado de Alta (Solo info de perfil, sin Auth)
    const [correo, setCorreo] = useState('');
    const [nombre, setNombre] = useState('');
    const [empresa, setEmpresa] = useState('');
    
    // Estado de Modal de Edición
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);

    // Listas y Catálogos
    const [plantasDisponibles, setPlantasDisponibles] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Paginación y Búsqueda
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchDatos = async () => {
        setLoading(true);
        try {
            // Traer clientes activos
            const { data: clientesData } = await supabase
                .from('usuarios')
                .select('*')
                .eq('rol', 'cliente')
                .eq('estado_empleado', 'Activo')
                .order('nombre', { ascending: true });
            
            // Traer plantas activas
            const { data: plantasData } = await supabase
                .from('plantas')
                .select('id, nombre_planta, planta_id_numerico')
                .eq('estado', 'Activo')
                .order('nombre_planta');

            setClientes(clientesData || []);
            setPlantasDisponibles(plantasData || []);
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDatos(); }, []);

    // ALTA DE CLIENTE (Perfil únicamente, sin Supabase Auth para desarrollo local)
    const handleCreateClientProfile = async (e) => {
        e.preventDefault();

        try {
            // Se inserta en public.usuarios sin UUID atado a auth.users, asumiendo que el RLS lo permite localmente o generará un UUID random.
            const { error: insertError } = await supabase.from('usuarios').insert([{
                correo: correo.trim(),
                nombre: nombre.trim(),
                empresa: empresa.trim(),
                rol: 'cliente',
                estado_empleado: 'Activo',
                plantasAsociadas: [] // Inicia sin plantas, se le asignan en 'Editar'
            }]);

            if (insertError) throw insertError;

            toast.success(`Perfil de cliente creado. Ahora edítalo para asignarle plantas.`);
            setCorreo(''); setNombre(''); setEmpresa('');
            fetchDatos();
            if(onUserAdded) onUserAdded();
        } catch (error) {
            console.error(error);
            toast.error("Error al registrar perfil de cliente");
        }
    };

    const handleBaja = async (id, nombreCliente) => {
        if (!window.confirm(`¿Dar de baja al cliente "${nombreCliente}"? Perderá el acceso al portal.`)) return;
        try {
            const { error } = await supabase.from('usuarios').update({ estado_empleado: 'Inactivo' }).eq('id', id);
            if (error) throw error;
            toast.success("Cliente dado de baja");
            fetchDatos();
        } catch (error) {
            toast.error("Error al dar de baja");
        }
    };

    const openEditModal = (cliente) => {
        setClientToEdit(cliente);
        setIsEditModalOpen(true);
    };

    // Datos procesados para UI
    const filteredClientes = clientes.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.empresa?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage) || 1;
    const paginatedClientes = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border animate-in fade-in">
            <h2 className="text-xl font-bold mb-6 text-foreground">Alta de Clientes (Perfil)</h2>
            
            <form onSubmit={handleCreateClientProfile} className="mb-8 border border-border p-5 rounded-xl bg-muted/5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Nombre del Contacto</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Empresa / Razón Social</label>
                        <input type="text" value={empresa} onChange={(e) => setEmpresa(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Correo Electrónico</label>
                        <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent outline-none text-sm" />
                    </div>
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all text-sm">
                        Registrar Perfil
                    </button>
                </div>
            </form>

            <hr className="my-6 border-border" />

            {/* TABLA INFERIOR */}
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h3 className="text-lg font-bold text-foreground">Directorio de Clientes</h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Buscar por nombre o empresa..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-accent outline-none bg-background" />
                </div>
            </div>

            {loading ? <p className="animate-pulse text-sm text-muted-foreground text-center py-8">Cargando directorio de clientes...</p> : (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Contacto y Empresa</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Correo</th>
                                <th className="px-4 py-3 text-center font-bold text-muted-foreground">Plantas Asignadas</th>
                                <th className="px-4 py-3 text-right font-bold text-muted-foreground w-28">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {paginatedClientes.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-8 text-center text-muted-foreground italic">No se encontraron clientes activos.</td></tr>
                            ) : paginatedClientes.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-foreground">{c.nombre}</div>
                                        <div className="text-xs text-muted-foreground">{c.empresa || 'Sin empresa'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{c.correo}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold border border-border">
                                            {Array.isArray(c.plantasAsociadas) ? c.plantasAsociadas.length : 0} 
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(c)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors" title="Modificar y Asignar Plantas">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleBaja(c.id, c.nombre)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Dar de baja">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-3 bg-muted/20 border-t border-border">
                            <span className="text-xs text-muted-foreground">Pág {currentPage} de {totalPages}</span>
                            <div className="flex space-x-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs border rounded-md bg-background disabled:opacity-50 hover:bg-muted transition-colors">Ant</button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs border rounded-md bg-background disabled:opacity-50 hover:bg-muted transition-colors">Sig</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Renderizar Modal */}
            <ManageClientModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                cliente={clientToEdit} 
                plantasDisponibles={plantasDisponibles} 
                onClientUpdated={fetchDatos} 
            />
        </div>
    );
};
export default UserManagement;