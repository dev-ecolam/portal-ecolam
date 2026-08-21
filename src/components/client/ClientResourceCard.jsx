
import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

function ClientResourceCard({ title, description, type, downloadUrl, index = 0 }) {
  const handleAction = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card text-card-foreground rounded-xl p-6 border hover:shadow-lg transition-all duration-300 h-full flex flex-col"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{title}</h3>
          <span className="text-xs px-2 py-1 rounded bg-accent/10 text-accent font-medium">
            {type}
          </span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow">
        {description}
      </p>

      <Button
        onClick={handleAction}
        variant="outline"
        className="w-full mt-auto"
      >
        {type === 'Documento' ? (
          <>
            <Download className="w-4 h-4 mr-2" />
            Descargar
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4 mr-2" />
            Acceder
          </>
        )}
      </Button>
    </motion.div>
  );
}

export default ClientResourceCard;
