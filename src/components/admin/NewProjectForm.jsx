import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { Alert } from '../ui/UIComponents'; 
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

// ==============================================================================
// COMPONENTE: Menú Desplegable con Buscador (Autocomplete)
// ==============================================================================
const SearchableSelect = ({ options, value, onChange, placeholder, displayKey, valueKey }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        const selected = options.find(opt => opt[valueKey] === value);
        setSearchTerm(selected ? selected[displayKey] : '');
    }, [value, options, displayKey, valueKey]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                const selected = options.find(opt => opt[valueKey] === value);
                setSearchTerm(selected ? selected[displayKey] : '');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [wrapperRef, value, options, valueKey, displayKey]);

    const filteredOptions = options.filter(opt => 
        opt[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    className="w-full p-2 pr-8 border rounded-lg bg-background outline-none focus:ring-1 focus:ring-accent text-sm"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        onChange(''); 
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            
            {isOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <li 
                                key={opt[valueKey]}
                                className="px-3 py-2 hover:bg-muted cursor-pointer text-sm text-foreground transition-colors"
                                onClick={() => {
                                    onChange(opt[valueKey]);
                                    setSearchTerm(opt[displayKey]);
                                    setIsOpen(false);
                                }}
                            >
                                {opt[displayKey]}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-muted-foreground text-sm italic">No hay coincidencias</li>
                    )}
                </ul>
            )}
        </div>
    );
};


