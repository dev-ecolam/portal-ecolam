import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { UserPlus, Search, UserMinus, FileText } from 'lucide-react';
import { calculateVacationBalance } from '../../utils/helpers';
import { ManageEmployeeModal } from './ManageEmployeeModal'; // Crearemos este modal ahora

export const EmployeesPanel = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalEmployee, setModalEmployee] = useState(null); // null = cerrado, {} = nuevo, {...} = editar

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .not('rol', 'in', '("cliente")') // Solo ocultamos a los clientes
                .order('estado_empleado', { ascending: true }) // Activos primero
                .order('nombre', { ascending: true });

            if (error) throw error;

            const { data: vacData } = await supabase
                .from('ausencias_vacaciones')
                .select('usuario_id, dias_habiles')
                .eq('estado', 'Aprobado');

            const enrichedData = data.map(emp => {
                const tomadosEnSistema = vacData.filter(v => v.usuario_id === emp.id).reduce((sum, v) => sum + Number(v.dias_habiles), 0);
                const balance = calculateVacationBalance(emp.fecha_ingreso); 
                const saldoFinal = balance.disponibles + (emp.dias_acumulados_anteriores || 0) - (emp.dias_tomados_manuales || 0) - tomadosEnSistema;

                return { ...emp, antiguedad: balance.antiguedad, saldoFinal };
            });

            setEmployees(enrichedData);
        } catch (error) {
            toast.error("Error al cargar la plantilla.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEmployees(); }, []);

    const filteredEmployees = employees.filter(emp => 
        emp.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.rol?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input 
                        type="text" 
                        placeholder="Buscar empleado por nombre o rol..." 
                        className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setModalEmployee({})} // Pasamos un objeto vacío para indicar "Nuevo"
                    className="w-full md:w-auto bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-primary/90 transition-colors text-sm shadow-sm"
                >
                    <UserPlus className="w-4 h-4 mr-2"/> Alta de Empleado
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Empleado / Rol</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Contrato</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase">Ingreso / Antigüedad</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase">Vacaciones</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase">Expediente</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loading ? <tr><td colSpan="5" className="text-center py-8">Cargando plantilla...</td></tr> : 
                        filteredEmployees.map(emp => (
                            <tr key={emp.id} className={`hover:bg-muted/30 ${emp.estado_empleado === 'Baja' ? 'opacity-60 bg-muted/10' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${emp.estado_empleado === 'Baja' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                        <div>
                                            <p className="font-bold text-foreground">{emp.nombre}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{emp.rol}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-bold border border-border">
                                        {emp.tipo_contrato}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-sm">{emp.fecha_ingreso ? new Date(emp.fecha_ingreso).toLocaleDateString('es-MX') : 'Sin registro'}</p>
                                    {emp.estado_empleado !== 'Baja' && <p className="text-xs text-muted-foreground">{emp.antiguedad} años cumplidos</p>}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {emp.estado_empleado !== 'Baja' ? (
                                        <>
                                            <p className="text-xl font-black text-green-600">{Math.floor(emp.saldoFinal || 0)}</p>
                                            <p className="text-[10px] uppercase font-bold text-green-600/70">Días Libres</p>
                                        </>
                                    ) : <span className="text-xs text-muted-foreground">Inactivo</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => setModalEmployee(emp)}
                                        className="text-xs font-bold bg-background text-foreground border border-border px-4 py-2 rounded-md hover:bg-muted transition-colors"
                                    >
                                        Gestionar Perfil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalEmployee && (
                <ManageEmployeeModal 
                    employee={modalEmployee} 
                    onClose={() => setModalEmployee(null)} 
                    onFinalized={() => { setModalEmployee(null); fetchEmployees(); }} 
                />
            )}
        </div>
    );
};