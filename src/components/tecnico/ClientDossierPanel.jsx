import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { X, FileText, Download, Edit3, Save, FileArchive } from 'lucide-react';

export const ClientDossierPanel = ({ plantaId, plantaNombre, currentUser, onClose }) => {
    // Estados Datos de Planta
    const [plantaData, setPlantaData] = useState({});
    const [isEditingPlanta, setIsEditingPlanta] = useState(false);
    const [loadingPlanta, setLoadingPlanta] = useState(true);

    // Estados Estudios/Proyectos (PDFs) y Editables (.rar)
    const [estudios, setEstudios] = useState([]);
    const [editables, setEditables] = useState([]);
    const [loadingEstudios, setLoadingEstudios] = useState(true);
    const [loadingEditables, setLoadingEditables] = useState(true);

    useEffect(() => {
        if (plantaId) {
            fetchPlantaData();
            fetchEstudiosRecientes();
            fetchEditables();
        } else {
            setLoadingPlanta(false);
            setLoadingEstudios(false);
            setLoadingEditables(false);
        }
    }, [plantaId]);

    const fetchPlantaData = async () => {
        try {
            const { data, error } = await supabase
                .from('plantas')
                .select('*')
                .eq('id', plantaId)
                .maybeSingle();
            
            if (error) throw error;
            if (data) {
                setPlantaData(data);
                // Se eliminó la regla que abría automáticamente la edición
            }
        } catch (err) {
            console.error("Error al cargar planta", err);
        } finally {
            setLoadingPlanta(false);
        }
    };

    const fetchEstudiosRecientes = async () => {
        try {
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('id, servicio_id, servicios(nombre_servicio), url_estudio_r2, fecha_vencimiento, fecha_apertura')
                .eq('planta_id', plantaId)
                .not('url_estudio_r2', 'is', null) 
                .order('fecha_apertura', { ascending: false }); 
            
            if (error) throw error;

            const uniqueServices = [];
            const seenServices = new Set();
            
            if (data) {
                data.forEach(proj => {
                    if (!seenServices.has(proj.servicio_id)) {
                        seenServices.add(proj.servicio_id);
                        uniqueServices.push(proj);
                    }
                });
            }
            setEstudios(uniqueServices);
        } catch (err) {
            console.error("Error al cargar estudios:", err);
        } finally {
            setLoadingEstudios(false);
        }
    };

    const fetchEditables = async () => {
        try {
            const { data, error } = await supabase
                .from('documentos_clientes')
                .select('*')
                .eq('planta_id', plantaId)
                .eq('categoria', 'Editable') // Buscamos solo los archivos base .rar/.zip
                .order('creado_en', { ascending: false });
            
            if (error) throw error;
            setEditables(data || []);
        } catch (err) {
            console.error("Error al cargar editables:", err);
        } finally {
            setLoadingEditables(false);
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
                    // nombre_planta se excluye a propósito para evitar sobreescritura accidental
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
                    peticion_modificacion: false
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

    const handleEditClick = () => {
        if (plantaData.rfc || plantaData.nombre_comercial) {
            toast.warning("Advertencia: Esta planta ya tiene datos registrados, ten cuidado al modificarlos.");
        }
        setIsEditingPlanta(true);
    };

    const DataItem = ({ label, value }) => (
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
            {value ? (
                <span className="text-sm font-medium text-foreground select-all">{value}</span>
            ) : (
                <span className="text-sm italic text-muted-foreground/60">(Falta este dato)</span>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
                
                {/* Cabecera */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-primary flex items-center">
                            Expediente del Cliente
                        </h2>
                        <p className="text-sm font-medium text-accent">{plantaNombre || 'Planta'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Área Scrolleable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* SECCIÓN 1: DATOS GENERALES */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Datos Generales y Fiscales</h3>
                        </div>

                        {loadingPlanta ? (
                            <p className="text-sm animate-pulse">Cargando datos...</p>
                        ) : (
                            <div className="bg-muted/10 border border-border rounded-xl p-5">
                                {!isEditingPlanta ? (
                                    /* MODO LECTURA */
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                                            <DataItem label="Razón Social" value={plantaData.nombre_planta} />
                                            <DataItem label="Nombre Comercial" value={plantaData.nombre_comercial} />
                                            <DataItem label="RFC" value={plantaData.rfc} />
                                            <DataItem label="Representante Legal" value={plantaData.representante_legal} />
                                            <div className="md:col-span-2">
                                                <DataItem label="Domicilio Fiscal" value={plantaData.domicilio_fiscal} />
                                            </div>
                                            <DataItem label="Ciudad / Estado" value={plantaData.ciudad_estado} />
                                            <DataItem label="Giro de Empresa" value={plantaData.giro_empresa} />
                                        </div>
                                        <hr className="border-border my-5" />
                                        <h4 className="text-xs font-bold text-primary uppercase mb-4">Datos de Contacto en Planta</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                                            <DataItem label="Contacto / Encargado" value={plantaData.contacto_encargado} />
                                            <DataItem label="Puesto" value={plantaData.puesto_contacto} />
                                            <DataItem label="Teléfono" value={plantaData.telefono_contacto} />
                                            <DataItem label="Correo Electrónico" value={plantaData.correo_contacto} />
                                        </div>
                                        
                                        <div className="mt-6 flex justify-end">
                                            <button onClick={handleEditClick} className="flex items-center text-xs font-bold text-primary hover:underline bg-primary/10 px-4 py-2 rounded-lg transition-colors">
                                                <Edit3 className="w-4 h-4 mr-2" /> Editar Datos
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* MODO EDICIÓN */
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Razón Social <span className="lowercase font-normal text-[10px] text-amber-600">(Bloqueado)</span></label>
                                                {/* CAMBIO: Se bloqueó el campo de la Razón Social */}
                                                <input 
                                                    type="text" 
                                                    name="nombre_planta" 
                                                    value={plantaData.nombre_planta || ''} 
                                                    disabled 
                                                    className="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted text-muted-foreground cursor-not-allowed outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Nombre Comercial</label>
                                                <input type="text" name="nombre_comercial" value={plantaData.nombre_comercial || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">RFC</label>
                                                <input type="text" name="rfc" value={plantaData.rfc || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Representante Legal</label>
                                                <input type="text" name="representante_legal" value={plantaData.representante_legal || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Domicilio Fiscal</label>
                                                <input type="text" name="domicilio_fiscal" value={plantaData.domicilio_fiscal || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Ciudad / Estado</label>
                                                <input type="text" name="ciudad_estado" value={plantaData.ciudad_estado || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Giro de Empresa</label>
                                                <input type="text" name="giro_empresa" value={plantaData.giro_empresa || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                        </div>
                                        <hr className="border-border my-2" />
                                        <h4 className="text-xs font-bold text-primary uppercase">Datos de Contacto en Planta</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Contacto / Encargado</label>
                                                <input type="text" name="contacto_encargado" value={plantaData.contacto_encargado || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Puesto</label>
                                                <input type="text" name="puesto_contacto" value={plantaData.puesto_contacto || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Teléfono</label>
                                                <input type="text" name="telefono_contacto" value={plantaData.telefono_contacto || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1">Correo Electrónico</label>
                                                <input type="email" name="correo_contacto" value={plantaData.correo_contacto || ''} onChange={handlePlantaChange} className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-3 gap-2">
                                            <button onClick={() => setIsEditingPlanta(false)} className="text-muted-foreground text-sm font-bold py-2 px-4 rounded-md hover:bg-muted transition-colors">
                                                Cancelar
                                            </button>
                                            <button onClick={handleSavePlanta} className="bg-primary text-primary-foreground text-sm font-bold py-2 px-6 rounded-md hover:bg-primary/90 flex items-center shadow-md">
                                                <Save className="w-4 h-4 mr-2" /> Guardar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: ESTUDIOS / PDFs (MÁS RECIENTES) */}
                    <div className="border-t border-border pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Estudios Vigentes (PDF)</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {loadingEstudios ? (
                                <p className="text-sm text-center">Buscando estudios recientes...</p>
                            ) : estudios.length === 0 ? (
                                <div className="bg-muted/10 border border-dashed border-border p-6 rounded-lg text-center">
                                    <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground italic">No hay PDFs de estudios registrados para esta planta.</p>
                                </div>
                            ) : (
                                estudios.map(estudio => (
                                    <div key={estudio.id} className="group bg-background border border-border p-4 rounded-lg flex items-center justify-between hover:border-accent transition-colors">
                                        <div className="flex items-center overflow-hidden">
                                            <FileText className="w-8 h-8 text-red-500 mr-3 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-foreground">
                                                    {estudio.servicios?.nombre_servicio || 'Servicio Desconocido'}
                                                </p>
                                                {estudio.fecha_vencimiento ? (
                                                    <p className="text-[11px] text-muted-foreground mt-1">
                                                        Vence: <span className="font-bold">{estudio.fecha_vencimiento}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-amber-600 mt-1">Sin fecha de vencimiento</p>
                                                )}
                                            </div>
                                        </div>
                                        <a 
                                            href={estudio.url_estudio_r2} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="ml-4 shrink-0 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground p-2 rounded-md transition-colors flex items-center shadow-sm"
                                            title="Ver PDF"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            <span className="text-xs font-bold">Ver Estudio</span>
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 3: ARCHIVOS EDITABLES (.rar / .zip) */}
                    <div className="border-t border-border pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Archivos Base / Editables</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {loadingEditables ? (
                                <p className="text-sm text-center">Buscando editables...</p>
                            ) : editables.length === 0 ? (
                                <div className="bg-muted/10 border border-dashed border-border p-6 rounded-lg text-center">
                                    <FileArchive className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground italic">No hay archivos editables base para esta planta.</p>
                                </div>
                            ) : (
                                editables.map(doc => (
                                    <div key={doc.id} className="group bg-background border border-border p-4 rounded-lg flex items-center justify-between hover:border-amber-400 transition-colors">
                                        <div className="flex items-center overflow-hidden">
                                            <FileArchive className="w-8 h-8 text-amber-500 mr-3 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-foreground">
                                                    {doc.nombre_archivo.replace('Editable_', '').replace(/_[0-9]+$/, '').replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    Guardado el: <span className="font-bold">{new Date(doc.creado_en).toLocaleDateString()}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <a 
                                            href={doc.url_archivo} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="ml-4 shrink-0 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white p-2 rounded-md transition-colors flex items-center shadow-sm"
                                            title="Descargar Editable"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            <span className="text-xs font-bold">Descargar ZIP/RAR</span>
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};