import React from 'react';
import { Helmet } from 'react-helmet';
import { Shield, Users, Award, Leaf, FileCheck, Building2, Factory } from 'lucide-react';
import ServiceCard from '@/components/landing/ServiceCard.jsx';
import { motion } from 'framer-motion';

function ServicesPage() {
  const services = [
    {
      icon: Shield,
      title: 'Ergonomía',
      description: 'Análisis integral de puestos de trabajo para prevenir lesiones musculoesqueléticas y mejorar la productividad. Diseñamos soluciones personalizadas que optimizan el bienestar de los colaboradores.',
      benefits: [
        'Evaluaciones ergonómicas detalladas',
        'Diseño y rediseño de estaciones de trabajo',
        'Capacitación en posturas correctas',
        'Implementación de pausas activas',
        'Seguimiento y medición de resultados'
      ],
      variant: 'featured'
    },
    {
      icon: Users,
      title: 'Seguridad Ocupacional',
      description: 'Programas integrales de seguridad e higiene que protegen a su equipo y cumplen con todas las normativas vigentes. Reducimos riesgos y creamos culturas de seguridad sostenibles.',
      benefits: [
        'Auditorías de seguridad completas',
        'Planes de prevención de riesgos',
        'Capacitación en seguridad',
        'Equipos de protección personal',
        'Certificaciones de cumplimiento'
      ],
      variant: 'accent'
    },
    {
      icon: Award,
      title: 'Cumplimiento STPS',
      description: 'Asesoría especializada para cumplir con todas las Normas Oficiales Mexicanas de la Secretaría del Trabajo y Previsión Social. Mantenemos su empresa actualizada y en cumplimiento.',
      benefits: [
        'Auditorías NOM completas',
        'Documentación legal requerida',
        'Capacitación obligatoria',
        'Seguimiento de actualizaciones normativas',
        'Representación ante autoridades'
      ],
      variant: 'default'
    },
    {
      icon: Leaf,
      title: 'Gestión SEMARNAT',
      description: 'Soluciones ambientales integrales para cumplir con regulaciones de la Secretaría de Medio Ambiente y Recursos Naturales. Protegemos el medio ambiente mientras optimizamos sus operaciones.',
      benefits: [
        'Estudios de impacto ambiental',
        'Trámites de permisos y licencias',
        'Monitoreo de emisiones',
        'Planes de manejo de residuos',
        'Auditorías ambientales'
      ],
      variant: 'default'
    },
    {
      icon: FileCheck,
      title: 'Cumplimiento de NOMs',
      description: 'Verificación y certificación del cumplimiento de Normas Oficiales Mexicanas aplicables a su industria. Garantizamos que su empresa opere dentro del marco legal vigente.',
      benefits: [
        'Identificación de NOMs aplicables',
        'Evaluación de cumplimiento actual',
        'Planes de acción correctiva',
        'Preparación para inspecciones',
        'Certificaciones oficiales'
      ],
      variant: 'default'
    },
    {
      icon: Building2,
      title: 'Colaboraciones Gubernamentales',
      description: 'Facilitamos la relación entre su empresa y entidades gubernamentales. Gestionamos trámites, permisos y certificaciones con eficiencia y transparencia.',
      benefits: [
        'Gestión de trámites oficiales',
        'Representación ante autoridades',
        'Obtención de permisos',
        'Seguimiento de procesos',
        'Asesoría en licitaciones'
      ],
      variant: 'default'
    },
    {
      icon: Factory,
      title: 'Servicios para Maquiladoras',
      description: 'Soluciones especializadas para la industria maquiladora, incluyendo programas de seguridad, cumplimiento normativo y optimización de procesos adaptados a sus necesidades específicas.',
      benefits: [
        'Programas de seguridad industrial',
        'Cumplimiento de certificaciones internacionales',
        'Optimización de líneas de producción',
        'Capacitación especializada',
        'Auditorías de calidad y seguridad'
      ],
      variant: 'default'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Servicios - Ecolam</title>
        <meta name="description" content="Catálogo completo de servicios de Ecolam: ergonomía, seguridad ocupacional, cumplimiento STPS y SEMARNAT, NOMs, colaboraciones gubernamentales y servicios para maquiladoras." />
      </Helmet>
      <section className="py-24 bg-muted border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Nuestros servicios
            </h1>
            <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-xl text-foreground/80 leading-relaxed">
              Soluciones integrales en seguridad, ergonomía y cumplimiento normativo diseñadas para proteger a tu equipo y optimizar tus operaciones
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default ServicesPage;
