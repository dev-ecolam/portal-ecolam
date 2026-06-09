
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    service: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const services = [
    'Ergonomía',
    'Seguridad Ocupacional',
    'Cumplimiento STPS',
    'Gestión SEMARNAT',
    'Cumplimiento de NOMs',
    'Colaboraciones Gubernamentales',
    'Servicios para Maquiladoras',
    'Otro'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.company || !formData.phone || !formData.service || !formData.message) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const submissions = JSON.parse(localStorage.getItem('ecolamContactSubmissions') || '[]');
      const newSubmission = {
        ...formData,
        submittedAt: new Date().toISOString(),
        id: Date.now()
      };
      submissions.push(newSubmission);
      localStorage.setItem('ecolamContactSubmissions', JSON.stringify(submissions));

      toast.success('Mensaje enviado correctamente. Nos pondremos en contacto pronto.');
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        service: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Correo electrónico',
      value: 'ventas@ecolam.com',
      link: 'mailto:ventas@ecolam.com'
    },
    {
      icon: Phone,
      title: 'Teléfono',
      value: '+52 (656) 550-4406',
      link: 'tel:+526565504406'
    },
    {
      icon: MapPin,
      title: 'Ubicación',
      value: 'Ciudad Juárez, México',
      link: null
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contacto - Ecolam</title>
        <meta name="description" content="Contáctanos para solicitar una consulta gratuita. Nuestros expertos están listos para ayudarte con tus necesidades de seguridad, ergonomía y cumplimiento normativo." />
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
                  Contáctanos
                </h1>
                <div className="w-24 h-1 bg-accent mx-auto mb-6 rounded-full" />
                <p className="text-xl text-foreground/80 leading-relaxed">
                  Estamos listos para ayudarte a transformar tu empresa en un espacio más seguro y sostenible
                </p>
              </motion.div>
            </div>
          </section>

          <section className="py-24 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl font-bold mb-6">Envíanos un mensaje</h2>
                  <p className="text-foreground/70 mb-10 leading-relaxed font-medium">
                    Completa el formulario y uno de nuestros especialistas se pondrá en contacto contigo en menos de 24 horas.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Juan Pérez"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="tu@empresa.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Nombre de tu empresa"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+52 (55) 1234-5678"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service">Servicio de interés</Label>
                      <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service} value={service}>
                              {service}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Cuéntanos sobre tus necesidades operativas y normativas..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Enviando mensaje...'
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Enviar solicitud
                        </>
                      )}
                    </Button>
                  </form>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-10"
                >
                  <div>
                    <h2 className="text-3xl font-bold mb-6">Información de contacto</h2>
                    <p className="text-foreground/70 mb-8 leading-relaxed font-medium">
                      También puedes comunicarte directamente con nosotros a través de los siguientes medios institucionales.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-card text-card-foreground rounded-2xl p-6 shadow-md border border-border hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start gap-5">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <info.icon className="w-7 h-7 text-primary" />
                          </div>
                          <div className="pt-1">
                            <h3 className="font-bold mb-1 text-lg">{info.title}</h3>
                            {info.link ? (
                              <a
                                href={info.link}
                                className="text-primary hover:text-accent font-medium transition-colors duration-200 block"
                              >
                                {info.value}
                              </a>
                            ) : (
                              <p className="text-foreground/80 font-medium block">{info.value}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-primary text-primary-foreground rounded-2xl p-10 shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent rounded-full opacity-20 blur-2xl" />
                    <h3 className="text-2xl font-bold mb-6 text-white relative z-10">Horario de atención</h3>
                    <div className="space-y-3 font-medium text-primary-foreground/90 relative z-10">
                      <p className="flex justify-between border-b border-primary-foreground/20 pb-3">
                        <span>Lunes a Viernes</span>
                        <span>8:00 AM - 4:30 PM</span>
                      </p>
                      <p className="flex justify-between border-b border-primary-foreground/20 pb-3">
                        <span>Sábados</span>
                        <span>8:00 AM - 4:30 PM</span>
                      </p>
                      <p className="flex justify-between pb-1">
                        <span>Domingos</span>
                        <span className="text-accent">Cerrado</span>
                      </p>
                    </div>
                  </div>
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

export default ContactoPage;
