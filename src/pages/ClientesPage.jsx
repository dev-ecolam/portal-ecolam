import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabase/client';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ClientesPage() {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast.success('¡Bienvenido al portal!');
      
      // En lugar de renderizar aquí mismo, lo mandamos a su ruta oficial
      navigate('/portal/dashboard');
      
    } catch (error) {
      toast.error('Error: Correo o contraseña incorrectos.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Portal de Clientes - Ecolam</title>
        <meta name="description" content="Accede al panel de control y herramientas de Ecolam." />
      </Helmet>
      <section className="py-24 bg-muted border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Portal de Clientes</h1>
            <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-xl text-foreground/80 leading-relaxed">
              Ingresa tus credenciales para visualizar el estatus de tus proyectos y resultados de estudios.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Formulario de Login */}
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
                    <h2 className="text-2xl font-bold">Iniciar sesión</h2>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium">Correo electrónico</label>
                      <input
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input mt-1"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Contraseña</label>
                      <input
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-input mt-1"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? "Verificando..." : "Acceder al Portal"}
                    </Button>
                  </form>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </> 
  );
}

export default ClientesPage;