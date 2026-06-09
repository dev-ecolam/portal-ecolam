
import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import TrayectoriaPage from './pages/TrayectoriaPage.jsx';
import ClientesPage from './pages/ClientesPage.jsx';
import ContactoPage from './pages/ContactoPage.jsx';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/trayectoria" element={<TrayectoriaPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/contacto" element={<ContactoPage />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
