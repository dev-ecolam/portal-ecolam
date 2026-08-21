import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* El menú de navegación global de la empresa */}
      <Header />

      {/* Aquí React Router inyectará mágicamente HomePage, ServicesPage, etc. */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* El pie de página global */}
      <Footer />
    </div>
  );
};

export default PublicLayout;