import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { Search, Trash2, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const UserManagement = ({ onUserAdded }) => {
    const { userData } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nombre, setNombre] = useState('');
    const [selectedPlantas, setSelectedPlantas] = useState([]);
    
    // Plantas disponibles para asignar
    const [plantasDisponibles, setPlantasDisponibles] = useState([]);
    const [plantaSearch, setPlantaSearch] = useState('');
    
    // Lista de clientes
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
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
                .eq('estado', 'Activo');

            setClientes(clientesData || []);
            setPlantasDisponibles(plantasData || []);
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDatos(); }, []);

    const handleCreateClient = async (e) => {
        e.preventDefault();
        
        if (selectedPlantas.length === 0) {
            toast.error("Debes asignar al menos una planta al cliente.");
            return;
        }

        try {
            // Generamos ID de cliente (Ej: 001)
            const { data: maxIdData } = await supabase
                .from('usuarios')
                .select('cliente_id_numerico')
                .eq('rol', 'cliente')
                .order('cliente_id_numerico', { ascending: false })
                .limit(1);

            let nextNum = 1;
            if (maxIdData && maxIdData.length > 0 && maxIdData[0].cliente_id_numerico) {
                nextNum = parseInt(maxIdData[0].cliente_id_numerico, 10) + 1;
            }
            const nextId = String(nextNum).padStart(3, '0');

            // Creamos el perfil de cliente (sin empresa)
            const { error: insertError } = await supabase.from('usuarios').insert([{
                email: email.trim(),
                nombre: nombre.trim(),
                rol: 'cliente',
                estado_empleado: 'Activo',
                cliente_id_numerico: nextId,
                plantasAsociadas: selectedPlantas
            }]);

            if (insertError) throw insertError;

            toast.success(`Cliente ${nombre} creado correctamente`);
            setEmail(''); setPassword(''); setNombre(''); setSelectedPlantas([]); setPlantaSearch('');
            fetchDatos();
            if(onUserAdded) onUserAdded();
        } catch (error) {
            toast.error("Error al registrar cliente");
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

    const handlePlantaToggle = (plantaId) => {
        setSelectedPlantas(prev => 
            prev.includes(plantaId) ? prev.filter(p => p !== plantaId) : [...prev, plantaId]
        );
    };

    // Datos procesados para UI
    const filteredClientes = clientes.filter(c => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredClientes.length / itemsPerPage) || 1;
    const paginatedClientes = filteredClientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Plantas seleccionadas para mostrarlas en el cuadro derecho
    const plantasSeleccionadasData = plantasDisponibles.filter(p => selectedPlantas.includes(p.id));

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 text-foreground">Alta de Clientes</h2>
            
            <form onSubmit={handleCreateClient} className="mb-8 border border-border p-5 rounded-xl bg-muted/5">
                {/* FILA 1: DATOS PERSONALES Y ACCESO */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Nombre del Contacto</label>
                        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Correo Electrónico (Acceso)</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Contraseña</label>
                        <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-accent" />
                    </div>
                </div>

                {/* FILA 2: ASIGNACIÓN DE PLANTAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-lg p-4">
                    
                    {/* Búsqueda y Selección */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">Buscar y Asignar Plantas</label>
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                            <input 
                                type="text" 
                                placeholder="Buscar planta por nombre..." 
                                value={plantaSearch}
                                onChange={(e) => setPlantaSearch(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 border rounded-lg text-sm bg-background focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                        <div className="max-h-[160px] overflow-y-auto border border-border p-2 rounded-lg bg-background flex flex-col gap-1">
                            {plantasDisponibles.filter(p => p.nombre_planta.toLowerCase().includes(plantaSearch.toLowerCase())).map(planta => (
                                <label key={planta.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted p-1.5 rounded transition-colors">
                                    <input type="checkbox" checked={selectedPlantas.includes(planta.id)} onChange={() => handlePlantaToggle(planta.id)} className="rounded text-accent w-4 h-4" />
                                    <span><span className="font-mono text-muted-foreground mr-1">{planta.planta_id_numerico}</span> {planta.nombre_planta}</span>
                                </label>
                            ))}
                            {plantasDisponibles.filter(p => p.nombre_planta.toLowerCase().includes(plantaSearch.toLowerCase())).length === 0 && (
                                <p className="text-xs text-muted-foreground p-2 italic">No se encontraron plantas.</p>
                            )}
                        </div>
                    </div>

                    {/* Resumen de Plantas Seleccionadas */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase">
                            Plantas Seleccionadas ({selectedPlantas.length})
                        </label>
                        <div className="h-[205px] overflow-y-auto border border-border rounded-lg bg-muted/20 p-3 flex flex-wrap content-start gap-2">
                            {plantasSeleccionadasData.length === 0 ? (
                                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground italic">
                                    Selecciona plantas de la lista
                                </div>
                            ) : (
                                plantasSeleccionadasData.map(planta => (
                                    <div key={planta.id} className="bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-md font-bold flex items-center shadow-sm">
                                        <span className="opacity-80 font-mono mr-1">{planta.planta_id_numerico}</span> 
                                        {planta.nombre_planta}
                                        <button 
                                            type="button" 
                                            onClick={() => handlePlantaToggle(planta.id)}
                                            className="ml-2 hover:text-red-300 focus:outline-none"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2.5 px-8 rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all">Registrar Cliente</button>
                </div>
            </form>

            <hr className="my-6 border-border" />

            {/* TABLA INFERIOR */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Clientes Activos</h3>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-accent outline-none" />
                </div>
            </div>

            {loading ? <p className="animate-pulse text-sm text-muted-foreground">Cargando clientes...</p> : (
                <div className="border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground w-20">ID</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Contacto</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground text-center">Plantas Asignadas</th>
                                <th className="px-4 py-3 text-right font-bold text-muted-foreground w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {paginatedClientes.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center text-muted-foreground">No se encontraron clientes activos.</td></tr>
                            ) : paginatedClientes.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3 font-mono text-muted-foreground">{c.cliente_id_numerico}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{c.nombre}<br/><span className="text-xs text-muted-foreground font-normal">{c.email}</span></td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold border border-border">
                                            {c.plantasAsociadas?.length || 0} Plantas
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleBaja(c.id, c.nombre)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Dar de baja"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-3 bg-muted/20 border-t border-border">
                            <span className="text-xs text-muted-foreground">Pág {currentPage} de {totalPages}</span>
                            <div className="flex space-x-2">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 text-xs border rounded bg-background disabled:opacity-50">Ant</button>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 text-xs border rounded bg-background disabled:opacity-50">Sig</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default UserManagement;