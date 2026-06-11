
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { LogIn, LogOut, UserPlus, Lock } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ClientResourceCard from '@/components/ClientResourceCard.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function ClientesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const session = localStorage.getItem('ecolamClientSession');
    if (session) {
      const client = JSON.parse(session);
      setCurrentClient(client);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const clients = JSON.parse(localStorage.getItem('ecolamClients') || '[]');
    const client = clients.find(
      c => c.email === loginData.email && c.password === loginData.password
    );

    if (client) {
      const sessionData = { email: client.email, name: client.name, company: client.company };
      localStorage.setItem('ecolamClientSession', JSON.stringify(sessionData));
      setCurrentClient(sessionData);
      setIsAuthenticated(true);
      toast.success(`Bienvenido, ${client.name}`);
      setLoginData({ email: '', password: '' });
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();

    if (!registerData.name || !registerData.email || !registerData.company || !registerData.password || !registerData.confirmPassword) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const clients = JSON.parse(localStorage.getItem('ecolamClients') || '[]');
    
    if (clients.find(c => c.email === registerData.email)) {
      toast.error('Este correo ya está registrado');
      return;
    }

    const newClient = {
      name: registerData.name,
      email: registerData.email,
      company: registerData.company,
      password: registerData.password,
      registeredAt: new Date().toISOString()
    };

    clients.push(newClient);
    localStorage.setItem('ecolamClients', JSON.stringify(clients));

    const sessionData = { email: newClient.email, name: newClient.name, company: newClient.company };
    localStorage.setItem('ecolamClientSession', JSON.stringify(sessionData));
    setCurrentClient(sessionData);
    setIsAuthenticated(true);
    toast.success('Registro exitoso. Bienvenido a Ecolam');
    setRegisterData({ name: '', email: '', company: '', password: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('ecolamClientSession');
    setCurrentClient(null);
    setIsAuthenticated(false);
    toast.success('Sesión cerrada correctamente');
  };

  const resources = [
    {
      title: 'Manual de Seguridad Ocupacional 2026',
      description: 'Guía completa actualizada con las últimas normativas STPS y mejores prácticas en seguridad industrial.',
      type: 'Documento',
      downloadUrl: '#'
    },
    {
      title: 'Checklist de Cumplimiento NOM-035',
      description: 'Lista de verificación detallada para evaluar y cumplir con la NOM-035-STPS-2018 sobre factores de riesgo psicosocial.',
      type: 'Documento',
      downloadUrl: '#'
    },
    {
      title: 'Calculadora de Riesgo Ergonómico',
      description: 'Herramienta interactiva para evaluar riesgos ergonómicos en estaciones de trabajo y calcular niveles de exposición.',
      type: 'Herramienta',
      downloadUrl: '#'
    },
    {
      title: 'Plantillas de Auditoría SEMARNAT',
      description: 'Formatos estandarizados para realizar auditorías ambientales y documentar cumplimiento de regulaciones.',
      type: 'Documento',
      downloadUrl: '#'
    },
    {
      title: 'Guía de Implementación ISO 45001',
      description: 'Paso a paso para implementar sistemas de gestión de seguridad y salud ocupacional según ISO 45001.',
      type: 'Documento',
      downloadUrl: '#'
    },
    {
      title: 'Portal de Capacitación en Línea',
      description: 'Acceso a cursos virtuales sobre seguridad, ergonomía y cumplimiento normativo con certificación.',
      type: 'Herramienta',
      downloadUrl: '#'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Área de Clientes - Ecolam</title>
        <meta name="description" content="Accede a recursos exclusivos, documentos técnicos, herramientas y capacitación para clientes de Ecolam." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="py-24 bg-muted border-b border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Área de clientes
                </h1>
                <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
                <p className="text-xl text-foreground/80 leading-relaxed">
                  Accede a recursos exclusivos, documentos técnicos y herramientas diseñadas para optimizar tus operaciones
                </p>
              </motion.div>
            </div>
          </section>

          {!isAuthenticated ? (
            <section className="py-24 bg-background">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted p-1 rounded-xl">
                      <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Iniciar sesión</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-card text-card-foreground rounded-2xl p-8 shadow-xl border border-border"
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <LogIn className="w-6 h-6 text-primary" />
                          </div>
                          <h2 className="text-2xl font-bold">Iniciar sesión</h2>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                          <div className="space-y-1">
                            <Label htmlFor="login-email">Correo electrónico</Label>
                            <Input
                              id="login-email"
                              type="email"
                              value={loginData.email}
                              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                              placeholder="tu@empresa.com"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="login-password">Contraseña</Label>
                            <Input
                              id="login-password"
                              type="password"
                              value={loginData.password}
                              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                              placeholder="••••••••"
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold mt-4 shadow-md py-6">
                            Acceder
                          </Button>
                        </form>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </section>
          ) : (
            <section className="py-24 bg-background">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-16 p-8 bg-muted rounded-2xl border border-border">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Bienvenido, {currentClient.name}</h2>
                    <p className="text-foreground/70 font-medium">{currentClient.company}</p>
                  </div>
                  <Button onClick={handleLogout} variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar sesión
                  </Button>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <div className="w-2 h-8 bg-accent rounded-full" />
                    Recursos disponibles
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {resources.map((resource, index) => (
                      <ClientResourceCard key={index} {...resource} index={index} />
                    ))}
                  </div>
                </motion.div>
              </div>
            </section>
          )}

          {!isAuthenticated && (
            <section className="py-24 bg-primary text-primary-foreground text-center border-t border-primary/20">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                  >
                    <Lock className="w-16 h-16 text-accent mx-auto mb-8 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Contenido exclusivo para clientes</h2>
                    <p className="text-xl text-primary-foreground/90 leading-relaxed font-medium">
                      Inicia sesión o regístrate para acceder a documentos técnicos, herramientas especializadas y recursos de capacitación diseñados para optimizar tus operaciones
                    </p>
                  </motion.div>
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}

export default ClientesPage;
