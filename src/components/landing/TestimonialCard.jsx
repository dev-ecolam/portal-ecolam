
import React from 'react';
import { Quote } from 'lucide-react';
import { motion } from 'framer-motion';

function TestimonialCard({ quote, name, company, role, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card text-card-foreground rounded-2xl p-6 shadow-lg h-full flex flex-col"
    >
      <Quote className="w-10 h-10 text-accent mb-4" />
      <blockquote className="text-base leading-relaxed mb-6 flex-grow">
        {quote}
      </blockquote>
      <div className="border-t pt-4">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
        <p className="text-sm text-muted-foreground">{company}</p>
      </div>
    </motion.div>
  );
}

export default TestimonialCard;