// ==============================================================================
// FORMULARIO DE NUEVO PROYECTO
// ==============================================================================
const NewProjectForm = ({ onProjectAdded }) => {
    const formRef = useRef(null);
    const [collections, setCollections] = useState({ servicios: [], plantas: [], proveedores: [] });
    
    const [formData, setFormData] = useState({
        planta_id: '', servicio_id: '', proveedor_id: '', comentarios_apertura: '',
        fecha_apertura: new Date().toISOString().split('T')[0],
        precio_cotizacion_cliente: '', costo_proveedor: '', cotizacion_cliente_ref: '', 
        po_cliente_ref: '', cotizacion_proveedor_ref: '', po_proveedor: '',
        // Campos para URLs de PDF
        url_cotizacion_cliente: '', url_po_cliente: '', url_cotizacion_proveedor: '', url_po_proveedor: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDropdowns = async () => {
            try {
                const [pRes, sRes, provRes] = await Promise.all([
                    supabase.from('plantas').select('*').eq('estado', 'Activo').order('nombre_planta'),
                    supabase.from('servicios').select('*').eq('estado', 'Activo').order('nombre_servicio'),
                    supabase.from('proveedores').select('*').eq('estado', 'Activo').order('nombre_proveedor')
                ]);
                
                setCollections({ 
                    plantas: pRes.data || [],
                    servicios: sRes.data || [], 
                    proveedores: provRes.data || [] 
                });
            } catch (err) {
                toast.error("Error al cargar los catálogos");
            }
        };
        fetchDropdowns();
    }, []);

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingDoc(fieldName);
        try {
            const fileExt = file.name.split('.').pop();
            // Como no tenemos NPU aún, usamos un identificador temporal seguro
            const fileName = `pre_apertura_${fieldName}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('documentos_proyectos')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('documentos_proyectos')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, [fieldName]: publicUrlData.publicUrl }));
            toast.success('Documento adjuntado listo para guardar');
        } catch (error) {
            console.error(error);
            toast.error('Error al subir el documento PDF');
        } finally {
            setUploadingDoc(null);
        }
    };

    const renderDocUpload = (fieldName) => (
        <div className="mt-2 flex items-center justify-between bg-muted/30 p-2 rounded-md border border-border animate-in fade-in">
            {formData[fieldName] ? (
                <a href={formData[fieldName]} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-blue-600 hover:underline">
                    Ver Archivo Adjunto
                </a>
            ) : (
                <span className="text-[11px] text-muted-foreground italic">Falta PDF de respaldo</span>
            )}
            <label className={`cursor-pointer px-2 py-1 rounded text-[11px] font-bold transition-colors shadow-sm ${uploadingDoc === fieldName ? 'bg-muted text-muted-foreground' : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'}`}>
                {uploadingDoc === fieldName ? 'Subiendo...' : (formData[fieldName] ? 'Reemplazar' : 'Adjuntar PDF')}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, fieldName)} disabled={uploadingDoc === fieldName} />
            </label>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); 
        setError('');
        
        try {
            const planta = collections.plantas.find(p => p.id === formData.planta_id);
            const servicio = collections.servicios.find(s => s.id === formData.servicio_id);
            const proveedor = collections.proveedores.find(p => p.id === formData.proveedor_id);

            if (!planta || !servicio || !proveedor) {
                throw new Error("Por favor, selecciona opciones válidas del catálogo.");
            }

            let deducedClienteId = null;
            const { data: clienteData } = await supabase
                .from('usuarios')
                .select('id')
                .eq('rol', 'cliente')
                .eq('estado_empleado', 'Activo')
                .contains('plantasAsociadas', `[{"id": "${formData.planta_id}"}]`)
                .maybeSingle();

            if (clienteData) deducedClienteId = clienteData.id;

            const anioActual = new Date(formData.fecha_apertura).getFullYear();
            let { data: contadorData, error: countError } = await supabase.from('contadores_npu').select('*').eq('anio', anioActual).maybeSingle(); 
            
            let consecutivoActual = 1;
            if (!contadorData) {
                await supabase.from('contadores_npu').insert([{ anio: anioActual, consecutivo: 1 }]);
            } else {
                consecutivoActual = contadorData.consecutivo + 1;
                await supabase.from('contadores_npu').update({ consecutivo: consecutivoActual }).eq('anio', anioActual);
            }

            const consecutivoFormateado = consecutivoActual.toString().padStart(3, '0');
            const ultimosDos = anioActual.toString().slice(-2);
            const npu = `${planta.planta_id_numerico}-${servicio.servicio_id_numerico}-${proveedor.proveedor_id_numerico}-${consecutivoFormateado}${ultimosDos}`;

            const tienePO = formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '';
            const estadoInicial = tienePO ? 'Activo' : 'Cotización';
            const fechaDeActivacion = tienePO ? formData.fecha_apertura : null;

            const { error: insertError } = await supabase.from('proyectos_v2').insert([{
                cliente_id: deducedClienteId,
                planta_id: formData.planta_id,
                servicio_id: formData.servicio_id,
                proveedor_id: formData.proveedor_id,
                nombre_estudio: servicio.nombre_servicio,
                npu: npu,
                estado: estadoInicial,
                fecha_apertura: formData.fecha_apertura,
                fecha_activacion: fechaDeActivacion,
                precio_cotizacion_cliente: Number(formData.precio_cotizacion_cliente) || 0,
                costo_proveedor: Number(formData.costo_proveedor) || 0,
                cotizacion_cliente_ref: formData.cotizacion_cliente_ref,
                po_cliente_ref: formData.po_cliente_ref,
                cotizacion_proveedor_ref: formData.cotizacion_proveedor_ref,
                po_proveedor: formData.po_proveedor,
                url_cotizacion_cliente: formData.url_cotizacion_cliente,
                url_po_cliente: formData.url_po_cliente,
                url_cotizacion_proveedor: formData.url_cotizacion_proveedor,
                url_po_proveedor: formData.url_po_proveedor,
                comentarios_apertura: formData.comentarios_apertura
            }]);

            if (insertError) throw insertError;
            
            toast.success(`Proyecto creado con NPU: ${npu}`);
            
            formRef.current.reset();
            setFormData({
                planta_id: '', servicio_id: '', proveedor_id: '', comentarios_apertura: '',
                fecha_apertura: new Date().toISOString().split('T')[0],
                precio_cotizacion_cliente: '', costo_proveedor: '', cotizacion_cliente_ref: '', 
                po_cliente_ref: '', cotizacion_proveedor_ref: '', po_proveedor: '',
                url_cotizacion_cliente: '', url_po_cliente: '', url_cotizacion_proveedor: '', url_po_proveedor: ''
            });
            
            if(onProjectAdded) onProjectAdded();
            
        } catch (err) {
            setError(err.message || "Error al crear el proyecto.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-8 animate-in fade-in">
            <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                Crear Nuevo Proyecto o Cotización
            </h3>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                
                {/* FILA 1: FECHA Y CATÁLOGOS CON BUSCADOR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-5 rounded-xl border border-border">
                    <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">Fecha (Apertura)</label>
                        <input type="date" value={formData.fecha_apertura} onChange={e => setFormData({...formData, fecha_apertura: e.target.value})} className="w-full p-2 border rounded-lg outline-none focus:ring-1 focus:ring-accent text-sm" required />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">Planta</label>
                        <SearchableSelect 
                            options={collections.plantas} value={formData.planta_id} placeholder="Buscar..." displayKey="nombre_planta" valueKey="id"
                            onChange={val => setFormData({...formData, planta_id: val})}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">Servicio</label>
                        <SearchableSelect 
                            options={collections.servicios} value={formData.servicio_id} placeholder="Buscar..." displayKey="nombre_servicio" valueKey="id"
                            onChange={val => setFormData({...formData, servicio_id: val})}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1 uppercase">Proveedor</label>
                        <SearchableSelect 
                            options={collections.proveedores} value={formData.proveedor_id} placeholder="Buscar..." displayKey="nombre_proveedor" valueKey="id"
                            onChange={val => setFormData({...formData, proveedor_id: val})}
                        />
                    </div>
                </div>

                {/* FILA 2: DATOS FINANCIEROS Y REFERENCIAS CONDICIONALES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-card">
                        <h4 className="font-bold text-sm text-foreground uppercase border-b border-border pb-2">Información del Cliente</h4>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Precio Cotización (con IVA)</label>
                            <input type="number" placeholder="$ 0.00" value={formData.precio_cotizacion_cliente} onChange={e => setFormData({...formData, precio_cotizacion_cliente: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Ref. Cotización Cliente</label>
                            <input type="text" placeholder="Ej: COT-2024-001" value={formData.cotizacion_cliente_ref} onChange={e => setFormData({...formData, cotizacion_cliente_ref: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                            {formData.cotizacion_cliente_ref?.trim() && renderDocUpload('url_cotizacion_cliente')}
                        </div>
                        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                            <label className="block text-xs text-primary font-bold mb-1 uppercase">Orden de Compra (PO)</label>
                            <p className="text-[12px] text-muted-foreground mb-2">Llenarlo activará el proyecto. Déjalo vacío si es cotización.</p>
                            <input type="text" placeholder="Nº de PO..." value={formData.po_cliente_ref} onChange={e => setFormData({...formData, po_cliente_ref: e.target.value})} className="w-full p-2 border border-accent/30 rounded-lg bg-background font-mono text-sm focus:ring-1 focus:ring-accent outline-none" />
                            {formData.po_cliente_ref?.trim() && renderDocUpload('url_po_cliente')}
                        </div>
                    </div>
                    
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-card">
                        <h4 className="font-bold text-sm text-foreground uppercase border-b border-border pb-2">Información del Proveedor</h4>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Costo Proveedor (con IVA)</label>
                            <input type="number" placeholder="$ 0.00" value={formData.costo_proveedor} onChange={e => setFormData({...formData, costo_proveedor: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Ref. Cotización Proveedor</label>
                            <input type="text" placeholder="Ej: PROV-456" value={formData.cotizacion_proveedor_ref} onChange={e => setFormData({...formData, cotizacion_proveedor_ref: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                            {formData.cotizacion_proveedor_ref?.trim() && renderDocUpload('url_cotizacion_proveedor')}
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Orden de Compra (PO) Proveedor</label>
                            <input type="text" placeholder="Ej: PO-PROV-789" value={formData.po_proveedor} onChange={e => setFormData({...formData, po_proveedor: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                            {formData.po_proveedor?.trim() && renderDocUpload('url_po_proveedor')}
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Comentarios de Apertura (Opcional)</label>
                            <textarea rows="3" placeholder="Notas internas..." value={formData.comentarios_apertura} onChange={e => setFormData({...formData, comentarios_apertura: e.target.value})} className="w-full p-2 border rounded-lg resize-none text-sm" />
                        </div>
                    </div>
                </div>
                
                <Alert message={error} type="error" onClose={() => setError('')} />
                
                <div className="flex justify-end pt-2 border-t border-border">
                    <button type="submit" disabled={loading || uploadingDoc} className="w-full md:w-auto px-8 bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50">
                        {loading || uploadingDoc ? 'Procesando...' : (formData.po_cliente_ref ? 'Crear y Activar Proyecto' : 'Crear Cotización')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewProjectForm;