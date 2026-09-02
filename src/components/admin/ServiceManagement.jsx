import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';

const DEPENDENCIAS = [
    'STPS', 'SEMARNAT', 'PROFEPA', 'CONAGUA', 
    'Protección Civil', 'Gobierno del Estado', 
    'Gobierno Municipal', 'Secretaría de Salud / COFEPRIS', 
    'Norma Oficial Mexicana (NOM)', 'Ninguna / Control Interno'
];

const ServiceManagement = () => {
    const [servicios, setServicios] = useState([]);
    const [newServiceName, setNewServiceName] = useState('');
    const [dependencia, setDependencia] = useState(DEPENDENCIAS[0]);
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchServicios = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('servicios')
                .select('*')
                .eq('estado', 'Activo')
                .order('nombre_servicio', { ascending: true });
            if (error) throw error;
            setServicios(data || []);
        } catch (error) {
            toast.error("Error al cargar servicios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchServicios(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newServiceName.trim()) return;

        try {
            const { data: maxIdData } = await supabase
                .from('servicios')
                .select('servicio_id_numerico')
                .order('servicio_id_numerico', { ascending: false })
                .limit(1);

            let nextNum = 1;
            if (maxIdData && maxIdData.length > 0 && maxIdData[0].servicio_id_numerico) {
                nextNum = parseInt(maxIdData[0].servicio_id_numerico, 10) + 1;
            }
            const nextId = String(nextNum).padStart(4, '0');

            const { error } = await supabase.from('servicios').insert([{
                nombre_servicio: newServiceName.trim(),
                servicio_id_numerico: nextId,
                dependencia: dependencia,
                estado: 'Activo'
            }]);

            if (error) throw error;
            
            toast.success(`Servicio agregado con ID: ${nextId}`);
            setNewServiceName('');
            setDependencia(DEPENDENCIAS[0]);
            fetchServicios();
        } catch (error) {
            toast.error("Error al guardar el servicio");
        }
    };

    const handleBaja = async (id, nombre) => {
        if (!window.confirm(`¿Dar de baja el servicio "${nombre}"?`)) return;
        try {
            const { error } = await supabase.from('servicios').update({ estado: 'Inactivo' }).eq('id', id);
            if (error) throw error;
            toast.success("Servicio dado de baja");
            fetchServicios();
        } catch (error) {
            toast.error("Error al dar de baja");
        }
    };

    const filteredServicios = servicios.filter(s => s.nombre_servicio?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredServicios.length / itemsPerPage) || 1;
    const paginatedServicios = filteredServicios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 text-foreground">Gestión de Servicios</h2>
            
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-[2]">
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Nombre del Servicio</label>
                    <input type="text" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Ej. Análisis de Agua..." className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent" required />
                </div>
                <div className="flex-[1]">
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Dependencia</label>
                    <select value={dependencia} onChange={(e) => setDependencia(e.target.value)} className="w-full p-2 border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent">
                        {DEPENDENCIAS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button type="submit" className="bg-primary text-primary-foreground font-bold py-2 px-6 rounded-lg hover:opacity-90 h-[42px] w-full md:w-auto">Agregar</button>
                </div>
            </form>

            <hr className="my-6 border-border" />

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-foreground">Servicios Activos</h3>
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Buscar servicio..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent" />
                </div>
            </div>

            {loading ? <p className="animate-pulse text-sm text-muted-foreground">Cargando...</p> : (
                <div className="border rounded-xl overflow-hidden">
                    <table className="min-w-full text-sm divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground w-20">ID</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Servicio</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Dependencia</th>
                                <th className="px-4 py-3 text-right font-bold text-muted-foreground w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {paginatedServicios.length === 0 ? (
                                <tr><td colSpan="4" className="px-4 py-6 text-center text-muted-foreground">No hay servicios.</td></tr>
                            ) : paginatedServicios.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3 font-mono text-muted-foreground">{s.servicio_id_numerico}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{s.nombre_servicio}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{s.dependencia}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleBaja(s.id, s.nombre_servicio)} className="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Dar de baja"><Trash2 className="h-4 w-4" /></button>
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
export default ServiceManagement;