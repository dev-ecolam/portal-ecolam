import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from '../supabase/client';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import TrayectoriaPage from './pages/TrayectoriaPage';
import ContactoPage from './pages/ContactoPage';
import ClientesPage from './pages/ClientesPage';
import EmpleadosLoginPage from './pages/EmpleadosLoginPage';
import PublicLayout from './components/layout/PublicLayout';

// 2. IMPORTACIONES PEREZOSAS (Lazy Loading) - Cambiamos 'dashboards' por 'dashboard'
const ClientDashboard = lazy(() => import('./dashboard/ClientDashboard').then(module => ({ default: module.ClientDashboard })));
const AdminDashboard = lazy(() => import('./dashboard/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
//const TecnicoDashboard = lazy(() => import('./dashboard/TecnicoDashboard').then(module => ({ default: module.TecnicoDashboard })));

// 3. PANTALLA DE CARGA
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#cdcdcd]">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-transparent"></div>
  </div>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mantenemos la sesión de Supabase viva y actualizada
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="bg-[#cdcdcd] min-h-screen font-sans">
      <Toaster richColors position="bottom-right" />
      
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          
          {/* ==========================================
              SITIO WEB PÚBLICO (Envueltos en PublicLayout)
             ========================================== */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/trayectoria" element={<TrayectoriaPage />} />
            <Route path="/contacto" element={<ContactoPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
          </Route>

          {/* ==========================================
              PUERTA TRASERA EMPLEADOS (Sin Header/Footer)
             ========================================== */}
          <Route path="/intranet" element={<EmpleadosLoginPage />} />

          {/* ==========================================
              RUTAS PROTEGIDAS (Dashboards)
             ========================================== */}
          <Route path="/portal/dashboard" element={<ClientDashboard />} />
          <Route path="/intranet/admin" element={<AdminDashboard />} />
          {/* <Route path="/intranet/tecnico" element={<TecnicoDashboard />} /> */}
          
          {/* RUTA 404 */}
          <Route path="*" element={<h1 className="text-center mt-20 text-2xl font-bold">404 - Página no encontrada</h1>} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default App;