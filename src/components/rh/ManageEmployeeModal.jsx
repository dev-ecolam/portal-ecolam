import React, { useState } from 'react';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';

export const ManageEmployeeModal = ({ employee, onClose, onFinalized }) => {
    const isNew = !employee.id;
    const [activeTab, setActiveTab] = useState('perfil'); // perfil, contrato, horario
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        nombre: employee.nombre || '',
        email: employee.email || '',
        rol: employee.rol || 'tecnico',
        estado_empleado: employee.estado_empleado || 'Activo',
        fecha_nacimiento: employee.fecha_nacimiento || '',
        rfc: employee.rfc || '',
        nss: employee.nss || '',
        tipo_contrato: employee.tipo_contrato || 'Indeterminado',
        fecha_ingreso: employee.fecha_ingreso || '',
        salario_mensual: employee.salario_mensual || 0,
        // Datos para ajustes manuales de vacaciones
        dias_acumulados_anteriores: employee.dias_acumulados_anteriores || 0,
        dias_tomados_manuales: employee.dias_tomados_manuales || 0
    });

    const handleSave = async () => {
        if (!formData.nombre || !formData.email) return toast.error("Nombre y Email son obligatorios.");
        setLoading(true);

        try {
            if (isNew) {
                // NOTA ARQUITECTÓNICA: Crear usuarios en Supabase Auth desde el cliente está bloqueado por seguridad.
                // En un ERP real, RH llena este form, se guarda en la tabla 'usuarios' y una Edge Function o un script de backend le envía el correo de invitación.
                // Aquí simularemos la inserción directa al perfil del CRM.
                const { error } = await supabase.from('usuarios').insert([{ ...formData }]);
                if (error) throw error;
                toast.success("Empleado registrado. Asegúrate de enviarle su invitación al sistema.");
            } else {
                const { error } = await supabase.from('usuarios').update(formData).eq('id', employee.id);
                if (error) throw error;
                toast.success("Expediente actualizado.");
            }
            onFinalized();
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar el expediente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
            <div className="bg-card p-0 rounded-2xl shadow-xl w-full max-w-3xl border border-border flex flex-col h-[90vh] md:h-[auto] max-h-[90vh]">
                
                {/* HEADER */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10 rounded-t-2xl">
                    <div>
                        <h3 className="text-xl font-black text-primary">{isNew ? 'Alta de Nuevo Empleado' : `Expediente: ${employee.nombre}`}</h3>
                        {!isNew && <p className="text-sm font-bold text-muted-foreground mt-1">ID: {employee.id.split('-')[0]}</p>}
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl">&times;</button>
                </div>

                {/* TABS INTERNAS */}
                <div className="flex border-b border-border px-6">
                    <button onClick={() => setActiveTab('perfil')} className={`py-3 px-4 text-sm font-bold border-b-2 ${activeTab === 'perfil' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Perfil y Contacto</button>
                    <button onClick={() => setActiveTab('contrato')} className={`py-3 px-4 text-sm font-bold border-b-2 ${activeTab === 'contrato' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Contrato y Salario</button>
                    {!isNew && <button onClick={() => setActiveTab('vacaciones')} className={`py-3 px-4 text-sm font-bold border-b-2 ${activeTab === 'vacaciones' ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Ajustes Vacaciones</button>}
                </div>

                {/* BODY (Scrollable) */}
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    
                    {activeTab === 'perfil' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold mb-1">Nombre Completo</label>
                                <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Correo Electrónico (Institucional)</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!isNew} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none disabled:opacity-60" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Fecha de Nacimiento</label>
                                <input type="date" value={formData.fecha_nacimiento} onChange={e => setFormData({...formData, fecha_nacimiento: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">RFC</label>
                                <input type="text" value={formData.rfc} onChange={e => setFormData({...formData, rfc: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none uppercase" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">NSS (Seguro Social)</label>
                                <input type="text" value={formData.nss} onChange={e => setFormData({...formData, nss: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'contrato' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in">
                            <div>
                                <label className="block text-sm font-bold mb-1">Rol en el Sistema</label>
                                <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent">
                                    <option value="tecnico">Técnico Operativo</option>
                                    <option value="supervisor">Supervisor de Calidad</option>
                                    <option value="rh">Recursos Humanos</option>
                                    <option value="administrador">Administración / Finanzas</option>
                                    <option value="directivo">Directivo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-destructive">Estatus Laboral</label>
                                <select value={formData.estado_empleado} onChange={e => setFormData({...formData, estado_empleado: e.target.value})} className="w-full px-4 py-2 border border-destructive/50 rounded-lg bg-destructive/5 text-destructive font-bold text-sm outline-none focus:ring-1 focus:ring-destructive">
                                    <option value="Activo">Activo</option>
                                    <option value="Baja">Baja Definitiva</option>
                                    <option value="Suspendido">Suspendido / Permiso</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Tipo de Contrato</label>
                                <select value={formData.tipo_contrato} onChange={e => setFormData({...formData, tipo_contrato: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-1 focus:ring-accent">
                                    <option value="Indeterminado">Tiempo Indeterminado</option>
                                    <option value="Prueba">Periodo de Prueba (30/90 días)</option>
                                    <option value="Determinado">Tiempo Determinado</option>
                                    <option value="Asimilado">Asimilado a Salarios</option>
                                    <option value="Honorarios">Honorarios (Externo)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Fecha de Ingreso</label>
                                <input type="date" value={formData.fecha_ingreso} onChange={e => setFormData({...formData, fecha_ingreso: e.target.value})} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-sm outline-none" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold mb-1 text-green-600">Salario Mensual Bruto</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                                    <input type="number" value={formData.salario_mensual} onChange={e => setFormData({...formData, salario_mensual: e.target.value})} className="w-full pl-8 pr-4 py-2 border border-green-200 rounded-lg bg-green-50 text-green-900 font-bold text-sm outline-none focus:ring-1 focus:ring-green-500" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">* Visible solo para RRHH y Directivos.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vacaciones' && !isNew && (
                        <div className="space-y-4 animate-in fade-in">
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                <p className="text-sm text-amber-800 font-bold mb-2">Ajustes Manuales de Saldo</p>
                                <p className="text-xs text-amber-700 mb-4">Utiliza esto solo si necesitas cuadrar el saldo por vacaciones tomadas antes de usar el CRM, o días extra otorgados como bono.</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-1">Días a Favor (+)</label>
                                        <input type="number" value={formData.dias_acumulados_anteriores} onChange={e => setFormData({...formData, dias_acumulados_anteriores: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-muted-foreground mb-1">Días Descontados (-)</label>
                                        <input type="number" value={formData.dias_tomados_manuales} onChange={e => setFormData({...formData, dias_tomados_manuales: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER ACCIONES */}
                <div className="p-6 border-t border-border bg-muted/10 rounded-b-2xl flex justify-end gap-3">
                    <button onClick={onClose} disabled={loading} className="px-5 py-2 font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={loading} className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold py-2 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Guardar Expediente'}
                    </button>
                </div>
            </div>
        </div>
    );
};