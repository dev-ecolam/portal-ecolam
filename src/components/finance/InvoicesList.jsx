import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Search, Plus } from 'lucide-react';

// ========================================================
// TABLAS GENERALES DE CXC y CXP
// ========================================================
export const InvoicesList = ({ invoiceType }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchInvoices = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('facturas')
                .select('*')
                .eq('tipo', invoiceType)
                .order('fecha_emision', { ascending: false });
            
            if (!error && data) setInvoices(data);
            setLoading(false);
        };
        fetchInvoices();
    }, [invoiceType]);

    const filteredInvoices = invoices.filter(inv => 
        (inv.folio?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (inv.entidad_nombre?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder={`Buscar folio o ${invoiceType}...`} className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button className="w-full md:w-auto bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors text-sm">
                    <Plus className="w-4 h-4 mr-2"/> Añadir Factura General
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Folio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">{invoiceType === 'cliente' ? 'Cliente' : 'Proveedor'}</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Monto Total</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Emisión</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Estatus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">Cargando facturas...</td></tr> : 
                        filteredInvoices.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No hay registros.</td></tr> :
                        filteredInvoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4 font-bold">{inv.folio}</td>
                                <td className="px-6 py-4 text-sm">{inv.entidad_nombre || 'Gasto General'}</td>
                                <td className="px-6 py-4 font-black">${Number(inv.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(inv.fecha_emision).toLocaleDateString('es-MX')}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        inv.estado === 'Pagada' ? 'bg-green-100 text-green-800' :
                                        inv.estado === 'Cancelada' ? 'bg-gray-100 text-gray-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {inv.estado}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
