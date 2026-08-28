import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { AttachInvoiceModal } from '@/components/finance/AttachInvoiceModal';

// ========================================================
// TABLA DE PENDIENTES DE FACTURAR
// ========================================================
export const PendingInvoicesTable = ({ projects, loading, onUpdate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modalProject, setModalProject] = useState(null);

    const filteredProjects = projects.filter(p => 
        (p.npu?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.clientes?.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Buscar por NPU o cliente..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-1 focus:ring-accent text-sm outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">NPU / Cliente</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Servicio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Referencias</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Montos</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">Cargando...</td></tr> : 
                        filteredProjects.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No hay proyectos pendientes de facturar.</td></tr> :
                        filteredProjects.map(project => (
                            <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-primary">{project.npu}</p>
                                    <p className="text-sm font-medium">{project.clientes?.nombre_empresa}</p>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{project.servicios?.nombre_servicio}</td>
                                <td className="px-6 py-4 text-xs">
                                    <p><span className="font-bold">PO Cliente:</span> {project.po_cliente_ref || 'N/A'}</p>
                                    <p><span className="font-bold">Cot. Ref:</span> {project.cotizacion_cliente_ref || 'N/A'}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-green-600">Venta: ${project.precio_cotizacion_cliente?.toFixed(2) || '0.00'}</p>
                                    {project.costo_proveedor > 0 && <p className="text-xs text-destructive">Costo: ${project.costo_proveedor?.toFixed(2)}</p>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setModalProject(project)} className="bg-accent/10 text-accent hover:bg-accent hover:text-primary-foreground font-bold py-2 px-4 rounded-lg text-sm transition-colors border border-accent/20">
                                        Adjuntar Factura
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Simplificado (Conectaremos la lógica de guardado más adelante según tu estructura) */}
            {modalProject && (
                <AttachInvoiceModal project={modalProject} onClose={() => setModalProject(null)} onFinalized={() => { setModalProject(null); onUpdate(); }} />
            )}
        </div>
    );
};