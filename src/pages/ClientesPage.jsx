import React, { useState, useEffect } from 'react';
import { ClientDashboard } from '../dashboard/ClientDashboard'; 
import { toast } from 'sonner';
import { auth, db } from '../firebase/config';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; 

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

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans pt-20">
      
      <main className="flex-grow flex items-center justify-center p-4">
        {!isAuthenticated ? (
          <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-primary">Portal de Clientes</h1>
              <div className="w-16 h-1 bg-accent mx-auto mt-4 rounded-full"></div>
              <p className="text-muted-foreground mt-4 text-sm">Ingresa con tus credenciales para ver tus proyectos.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Correo electrónico</label>
                <input 
                  type="email" 
                  value={loginData.email} 
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} 
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="tu@empresa.com" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={loginData.password} 
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} 
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full bg-accent text-primary font-bold py-3.5 rounded-lg hover:brightness-105 disabled:opacity-70 transition-all mt-2 shadow-md"
              >
                {isLoading ? 'Verificando...' : 'Acceder al Portal'}
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-7xl mx-auto space-y-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-primary">Hola, {currentClient?.nombreCompleto}</h2>
                <p className="text-muted-foreground text-sm font-medium">{currentClient?.planta}</p>
              </div>
              <button onClick={handleLogout} className="px-5 py-2 text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors border border-destructive/20">
                Cerrar sesión
              </button>
            </div>

            <div className="bg-card p-6 md:p-8 rounded-xl border border-border shadow-sm min-h-[500px]">
              <ClientDashboard selectedClientProfile={currentClient} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ClientesPage;