import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { Alert } from '../ui/UIComponents'; 
import { toast } from 'sonner';
import { ChevronDown, UploadCloud } from 'lucide-react';

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
        po_cliente_ref: '', cotizacion_proveedor_ref: ''
    });

    // Estados para los archivos PDF
    const [files, setFiles] = useState({
        url_cotizacion_cliente: null,
        url_po_cliente: null,
        url_cotizacion_proveedor: null
    });
    
    const [loading, setLoading] = useState(false);
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

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        setFiles(prev => ({ ...prev, [field]: file }));
    };

    // Helper para subir archivos a Supabase Storage
    const uploadFile = async (file, pathRef) => {
        if (!file) return null;
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${pathRef}_${Date.now()}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('documentos_proyectos')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos_proyectos')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error("Error uploading file:", err);
            toast.error(`Error al subir el archivo ${file.name}`);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); 
        setError('');
        
        try {
            const planta = collections.plantas.find(p => p.id === formData.planta_id);
            const servicio = collections.servicios.find(s => s.id === formData.servicio_id);
            const proveedor = collections.proveedores.find(p => p.id === formData.proveedor_id);

            if (!planta || !servicio || !proveedor) {
                throw new Error("Por favor, selecciona opciones válidas del catálogo para Planta, Servicio y Proveedor.");
            }

            // 1. Generar el NPU
            const anioActual = new Date(formData.fecha_apertura).getFullYear();
            let { data: contadorData, error: countError } = await supabase.from('contadores_npu').select('*').eq('anio', anioActual).single();
            
            let consecutivoActual = 1;
            if (countError && countError.code === 'PGRST116') {
                await supabase.from('contadores_npu').insert([{ anio: anioActual, consecutivo: 1 }]);
            } else if (contadorData) {
                consecutivoActual = contadorData.consecutivo + 1;
                await supabase.from('contadores_npu').update({ consecutivo: consecutivoActual }).eq('anio', anioActual);
            }

            const consecutivoFormateado = consecutivoActual.toString().padStart(3, '0');
            const ultimosDos = anioActual.toString().slice(-2);
            const npu = `${planta.planta_id_numerico}-${servicio.servicio_id_numerico}-${proveedor.proveedor_id_numerico}-${consecutivoFormateado}${ultimosDos}`;

            // 2. Subir Archivos si existen
            const urlCotizacionCliente = await uploadFile(files.url_cotizacion_cliente, `${npu}_cot_cliente`);
            const urlPOCliente = await uploadFile(files.url_po_cliente, `${npu}_po_cliente`);
            const urlCotizacionProveedor = await uploadFile(files.url_cotizacion_proveedor, `${npu}_cot_proveedor`);

            // 3. Evaluar estado inicial
            const tienePO = formData.po_cliente_ref && formData.po_cliente_ref.trim() !== '';
            const estadoInicial = tienePO ? 'Activo' : 'Cotización';
            const fechaDeActivacion = tienePO ? formData.fecha_apertura : null;

            // 4. Insertar Proyecto (Enviando nombre_estudio dinámicamente)
            const { error: insertError } = await supabase.from('proyectos_v2').insert([{
                planta_id: formData.planta_id,
                servicio_id: formData.servicio_id,
                proveedor_id: formData.proveedor_id,
                nombre_estudio: servicio.nombre_servicio, // <--- DATO OBLIGATORIO AÑADIDO AQUI
                npu: npu,
                estado: estadoInicial,
                fecha_apertura: formData.fecha_apertura,
                fecha_activacion: fechaDeActivacion,
                precio_cotizacion_cliente: Number(formData.precio_cotizacion_cliente) || 0,
                costo_proveedor: Number(formData.costo_proveedor) || 0,
                cotizacion_cliente_ref: formData.cotizacion_cliente_ref,
                po_cliente_ref: formData.po_cliente_ref,
                cotizacion_proveedor_ref: formData.cotizacion_proveedor_ref,
                url_cotizacion_cliente: urlCotizacionCliente,
                url_po_cliente: urlPOCliente,
                url_cotizacion_proveedor: urlCotizacionProveedor,
                comentarios_apertura: formData.comentarios_apertura
            }]);

            if (insertError) throw insertError;
            
            toast.success(`Proyecto/Cotización creado con NPU: ${npu}`);
            
            formRef.current.reset();
            setFormData({
                planta_id: '', servicio_id: '', proveedor_id: '', comentarios_apertura: '',
                fecha_apertura: new Date().toISOString().split('T')[0],
                precio_cotizacion_cliente: '', costo_proveedor: '', cotizacion_cliente_ref: '', 
                po_cliente_ref: '', cotizacion_proveedor_ref: ''
            });
            setFiles({
                url_cotizacion_cliente: null,
                url_po_cliente: null,
                url_cotizacion_proveedor: null
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

                {/* FILA 2: DATOS FINANCIEROS Y REFERENCIAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bloque Planta (Antes Cliente) */}
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-card">
                        <h4 className="font-bold text-sm text-foreground uppercase border-b border-border pb-2">Información del Cliente / Planta</h4>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Precio Cotización (con IVA)</label>
                            <input type="number" placeholder="$ 0.00" value={formData.precio_cotizacion_cliente} onChange={e => setFormData({...formData, precio_cotizacion_cliente: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Ref. Cotización Cliente</label>
                            <input type="text" placeholder="Ej: COT-2024-001" value={formData.cotizacion_cliente_ref} onChange={e => setFormData({...formData, cotizacion_cliente_ref: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        
                        {/* Subida dinámica de Cotización Cliente */}
                        {formData.cotizacion_cliente_ref.trim() !== '' && (
                            <div className="mt-2 pl-2 border-l-2 border-accent animate-in slide-in-from-top-2">
                                <label className="block text-[10px] font-bold text-primary uppercase mb-1 flex items-center">
                                    <UploadCloud className="w-3 h-3 mr-1" /> Adjuntar PDF de Cotización
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => handleFileChange(e, 'url_cotizacion_cliente')}
                                    className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer" 
                                />
                            </div>
                        )}

                        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20 mt-4">
                            <label className="block text-xs text-primary font-bold mb-1 uppercase">Orden de Compra (PO)</label>
                            <p className="text-[12px] text-muted-foreground mb-2">Llenarlo activará el proyecto. Déjalo si es una cotización.</p>
                            <input type="text" placeholder="Nº de PO..." value={formData.po_cliente_ref} onChange={e => setFormData({...formData, po_cliente_ref: e.target.value})} className="w-full p-2 border border-accent/30 rounded-lg bg-background font-mono text-sm focus:ring-1 focus:ring-accent outline-none" />
                            
                            {/* Subida dinámica de PO Cliente */}
                            {formData.po_cliente_ref.trim() !== '' && (
                                <div className="mt-3 animate-in fade-in">
                                    <label className="block text-[10px] font-bold text-primary uppercase mb-1 flex items-center">
                                        <UploadCloud className="w-3 h-3 mr-1" /> Adjuntar PDF de PO
                                    </label>
                                    <input 
                                        type="file" 
                                        accept=".pdf"
                                        onChange={(e) => handleFileChange(e, 'url_po_cliente')}
                                        className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer" 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Bloque Proveedor */}
                    <div className="space-y-4 border border-border p-4 rounded-xl bg-card">
                        <h4 className="font-bold text-sm text-foreground uppercase border-b border-border pb-2">Información del Proveedor</h4>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Costo Proveedor (con IVA)</label>
                            <input type="number" placeholder="$ 0.00" value={formData.costo_proveedor} onChange={e => setFormData({...formData, costo_proveedor: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Ref. Cotización Proveedor</label>
                            <input type="text" placeholder="Ej: PROV-456" value={formData.cotizacion_proveedor_ref} onChange={e => setFormData({...formData, cotizacion_proveedor_ref: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
                        </div>

                        {/* Subida dinámica de Cotización Proveedor */}
                        {formData.cotizacion_proveedor_ref.trim() !== '' && (
                            <div className="mt-2 pl-2 border-l-2 border-accent animate-in slide-in-from-top-2">
                                <label className="block text-[10px] font-bold text-primary uppercase mb-1 flex items-center">
                                    <UploadCloud className="w-3 h-3 mr-1" /> Adjuntar PDF Cot. Proveedor
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pdf"
                                    onChange={(e) => handleFileChange(e, 'url_cotizacion_proveedor')}
                                    className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer" 
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs text-muted-foreground mb-1 mt-4">Comentarios de Apertura (Opcional)</label>
                            <textarea rows="3" placeholder="Notas internas..." value={formData.comentarios_apertura} onChange={e => setFormData({...formData, comentarios_apertura: e.target.value})} className="w-full p-2 border rounded-lg resize-none text-sm" />
                        </div>
                    </div>
                </div>
                
                <Alert message={error} type="error" onClose={() => setError('')} />
                
                <div className="flex justify-end pt-2 border-t border-border">
                    <button type="submit" disabled={loading} className="w-full md:w-auto px-8 bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-3 rounded-lg shadow-md transition-all">
                        {loading ? 'Procesando...' : (formData.po_cliente_ref ? 'Crear y Activar Proyecto' : 'Crear Cotización')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewProjectForm;