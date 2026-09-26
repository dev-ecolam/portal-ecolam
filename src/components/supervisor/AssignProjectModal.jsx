import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { ChevronDown, CalendarDays, Clock, Target } from 'lucide-react';

// Componente SearchableSelect (Autocomplete) integrado
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
                    className="w-full p-3 pr-8 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        onChange(''); 
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            
            {isOpen && (
                <ul className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map(opt => (
                            <li 
                                key={opt[valueKey]}
                                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm font-medium transition-colors"
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
                        <li className="px-4 py-3 text-muted-foreground text-sm italic">Sin coincidencias</li>
                    )}
                </ul>
            )}
        </div>
    );
};

// MODAL PRINCIPAL
const AssignProjectModal = ({ project, technicians, onClose, onFinalized }) => {
    // ESTADOS INDEPENDIENTES
    const [selectedTech, setSelectedTech] = useState(project?.tecnico_id || '');
    
    // 1. Días para calcular la Fecha Interna (Proyecto)
    const [diasEntregaInterna, setDiasEntregaInterna] = useState('');
    const [fechaCalculada, setFechaCalculada] = useState(project?.fecha_entrega_interna || '');
    
    // 2. Días Meta (Técnico)
    const [diasTecnico, setDiasTecnico] = useState(project?.dias_asignados_tecnico || '');
    
    const [loading, setLoading] = useState(false);

    // Calcular fecha límite interna saltando sábados (6) y domingos (0)
    useEffect(() => {
        if (!diasEntregaInterna || isNaN(diasEntregaInterna) || diasEntregaInterna <= 0) {
            // Si el proyecto ya tenía fecha, la mantenemos visualmente, si no, lo limpiamos
            if (!project?.fecha_entrega_interna) setFechaCalculada('');
            return;
        }

        let date = new Date(); 
        let daysAdded = 0;
        const totalDays = parseInt(diasEntregaInterna, 10);

        while (daysAdded < totalDays) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                daysAdded++;
            }
        }
        
        setFechaCalculada(date.toISOString().split('T')[0]);
    }, [diasEntregaInterna]);

    const handleAssign = async () => {
        if (!selectedTech) return toast.error("Selecciona un técnico.");
        if (!fechaCalculada) return toast.error("Debes definir los días de entrega interna.");
        if (!diasTecnico || diasTecnico <= 0) return toast.error("Asigna los días de trabajo (meta) para el técnico.");

        setLoading(true);
        try {
            const updatePayload = {
                tecnico_id: selectedTech,
                dias_asignados_tecnico: parseInt(diasTecnico, 10), // Días independientes del técnico
                fecha_entrega_interna: fechaCalculada,             // Fecha calculada del proyecto
                estado_operativo: 'Pendiente'
            };

            // Lógica de penalización si se está reasignando a un técnico diferente
            if (project.tecnico_id && selectedTech !== project.tecnico_id) {
                await supabase.from('rendimiento_tecnicos').insert([{
                    tecnico_id: project.tecnico_id,
                    proyecto_id: project.id,
                    npu_proyecto: project.npu,
                    dias_asignados: project.dias_asignados_tecnico || 0,
                    dias_trabajados_reales: project.dias_reales_trabajados || 0,
                    resultado: 'Reasignado (Penalización)'
                }]);

                updatePayload.dias_reales_trabajados = 0;
                updatePayload.ultimo_inicio_proceso = null;
            }

            const { error } = await supabase
                .from('proyectos_v2')
                .update(updatePayload)
                .eq('id', project.id);
                
            if (error) throw error;
            
            toast.success("Proyecto asignado y tiempos configurados correctamente.");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al asignar el proyecto.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-lg border border-border">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-xl font-bold text-primary">Asignar Proyecto Técnico</h3>
                    <p className="text-sm font-bold text-accent mt-1">{project.npu}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.servicios?.nombre_servicio}</p>
                </div>
                
                <div className="space-y-6">
                    {/* SELECTOR DE TÉCNICO */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">1. Técnico Responsable</label>
                        <SearchableSelect 
                            options={technicians} 
                            value={selectedTech} 
                            placeholder="Buscar técnico activo..." 
                            displayKey="nombre" 
                            valueKey="id"
                            onChange={setSelectedTech}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* CÁLCULO DE FECHA DE ENTREGA INTERNA */}
                        <div className="bg-muted/30 p-4 rounded-xl border border-border">
                            <label className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                <Clock className="w-3.5 h-3.5 mr-1.5" /> 2. Entrega Interna
                            </label>
                            <input 
                                type="number" 
                                min="1"
                                placeholder="Días hábiles al proyecto..." 
                                value={diasEntregaInterna}
                                onChange={e => setDiasEntregaInterna(e.target.value)}
                                className="w-full p-2.5 mb-3 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm"
                            />
                            <div className="flex flex-col justify-center border-t border-border/50 pt-2">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Fecha Calculada:</span>
                                {fechaCalculada ? (
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                                        <CalendarDays className="w-4 h-4 text-accent" />
                                        {fechaCalculada.includes('T') ? new Date(fechaCalculada).toLocaleDateString('es-MX') : new Date(`${fechaCalculada}T12:00:00Z`).toLocaleDateString('es-MX')}
                                    </div>
                                ) : (
                                    <span className="text-xs italic text-muted-foreground">Esperando días...</span>
                                )}
                            </div>
                        </div>

                        {/* DÍAS META DEL TÉCNICO */}
                        <div className="bg-accent/5 p-4 rounded-xl border border-accent/20">
                            <label className="flex items-center text-xs font-bold text-accent uppercase tracking-wider mb-2">
                                <Target className="w-3.5 h-3.5 mr-1.5" /> 3. Meta del Técnico
                            </label>
                            <input 
                                type="number" 
                                min="1"
                                placeholder="Días meta asignados..." 
                                value={diasTecnico}
                                onChange={e => setDiasTecnico(e.target.value)}
                                className="w-full p-2.5 border border-accent/40 rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm font-bold text-foreground"
                            />
                            <p className="text-[10px] text-muted-foreground mt-3 leading-tight">
                                Estos son los días reales que se le evaluarán al técnico en su rendimiento.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-bold text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
                    <button onClick={handleAssign} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2.5 px-6 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50">
                        {loading ? 'Asignando...' : 'Confirmar Asignación'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignProjectModal;