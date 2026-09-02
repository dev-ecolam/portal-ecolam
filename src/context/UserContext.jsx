import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Usuario de Auth (Correo/Sesión)
  const [userData, setUserData] = useState(null); // Perfil de la BD (Rol, Nombre)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let realtimeSubscription = null;

    // Función principal para cargar la sesión y el perfil
    const fetchProfile = async (sessionUser) => {
      if (!sessionUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(sessionUser);

      try {
        // 1. Buscar el perfil directo en la tabla 'usuarios'
        const { data: profile, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (profile) {
          setUserData(profile);

          supabase.removeAllChannels();

          const channel = supabase.channel(`usuario-${sessionUser.id}`);
          
          realtimeSubscription = channel.on(
            'postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'usuarios', filter: `id=eq.${sessionUser.id}` }, 
            (payload) => {
              setUserData(payload.new);
            }
          ).subscribe();

        } else {
          // 2. FALLBACK: Cliente Asociado
          // En Supabase, usamos la búsqueda en arrays nativa de Postgres (.contains)
          const { data: clientDocs, error: clientErr } = await supabase
            .from('usuarios')
            .select('*')
            .contains('clientesAsociados', [sessionUser.id]); // Busca si el array contiene el ID

          if (clientDocs && clientDocs.length > 0) {
            setUserData({ authUid: sessionUser.id, ...clientDocs[0] });
          } else {
            console.error("Usuario autenticado sin documento vinculado en la tabla usuarios");
            setUserData(null);
          }
        }
      } catch (err) {
        console.error("Error al inicializar el usuario:", err);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    // A) Obtener sesión inicial al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchProfile(session?.user ?? null);
    });

    // B) Escuchar cambios de sesión (Login / Logout)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        fetchProfile(session?.user ?? null);
      }
    );

    // Limpieza al desmontar
    return () => {
      if (realtimeSubscription) supabase.removeChannel(realtimeSubscription);
      if (authListener) authListener.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userData,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
};