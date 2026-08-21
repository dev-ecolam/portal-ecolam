import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '../../context/UserContext';
import { motion } from 'framer-motion';
import Header from './Header'; 
import Footer from './Footer'; 

const DashboardLayout = ({ children }) => {
  const { user, userData } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Limpiamos la sesión local si la estás usando
    localStorage.removeItem('ecolamClientSession');
    // Redirigimos al login principal
    navigate('/portal');
  };

  // Extraemos el nombre y rol de tu Contexto de Usuario de PostgreSQL
  const nombre = userData?.nombre || user?.email?.split('@')[0] || 'Usuario';
  const rol = userData?.rol || (userData?.roles && userData.roles[0]) || 'Rol no definido';

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      
      {/* 1. Header Global (Descomenta si lo usas) */}
      <Header />

      <main className="flex-grow w-full max-w-7xl mx-auto space-y-6 py-8 px-4 sm:px-6 lg:px-8">
        
        {/* 2. Barra de Bienvenida y Cerrar Sesión */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Bienvenido, {nombre.split(" ").slice(0, 2).join(" ")}
            </h2>
            <p className="text-xs text-muted-foreground capitalize font-medium mt-1">
              Sesión activa como: <span className="text-accent font-semibold">{rol}</span>
            </p>
          </div>

          <Button onClick={handleLogout} variant="outline" className="border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>

        {/* 3. Contenedor principal donde se inyectará cada Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm min-h-[500px]"
        >
          {children}
        </motion.div>

      </main>

      {/* 4. Footer Global (Descomenta si lo usas) */}
      <Footer />
      
    </div>
  );
};

export default DashboardLayout;