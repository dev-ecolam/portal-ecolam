
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

function TimelineItem({ year, title, description, metrics, index = 0, isLast = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative flex gap-6 pb-12"
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center z-10">
          <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
        </div>
        {!isLast && (
          <div className="w-0.5 h-full bg-border mt-2" />
        )}
      </div>

      <div className="flex-1 pb-8">
        <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-lg">
          <span className="inline-block px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-semibold mb-3">
            {year}
          </span>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground leading-relaxed mb-4">{description}</p>
          
          {metrics && metrics.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              {metrics.map((metric, idx) => (
                <div key={idx}>
                  <p className="text-2xl font-bold text-accent">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TimelineItem;
