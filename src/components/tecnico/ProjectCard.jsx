import React from 'react';
import { Calendar, Building2 } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const ProjectCard = ({ project, isActive, onSelect }) => {
    let timeStatus = 'A Tiempo';
    let statusColors = 'bg-green-100 text-green-700';

    if (project.fecha_entrega_interna) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const datePart = project.fecha_entrega_interna.substring(0, 10);
        const limit = new Date(`${datePart}T00:00:00`);
        limit.setHours(0,0,0,0);
        
        const diffDays = Math.ceil((limit - today) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            timeStatus = 'Atrasado';
            statusColors = 'bg-destructive/20 text-destructive';
        } else if (diffDays <= 7) {
            timeStatus = 'Vence Pronto';
            statusColors = 'bg-amber-100 text-amber-700';
        }
    }

    // Lógica para el punto de notificación
    const isNew = project.estado_operativo === 'Pendiente' && !project.ultimo_inicio_proceso;
    const hasNotes = !!project.notas_supervisor;
    const isRejected = project.estado_operativo === 'Rechazado' || project.estado === 'Rechazado';
    
    // El punto se muestra si es nuevo, tiene notas o fue rechazado Y no ha sido visto
    const showNotificationDot = (isNew || hasNotes || isRejected) && !project.notas_leidas;

    return (
        <div 
            onClick={onSelect}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm relative
                ${isActive ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-border bg-card hover:border-accent/50 hover:shadow-md'}`}
        >
            {/* Punto Rojo de Notificación */}
            {showNotificationDot && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                </span>
            )}

            <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-primary text-sm flex items-start gap-1.5 line-clamp-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    {project.plantas?.nombre_planta || 'Planta no asignada'}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ml-2 ${statusColors}`}>
                    {timeStatus}
                </span>
            </div>
            
            <p className="text-xs text-muted-foreground font-medium mb-4 line-clamp-2">
                {project.servicios?.nombre_servicio}
            </p>

            <div className="flex items-center text-xs text-muted-foreground font-bold border-t border-border pt-3">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-accent" />
                Límite: {project.fecha_entrega_interna ? formatDate(project.fecha_entrega_interna) : 'Sin fecha'}
            </div>
        </div>
    );
};

export default ProjectCard;