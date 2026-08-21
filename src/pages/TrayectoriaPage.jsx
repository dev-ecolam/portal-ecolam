
import React from 'react';
import { Helmet } from 'react-helmet';
import { TrendingUp, Award, Users, Building } from 'lucide-react';
import TimelineItem from '@/components/landing/TimelineItem.jsx';
import { motion } from 'framer-motion';

function TrayectoriaPage() {
  const milestones = [
    {
      year: '2009',
      title: 'Fundación de Ecolam',
      description: 'Iniciamos operaciones con un equipo de 3 especialistas enfocados en ergonomía y seguridad ocupacional para pequeñas y medianas empresas en Ciudad Juárez.',
      metrics: [
        { value: '3', label: 'Especialistas' },
        { value: '12', label: 'Clientes iniciales' }
      ]
    },
    {
      year: '2012',
      title: 'Expansión de servicios',
      description: 'Incorporamos servicios de cumplimiento STPS y SEMARNAT, convirtiéndonos en un proveedor integral de soluciones de seguridad y cumplimiento normativo.',
      metrics: [
        { value: '47', label: 'Clientes activos' },
        { value: '8', label: 'Especialistas' }
      ]
    },
    {
      year: '2015',
      title: 'Certificación ISO 9001',
      description: 'Obtuvimos la certificación ISO 9001 en sistemas de gestión de calidad, consolidando nuestros procesos y garantizando excelencia en el servicio.',
      metrics: [
        { value: '127', label: 'Proyectos completados' },
        { value: '15', label: 'Equipo profesional' }
      ]
    },
    {
      year: '2018',
      title: 'Colaboraciones gubernamentales',
      description: 'Establecimos alianzas estratégicas con entidades gubernamentales, participando en programas de capacitación y certificación a nivel nacional.',
      metrics: [
        { value: '5', label: 'Alianzas gubernamentales' },
        { value: '2,847', label: 'Trabajadores capacitados' }
      ]
    },
    {
      year: '2021',
      title: 'Especialización en maquiladoras',
      description: 'Desarrollamos programas especializados para la industria maquiladora, atendiendo las necesidades específicas de manufactura y producción a gran escala.',
      metrics: [
        { value: '34', label: 'Maquiladoras atendidas' },
        { value: '87.3%', label: 'Reducción de incidentes' }
      ]
    },
    {
      year: '2024',
      title: 'Liderazgo en el sector',
      description: 'Reconocidos como líderes en consultoría de seguridad y cumplimiento normativo, con presencia en 12 estados de la República Mexicana y un equipo de más de 40 especialistas.',
      metrics: [
        { value: '40+', label: 'Especialistas' },
        { value: '12', label: 'Estados con presencia' }
      ]
    }
  ];

  const achievements = [
    {
      icon: TrendingUp,
      value: '15+',
      label: 'Años de experiencia',
      description: 'Más de una década sirviendo a empresas líderes'
    },
    {
      icon: Award,
      value: '847',
      label: 'Proyectos completados',
      description: 'Soluciones implementadas con éxito'
    },
    {
      icon: Users,
      value: '12,400+',
      label: 'Trabajadores capacitados',
      description: 'Profesionales formados en seguridad'
    },
    {
      icon: Building,
      value: '183',
      label: 'Empresas atendidas',
      description: 'Clientes satisfechos en diversos sectores'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Trayectoria - Ecolam</title>
        <meta name="description" content="Conoce la historia de Ecolam: 15 años de experiencia, 847 proyectos completados, más de 12,400 trabajadores capacitados y presencia en 12 estados de México." />
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
              Nuestra trayectoria
            </h1>
            <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-xl text-foreground/80 leading-relaxed">
              Más de 15 años transformando espacios de trabajo en entornos seguros, saludables y sostenibles
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-background border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Logros destacados</h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-card text-card-foreground rounded-2xl p-8 text-center shadow-md border border-border hover:shadow-xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <achievement.icon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-4xl font-extrabold text-primary mb-3">{achievement.value}</p>
                <p className="font-bold text-lg mb-2">{achievement.label}</p>
                <p className="text-sm text-muted-foreground">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nuestra historia</h2>
            <div className="w-16 h-1 bg-accent mx-auto mb-6 rounded-full" />
            <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
              Un recorrido de crecimiento, innovación y compromiso con la seguridad
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {milestones.map((milestone, index) => (
              <TimelineItem
                key={index}
                {...milestone}
                index={index}
                isLast={index === milestones.length - 1}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default TrayectoriaPage;
