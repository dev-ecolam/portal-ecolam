import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, FileText, Send, Lock, Clock, Calendar } from 'lucide-react';

export const ManageEcotechProjectModal = ({ project, onClose, onFinalized }) => {
    const getLogistica = () => {
        if (!project.logistica_ecotech) return {};
        return Array.isArray(project.logistica_ecotech) ? project.logistica_ecotech[0] || {} : project.logistica_ecotech;
    };
    
    const logistica = getLogistica();

    // Estados
    const [labProjectNumber, setLabProjectNumber] = useState(project.ecotech_num_proyecto || '');
    const [pdfCotizacionFile, setPdfCotizacionFile] = useState(null); 
    const [guiaEnvio, setGuiaEnvio] = useState(logistica.guia_envio || '');
    const [guiaRegreso, setGuiaRegreso] = useState(logistica.guia_regreso || '');
    const [notes, setNotes] = useState(logistica.notas || '');
    const [loading, setLoading] = useState(false);
    
    const currentStatus = logistica.estatus || 'Pendiente de Solicitud';

    // Hitos cumplidos (Línea de tiempo)
    const pasoSolicitud = project.ecotech_solicitud_enviada;
    const pasoAsignado = !!project.ecotech_num_proyecto;
    const pasoDigital = !!project.ecotech_hojas_campo_url;
    const pasoEnvio = !!logistica.guia_envio;
    const pasoRegreso = !!logistica.guia_regreso;

    // Contador de días
    const getDaysElapsed = (dateString) => {
        if (!dateString) return 0;
        const diff = new Date() - new Date(dateString);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const handleSaveChanges = async () => {
        setLoading(true);
        try {
            let pdfUrl = logistica.pdf_cotizacion;

            if (pdfCotizacionFile) {
                const path = `${project.id}/ecotech_cotizacion_${Date.now()}.pdf`;
                await supabase.storage.from('evidencias').upload(path, pdfCotizacionFile);
                const { data } = supabase.storage.from('evidencias').getPublicUrl(path);
                pdfUrl = data.publicUrl;
            }

            // Determinar fechas automáticas según lo que se está guardando
            const updatesLogistica = {
                proyecto_id: project.id,
                guia_envio: guiaEnvio,
                guia_regreso: guiaRegreso,
                pdf_cotizacion: pdfUrl,
                notas: notes,
                actualizado_en: new Date().toISOString()
            };

            // Si estamos asignando el número por primera vez
            if (!pasoAsignado && labProjectNumber) {
                updatesLogistica.fecha_asignacion = new Date().toISOString();
                updatesLogistica.estatus = 'En Proceso';
            }

            // Si estamos guardando la guía de envío por primera vez
            if (!pasoEnvio && guiaEnvio) {
                updatesLogistica.fecha_envio_fisico = new Date().toISOString();
            }

            const { error: logError } = await supabase.from('logistica_ecotech').upsert(
                updatesLogistica, 
                { onConflict: 'proyecto_id' }
            );
            if (logError) throw logError;

            // Actualizamos en proyectos_v2 solo si cambió el número
            if (labProjectNumber !== project.ecotech_num_proyecto) {
                await supabase.from('proyectos_v2')
                    .update({ ecotech_num_proyecto: labProjectNumber })
                    .eq('id', project.id);
            }

            toast.success("Avance guardado correctamente.");
            onFinalized();
            onClose();
        } catch (err) {
            toast.error("Error al guardar los cambios.");
        } finally { 
            setLoading(false); 
        }
    };

    const handleFinishProject = async () => {
        if (!guiaRegreso) return toast.error("Se requiere la Guía de Regreso para terminar.");
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
                notas_supervisor: 'Ecotech ha devuelto los resultados. Proceder con el estudio final.'
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
                
                {/* Cabecera */}
                <div className="flex justify-between items-start mb-6 border-b border-border pb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-primary">Logística: {project.npu}</h3>
                        <p className="text-sm font-bold text-accent mt-1">Estatus: {currentStatus}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                <div className="space-y-6">
                    
                    {/* PASO 1: Solicitud del Técnico */}
                    {!pasoSolicitud ? (
                        <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-border text-center">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-bold text-muted-foreground">Esperando acción del técnico</p>
                            <p className="text-xs text-muted-foreground mt-1">Aún no se han solicitado las fechas ni los puntos de muestreo.</p>
                        </div>
                    ) : (
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 relative">
                            <h4 className="font-bold text-blue-800 flex items-center mb-2"><Calendar className="w-4 h-4 mr-2"/> 1. Solicitud de Folio</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <p><span className="font-bold text-blue-700">Fechas:</span> {project.ecotech_fechas_visita}</p>
                                <p><span className="font-bold text-blue-700">Puntos/Día:</span> {project.ecotech_puntos_dia}</p>
                            </div>
                            {logistica.fecha_solicitud && (
                                <span className="absolute top-4 right-4 text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                    Hace {getDaysElapsed(logistica.fecha_solicitud)} días
                                </span>
                            )}
                        </div>
                    )}

                    {/* PASO 2: Asignación de Folio (Se habilita si hay solicitud) */}
                    {pasoSolicitud && (
                        <div className={`p-5 rounded-xl border transition-all ${pasoAsignado ? 'bg-background border-border' : 'bg-orange-50 border-orange-200 shadow-sm'}`}>
                            <h4 className="font-bold flex items-center mb-4 text-primary"><FileText className="w-4 h-4 mr-2"/> 2. Asignación de Laboratorio</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Número Ecotech</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej. ECO-2026-891" 
                                        value={labProjectNumber} 
                                        onChange={e => setLabProjectNumber(e.target.value)} 
                                        className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cotización / Acuse (Opcional)</label>
                                    <input type="file" accept=".pdf" onChange={e => setPdfCotizacionFile(e.target.files[0])} className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-3 file:py-1.5 cursor-pointer"/>
                                    {logistica.pdf_cotizacion && <a href={logistica.pdf_cotizacion} target="_blank" rel="noreferrer" className="text-xs text-green-600 font-bold mt-2 hover:underline block">✓ Ver PDF guardado</a>}
                                </div>
                            </div>
                            {logistica.fecha_asignacion && (
                                <p className="text-[10px] text-muted-foreground mt-3 font-bold text-right">Asignado hace {getDaysElapsed(logistica.fecha_asignacion)} días</p>
                            )}
                        </div>
                    )}

                    {/* PASO 3: Recepción Digital */}
                    {pasoAsignado && (
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
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-emerald-800 flex items-center"><CheckCircle2 className="w-4 h-4 mr-2"/> 3. Expediente Digital Recibido</h4>
                                    {logistica.fecha_recepcion_digital && (
                                        <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-1 rounded-full">
                                            Hace {getDaysElapsed(logistica.fecha_recepcion_digital)} días
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-4 mt-3">
                                    <a href={project.ecotech_hojas_campo_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded hover:bg-emerald-200">📄 Ver Hojas Campo</a>
                                    <a href={project.ecotech_ppt_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded hover:bg-emerald-200">📊 Ver Plano (PPT)</a>
                                </div>
                            </div>
                        )
                    )}

                    {/* PASO 4: Guías Físicas (Solo si ya enviaron lo digital) */}
                    {pasoDigital && (
                        <div className="p-5 border border-border rounded-xl bg-background space-y-4">
                            <h4 className="font-bold flex items-center text-primary"><Send className="w-4 h-4 mr-2"/> 4. Logística de Hieleras</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Guía de Envío a Lab</label>
                                    <input type="text" placeholder="Tracking No." value={guiaEnvio} onChange={e => setGuiaEnvio(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"/>
                                    {logistica.fecha_envio_fisico && <p className="text-[10px] text-muted-foreground mt-1">Enviado hace {getDaysElapsed(logistica.fecha_envio_fisico)} días</p>}
                                </div>
                                
                                <div className={!pasoEnvio ? 'opacity-50 pointer-events-none' : ''}>
                                    <label className="block text-xs font-bold text-muted-foreground uppercase mb-1 flex items-center">
                                        Guía de Regreso {!pasoEnvio && <Lock className="w-3 h-3 ml-1"/>}
                                    </label>
                                    <input type="text" placeholder="Tracking No." value={guiaRegreso} onChange={e => setGuiaRegreso(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background outline-none focus:border-accent"/>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notas Internas (Siempre visibles) */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Bloc de Notas del Proveedor</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" placeholder="Observaciones sobre la paquetería, el estatus..." className="w-full px-4 py-3 border border-border rounded-lg bg-background outline-none focus:border-accent text-sm"></textarea>
                    </div>
                </div>

                {/* Footer Acciones */}
                <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-3">
                    
                    {currentStatus === 'Terminado' ? (
                        <span className="text-sm font-bold text-green-600 flex items-center bg-green-50 px-4 py-2 rounded-lg border border-green-200 w-full md:w-auto justify-center">
                            <CheckCircle2 className="w-4 h-4 mr-2"/> Logística Cerrada
                        </span>
                    ) : (
                        <div className="hidden md:block flex-1"></div> /* Espaciador */
                    )}

                    <div className="flex w-full md:w-auto gap-3">
                        <button onClick={onClose} disabled={loading} className="flex-1 md:flex-none px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cerrar</button>
                        
                        {currentStatus !== 'Terminado' && (
                            pasoRegreso ? (
                                <button onClick={handleFinishProject} disabled={loading} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                                    {loading ? 'Procesando...' : 'Marcar como Terminado'}
                                </button>
                            ) : (
                                <button onClick={handleSaveChanges} disabled={loading} className="flex-1 md:flex-none bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg transition-colors shadow-md">
                                    {loading ? 'Guardando...' : 'Guardar Avance'}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};