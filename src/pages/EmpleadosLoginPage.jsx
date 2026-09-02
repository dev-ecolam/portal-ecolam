import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { toast } from 'sonner';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';

const EmpleadosLoginPage = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Completar todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Iniciar sesión en Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) throw authError;

      // 2. Traer el rol para saber a dónde mandarlo
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, roles')
        .eq('id', authData.user.id)
        .single();

      const role = userData?.rol || (userData?.roles && userData.roles[0]);
      
      toast.success('Acceso autorizado');

      // 3. Enrutamiento inteligente según el rol (con Switch)
      const userRole = role?.toLowerCase();

      switch (userRole) {
        case 'administrador':
          navigate('/intranet/admin');
          break;
        case 'directivo':
          navigate('/intranet/directivo');
          break;
        case 'rh':
          navigate('/intranet/rh');
          break;
        case 'finanzas':
          navigate('/intranet/finanzas');
          break;
        case 'supervisor':
          navigate('/intranet/supervisor');
          break;
        case 'tecnico':
          navigate('/intranet/tecnico');
          break;
        case 'ecotech':
          navigate('/intranet/ecotech');
          break;
        case 'cliente':
          navigate('/portal/dashboard');
          break;
        default:
          // Si por alguna razón el rol está vacío o no coincide, lo regresamos/mantenemos a salvo
          toast.error('Rol no reconocido. Contacta a soporte.');
          await supabase.auth.signOut();
          navigate('/login'); 
          break;
      }

    } catch (error) {
      toast.error('Credenciales incorrectas o acceso denegado.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4 font-sans">
      <Helmet>
        <title>Intranet - Ecolam</title>
      </Helmet>

      <div className="w-full max-w-md bg-zinc-950 p-8 rounded-xl shadow-2xl border border-zinc-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Acceso Operativo</h2>
          <p className="text-sm text-zinc-400 mt-1">Portal interno de Ecolam</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Correo Institucional</label>
            <input
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              placeholder="usuario@ecolam.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900 text-white focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-black font-bold py-3 text-base">
            {isLoading ? "Verificando..." : "Ingresar al Sistema"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EmpleadosLoginPage;