import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabase/client';
import { Alert } from '../ui/Alert';

// ==============================================================================
// FORMULARIO DE NUEVO PROYECTO (Lógica de Fechas de Activación)
// ==============================================================================
const NewProjectForm = ({ onProjectAdded }) => {
    const formRef = useRef(null);
    const [collections, setCollections] = useState({ clientes: [], servicios: [], proveedores: [] });
    const [formData, setFormData] = useState({
        cliente_id: '', servicio_id: '', proveedor_id: '', comentarios_apertura: '',
        fecha_apertura: new Date().toISOString().split('T')[0], // Se usará para cotización o alta inicial
        precio_cotizacion_cliente: '', costo_proveedor: '', cotizacion_cliente_ref: '', 
        po_cliente_ref: '', cotizacion_proveedor_ref: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Dentro de <NewProjectForm />
    useEffect(() => {
        const fetchDropdowns = async () => {
            const [cRes, sRes, pRes] = await Promise.all([
                supabase.from('clientes').select('*').order('nombre_empresa'),
                supabase.from('servicios').select('*').eq('activo', true).order('nombre_servicio'),
                supabase.from('proveedores').select('*').eq('activo', true).order('nombre_proveedor')
            ]);
            setCollections({ 
                clientes: cRes.data || [], 
                servicios: sRes.data || [], 
                proveedores: pRes.data || [] 
            });
        };
        fetchDropdowns();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        
        try {
            const cliente = collections.clientes.find(c => c.id === formData.cliente_id);
            const servicio = collections.servicios.find(s => s.id === formData.servicio_id);
            const proveedor = collections.proveedores.find(p => p.id === formData.proveedor_id);

            // 1. Obtener y actualizar el contador NPU
            const anioActual = new Date(formData.fecha_apertura).getFullYear();
            let { data: contadorData } = await supabase.from('contadores_npu').select('*').eq('anio', anioActual).single();
            
            if (!contadorData) {
                await supabase.from('contadores_npu').insert([{ anio: anioActual, consecutivo: 1 }]);
                contadorData = { consecutivo: 1 };
            } else {
                contadorData.consecutivo += 1;
                await supabase.from('contadores_npu').update({ consecutivo: contadorData.consecutivo }).eq('anio', anioActual);
            }

            // 2. Armar el NPU
            const consecutivoFormateado = contadorData.consecutivo.toString().padStart(3, '0');
            const ultimosDos = anioActual.toString().slice(-2);
            const npu = `${cliente.cliente_id_numerico}-${servicio.servicio_id_numerico}-${proveedor.proveedor_id_numerico}-${consecutivoFormateado}${ultimosDos}`;

            // 3. Lógica inteligente de Activación
            // Si el admin escribió una PO al crear el proyecto, se activa hoy mismo. Si no, se queda como cotización y sin fecha de activación.
            const tienePO = formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '';
            const estadoInicial = tienePO ? 'activo' : 'cotizacion';
            const fechaDeActivacion = tienePO ? formData.fecha_apertura : null;

            // 4. Crear el Proyecto
            const { error: insertError } = await supabase.from('proyectos_v2').insert([{
                ...formData,
                npu,
                estado: estadoInicial,
                fecha_activacion: fechaDeActivacion,
                dias_habiles_estimados: servicio.dias_habiles_estimados || 0, // Jalamos los días directamente del catálogo
                precio_cotizacion_cliente: Number(formData.precio_cotizacion_cliente) || 0,
                costo_proveedor: Number(formData.costo_proveedor) || 0,
            }]);

            if (insertError) throw insertError;
            
            formRef.current.reset();
            setFormData({
                cliente_id: '', servicio_id: '', proveedor_id: '', comentarios_apertura: '',
                fecha_apertura: new Date().toISOString().split('T')[0],
                precio_cotizacion_cliente: '', costo_proveedor: '', cotizacion_cliente_ref: '', 
                po_cliente_ref: '', cotizacion_proveedor_ref: ''
            });
            onProjectAdded();
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border mb-8">
            <h3 className="text-xl font-bold mb-4">Crear Nuevo Proyecto o Cotización</h3>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Fecha de Alta (Cotización)</label>
                        <input type="date" value={formData.fecha_apertura} onChange={e => setFormData({...formData, fecha_apertura: e.target.value})} className="w-full p-2 border rounded" required />
                    </div>
                    
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})} className="p-2 border rounded" required>
                            <option value="">Seleccionar Cliente</option>
                            {collections.clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                        </select>

                        <select value={formData.servicio_id} onChange={e => setFormData({...formData, servicio_id: e.target.value})} className="p-2 border rounded" required>
                            <option value="">Seleccionar Servicio</option>
                            {collections.servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
                        </select>

                        <select value={formData.proveedor_id} onChange={e => setFormData({...formData, proveedor_id: e.target.value})} className="p-2 border rounded" required>
                            <option value="">Seleccionar Proveedor</option>
                            {collections.proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre_proveedor}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-4">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">Datos del Cliente</h4>
                        <input type="number" placeholder="Precio Cotización (con IVA)" value={formData.precio_cotizacion_cliente} onChange={e => setFormData({...formData, precio_cotizacion_cliente: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="Ref. Cotización Cliente" value={formData.cotizacion_cliente_ref} onChange={e => setFormData({...formData, cotizacion_cliente_ref: e.target.value})} className="w-full p-2 border rounded" />
                        
                        <div className="bg-accent/10 p-3 rounded border border-accent/20">
                            <label className="block text-xs text-primary font-bold mb-1">Orden de Compra (PO) - Activa el proyecto</label>
                            <input type="text" placeholder="Nº de PO (Dejar vacío si es solo cotización)" value={formData.po_cliente_ref} onChange={e => setFormData({...formData, po_cliente_ref: e.target.value})} className="w-full p-2 border rounded bg-background" />
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground">Datos del Proveedor</h4>
                        <input type="number" placeholder="Costo Proveedor (con IVA)" value={formData.costo_proveedor} onChange={e => setFormData({...formData, costo_proveedor: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="Ref. Cotización Proveedor" value={formData.cotizacion_proveedor_ref} onChange={e => setFormData({...formData, cotizacion_proveedor_ref: e.target.value})} className="w-full p-2 border rounded" />
                    </div>
                </div>
                
                <Alert message={error} type="error" onClose={() => setError('')} />
                <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-primary-foreground font-bold py-3 rounded text-lg transition-colors">
                    {loading ? 'Procesando...' : (formData.po_cliente_ref ? 'Crear y Activar Proyecto (Generar NPU)' : 'Crear Cotización (Generar NPU)')}
                </button>
            </form>
        </div>
    );
};

export default NewProjectForm;