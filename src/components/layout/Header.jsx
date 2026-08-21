
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Servicios', path: '/servicios' },
    { name: 'Trayectoria', path: '/trayectoria' },
    { name: 'Clientes', path: '/clientes' },
    { name: 'Contacto', path: '/contacto' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="https://horizons-cdn.hostinger.com/1b3da300-0daa-419c-9af6-b737c342ec20/566f925736623631b763730a36e2efb4.png" 
              alt="Ecolam Logo" 
              className="h-10 md:h-12 w-auto group-hover:scale-105 transition-transform duration-300"
            />
            <span className="text-xs text-primary font-medium hidden lg:inline-block border-l-2 border-primary/20 pl-3 leading-tight max-w-[150px]">
              Consultoría ambiental y seguridad industrial
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive(item.path)
                    ? 'text-accent bg-primary' // Alta legibilidad: verde lima sobre azul marino
                    : 'text-primary hover:text-accent hover:bg-primary/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link to="/contacto">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-md hover:shadow-lg transition-all">
                Contáctanos
              </Button>
            </Link>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <Menu className="h-7 w-7" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <div className="flex items-center gap-3 mb-8 border-b pb-4 mt-4">
                <img 
                  src="https://horizons-cdn.hostinger.com/1b3da300-0daa-419c-9af6-b737c342ec20/566f925736623631b763730a36e2efb4.png" 
                  alt="Ecolam Logo" 
                  className="h-8 w-auto"
                />
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                      isActive(item.path)
                        ? 'text-accent bg-primary'
                        : 'text-primary hover:bg-primary/5 hover:text-accent'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="mt-4 border-t pt-4">
                  <span className="text-xs text-muted-foreground font-medium block mb-4">
                    Consultoría ambiental, ergonomia ocupacional y seguridad industrial
                  </span>
                  <Link to="/contacto" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6">
                      Contáctanos
                    </Button>
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default Header;
