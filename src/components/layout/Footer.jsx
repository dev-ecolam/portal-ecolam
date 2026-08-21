
import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">
          <div className="flex flex-col items-start">
            <Link to="/" className="inline-block mb-6 bg-white rounded-xl p-3 shadow-sm">
              <img 
                src="https://horizons-cdn.hostinger.com/1b3da300-0daa-419c-9af6-b737c342ec20/566f925736623631b763730a36e2efb4.png" 
                alt="Ecolam Logo" 
                className="h-12 w-auto"
              />
            </Link>
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              Comprometidos con la excelencia normativa y la sostenibilidad de su empresa.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg tracking-wide mb-6 text-white">Enlaces rápidos</h3>
            <nav className="flex flex-col gap-3">
              <Link to="/servicios" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                Servicios
              </Link>
              <Link to="/trayectoria" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                Trayectoria
              </Link>
              <Link to="/clientes" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                Clientes
              </Link>
              <Link to="/contacto" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                Contacto
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-bold text-lg tracking-wide mb-6 text-white">Contacto</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-0.5 text-accent" />
                <a href="mailto:ventas@ecolam.com" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                  ventas@ecolam.mx
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-0.5 text-accent" />
                <a href="tel:+526565504406" className="text-sm text-primary-foreground hover:text-accent transition-colors duration-200 font-medium">
                  +52 (656) 550-4406
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 text-accent" />
                <span className="text-sm text-primary-foreground opacity-90 font-medium">
                  Ciudad Juárez, México
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/80 font-medium">
            © 2026 Ecolam. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link to="/privacidad" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors duration-200">
              Política de Privacidad
            </Link>
            <Link to="/terminos" className="text-sm text-primary-foreground/80 hover:text-accent transition-colors duration-200">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
