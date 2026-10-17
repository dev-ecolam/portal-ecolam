import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Send, Lock, Clock, Calendar, Download } from 'lucide-react';

export const ManageEcotechProjectModal = ({ project, onClose, onFinalized }) => {
    const getLogistica = () => {
        if (!project.logistica_ecotech) return {};
        return Array.isArray(project.logistica_ecotech) ? project.logistica_ecotech[0] || {} : project.logistica_ecotech;
    };
    
    const logistica = getLogistica();

    // Estados Locales
    const [labProjectNumber, setLabProjectNumber] = useState('');
    const [pdfCotizacionFile, setPdfCotizacionFile] = useState(null); 
    const [guiaEnvio, setGuiaEnvio] = useState('');
    const [guiaRegreso, setGuiaRegreso] = useState('');
    const [notes, setNotes] = useState(logistica.notas || '');
    const [loading, setLoading] = useState(false);
    
    const currentStatus = logistica.estatus || 'Pendiente de Solicitud';

    // VERIFICADORES DE HITOS (CANDADOS)
    const pasoSolicitud = project.ecotech_solicitud_enviada;
    const isAsignado = !!project.ecotech_num_proyecto; // Paso 2 completado
    const pasoDigital = !!project.ecotech_hojas_campo_url; // Técnico subió archivos
    const isDigitalConfirmed = logistica.estatus === 'Digital Confirmado' || logistica.estatus === 'Terminado' || !!logistica.guia_envio; // Paso 3 completado
    const hasGuiaEnvio = !!logistica.guia_envio; // Paso 4.A completado
    const hasGuiaRegreso = !!logistica.guia_regreso; // Paso 4.B completado

    // FUNCIÓN: Descargar ambos archivos con un solo clic
    const handleDownloadFiles = () => {
        if (project.ecotech_hojas_campo_url) {
            window.open(project.ecotech_hojas_campo_url, '_blank');
        }
        if (project.ecotech_ppt_url) {
            // Pequeño retraso para evitar que el navegador bloquee la segunda ventana emergente
            setTimeout(() => {
                window.open(project.ecotech_ppt_url, '_blank');
            }, 300);
        }
    };

    // FUNCIÓN: Marcar como "Enviado Digitalmente" y borrar PPT
    const handleConfirmDigital = async () => {
        setLoading(true);
        try {
            // 1. Borrar PPT del servidor para ahorrar espacio
            if (project.ecotech_ppt_url) {
                const urlParts = project.ecotech_ppt_url.split('/evidencias/');
                if (urlParts.length > 1) {
                    await supabase.storage.from('evidencias').remove([urlParts[1]]);
                }
                await supabase.from('proyectos_v2').update({ ecotech_ppt_url: null }).eq('id', project.id);
            }

            // 2. Registrar el hito en logística
            const { error } = await supabase.from('logistica_ecotech').upsert({
                proyecto_id: project.id,
                estatus: 'Digital Confirmado',
                actualizado_en: new Date().toISOString()
            }, { onConflict: 'proyecto_id' });
            if (error) throw error;

            toast.success("Confirmado. Ya puedes registrar las guías de hieleras.");
            onFinalized();
        } catch (error) {
            toast.error("Error al confirmar el envío digital.");
        } finally {
            setLoading(false);
        }
    };

    // FUNCIÓN: Guardar Avances Parciales (Folios o Guías)
    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            const updatesLogistica = {
                proyecto_id: project.id,
                notas: notes,
                actualizado_en: new Date().toISOString()
            };

            // Si estamos guardando la Asignación
            if (!isAsignado && labProjectNumber) {
                let pdfUrl = null;
                if (pdfCotizacionFile) {
                    const path = `${project.id}/ecotech_cotizacion_${Date.now()}.pdf`;
                    await supabase.storage.from('evidencias').upload(path, pdfCotizacionFile);
                    const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
                    pdfUrl = data.publicUrl;
                }
                
                updatesLogistica.fecha_asignacion = new Date().toISOString();
                updatesLogistica.estatus = 'En Proceso';
                if (pdfUrl) updatesLogistica.pdf_cotizacion = pdfUrl;

                await supabase.from('proyectos_v2').update({ 
                    ecotech_num_proyecto: labProjectNumber,
                    notas_leidas: false,
                    notas_supervisor: project.notas_supervisor 
                        ? project.notas_supervisor + `\n\n📌 Ecotech asignó el Folio: ${labProjectNumber}`
                        : `📌 Ecotech asignó el Folio: ${labProjectNumber}`
                }).eq('id', project.id);
            }

            // Si estamos guardando Guía de Envío
            if (isDigitalConfirmed && !hasGuiaEnvio && guiaEnvio) {
                updatesLogistica.guia_envio = guiaEnvio;
                updatesLogistica.fecha_envio_fisico = new Date().toISOString();
            }

            // Si estamos guardando Guía de Regreso
            if (hasGuiaEnvio && !hasGuiaRegreso && guiaRegreso) {
                updatesLogistica.guia_regreso = guiaRegreso;
            }

            // Upsert Final Logística
            const { error: logError } = await supabase.from('logistica_ecotech').upsert(
                updatesLogistica, { onConflict: 'proyecto_id' }
            );
            if (logError) throw logError;

            toast.success("Avance guardado correctamente.");
            onFinalized();
        } catch (err) {
            toast.error("Error al guardar los cambios.");
        } finally { 
            setLoading(false); 
        }
    };

    // FUNCIÓN: Marcar como Terminado (Flujo finalizado)
    const handleFinishProject = async () => {
        if (!logistica.guia_regreso && !guiaRegreso) return toast.error("Se requiere la Guía de Regreso para terminar.");
        setLoading(true);

        try {
            await supabase.from('logistica_ecotech').upsert({
                proyecto_id: project.id,
                estatus: 'Terminado',
                actualizado_en: new Date().toISOString()
            }, { onConflict: 'proyecto_id' });

            await supabase.from('proyectos_v2').update({
                estado_operativo: 'En Proceso', 
                esperando_proveedor: false,
                notas_leidas: false,
                notas_supervisor: project.notas_supervisor 
                    ? project.notas_supervisor + '\n\n✅ Ecotech ha devuelto los resultados físicos. Proceder con el estudio final.'
                    : '✅ Ecotech ha devuelto los resultados físicos. Proceder con el estudio final.'
            }).eq('id', project.id);

            toast.success("Logística finalizada. Proyecto devuelto al técnico.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al finalizar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in-95">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-xl border border-border max-h-[90vh] overflow-y-auto">
                
                <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-primary">Logística: {project.npu}</h3>
                        <p className="text-sm font-bold text-accent mt-1">Estatus: {currentStatus}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                <div className="space-y-6">
                    
                    {/* PASO 1: SOLICITUD */}
                    {!pasoSolicitud ? (
                        <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-border text-center">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-bold text-muted-foreground">Esperando acción del técnico</p>
                        </div>
                    ) : (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 flex items-center mb-2"><Calendar className="w-4 h-4 mr-2"/> 1. Solicitud de Folio</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <p><span className="font-bold text-blue-700">Fechas:</span> {project.ecotech_fechas_visita}</p>
                                <p><span className="font-bold text-blue-700">Puntos/Día:</span> {project.ecotech_puntos_dia}</p>
                            </div>
                        </div>
                    )}

                    {/* PASO 2: ASIGNACIÓN */}
                    {pasoSolicitud && (
                        <div className={`p-5 rounded-xl border transition-all ${isAsignado ? 'bg-muted/30 border-border' : 'bg-orange-50 border-orange-200 shadow-sm'}`}>
                            <h4 className="font-bold flex items-center mb-4 text-primary"><FileText className="w-4 h-4 mr-2"/> 2. Asignación de Laboratorio</h4>
                            
                            {/* BLOQUEO: Si ya está asignado, se muestra como texto bloqueado */}
                            {isAsignado ? (
                                <div className="space-y-2">
                                    <div className="bg-background p-3 rounded-lg border border-border flex justify-between items-center">
                                        <span className="text-xs font-bold text-muted-foreground uppercase">Número Asignado:</span>
                                        <span className="font-mono font-bold text-foreground">{project.ecotech_num_proyecto}</span>
                                    </div>
                                    {logistica.pdf_cotizacion && (
                                        <a href={logistica.pdf_cotizacion} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline flex items-center mt-2">
                                            <FileText className="w-3 h-3 mr-1"/> Ver PDF Cotización Guardado
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Número Ecotech</label>
                                        <input type="text" placeholder="Ej. ECO-2026-891" value={labProjectNumber} onChange={e => setLabProjectNumber(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent font-medium"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cotización / Acuse (Opcional)</label>
                                        <input type="file" accept=".pdf" onChange={e => setPdfCotizacionFile(e.target.files[0])} className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-3 file:py-1.5 cursor-pointer"/>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PASO 3: DESCARGA DIGITAL Y CONFIRMACIÓN */}
                    {isAsignado && (
                        !pasoDigital ? (
                            <div className="bg-muted/30 p-4 rounded-xl border border-dashed border-border flex items-center">
                                <Clock className="w-5 h-5 text-amber-500 mr-3" />
                                <div>
                                    <p className="text-sm font-bold text-foreground">Esperando Expediente Digital</p>
                                    <p className="text-xs text-muted-foreground">El técnico aún no sube las hojas de campo ni el plano.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 flex items-center mb-3"><CheckCircle2 className="w-4 h-4 mr-2"/> 3. Expediente Digital Recibido</h4>
                                
                                {!isDigitalConfirmed ? (
                                    <div className="space-y-3">
                                        <button onClick={handleDownloadFiles} className="w-full flex items-center justify-center text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-4 py-2.5 rounded-lg hover:bg-emerald-200 transition-colors">
                                            <Download className="w-4 h-4 mr-2"/> Descargar Archivos (PDF y PPT)
                                        </button>
                                        
                                        <div className="pt-2">
                                            <button onClick={handleConfirmDigital} disabled={loading} className="w-full flex items-center justify-center text-xs font-bold text-white bg-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-700 shadow-sm transition-colors">
                                                <Send className="w-4 h-4 mr-2"/> Enviado Digitalmente
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-background p-3 rounded-lg border border-emerald-200 flex items-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2"/>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">Expediente Confirmado</p>
                                            <p className="text-[10px] text-muted-foreground">Plano PPT eliminado por seguridad.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    )}

                    {/* PASO 4: LOGÍSTICA DE HIELERAS (Solo se abre si confirmaron el paso 3) */}
                    {isDigitalConfirmed && (
                        <div className="p-5 border border-border rounded-xl bg-background space-y-4">
                            <h4 className="font-bold flex items-center text-primary"><Send className="w-4 h-4 mr-2"/> 4. Logística Física</h4>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* Guía de Envío */}
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Envío a Laboratorio</label>
                                    {hasGuiaEnvio ? (
                                        <div className="bg-muted p-2.5 rounded-lg border border-border font-mono text-sm text-foreground flex items-center">
                                            <Lock className="w-3 h-3 mr-2 text-muted-foreground"/> {logistica.guia_envio}
                                        </div>
                                    ) : (
                                        <input type="text" placeholder="Tracking No." value={guiaEnvio} onChange={e => setGuiaEnvio(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"/>
                                    )}
                                </div>
                                
                                {/* Guía de Regreso */}
                                <div className={!hasGuiaEnvio ? 'opacity-50 pointer-events-none' : ''}>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Regreso a Oficina</label>
                                    {hasGuiaRegreso ? (
                                        <div className="bg-muted p-2.5 rounded-lg border border-border font-mono text-sm text-foreground flex items-center">
                                            <Lock className="w-3 h-3 mr-2 text-muted-foreground"/> {logistica.guia_regreso}
                                        </div>
                                    ) : (
                                        <input type="text" placeholder="Tracking No." value={guiaRegreso} onChange={e => setGuiaRegreso(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"/>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notas Internas (Siempre editables) */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Bloc de Notas del Proveedor</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" className="w-full px-4 py-3 border border-border rounded-lg bg-background outline-none focus:border-accent text-sm"></textarea>
                    </div>
                </div>

                {/* Footer Acciones */}
                <div className="mt-8 pt-4 border-t border-border flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cerrar</button>
                    
                    {currentStatus !== 'Terminado' && (
                        // Lógica Dinámica de Botón Principal
                        hasGuiaRegreso ? (
                            <button onClick={handleFinishProject} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                                {loading ? 'Procesando...' : 'Marcar como Terminado'}
                            </button>
                        ) : (
                            // Solo muestra Guardar si hay inputs abiertos por llenar
                            (!isAsignado || (isDigitalConfirmed && !hasGuiaEnvio) || (hasGuiaEnvio && !hasGuiaRegreso) || notes !== logistica.notas) && (
                                <button onClick={handleSaveChanges} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                                    {loading ? 'Guardando...' : 'Guardar Avance'}
                                </button>
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
};