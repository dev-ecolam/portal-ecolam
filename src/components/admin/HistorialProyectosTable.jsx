import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabase/client';
import { Search, FolderOpen, Download } from 'lucide-react';

export const HistorialProyectosTable = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [npuFilter, setNpuFilter] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [providerFilter, setProviderFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // Cálculo de 5 años (Requerimiento Fiscal SAT México)
                const startYear = new Date().getFullYear() - 5;
                const startDate = `${startYear}-01-01`;

                // Consulta relacional (JOINs en Supabase)
                const { data, error } = await supabase
                    .from('proyectos_v2')
                    .select(`
                        id, npu, estado, fecha_apertura, 
                        precio_cotizacion_cliente, costo_proveedor,
                        po_cliente_ref, cotizacion_proveedor_ref, po_proveedor,
                        url_pdf_cliente, notas_supervisor,
                        clientes(nombre_empresa),
                        servicios(nombre_servicio),
                        facturas!facturas_proyecto_id_fkey(folio, tipo)
                    `)
                    .gte('fecha_apertura', startDate)
                    .order('fecha_apertura', { ascending: false });

                if (error) throw error;
                
                // Procesamos la data para que sea fácil de mapear en React
                const cleanData = (data || []).map(p => {
                    const facturasCliente = p.facturas?.filter(f => f.tipo === 'cliente').map(f => f.folio).join(', ');
                    const facturasProv = p.facturas?.filter(f => f.tipo === 'proveedor').map(f => f.folio).join(', ');
                    
                    return {
                        ...p,
                        clienteNombre: p.clientes?.nombre_empresa || 'N/A',
                        servicioNombre: p.servicios?.nombre_servicio || 'N/A',
                        proveedorNombre: p.proveedor_nombre || 'N/A', // Asumiendo que sigue como texto libre o relación
                        foliosCliente: facturasCliente || 'Sin factura',
                        foliosProv: facturasProv || '---'
                    };
                });

                setProjects(cleanData);
            } catch (err) {
                console.error("Error cargando historial:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    // Listas únicas para los selectores (dropdowns)
    const uniqueClients = useMemo(() => [...new Set(projects.map(p => p.clienteNombre))].sort(), [projects]);
    const uniqueServices = useMemo(() => [...new Set(projects.map(p => p.servicioNombre))].sort(), [projects]);
    const uniqueProviders = useMemo(() => [...new Set(projects.map(p => p.proveedorNombre))].filter(n => n !== 'N/A').sort(), [projects]);

    // Filtrado en memoria
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchNPU = !npuFilter || p.npu?.toLowerCase().includes(npuFilter.toLowerCase());
            const matchClient = !clientFilter || p.clienteNombre === clientFilter;
            const matchProvider = !providerFilter || p.proveedorNombre === providerFilter;
            const matchService = !serviceFilter || p.servicioNombre === serviceFilter;
            return matchNPU && matchClient && matchProvider && matchService;
        });
    }, [projects, npuFilter, clientFilter, providerFilter, serviceFilter]);

    // Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-accent"/>
                    <h2 className="text-lg font-bold text-primary">Archivo Histórico (Legal 5 años)</h2>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por NPU..."
                            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"
                            value={npuFilter}
                            onChange={(e) => { setNpuFilter(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                    
                    <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                        <option value="">Todos los Clientes</option>
                        {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                        <option value="">Todos los Servicios</option>
                        {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select value={providerFilter} onChange={(e) => { setProviderFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                        <option value="">Todos los Proveedores</option>
                        {uniqueProviders.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Proyecto / Servicio</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente / Factura</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Proveedor / Factura</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Márgenes Financieros</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Entregable Final</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {currentItems.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No se encontraron proyectos en el archivo.</td></tr>
                            ) : currentItems.map(p => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{p.npu}</p>
                                        <p className="text-sm font-medium">{p.servicioNombre}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${p.estado === 'completado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold">{p.clienteNombre}</p>
                                        <p className="text-xs text-muted-foreground mt-1"><span className="font-bold text-blue-600">PO:</span> {p.po_cliente_ref || '-'}</p>
                                        <p className="text-xs text-muted-foreground"><span className="font-bold text-blue-600">Fac:</span> {p.foliosCliente}</p>
                                    </td>

                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold">{p.proveedorNombre}</p>
                                        <p className="text-xs text-muted-foreground mt-1"><span className="font-bold text-orange-600">PO:</span> {p.po_proveedor || '-'}</p>
                                        <p className="text-xs text-muted-foreground"><span className="font-bold text-orange-600">Fac:</span> {p.foliosProv}</p>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-black text-green-600">Venta: ${(p.precio_cotizacion_cliente || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                            <p className="text-xs font-bold text-destructive">Costo: ${(p.costo_proveedor || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        {p.url_pdf_cliente ? (
                                            <a 
                                                href={`/visor.html?pdf=${encodeURIComponent(p.url_pdf_cliente)}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-flex items-center justify-center bg-accent/10 text-accent font-bold px-3 py-1.5 rounded hover:bg-accent hover:text-white transition-colors text-xs"
                                            >
                                                <FolderOpen className="w-3 h-3 mr-1" />
                                                Abrir Expediente
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sin documento final</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Paginación */}
            {!loading && totalPages > 0 && (
                <div className="p-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>Mostrar:</span>
                        <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 border border-border rounded-md bg-background">
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Página {currentPage} de {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50">Anterior</button>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50">Siguiente</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};