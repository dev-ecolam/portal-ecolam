import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Search, Plus } from 'lucide-react';
import { AddOpExModal } from './AddOpExModal';

// ========================================================
// MÓDULO DE GASTOS OPERATIVOS (OpEx)
// ========================================================
export const OpExExpensesList = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchExpenses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('facturas')
            .select('*')
            .eq('tipo', 'gasto_operativo')
            .order('fecha_emision', { ascending: false });
        
        if (!error && data) setExpenses(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const filteredExpenses = expenses.filter(exp => 
        (exp.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.categoria_gasto?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" placeholder="Buscar por concepto o categoría..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm outline-none" onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors text-sm shadow-sm">
                    <Plus className="w-4 h-4 mr-2"/> Registrar Nuevo Gasto
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Fecha</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Categoría</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Concepto / Descripción</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Monto Total</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Comprobante</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? <tr><td colSpan="5" className="text-center py-8">Cargando gastos...</td></tr> : 
                        filteredExpenses.length === 0 ? <tr><td colSpan="5" className="text-center py-8 text-muted-foreground">No hay gastos registrados.</td></tr> :
                        filteredExpenses.map(exp => (
                            <tr key={exp.id} className="hover:bg-muted/30">
                                <td className="px-6 py-4 text-sm font-medium">{new Date(exp.fecha_emision).toLocaleDateString('es-MX')}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-bold border border-border">
                                        {exp.categoria_gasto}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm">{exp.descripcion}</td>
                                <td className="px-6 py-4 font-black text-destructive">${Number(exp.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-muted-foreground">{exp.tipo_comprobante}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAddModal && <AddOpExModal onClose={() => setShowAddModal(false)} onFinalized={fetchExpenses} />}
        </div>
    );
};
