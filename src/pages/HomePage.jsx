
import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Users, Award, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ServiceCard from '@/components/ServiceCard.jsx';
import TestimonialCard from '@/components/TestimonialCard.jsx';

function HomePage() {
  const featuredServices = [
    {
      icon: Shield,
      title: 'Ergonomía',
      description: 'Análisis y optimización de espacios de trabajo para prevenir lesiones y mejorar el bienestar de los colaboradores.',
      benefits: ['Evaluaciones ergonómicas', 'Diseño de estaciones de trabajo', 'Capacitación especializada'],
      variant: 'featured'
    },
    {
      icon: Users,
      title: 'Seguridad Ocupacional',
      description: 'Implementación de programas integrales de seguridad para proteger a su equipo y cumplir con normativas.',
      benefits: ['Auditorías de seguridad', 'Planes de prevención', 'Certificaciones'],
      variant: 'accent'
    },
    {
      icon: Award,
      title: 'Cumplimiento STPS',
      description: 'Asesoría especializada para cumplir con todas las normas de la Secretaría del Trabajo y Previsión Social.',
      benefits: ['Auditorías NOM', 'Documentación legal', 'Seguimiento continuo'],
      variant: 'default'
    },
    {
      icon: Leaf,
      title: 'Gestión SEMARNAT',
      description: 'Soluciones ambientales para cumplir con regulaciones de la Secretaría de Medio Ambiente y Recursos Naturales.',
      benefits: ['Estudios de impacto', 'Permisos ambientales', 'Monitoreo continuo'],
      variant: 'default'
    }
  ];

  const testimonials = [
    {
      quote: 'Ecolam transformó completamente nuestro enfoque de seguridad ocupacional. Su equipo profesional nos ayudó a implementar sistemas que redujeron incidentes en un 73% durante el primer año.',
      name: 'Carlos Mendoza',
      role: 'Director de Operaciones',
      company: 'Industrias del Norte'
    },
    {
      quote: 'La asesoría en cumplimiento normativo de Ecolam fue fundamental para obtener nuestras certificaciones. Su conocimiento profundo de las regulaciones STPS y SEMARNAT nos ahorró tiempo y recursos.',
      name: 'Ana Patricia Ruiz',
      role: 'Gerente de Recursos Humanos',
      company: 'Manufactura Avanzada SA'
    },
    {
      quote: 'Trabajar con Ecolam en nuestros proyectos de ergonomía mejoró significativamente la satisfacción de nuestros empleados. Los resultados fueron medibles y el retorno de inversión superó nuestras expectativas.',
      name: 'Roberto Sánchez',
      role: 'Coordinador de Seguridad',
      company: 'Grupo Industrial del Bajío'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Ecolam - Expertos en Ergonomía, Seguridad y Cumplimiento Ambiental</title>
        <meta name="description" content="Soluciones profesionales en ergonomía, seguridad ocupacional, cumplimiento STPS y SEMARNAT. Más de 15 años de experiencia sirviendo a empresas líderes en México." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-grow">
          <section className="relative min-h-[90dvh] flex items-center justify-center overflow-hidden bg-primary text-primary-foreground">
            <div
              className="absolute inset-0 z-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1673519451902-e67b4c97549a)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl text-center mx-auto"
              >
                <span className="inline-block py-1 px-3 rounded-full bg-accent/20 text-accent font-semibold text-sm mb-6 uppercase tracking-wider">
                  Consultoría Ambiental y Seguridad Industrial
                </span>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white" style={{ letterSpacing: '-0.02em' }}>
                  Transformamos espacios de trabajo en entornos seguros y sostenibles
                </h1>
                <p className="text-xl md:text-2xl text-primary-foreground/90 mb-10 leading-relaxed max-w-3xl mx-auto">
                  Expertos en ergonomía, seguridad ocupacional y cumplimiento normativo. Más de 15 años ayudando a empresas a proteger a su equipo y el medio ambiente.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/servicios">
                    <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-6 font-bold shadow-lg hover:-translate-y-1 transition-all">
                      Conoce nuestros servicios
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/contacto">
                    <Button size="lg" className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 font-bold shadow-lg hover:-translate-y-1 transition-all">
                      Solicita una consulta
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestros servicios principales</h2>
                <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
                <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
                  Soluciones integrales diseñadas para proteger a tu equipo, cumplir con regulaciones y optimizar operaciones
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {featuredServices.map((service, index) => (
                  <ServiceCard key={index} {...service} />
                ))}
              </div>

              <div className="text-center mt-16">
                <Link to="/servicios">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8">
                    Ver todos los servicios
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-24 bg-muted border-y border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
                <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
                <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
                  Empresas líderes confían en Ecolam para sus necesidades de seguridad y cumplimiento
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <TestimonialCard key={index} {...testimonial} index={index} />
                ))}
              </div>
            </div>
          </section>

          <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-white">
                    ¿Listo para mejorar la seguridad y sostenibilidad de tu empresa?
                  </h2>
                  <p className="text-xl opacity-90 mb-10 leading-relaxed font-medium">
                    Agenda una consulta gratuita con nuestros expertos y descubre cómo podemos ayudarte a alcanzar tus objetivos normativos y operativos.
                  </p>
                  <Link to="/contacto">
                    <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 font-bold shadow-xl hover:-translate-y-1 transition-all">
                      Contacta con nosotros
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default HomePage;
