import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../supabase/client';
import { toast } from 'sonner';
import { ChevronDown, CalendarDays } from 'lucide-react';

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
    const [selectedTech, setSelectedTech] = useState('');
    const [diasHabiles, setDiasHabiles] = useState('');
    const [fechaCalculada, setFechaCalculada] = useState('');
    const [loading, setLoading] = useState(false);

    // Calcular fecha límite saltando sábados (6) y domingos (0)
    useEffect(() => {
        if (!diasHabiles || isNaN(diasHabiles) || diasHabiles <= 0) {
            setFechaCalculada('');
            return;
        }

        let date = new Date(); 
        let daysAdded = 0;
        const totalDays = parseInt(diasHabiles, 10);

        while (daysAdded < totalDays) {
            date.setDate(date.getDate() + 1);
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                daysAdded++;
            }
        }
        
        setFechaCalculada(date.toISOString().split('T')[0]);
    }, [diasHabiles]);

    const handleAssign = async () => {
        if (!selectedTech) return toast.error("Selecciona un técnico.");
        if (!diasHabiles || diasHabiles <= 0) return toast.error("Ingresa una cantidad válida de días hábiles.");

        setLoading(true);
        try {
            const { error } = await supabase
                .from('proyectos_v2')
                .update({ 
                    tecnico_id: selectedTech,
                    dias_asignados_tecnico: parseInt(diasHabiles, 10), // Nuevo campo
                    fecha_entrega_interna: fechaCalculada, // Límite interno
                    estado_operativo: 'Pendiente' // Estado inicial para el técnico
                })
                .eq('id', project.id);
                
            if (error) throw error;
            
            toast.success("Proyecto asignado correctamente");
            onFinalized();
            onClose();
        } catch (error) {
            toast.error("Error al asignar el proyecto");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <div className="mb-6 pb-4 border-b border-border">
                    <h3 className="text-xl font-bold text-primary">Asignar Proyecto</h3>
                    <p className="text-sm font-bold text-accent mt-1">{project.npu}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{project.servicios?.nombre_servicio}</p>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Técnico Asignado</label>
                        <SearchableSelect 
                            options={technicians} 
                            value={selectedTech} 
                            placeholder="Buscar técnico activo..." 
                            displayKey="nombre" 
                            valueKey="id"
                            onChange={setSelectedTech}
                        />
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-border">
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tiempo de Ejecución</label>
                        <div className="flex gap-4 items-start">
                            <div className="w-1/2">
                                <input 
                                    type="number" 
                                    min="1"
                                    placeholder="Días hábiles..." 
                                    value={diasHabiles}
                                    onChange={e => setDiasHabiles(e.target.value)}
                                    className="w-full p-3 border border-border rounded-lg bg-background outline-none focus:ring-2 focus:ring-accent text-sm"
                                />
                            </div>
                            <div className="w-1/2 flex flex-col justify-center">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Fecha Límite Calculada:</span>
                                {fechaCalculada ? (
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                                        <CalendarDays className="w-4 h-4 text-accent" />
                                        {new Date(fechaCalculada).toLocaleDateString('es-MX')}
                                    </div>
                                ) : (
                                    <span className="text-xs italic text-muted-foreground">Esperando días...</span>
                                )}
                            </div>
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