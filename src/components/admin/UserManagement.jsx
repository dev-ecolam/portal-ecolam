import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Alert } from '../ui/Alert'; // Verifica si tu carpeta es 'ui' o 'UI'
import { UserDeactivationModal } from '../modals/UserDeactivationModal';

// ==============================================================================
// GESTIÓN DE USUARIOS (Con asignación Multi-Planta)
// ==============================================================================
const UserManagement = ({ onUserAdded }) => {
    const [nombreCompleto, setNombreCompleto] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol, setRol] = useState('cliente');
    const [plantasDisponibles, setPlantasDisponibles] = useState([]);
    const [plantasSeleccionadas, setPlantasSeleccionadas] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // NUEVOS ESTADOS PARA LA LISTA DE USUARIOS Y EL MODAL
    const [usuariosActivos, setUsuariosActivos] = useState([]);
    const [userToDeactivate, setUserToDeactivate] = useState(null);

    const fetchDatos = async () => {
        // Cargar plantas
        const { data: plantas } = await supabase.from('clientes').select('id, nombre_empresa').order('nombre_empresa');
        setPlantasDisponibles(plantas || []);
        
        // Cargar usuarios activos
        const { data: users } = await supabase.from('usuarios').select('*').eq('activo', true).order('nombre');
        setUsuariosActivos(users || []);
    };

    useEffect(() => { fetchDatos(); }, []);

    const handleCheckboxChange = (plantaId) => {
        setPlantasSeleccionadas(prev => 
            prev.includes(plantaId) ? prev.filter(id => id !== plantaId) : [...prev, plantaId]
        );
    };

    const resetForm = () => {
        setNombreCompleto(''); setEmail(''); setPassword(''); setRol('cliente'); setPlantasSeleccionadas([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (!nombreCompleto || !email || !password) {
            setError('Nombre, email y contraseña son obligatorios.');
            return;
        }

        if (rol === 'cliente' && plantasSeleccionadas.length === 0) {
            setError('Debes asignar al menos una planta al cliente.');
            return;
        }

        setLoading(true);

        try {
            /* 
               NOTA DE ARQUITECTURA: 
               En Supabase, crear un usuario con Auth desde el frontend cierra la sesión actual. 
               Para este entorno de desarrollo, simularemos el guardado en nuestra tabla pública 'usuarios'.
               En producción, esta llamada se hace a través de una Edge Function usando la 'service_role key'.
            */
            
            // 1. Insertar el perfil del usuario (Generamos un UUID temporal para pruebas locales)
            const nuevoIdUsuario = crypto.randomUUID(); 

            const { error: userError } = await supabase.from('usuarios').insert([{
                id: nuevoIdUsuario, nombre: nombreCompleto, correo: email, rol: rol, roles: [rol]
            }]);
            if (userError) throw userError;

            // 2. Si es cliente, insertar las relaciones en la tabla puente Multi-Planta
            if (rol === 'cliente' && plantasSeleccionadas.length > 0) {
                const relaciones = plantasSeleccionadas.map(clienteId => ({
                    usuario_id: nuevoIdUsuario, cliente_id: clienteId
                }));
                await supabase.from('usuario_clientes').insert(relaciones);
            }

            setSuccess(`¡Usuario creado con éxito!`);
            resetForm();
            fetchDatos(); // Refrescamos la tabla
            if (onUserAdded) onUserAdded();
        } catch (err) {
            setError(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-xl font-bold text-primary mb-4">Crear Nuevo Usuario</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" value={nombreCompleto} onChange={e => setNombreCompleto(e.target.value)} placeholder="Nombre Completo" className="w-full px-3 py-2 border rounded-md" required/>
                    <select value={rol} onChange={e => setRol(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                        <option value="cliente">Cliente (Externo)</option>
                        <option value="administrador">Administrador</option>
                        <option value="directivo">Directivo</option>
                        <option value="supervisor">Supervisor de Proyectos</option>
                        <option value="tecnico">Técnico</option>
                        <option value="finanzas">Finanzas</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email de Acceso" className="w-full px-3 py-2 border rounded-md" required/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña (mínimo 6 caracteres)" className="w-full px-3 py-2 border rounded-md" required minLength={6}/>
                </div>

                {/* SECCIÓN MULTI-PLANTA: Solo visible si el rol es 'cliente' */}
                {rol === 'cliente' && (
                    <div className="mt-4 p-4 border rounded-md bg-muted/30">
                        <h4 className="font-semibold text-sm mb-3">Asignar acceso a Plantas (Puede seleccionar varias):</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2">
                            {plantasDisponibles.map(planta => (
                                <label key={planta.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-muted p-1 rounded transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-accent focus:ring-accent"
                                        checked={plantasSeleccionadas.includes(planta.id)}
                                        onChange={() => handleCheckboxChange(planta.id)}
                                    />
                                    <span>{planta.nombre_empresa}</span>
                                </label>
                            ))}
                            {plantasDisponibles.length === 0 && <span className="text-xs text-muted-foreground">No hay plantas registradas.</span>}
                        </div>
                    </div>
                )}

                <Alert message={error} type="error" onClose={() => setError('')} />
                <Alert message={success} type="success" onClose={() => setSuccess('')} />
                
                <button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors">
                    {loading ? 'Creando...' : 'Crear Usuario'}
                </button>
            </form>
            {/* Lista de Usuarios y Botón de Baja */}
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-bold mb-4">Usuarios Activos</h3>
                <ul className="divide-y divide-border max-h-[500px] overflow-y-auto pr-2">
                    {usuariosActivos.map(u => (
                        <li key={u.id} className="py-3 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-sm">{u.nombre}</p>
                                <p className="text-xs text-muted-foreground capitalize">{u.rol} | {u.correo}</p>
                            </div>
                            <button 
                                onClick={() => setUserToDeactivate(u)} 
                                className="text-xs bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground px-3 py-1 rounded transition-colors"
                            >
                                Dar de Baja
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Aquí invocamos el Modal si hay un usuario seleccionado */}
            {userToDeactivate && (
                <UserDeactivationModal 
                    userToDeactivate={userToDeactivate} 
                    onClose={() => setUserToDeactivate(null)} 
                    onSuccess={() => {
                        setUserToDeactivate(null);
                        fetchDatos();
                    }} 
                />
            )}
        </div>
    );
};

export default UserManagement;