import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { X, FileText, Upload, AlertTriangle, Trash2, Download, Edit3, Save, Info } from 'lucide-react';

export const ClientDossierPanel = ({ clienteId, plantaId, plantaNombre, currentUser, onClose }) => {
    // Estados Documentos
    const [documentos, setDocumentos] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Estados Datos de Planta
    const [plantaData, setPlantaData] = useState({});
    const [isEditingPlanta, setIsEditingPlanta] = useState(false);
    const [loadingPlanta, setLoadingPlanta] = useState(true);

    // Formulario de subida de Docs
    const [file, setFile] = useState(null);
    const [categoria, setCategoria] = useState('Acta Constitutiva');
    const [descripcionOtro, setDescripcionOtro] = useState('');

    const CATEGORIAS_DOCS = [
        "Acta Constitutiva",
        "Poderes del representante legal",
        "Identificación del representante legal",
        "Comprobante de domicilio",
        "Planos catastrales",
        "Planos generales",
        "Otro"
    ];

    useEffect(() => {
        if (plantaId) {
            fetchDocumentos();
            fetchPlantaData();
        } else {
            setLoadingDocs(false);
            setLoadingPlanta(false);
        }
    }, [plantaId]);

    const fetchDocumentos = async () => {
        try {
            const { data, error } = await supabase
                .from('documentos_clientes')
                .select('*, usuarios(nombre)')
                .eq('planta_id', plantaId)
                .order('creado_en', { ascending: false });
            
            if (error) throw error;
            setDocumentos(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const fetchPlantaData = async () => {
        try {
            const { data, error } = await supabase
                .from('plantas')
                .select('*')
                .eq('id', plantaId)
                .single();
            
            if (error) throw error;
            setPlantaData(data || {});
            
            // Si la mayoría de los campos están vacíos, activar edición por defecto
            if (!data.rfc && !data.domicilio_fiscal) {
                setIsEditingPlanta(true);
            }
        } catch (err) {
            console.error("Error al cargar planta", err);
        } finally {
            setLoadingPlanta(false);
        }
    };

    const handlePlantaChange = (e) => {
        const { name, value } = e.target;
        setPlantaData(prev => ({ ...prev, [name]: value }));
    };

    const handleSavePlanta = async () => {
        setLoadingPlanta(true);
        try {
            const { error } = await supabase
                .from('plantas')
                .update({
                    nombre_planta: plantaData.nombre_planta, // Razón Social
                    nombre_comercial: plantaData.nombre_comercial,
                    rfc: plantaData.rfc,
                    domicilio_fiscal: plantaData.domicilio_fiscal,
                    ciudad_estado: plantaData.ciudad_estado,
                    contacto_encargado: plantaData.contacto_encargado,
                    puesto_contacto: plantaData.puesto_contacto,
                    telefono_contacto: plantaData.telefono_contacto,
                    correo_contacto: plantaData.correo_contacto,
                    giro_empresa: plantaData.giro_empresa,
                    representante_legal: plantaData.representante_legal,
                    peticion_modificacion: false // Se limpia la petición si se guarda con éxito
                })
                .eq('id', plantaId);

            if (error) throw error;
            toast.success("Datos de la planta actualizados correctamente.");
            setIsEditingPlanta(false);
        } catch (err) {
            toast.error("Error al guardar los datos de la planta.");
            console.error(err);
        } finally {
            setLoadingPlanta(false);
        }
    };

    // Subida de Documentos
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error("Selecciona un archivo.");
        
        const nombreFinalDoc = categoria === 'Otro' && descripcionOtro.trim() ? descripcionOtro : categoria;

        setUploading(true);
        try {
            const filePath = `${plantaId}/${Date.now()}_${file.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('documentos_clientes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('documentos_clientes')
                .getPublicUrl(filePath);

            const { error: dbError } = await supabase
                .from('documentos_clientes')
                .insert([{
                    planta_id: plantaId,
                    nombre_archivo: nombreFinalDoc,
                    categoria: categoria,
                    url_archivo: publicUrl,
                    path_archivo: filePath,
                    subido_por: currentUser.id
                }]);

            if (dbError) throw dbError;

            toast.success("Documento agregado al expediente.");
            setFile(null);
            setCategoria('Acta Constitutiva');
            setDescripcionOtro('');
            fetchDocumentos();
        } catch (err) {
            toast.error("Error al subir el documento.");
        } finally {
            setUploading(false);
        }
    };

    const solicitarBorrado = async (docId) => {
        try {
            await supabase.from('documentos_clientes').update({ solicitud_borrado: true }).eq('id', docId);
            toast.success("Solicitud de eliminación enviada.");
            fetchDocumentos();
        } catch (err) {
            toast.error("Error al solicitar el borrado.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
                
                {/* Cabecera */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-primary flex items-center">
                            Expediente Completo
                        </h2>
                        <p className="text-sm font-medium text-accent">{plantaNombre || 'Planta'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Banner de Aviso */}
                <div className="bg-amber-100/50 border-y border-amber-200 p-3 shrink-0">
                    <p className="text-xs text-amber-800 font-bold flex items-center justify-center text-center">
                        <Info className="w-4 h-4 mr-2" />
                        En caso de haber cambios en la estructura, representantes o datos fiscales, por favor solicita la modificación o actualiza los datos aquí mismo.
                    </p>
                </div>

                {/* Área Scrolleable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* SECCIÓN 1: DATOS GENERALES (Planta) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Datos Generales y Fiscales</h3>
                            {!isEditingPlanta && (
                                <button onClick={() => setIsEditingPlanta(true)} className="flex items-center text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-lg">
                                    <Edit3 className="w-3.5 h-3.5 mr-1" /> Modificar Datos
                                </button>
                            )}
                        </div>

                        {loadingPlanta ? (
                            <p className="text-sm animate-pulse">Cargando datos...</p>
                        ) : (
                            <div className="bg-muted/10 border border-border rounded-xl p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Razón Social</label>
                                        <input type="text" name="nombre_planta" value={plantaData.nombre_planta || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Nombre Comercial</label>
                                        <input type="text" name="nombre_comercial" value={plantaData.nombre_comercial || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">RFC</label>
                                        <input type="text" name="rfc" value={plantaData.rfc || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Representante Legal</label>
                                        <input type="text" name="representante_legal" value={plantaData.representante_legal || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Domicilio Fiscal</label>
                                        <input type="text" name="domicilio_fiscal" value={plantaData.domicilio_fiscal || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Ciudad / Estado</label>
                                        <input type="text" name="ciudad_estado" value={plantaData.ciudad_estado || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Giro de Empresa</label>
                                        <input type="text" name="giro_empresa" value={plantaData.giro_empresa || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                </div>
                                
                                <hr className="border-border my-2" />
                                <h4 className="text-xs font-bold text-primary uppercase">Datos de Contacto en Planta</h4>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Contacto / Encargado</label>
                                        <input type="text" name="contacto_encargado" value={plantaData.contacto_encargado || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Puesto</label>
                                        <input type="text" name="puesto_contacto" value={plantaData.puesto_contacto || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Teléfono</label>
                                        <input type="text" name="telefono_contacto" value={plantaData.telefono_contacto || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Correo Electrónico</label>
                                        <input type="email" name="correo_contacto" value={plantaData.correo_contacto || ''} onChange={handlePlantaChange} disabled={!isEditingPlanta} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background disabled:bg-muted/50 disabled:text-muted-foreground" />
                                    </div>
                                </div>

                                {isEditingPlanta && (
                                    <div className="flex justify-end pt-3">
                                        <button onClick={handleSavePlanta} className="bg-primary text-primary-foreground text-sm font-bold py-2 px-6 rounded-md hover:bg-primary/90 flex items-center shadow-md">
                                            <Save className="w-4 h-4 mr-2" /> Guardar Cambios Generales
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: DOCUMENTOS LEGALES */}
                    <div className="border-t border-border pt-6">
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Archivos y Documentos</h3>
                        
                        {/* Zona de Subida */}
                        <form onSubmit={handleUpload} className="bg-muted/30 p-4 rounded-xl border border-border border-dashed space-y-4 mb-6">
                            <h4 className="text-sm font-bold flex items-center text-primary"><Upload className="w-4 h-4 mr-2" /> Aportar Nuevo Documento</h4>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <select 
                                    value={categoria} 
                                    onChange={e => { setCategoria(e.target.value); setDescripcionOtro(''); }} 
                                    className="w-full px-3 py-2 text-sm font-medium border border-border rounded-md bg-background outline-none focus:border-accent"
                                >
                                    {CATEGORIAS_DOCS.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                
                                {categoria === 'Otro' && (
                                    <input 
                                        type="text" 
                                        placeholder="Especifica qué documento es..." 
                                        value={descripcionOtro} 
                                        onChange={e => setDescripcionOtro(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background outline-none focus:border-accent"
                                        required
                                    />
                                )}

                                <input 
                                    type="file" 
                                    onChange={e => setFile(e.target.files[0])} 
                                    className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                    required
                                />
                            </div>
                            
                            <button type="submit" disabled={uploading} className="w-full bg-accent text-white text-sm font-bold py-2.5 rounded-md hover:bg-accent/90 transition-colors shadow-sm">
                                {uploading ? 'Subiendo Archivo...' : 'Subir a Expediente'}
                            </button>
                        </form>

                        {/* Lista de Documentos */}
                        {loadingDocs ? (
                            <p className="text-sm text-center">Cargando documentos...</p>
                        ) : documentos.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground italic">No hay documentos cargados en el expediente.</p>
                        ) : (
                            <div className="space-y-3">
                                {documentos.map(doc => (
                                    <div key={doc.id} className="group bg-background border border-border p-3 rounded-lg flex items-start justify-between hover:border-accent transition-colors">
                                        <div className="flex items-start overflow-hidden">
                                            <FileText className="w-8 h-8 text-accent mr-3 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold truncate pr-2">{doc.nombre_archivo}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] text-muted-foreground">Subido por {doc.usuarios?.nombre?.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 shrink-0">
                                            <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer" className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors" title="Descargar/Ver">
                                                <Download className="w-4 h-4" />
                                            </a>
                                            
                                            {doc.solicitud_borrado ? (
                                                <span className="text-[10px] text-orange-500 font-bold flex items-center px-2" title="Revisión pendiente">
                                                    <AlertTriangle className="w-3 h-3 mr-1"/> Borrado P.
                                                </span>
                                            ) : (
                                                <button onClick={() => solicitarBorrado(doc.id)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Solicitar Eliminación">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};