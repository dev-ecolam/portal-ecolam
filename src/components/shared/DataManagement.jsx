import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { Search, Trash2 } from 'lucide-react';

export const DataManagement = ({ tableName, title, nameColumn, idColumn, padding }) => {
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('estado', 'Activo')
                .order(nameColumn, { ascending: true });
            
            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            toast.error(`Error al cargar ${title}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [tableName]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        try {
            const { data: maxIdData } = await supabase
                .from(tableName)
                .select(idColumn)
                .order(idColumn, { ascending: false })
                .limit(1);

            let nextNum = 1;
            // Evitamos que el 00 interfiera con el autoincremento normal
            if (maxIdData && maxIdData.length > 0 && maxIdData[0][idColumn]) {
                const currentMax = parseInt(maxIdData[0][idColumn], 10);
                nextNum = currentMax >= 0 ? currentMax + 1 : 1;
            }
            const nextId = String(nextNum).padStart(padding, '0');

            const { error } = await supabase.from(tableName).insert([{
                [nameColumn]: newItemName.trim(),
                [idColumn]: nextId,
                estado: 'Activo'
            }]);

            if (error) throw error;
            toast.success(`${title} agregado con ID: ${nextId}`);
            setNewItemName('');
            fetchData();
        } catch (error) {
            toast.error("Error al guardar");
        }
    };

    const handleBaja = async (id, nombre) => {
        // Advertencia Crítica que obliga a teclear para evitar clics por error
        const confirmacion = window.prompt(
            `⚠️ ACCIÓN CRÍTICA\n\nEstás a punto de dar de baja "${nombre}".\n\nPara confirmar, escribe la palabra: BAJA`
        );

        if (confirmacion !== "BAJA") {
            toast.info("Baja cancelada.");
            return;
        }

        try {
            const { error } = await supabase.from(tableName).update({ estado: 'Inactivo' }).eq('id', id);
            if (error) throw error;
            toast.success("Dado de baja correctamente");
            fetchData();
        } catch (error) {
            toast.error("Error al dar de baja");
        }
    };

    const filteredItems = items.filter(i => i[nameColumn]?.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border animate-in fade-in">
            <h2 className="text-xl font-bold mb-6 text-foreground">Gestión de {title}</h2>
            
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 mb-8 bg-muted/5 p-4 rounded-xl border border-border">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">Nombre</label>
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={`Nuevo ${title}...`} className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-accent text-sm" required />
                </div>
                <div className="flex items-end">
                    <button type="submit" className="w-full md:w-auto bg-primary text-primary-foreground font-bold py-2 px-8 rounded-lg hover:opacity-90 transition-all h-[38px] text-sm shadow-sm">
                        Agregar
                    </button>
                </div>
            </form>

            <hr className="my-6 border-border" />

            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                <h3 className="text-lg font-bold text-foreground">{title} Activos</h3>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder={`Buscar ${title.toLowerCase()}...`} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-1 focus:ring-accent bg-background" />
                </div>
            </div>

            {loading ? <p className="animate-pulse text-sm text-muted-foreground text-center py-8">Cargando...</p> : (
                <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="min-w-full text-sm divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground w-24">ID</th>
                                <th className="px-4 py-3 text-left font-bold text-muted-foreground">Nombre</th>
                                <th className="px-4 py-3 text-right font-bold text-muted-foreground w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {paginatedItems.length === 0 ? (
                                <tr><td colSpan="3" className="px-4 py-8 text-center text-muted-foreground italic">No se encontraron {title.toLowerCase()}.</td></tr>
                            ) : paginatedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-muted-foreground">{item[idColumn]}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{item[nameColumn]}</td>
                                    <td className="px-4 py-3 text-right">
                                        {/* Condicional de seguridad: No mostrar botón de borrar si el ID es '00' */}
                                        {item[idColumn] !== '00' && (
                                            <button onClick={() => handleBaja(item.id, item[nameColumn])} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Dar de baja">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
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
        </div>
    );
};