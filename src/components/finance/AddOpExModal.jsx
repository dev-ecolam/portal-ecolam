import React, { useState } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';

// ========================================================
// MODAL: REGISTRO MANUAL DE GASTOS (Tickets, Nómina, etc.)
// ========================================================
export const AddOpExModal = ({ onClose, onFinalized }) => {
    const [formData, setFormData] = useState({
        categoria: 'Gasolina y Transporte',
        tipoComprobante: 'Ticket / Nota',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        descripcion: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!formData.monto || !formData.descripcion) return toast.error("El monto y la descripción son obligatorios.");
        setLoading(true);

        try {
            const { error } = await supabase
                .from('facturas')
                .insert([{
                    tipo: 'gasto_operativo',
                    proyecto_id: null, // Es un gasto de la empresa, no de un proyecto en particular
                    folio: 'OPEX-' + Date.now().toString().slice(-6),
                    subtotal: Number(formData.monto), // Para simplificar asimilamos subtotal = total en gastos sin xml
                    monto: Number(formData.monto),
                    fecha_emision: formData.fecha,
                    estado: 'Pagada', // Los gastos operativos (gasolina, nominas) suelen registrarse ya pagados
                    descripcion: formData.descripcion,
                    categoria_gasto: formData.categoria,
                    tipo_comprobante: formData.tipoComprobante
                }]);

            if (error) throw error;
            toast.success("Gasto registrado correctamente.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al registrar el gasto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <h3 className="text-xl font-bold text-primary mb-6">Registrar Gasto Operativo (OpEx)</h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Categoría del Gasto</label>
                            <select value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:border-accent">
                                <option value="Nómina y Asimilados">Nómina y Asimilados</option>
                                <option value="Gasolina y Transporte">Gasolina y Transporte</option>
                                <option value="Insumos y Papelería">Insumos y Papelería</option>
                                <option value="Renta y Servicios">Renta y Servicios (Luz, Agua, Int)</option>
                                <option value="Software y Suscripciones">Software y Suscripciones</option>
                                <option value="Impuestos">Impuestos (SAT, IMSS)</option>
                                <option value="Otros Gastos Generales">Otros Gastos Generales</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Tipo de Comprobante</label>
                            <select value={formData.tipoComprobante} onChange={e => setFormData({...formData, tipoComprobante: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:border-accent">
                                <option value="Ticket / Nota">Ticket / Nota Física</option>
                                <option value="Recibo de Transferencia">Recibo de Transferencia</option>
                                <option value="Recibo de Nómina">Recibo de Nómina (PDF)</option>
                                <option value="Sin Comprobante">Sin Comprobante</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-1">Concepto / Descripción Corta</label>
                        <input type="text" placeholder="Ej. Quincena 1 de Octubre, Gasolina unidad 03..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:border-accent" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Monto Pagado (Total)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <input type="number" placeholder="0.00" value={formData.monto} onChange={e => setFormData({...formData, monto: e.target.value})} className="w-full pl-7 pr-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:border-accent font-bold" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Fecha de Gasto</label>
                            <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:border-accent" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50">
                        {loading ? 'Registrando...' : 'Registrar Gasto'}
                    </button>
                </div>
            </div>
        </div>
    );
};