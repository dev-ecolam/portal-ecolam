import React, { useState, useEffect } from 'react';
import { ClientDashboard } from '../dashboard/ClientDashboard'; 
import { toast } from 'sonner';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, LogOut, UserPlus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthLayout from "../components/layout/AuthLayout";
import PublicLayout from "../components/layout/PublicLayout";



function ClientesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const savedSession = localStorage.getItem('ecolamClientSession');
        const localData = savedSession ? JSON.parse(savedSession) : null;

        setCurrentClient({
          id: user.uid,
          email: user.email,
          nombreCompleto: localData?.nombreCompleto || user.email.split('@')[0],
          planta: localData?.planta || 'Cargando perfil...'
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCurrentClient(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
      const user = userCredential.user;

      let companyName = "Empresa Cliente"; 
      let clientName = user.email.split('@')[0];

      try {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          companyName = userData.planta || companyName;
          clientName = userData.nombreCompleto || clientName;
        }
      } catch (err) {
        console.error("Error al traer datos:", err);
      }

      const sessionData = { 
        id: user.uid, 
        email: user.email, 
        nombreCompleto: clientName, 
        planta: companyName
      };

      localStorage.setItem('ecolamClientSession', JSON.stringify(sessionData));
      setCurrentClient(sessionData);
      setIsAuthenticated(true);
      setLoginData({ email: '', password: '' });
      toast.success('¡Bienvenido al portal!');
      
    } catch (error) {
      toast.error('Error: Correo o contraseña incorrectos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('ecolamClientSession');
    toast.info('Sesión cerrada correctamente');
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
        <meta
          name="description"
          content="Accede a recursos exclusivos, documentos técnicos, herramientas y capacitación para clientes de Ecolam."
        />
      </Helmet>

      {!isAuthenticated ? (
        <PublicLayout>
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
                  Accede a recursos exclusivos, documentos digitales y herramientas
                  diseñadas para optimizar tus operaciones.
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-md mx-auto">
                <Tabs defaultValue="login">
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

                        <h2 className="text-2xl font-bold">
                          Iniciar sesión
                        </h2>
                      </div>

                      <form
                        onSubmit={handleLogin}
                        className="space-y-5"
                      >
                        <div>
                          <label>Correo electrónico</label>

                          <input
                            type="email"
                            value={loginData.email}
                            onChange={(e) =>
                              setLoginData({
                                ...loginData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-lg border border-border bg-input"
                            required
                          />
                        </div>

                        <div>
                          <label>Contraseña</label>

                          <input
                            type="password"
                            value={loginData.password}
                            onChange={(e) =>
                              setLoginData({
                                ...loginData,
                                password: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 rounded-lg border border-border bg-input"
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full"
                        >
                          {isLoading
                            ? "Verificando..."
                            : "Acceder al Portal"}
                        </Button>
                      </form>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>
        </PublicLayout>
      ) : (
        <AuthLayout>
          <section>
            <div className="w-full max-w-7xl mx-auto space-y-8 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    Bienvenido,{" "}
                    {currentClient?.nombreCompleto
                      ?.split(" ")
                      .slice(0, 2)
                      .join(" ")}
                  </h2>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm min-h-[500px]">
                  <ClientDashboard
                    selectedClientProfile={currentClient}
                  />
                </div>
              </motion.div>
            </div>
          </section>
        </AuthLayout>
      )}
    </>
  );
}

export default ClientesPage;