import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase/client';
import { toast } from 'sonner';
import DashboardLayout from '../components/layout/DashboardLayout';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { Search, FileText, UploadCloud, Link as LinkIcon, Calendar, CheckCircle2 } from 'lucide-react';

const PracticanteDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalProject, setModalProject] = useState(null);
    
    // Estados para Búsqueda y Paginación
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // El practicante ve lo que el supervisor ya aprobó ('terminado') o lo que está atorado en dependencia
            const { data, error } = await supabase
                .from('proyectos_v2')
                .select('*, clientes(nombre_empresa), servicios(nombre_servicio)')
                .in('estado', ['terminado', 'en_tramite_dependencia']);

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar los proyectos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    // Lógica de Búsqueda y Ordenamiento
    const sortedProjects = useMemo(() => {
        let filtered = projects.filter(p => 
            (p.npu?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.clientes?.nombre_empresa?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.servicios?.nombre_servicio?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        return filtered.sort((a, b) => {
            const dateA = new Date(a.fecha_apertura || 0);
            const dateB = new Date(b.fecha_apertura || 0);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [projects, searchTerm, sortOrder]);

    // Lógica de Paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Panel de Gestoría</h1>
                    <p className="text-muted-foreground mt-1">Prepara entregables, recaba firmas y gestiona acuses.</p>
                </div>

                {/* Controles de Tabla */}
                <div className="flex flex-wrap items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-sm">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Buscar NPU, Cliente..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-accent outline-none w-48"
                        />
                    </div>
                    <select 
                        value={itemsPerPage} 
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} 
                        className="px-3 py-2 text-sm border border-border rounded-md bg-background"
                    >
                        <option value={10}>10 items</option>
                        <option value={25}>25 items</option>
                        <option value={50}>50 items</option>
                    </select>
                    <button 
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} 
                        className="px-3 py-2 text-sm font-medium border border-border rounded-md bg-background hover:bg-muted"
                    >
                        {sortOrder === 'asc' ? 'Ascendente ↑' : 'Descendente ↓'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div></div>
            ) : sortedProjects.length === 0 ? (
                <div className="bg-card p-12 rounded-xl border border-border text-center">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-lg font-bold text-foreground">Todo al día</p>
                    <p className="text-muted-foreground">No hay proyectos pendientes de entrega en este momento.</p>
                </div>
            ) : (
                <>
                    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">NPU</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Cliente</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Servicio</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Tipo / Estado</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {currentItems.map(project => (
                                        <tr key={project.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-primary">{project.npu}</td>
                                            <td className="px-6 py-4 text-sm font-medium">{project.clientes?.nombre_empresa}</td>
                                            <td className="px-6 py-4 text-sm">{project.servicios?.nombre_servicio}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {project.es_entrega_preliminar && (
                                                        <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                                            Fase Preliminar
                                                        </span>
                                                    )}
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${project.estado === 'en_tramite_dependencia' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {project.estado === 'en_tramite_dependencia' ? 'En Dependencia' : 'Listo para Cliente'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setModalProject(project)}
                                                    className="bg-accent text-primary-foreground hover:bg-accent/90 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
                                                >
                                                    Gestionar Entrega
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Controles de Paginación */}
                    <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground px-2">
                        <span>Página {currentPage} de {totalPages || 1}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50 transition-colors">Anterior</button>
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border border-border rounded-md bg-card hover:bg-muted disabled:opacity-50 transition-colors">Siguiente</button>
                        </div>
                    </div>
                </>
            )}

            {modalProject && (
                <ManageFinalDeliveryModal 
                    project={modalProject} 
                    onClose={() => setModalProject(null)} 
                    onFinalized={fetchProjects} 
                />
            )}
        </DashboardLayout>
    );
};

// ==========================================
// MODAL DE GESTIÓN DE ENTREGA (Practicante)
// ==========================================
const ManageFinalDeliveryModal = ({ project, onClose, onFinalized }) => {
    const [notaFile, setNotaFile] = useState(null);
    const [pdfFinalFile, setPdfFinalFile] = useState(null);
    const [flipbookUrl, setFlipbookUrl] = useState(project.link_flipbook || '');
    const [fechaVigencia, setFechaVigencia] = useState(project.fecha_vigencia || '');
    const [estadoDependencia, setEstadoDependencia] = useState(project.estado_dependencia || 'Entregado al Cliente');
    const [loading, setLoading] = useState(false);

    const historialNotas = project.notas_firmadas || [];

    const handleSave = async () => {
        setLoading(true);
        try {
            let nuevaNotaUrl = null;
            let nuevoPdfFinalUrl = null;

            // 1. Subir Acuse/Nota
            if (notaFile) {
                const notaPath = `${project.id}/acuse_${Date.now()}.pdf`;
                await supabase.storage.from('evidencias').upload(notaPath, notaFile);
                const { data } = supabase.storage.from('evidencias').getPublicUrl(notaPath);
                nuevaNotaUrl = data.publicUrl;
            }

            // 2. Subir PDF Unido
            if (pdfFinalFile) {
                const pdfPath = `${project.id}/pdf_final_${Date.now()}.pdf`;
                await supabase.storage.from('evidencias').upload(pdfPath, pdfFinalFile);
                const { data } = supabase.storage.from('evidencias').getPublicUrl(pdfPath);
                nuevoPdfFinalUrl = data.publicUrl;
            }

            // 3. Historial de Acuses JSONB
            let nuevoHistorial = [...historialNotas];
            if (nuevaNotaUrl) {
                nuevoHistorial.push({
                    url: nuevaNotaUrl,
                    fecha_subida: new Date().toISOString(),
                    estado_reportado: estadoDependencia
                });
            }

            // 4. Lógica de "El Técnico Decide"
            let nuevoEstado = project.estado;
            let esPreliminar = project.es_entrega_preliminar;

            if (estadoDependencia === 'Ingresado a Dependencia') {
                nuevoEstado = 'en_tramite_dependencia';
            } else if (estadoDependencia === 'Completado al 100%') {
                // Si el técnico dijo que era preliminar, lo regresamos a ACTIVO para la fase 2.
                if (project.es_entrega_preliminar) {
                    nuevoEstado = 'activo';
                    esPreliminar = false; // Ya se cumplió esta fase preliminar
                    toast.info("Acuse guardado. El proyecto ha regresado al Técnico para la siguiente fase.");
                } else {
                    nuevoEstado = 'completado'; // Es final real, se cierra por completo.
                    toast.success("¡Proyecto cerrado y completado exitosamente!");
                }
            }

            // 5. Guardar en Supabase
            const { error } = await supabase
                .from('proyectos_v2')
                .update({
                    notas_firmadas: nuevoHistorial,
                    fecha_vigencia: fechaVigencia || null,
                    url_pdf_cliente: nuevoPdfFinalUrl || project.url_pdf_cliente,
                    link_flipbook: flipbookUrl,
                    estado_dependencia: estadoDependencia,
                    estado: nuevoEstado,
                    es_entrega_preliminar: esPreliminar
                })
                .eq('id', project.id);

            if (error) throw error;
            
            onFinalized();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar la entrega.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-8 rounded-2xl shadow-xl w-full max-w-2xl border border-border max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-primary">Documentar Entrega</h3>
                        <p className="text-accent font-bold mt-1">NPU: {project.npu}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>
                
                <div className="space-y-6">
                    {/* Archivos Originales */}
                    <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg">
                        <p className="text-sm font-bold">PDF Original del Técnico:</p>
                        {project.url_evidencia ? (
                            <a href={project.url_evidencia} target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline flex items-center">
                                <FileText className="w-4 h-4 mr-1"/> Descargar PDF Base
                            </a>
                        ) : <span className="text-sm text-muted-foreground">No disponible</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Acuses */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-foreground">1. Subir Acuse / Nota Firmada</label>
                            <input type="file" accept=".pdf" onChange={(e) => setNotaFile(e.target.files[0])} className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary/10 file:text-primary cursor-pointer"/>
                            {historialNotas.length > 0 && (
                                <div className="mt-2 text-xs">
                                    <span className="font-bold text-muted-foreground">Historial:</span> {historialNotas.length} acuse(s) subido(s).
                                </div>
                            )}
                        </div>

                        {/* Vigencia */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold flex items-center text-foreground"><Calendar className="w-4 h-4 mr-1"/> Fecha de Vigencia</label>
                            <input type="date" value={fechaVigencia} onChange={e => setFechaVigencia(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"/>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Entregables Finales */}
                    <div className="space-y-4">
                        <h4 className="font-bold text-foreground flex items-center"><UploadCloud className="w-4 h-4 mr-2"/> 2. Entregables Visuales para el Cliente</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">Link de Flipbook (Heyzine, etc.)</label>
                                <div className="relative">
                                    <LinkIcon className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                                    <input type="url" placeholder="https://heyzine.com/..." value={flipbookUrl} onChange={e => setFlipbookUrl(e.target.value)} className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-md bg-background"/>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground block mb-1">O subir PDF Unido / Final</label>
                                <input type="file" accept=".pdf" onChange={(e) => setPdfFinalFile(e.target.files[0])} className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-primary file:text-primary-foreground cursor-pointer"/>
                            </div>
                        </div>
                    </div>

                    {/* Estado Final */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-bold text-foreground">3. Estado Actual de la Entrega</label>
                        <select value={estadoDependencia} onChange={e => setEstadoDependencia(e.target.value)} className="w-full px-4 py-3 border border-border rounded-lg bg-background font-medium">
                            <option value="Entregado al Cliente">Entregado al Cliente (Falta dependencia)</option>
                            <option value="Ingresado a Dependencia">Ingresado a Dependencia (Esperando respuesta)</option>
                            <option value="Completado al 100%">Trámite Completado al 100%</option>
                        </select>
                        {estadoDependencia === 'Completado al 100%' && project.es_entrega_preliminar && (
                            <p className="text-sm text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                                ⚠️ Atención: El técnico marcó esto como "Fase Preliminar". Al guardar, el proyecto regresará a su Kanban para continuar con la siguiente fase.
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-border">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-6 rounded-lg shadow-md disabled:opacity-50 transition-colors">
                        {loading ? 'Guardando...' : 'Actualizar Estado de Entrega'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageFinalDeliveryModal;