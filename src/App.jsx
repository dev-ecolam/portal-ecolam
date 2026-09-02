import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { supabase } from '../supabase/client';

// 1. IMPORTAMOS EL PROVIDER AQUÍ ARRIBA (Este era el que faltaba)
import { UserProvider } from './context/UserContext';

// Importaciones normales
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import TrayectoriaPage from './pages/TrayectoriaPage';
import ContactoPage from './pages/ContactoPage';
import ClientesPage from './pages/ClientesPage';
import EmpleadosLoginPage from './pages/EmpleadosLoginPage';
import PublicLayout from './components/layout/PublicLayout';

// 2. IMPORTACIONES PEREZOSAS (Lazy Loading)
const ClientDashboard = lazy(() => import('./dashboard/ClientDashboard'));
const AdminDashboard = lazy(() => import('./dashboard/AdminDashboard'));
const TecnicoDashboard = lazy(() => import('./dashboard/TecnicoDashboard'));
const SupervisorDashboard = lazy(() => import('./dashboard/SupervisorDashboard'));
const FinanzasDashboard = lazy(() => import('./dashboard/FinanzasDashboard'));
const HRDashboard = lazy(() => import('./dashboard/HRDashboard'));
const DirectivoDashboard = lazy(() => import('./dashboard/DirectivoDashboard'));
const EcotechDashboard = lazy(() => import('./dashboard/EcotechDashboard'));

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
    // 4. EL USER PROVIDER ABRAZA TODA LA APLICACIÓN
    <UserProvider>
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
                PUERTA TRASERA EMPLEADOS
               ========================================== */}
            <Route path="/intranet" element={<EmpleadosLoginPage />} />
            
            {/* ==========================================
                RUTAS PROTEGIDAS (Dashboards)
               ========================================== */}
            <Route path="/portal/dashboard" element={<ClientDashboard />} />
            <Route path="/intranet/admin" element={<AdminDashboard />} />
            
            {/* NUEVOS DASHBOARDS INTEGRADOS */}
            <Route path="/intranet/tecnico" element={<TecnicoDashboard />} />
            <Route path="/intranet/supervisor" element={<SupervisorDashboard />} />
            <Route path="/intranet/finanzas" element={<FinanzasDashboard />} />
            <Route path="/intranet/rh" element={<HRDashboard />} />
            <Route path="/intranet/directivo" element={<DirectivoDashboard />} />
            <Route path="/intranet/ecotech" element={<EcotechDashboard />} />
            
            {/* RUTA 404 */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center mt-32">
                <h1 className="text-4xl font-black text-gray-800">404</h1>
                <p className="text-xl font-bold text-gray-600 mt-2">Página no encontrada</p>
              </div>
            } />
          </Routes>
        </Suspense>
      </div>
    </UserProvider>
  );
};

export default App;