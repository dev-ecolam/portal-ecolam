import React, { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { UploadCloud, FileText, CheckSquare } from 'lucide-react';

export const ModalFinalizarEcotech = ({ project, currentUser, onClose, onFinalized }) => {
    const [hojasFile, setHojasFile] = useState(null);
    const [pptFile, setPptFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubir = async () => {
        if (!hojasFile || !pptFile) return toast.error("Debes subir las hojas escaneadas (PDF) y el plano editable (PPT).");
        setLoading(true);

        try {
            // 1. Subir archivos
            const hojasPath = `${project.id}/hojas_campo_${Date.now()}.pdf`;
            await supabase.storage.from('evidencias').upload(hojasPath, hojasFile);
            const { data: { publicUrl: urlHojas } } = supabase.storage.from('evidencias').getPublicUrl(hojasPath);

            const pptExt = pptFile.name.split('.').pop();
            const pptPath = `${project.id}/plano_${Date.now()}.${pptExt}`;
            await supabase.storage.from('evidencias').upload(pptPath, pptFile);
            const { data: { publicUrl: urlPpt } } = supabase.storage.from('evidencias').getPublicUrl(pptPath);

            // 2. Proteger Kanban
            const { error: projError } = await supabase.from('proyectos_v2').update({
                ecotech_hojas_campo_url: urlHojas,
                ecotech_ppt_url: urlPpt,
                estado_operativo: 'Pausado',
                esperando_proveedor: true,
                fecha_fin_tecnico_real: new Date().toISOString()
            }).eq('id', project.id);
            if (projError) throw projError;

            // 3. Registrar el Hito Digital en Ecotech
            const { error: logError } = await supabase.from('logistica_ecotech').upsert({
                proyecto_id: project.id,
                fecha_recepcion_digital: new Date().toISOString(),
                actualizado_en: new Date().toISOString()
            }, { onConflict: 'proyecto_id' });
            if (logError) throw logError;

            // 4. Bitácora de trazabilidad
            await supabase.from('bitacoras_proyectos').insert([{
                proyecto_id: project.id,
                autor_id: currentUser?.id,
                mensaje: `📦 Hojas de campo y Plano (PPT) enviados a Ecotech. Parte técnica pausada en espera de resultados.`
            }]);

            toast.success("Archivos de campo enviados exitosamente.");
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al subir los archivos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in-95">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold text-primary mb-2 flex items-center">
                    <CheckSquare className="w-5 h-5 mr-2" /> Envío de Campo - Ecotech
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                    El proyecto <b className="text-foreground">{project.ecotech_num_proyecto}</b> pasará a manos de Ecotech. Sube tus levantamientos.
                </p>
                
                <div className="space-y-4 mb-6">
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
                        <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            1. Hojas de Campo Escaneadas (.pdf) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={e => setHojasFile(e.target.files[0])} 
                            className="w-full text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-blue-800 file:bg-blue-200 hover:file:bg-blue-300 cursor-pointer"
                        />
                    </div>
                    
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm">
                        <label className="block text-sm font-bold text-orange-800 mb-2 flex items-center">
                            <UploadCloud className="w-4 h-4 mr-2" />
                            2. Plano Editable (.ppt / .pptx) <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                            type="file" 
                            accept=".ppt,.pptx" 
                            onChange={e => setPptFile(e.target.files[0])} 
                            className="w-full text-xs font-bold file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-orange-800 file:bg-orange-200 hover:file:bg-orange-300 cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 border-t border-border/50 pt-4">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSubir} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-colors disabled:opacity-50">
                        {loading ? 'Subiendo...' : 'Enviar y Pausar'}
                    </button>
                </div>
            </div>
        </div>
    );
};