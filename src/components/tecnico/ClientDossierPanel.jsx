import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { X, FileText, Upload, AlertTriangle, Trash2, Download } from 'lucide-react';

export const ClientDossierPanel = ({ clienteId, clienteNombre, currentUser, onClose }) => {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    
    // Formulario de subida
    const [file, setFile] = useState(null);
    const [nombreDoc, setNombreDoc] = useState('');
    const [categoria, setCategoria] = useState('Legal');

    const fetchDocumentos = async () => {
        try {
            const { data, error } = await supabase
                .from('documentos_clientes')
                .select('*, usuarios(nombre)')
                .eq('cliente_id', clienteId)
                .order('creado_en', { ascending: false });
            
            if (error) throw error;
            setDocumentos(data || []);
        } catch (err) {
            toast.error("Error al cargar el expediente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clienteId) fetchDocumentos();
    }, [clienteId]);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !nombreDoc) return toast.error("Completa los datos del archivo.");
        
        setUploading(true);
        try {
            // 1. Subir a Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${clienteId}/${Date.now()}_${file.name}`;
            
            const { error: uploadError } = await supabase.storage
                .from('documentos_clientes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Obtener URL
            const { data: { publicUrl } } = supabase.storage
                .from('documentos_clientes')
                .getPublicUrl(filePath);

            // 3. Guardar en base de datos
            const { error: dbError } = await supabase
                .from('documentos_clientes')
                .insert([{
                    cliente_id: clienteId,
                    nombre_archivo: nombreDoc,
                    categoria: categoria,
                    url_archivo: publicUrl,
                    path_archivo: filePath,
                    subido_por: currentUser.id
                }]);

            if (dbError) throw dbError;

            toast.success("Documento guardado en el expediente.");
            setFile(null);
            setNombreDoc('');
            fetchDocumentos();
        } catch (err) {
            console.error(err);
            toast.error("Error al subir el documento.");
        } finally {
            setUploading(false);
        }
    };

    const solicitarBorrado = async (docId) => {
        try {
            const { error } = await supabase
                .from('documentos_clientes')
                .update({ solicitud_borrado: true })
                .eq('id', docId);
            
            if (error) throw error;
            toast.success("Solicitud de eliminación enviada al supervisor.");
            fetchDocumentos();
        } catch (err) {
            toast.error("Error al solicitar el borrado.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Fondo oscuro (Overlay) */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            
            {/* Panel Lateral */}
            <div className="relative w-full max-w-md h-full bg-card shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-border">
                
                {/* Header del Panel */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Expediente del Cliente</h2>
                        <p className="text-sm font-medium text-accent">{clienteNombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* Zona de Subida */}
                    <form onSubmit={handleUpload} className="bg-muted/30 p-4 rounded-xl border border-border border-dashed space-y-4">
                        <h3 className="text-sm font-bold flex items-center"><Upload className="w-4 h-4 mr-2" /> Aportar Documento</h3>
                        <input 
                            type="text" 
                            placeholder="Ej. Acta Constitutiva 2024" 
                            value={nombreDoc} 
                            onChange={e => setNombreDoc(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
                            required
                        />
                        <div className="flex gap-2">
                            <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-1/2 px-3 py-2 text-sm border border-border rounded-md bg-background">
                                <option value="Legal">Legal (Actas, RFC)</option>
                                <option value="Planos">Planos / Croquis</option>
                                <option value="Medio Ambiente">Medio Ambiente</option>
                                <option value="Protección Civil">Protección Civil</option>
                                <option value="Otro">Otro</option>
                            </select>
                            <input 
                                type="file" 
                                onChange={e => setFile(e.target.files[0])} 
                                className="w-1/2 text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary"
                                required
                            />
                        </div>
                        <button type="submit" disabled={uploading} className="w-full bg-primary text-primary-foreground text-sm font-bold py-2 rounded-md hover:bg-primary/90 transition-colors">
                            {uploading ? 'Subiendo...' : 'Guardar en Expediente'}
                        </button>
                    </form>

                    {/* Lista de Documentos */}
                    <div>
                        <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-muted-foreground">Documentos Disponibles</h3>
                        {loading ? (
                            <p className="text-sm text-center">Cargando...</p>
                        ) : documentos.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground italic">No hay documentos en el expediente de este cliente.</p>
                        ) : (
                            <div className="space-y-3">
                                {documentos.map(doc => (
                                    <div key={doc.id} className="group bg-background border border-border p-3 rounded-lg flex items-start justify-between hover:border-accent transition-colors">
                                        <div className="flex items-start overflow-hidden">
                                            <FileText className="w-8 h-8 text-accent mr-3 shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold truncate pr-2">{doc.nombre_archivo}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">{doc.categoria}</span>
                                                    <span className="text-[10px] text-muted-foreground">por {doc.usuarios?.nombre?.split(' ')[0]}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end space-y-2 shrink-0">
                                            <a href={doc.url_archivo} target="_blank" rel="noopener noreferrer" className="p-1 text-primary hover:bg-primary/10 rounded" title="Descargar/Ver">
                                                <Download className="w-4 h-4" />
                                            </a>
                                            
                                            {doc.solicitud_borrado ? (
                                                <span className="text-[10px] text-orange-500 font-bold flex items-center" title="Revisión pendiente">
                                                    <AlertTriangle className="w-3 h-3 mr-1"/> Borrado
                                                </span>
                                            ) : (
                                                <button onClick={() => solicitarBorrado(doc.id)} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors" title="Solicitar Eliminación">
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