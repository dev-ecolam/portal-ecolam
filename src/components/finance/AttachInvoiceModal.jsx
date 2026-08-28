import React, { useState } from 'react';
import { toast } from 'sonner';

// ========================================================
// MODAL: ADJUNTAR FACTURA AL PROYECTO
// ========================================================
export const AttachInvoiceModal = ({ project, onClose, onFinalized }) => {
    const [invoiceType, setInvoiceType] = useState('cliente'); // 'cliente' o 'proveedor'
    const [xmlFile, setXmlFile] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Lee el archivo localmente y extrae los datos al instante
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setXmlFile(file);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const xmlText = event.target.result;
            const extractedData = parseInvoiceXML(xmlText);

            if (extractedData) {
                setInvoiceData(extractedData);
                toast.success("Factura leída correctamente.");
            } else {
                setInvoiceData(null);
                toast.error('Error al leer el XML. Asegúrate de que es un archivo CFDI válido.');
            }
        };
        reader.readAsText(file);
    };

    const handleUpload = async () => {
        if (!xmlFile || !invoiceData) return toast.error("Debes subir un archivo XML válido.");
        setLoading(true);

        try {
            // 1. Subir XML a Supabase Storage (Bucket: 'facturas')
            const filePath = `${project.id}/${invoiceType}_${Date.now()}.xml`;
            const { error: uploadError } = await supabase.storage
                .from('facturas')
                .upload(filePath, xmlFile);

            if (uploadError) throw uploadError;

            // Obtener la URL pública del archivo
            const { data: publicUrlData } = supabase.storage
                .from('facturas')
                .getPublicUrl(filePath);

            // 2. Insertar los datos extraídos en la tabla 'facturas'
            const fechaEmisionSegura = new Date(invoiceData.fechaEmision);

            const { error: dbError } = await supabase
                .from('facturas')
                .insert([{
                    tipo: invoiceType,
                    proyecto_id: project.id,
                    folio: invoiceData.folio,
                    uuid_cfdi: invoiceData.uuid,
                    subtotal: invoiceData.subtotal,
                    iva: invoiceData.iva,
                    monto: invoiceData.monto,
                    fecha_emision: fechaEmisionSegura.toISOString().split('T')[0],
                    estado: 'Pendiente',
                    entidad_nombre: invoiceType === 'cliente' ? project.clientes?.nombre_empresa : project.proveedor_nombre,
                    url_xml: publicUrlData.publicUrl
                }]);

            if (dbError) throw dbError;

            // 3. Apagar la alerta del proyecto en la tabla proyectos_v2 (Si es de cliente)
            if (invoiceType === 'cliente') {
                await supabase
                    .from('proyectos_v2')
                    .update({ 
                        necesita_factura: false, 
                        estado: 'Completado' // Cierra el ciclo del proyecto
                    })
                    .eq('id', project.id);
            }

            toast.success("Factura guardada y enlazada al proyecto exitosamente.");
            onFinalized();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la factura en la base de datos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-primary">Facturar: {project.npu}</h3>
                        <p className="text-sm text-muted-foreground mt-1">Sube el XML y validaremos los datos.</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>
                
                <div className="space-y-5">
                    {/* Selector de tipo de factura */}
                    <div>
                        <label className="block text-sm font-bold mb-2">¿A quién corresponde esta factura?</label>
                        <select 
                            value={invoiceType} 
                            onChange={e => setInvoiceType(e.target.value)} 
                            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-accent outline-none text-sm"
                        >
                            <option value="cliente">Factura de Venta (Al Cliente)</option>
                            <option value="proveedor">Factura de Compra (Del Proveedor)</option>
                        </select>
                    </div>

                    {/* Input de Archivo */}
                    <div>
                        <label className="block text-sm font-bold mb-2">Subir Archivo XML (.xml)</label>
                        <input 
                            type="file" 
                            accept=".xml" 
                            onChange={handleFileChange} 
                            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold hover:file:bg-primary/20 cursor-pointer"
                        />
                    </div>

                    {/* Vista Previa de los Datos (Magia) */}
                    {invoiceData && (
                        <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl space-y-2 animate-in fade-in zoom-in duration-300">
                            <h4 className="font-bold text-accent mb-2 border-b border-accent/20 pb-1">Datos extraídos del CFDI</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="font-bold text-muted-foreground">Folio:</span> {invoiceData.folio}</div>
                                <div><span className="font-bold text-muted-foreground">Emisión:</span> {new Date(invoiceData.fechaEmision).toLocaleDateString('es-MX')}</div>
                                <div><span className="font-bold text-muted-foreground">Subtotal:</span> ${invoiceData.subtotal.toFixed(2)}</div>
                                <div><span className="font-bold text-muted-foreground">IVA:</span> ${invoiceData.iva.toFixed(2)}</div>
                                <div className="col-span-2 pt-2 border-t border-accent/20">
                                    <span className="font-black text-primary text-base">Total: ${invoiceData.monto.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button 
                        onClick={handleUpload} 
                        disabled={loading || !invoiceData} 
                        className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Factura'}
                    </button>
                </div>
            </div>
        </div>
    );
};