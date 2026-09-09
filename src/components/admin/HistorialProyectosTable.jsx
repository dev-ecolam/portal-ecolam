import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../supabase/client';
import { Search, FolderOpen, Download } from 'lucide-react';

export const HistorialProyectosTable = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [npuFilter, setNpuFilter] = useState('');
    const [plantaFilter, setPlantaFilter] = useState('');
    const [providerFilter, setProviderFilter] = useState('');
    const [serviceFilter, setServiceFilter] = useState('');
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                // Cálculo de rango: Desde hace 5 años, HASTA el 1 de Enero del año actual (excluyendo el año en curso)
                const currentYear = new Date().getFullYear();
                const startYear = currentYear - 5;
                
                const startDate = `${startYear}-01-01`;
                const endDate = `${currentYear}-01-01`;

                // Consulta relacional
                const { data, error } = await supabase
                    .from('proyectos_v2')
                    .select(`
                        id, npu, estado, fecha_apertura, fecha_activacion, comentarios_apertura,
                        precio_cotizacion_cliente, costo_proveedor, nombre_estudio,
                        po_cliente_ref, cotizacion_proveedor_ref, po_proveedor,
                        url_pdf_cliente, notas_supervisor,
                        plantas(nombre_planta),
                        servicios(nombre_servicio),
                        proveedores(nombre_proveedor),
                        facturas!facturas_proyecto_id_fkey(folio, tipo)
                    `)
                    .gte('fecha_apertura', startDate)
                    .lt('fecha_apertura', endDate) // "lt" significa Less Than (Menor que el año actual)
                    .order('fecha_apertura', { ascending: false });

                if (error) throw error;
                
                // Procesamos la data para que sea fácil de mapear en React
                const cleanData = (data || []).map(p => {
                    const facturasCliente = p.facturas?.filter(f => f.tipo === 'cliente').map(f => f.folio).join(', ');
                    const facturasProv = p.facturas?.filter(f => f.tipo === 'proveedor').map(f => f.folio).join(', ');
                    
                    return {
                        ...p,
                        plantaNombre: p.plantas?.nombre_planta || 'N/A',
                        servicioNombre: p.servicios?.nombre_servicio || 'N/A',
                        proveedorNombre: p.proveedores?.nombre_proveedor || p.proveedor_nombre || 'N/A', 
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
    const uniquePlantas = useMemo(() => [...new Set(projects.map(p => p.plantaNombre))].sort(), [projects]);
    const uniqueServices = useMemo(() => [...new Set(projects.map(p => p.servicioNombre))].sort(), [projects]);
    const uniqueProviders = useMemo(() => [...new Set(projects.map(p => p.proveedorNombre))].filter(n => n !== 'N/A').sort(), [projects]);

    // Filtrado en memoria
    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const matchNPU = !npuFilter || p.npu?.toLowerCase().includes(npuFilter.toLowerCase());
            const matchPlanta = !plantaFilter || p.plantaNombre === plantaFilter;
            const matchProvider = !providerFilter || p.proveedorNombre === providerFilter;
            const matchService = !serviceFilter || p.servicioNombre === serviceFilter;
            return matchNPU && matchPlanta && matchProvider && matchService;
        });
    }, [projects, npuFilter, plantaFilter, providerFilter, serviceFilter]);

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
                    <h2 className="text-lg font-bold text-primary">Archivo de Proyectos y Cotizaciones</h2>
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
                    
                    <select value={plantaFilter} onChange={(e) => { setPlantaFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none">
                        <option value="">Todas las Plantas</option>
                        {uniquePlantas.map(c => <option key={c} value={c}>{c}</option>)}
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Planta / Fechas</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Finanzas / PO</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Notas de Apertura</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Entregable Final</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {currentItems.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No se encontraron proyectos en el archivo.</td></tr>
                            ) : currentItems.map(p => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    {/* COLUMNA 1: Proyecto y Servicio */}
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-primary">{p.npu}</p>
                                        <p className="text-sm font-medium">{p.nombre_estudio}</p>
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block 
                                            ${p.estado?.toLowerCase() === 'completado' ? 'bg-green-100 text-green-800' : 
                                              p.estado?.toLowerCase() === 'cotización' ? 'bg-gray-100 text-gray-800' : 
                                              'bg-yellow-100 text-yellow-800'}`}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    
                                    {/* COLUMNA 2: Planta y Fechas */}
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-foreground mb-1">{p.plantaNombre}</p>
                                        <p className="text-xs text-muted-foreground">
                                            <span className="font-bold text-gray-600">Cotizado:</span> {new Date(p.fecha_apertura).toLocaleDateString('es-MX')}
                                        </p>
                                        {p.fecha_activacion && p.estado?.toLowerCase() !== 'cotización' && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                <span className="font-bold text-accent">Activado:</span> {new Date(p.fecha_activacion).toLocaleDateString('es-MX')}
                                            </p>
                                        )}
                                    </td>

                                    {/* COLUMNA 3: Proveedor, Finanzas y PO */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1 mb-2 border-b border-border pb-2">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase">Cliente</p>
                                            <p className="text-sm font-black text-green-600">Venta: ${(p.precio_cotizacion_cliente || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                            <p className="text-xs text-muted-foreground"><span className="font-bold text-blue-600">PO:</span> {p.po_cliente_ref || 'Pendiente'}</p>
                                        </div>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-[11px] font-bold text-muted-foreground uppercase">{p.proveedorNombre}</p>
                                            <p className="text-xs font-bold text-destructive">Costo: ${(p.costo_proveedor || 0).toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
                                            <p className="text-xs text-muted-foreground"><span className="font-bold text-orange-600">PO:</span> {p.po_proveedor || '-'}</p>
                                        </div>
                                    </td>

                                    {/* COLUMNA 4: Notas de Apertura */}
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-muted-foreground italic max-w-[200px] break-words">
                                            {p.comentarios_apertura || "Sin notas."}
                                        </p>
                                    </td>

                                    {/* COLUMNA 5: Entregable */}
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
                                            <span className="text-xs text-muted-foreground italic">Sin documento</span>
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