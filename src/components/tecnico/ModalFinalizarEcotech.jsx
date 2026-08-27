// ModalFinalizarEcotech.jsx
import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export const ModalFinalizarEcotech = ({ project, onClose, onFinalized }) => {
    const [hojasFile, setHojasFile] = useState(null);
    const [pptFile, setPptFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubir = async () => {
        if (!hojasFile || !pptFile) return toast.error("Debes subir las hojas escaneadas (PDF) y el plano editable (PPT).");
        setLoading(true);

        try {
            // 1. Subir Hojas
            const hojasPath = `${project.id}/hojas_campo_${Date.now()}.pdf`;
            await supabase.storage.from('evidencias').upload(hojasPath, hojasFile);
            const urlHojas = supabase.storage.from('evidencias').getPublicUrl(hojasPath).data.publicUrl;

            // 2. Subir PPT
            const pptExt = pptFile.name.split('.').pop();
            const pptPath = `${project.id}/plano_${Date.now()}.${pptExt}`;
            await supabase.storage.from('evidencias').upload(pptPath, pptFile);
            const urlPpt = supabase.storage.from('evidencias').getPublicUrl(pptPath).data.publicUrl;

            // 3. Pasar el proyecto al Encargado de Ecotech (o directamente a estado de espera de proveedor)
            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    ecotech_hojas_campo_url: urlHojas,
                    ecotech_ppt_url: urlPpt,
                    estado: 'en_manos_proveedor', // Nuevo estado para que el encargado lo mande
                    esperando_proveedor: true // Para que le salga en su resumen semanal
                })
                .eq('id', project.id);

            if (error) throw error;
            toast.success("Archivos de campo enviados exitosamente.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al subir los archivos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-xl font-bold mb-4">Envío de Campo - Ecotech</h3>
                <p className="text-sm text-muted-foreground mb-6">El proyecto <b>{project.ecotech_num_proyecto}</b> pasará a manos de Ecotech. Sube tus levantamientos.</p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">1. Hojas de Campo Escaneadas (PDF)</label>
                        <input type="file" accept=".pdf" onChange={e => setHojasFile(e.target.files[0])} className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer"/>
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-1">2. Plano de Puntos Editable (PPT/PPTX)</label>
                        <input type="file" accept=".ppt,.pptx" onChange={e => setPptFile(e.target.files[0])} className="w-full text-xs file:bg-primary/10 file:text-primary file:border-0 file:rounded file:px-2 file:py-1 cursor-pointer"/>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 font-bold text-muted-foreground hover:bg-muted rounded">Cancelar</button>
                    <button onClick={handleSubir} disabled={loading} className="bg-accent text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                        {loading ? 'Subiendo...' : 'Enviar y Finalizar Parte Técnica'}
                    </button>
                </div>
            </div>
        </div>
    );
};