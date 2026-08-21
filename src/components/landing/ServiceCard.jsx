
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function ServiceCard({ icon: Icon, title, description, benefits, variant = 'default' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`group h-full flex flex-col rounded-2xl p-6 transition-all duration-300 ${
        variant === 'featured'
          ? 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl'
          : variant === 'accent'
          ? 'bg-accent text-accent-foreground shadow-lg hover:shadow-xl'
          : 'bg-card text-card-foreground border hover:shadow-lg'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
        variant === 'featured' || variant === 'accent'
          ? 'bg-white/20'
          : 'bg-primary/10'
      }`}>
        <Icon className={`w-6 h-6 ${
          variant === 'featured' || variant === 'accent'
            ? 'text-white'
            : 'text-primary'
        }`} />
      </div>

      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className={`text-sm leading-relaxed mb-4 ${
        variant === 'featured' || variant === 'accent'
          ? 'opacity-90'
          : 'text-muted-foreground'
      }`}>
        {description}
      </p>

      {benefits && benefits.length > 0 && (
        <ul className="space-y-2 mb-6">
          {benefits.map((benefit, index) => (
            <li key={index} className={`text-sm flex items-start gap-2 ${
              variant === 'featured' || variant === 'accent'
                ? 'opacity-90'
                : 'text-muted-foreground'
            }`}>
              <span className="mt-1">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto">
        <Button
          variant={variant === 'default' ? 'outline' : 'secondary'}
          className="group-hover:translate-x-1 transition-transform duration-200"
        >
          Más información
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}

export default ServiceCard;
