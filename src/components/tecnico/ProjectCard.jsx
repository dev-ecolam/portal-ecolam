import React, { } from 'react';
import { Clock } from 'lucide-react';

// ==========================================
// TARJETA DE PROYECTO KANBAN
// ==========================================
const ProjectCard = ({ project, isActive, onSelect }) => {
    // Calculamos si está atrasado o por vencer
    const today = new Date();
    today.setHours(0,0,0,0);
    const deadline = project.fecha_entrega_interna ? new Date(project.fecha_entrega_interna) : null;
    let daysLeft = null;
    
    if (deadline) {
        deadline.setHours(0,0,0,0);
        daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    }

    return (
        <div className={`bg-card p-5 rounded-xl border transition-all ${isActive ? 'border-accent ring-2 ring-accent shadow-md' : 'border-border shadow-sm hover:border-accent/50'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded">{project.npu}</span>
                {daysLeft !== null && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded ${daysLeft < 0 ? 'bg-destructive/10 text-destructive' : daysLeft <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        <Clock className="w-3 h-3 mr-1" />
                        {daysLeft < 0 ? `Atrasado ${Math.abs(daysLeft)}d` : `${daysLeft}d restantes`}
                    </span>
                )}
            </div>
            
            <h3 className="font-bold text-foreground text-lg leading-tight mb-1">{project.servicios?.nombre_servicio}</h3>
            <p className="text-sm text-muted-foreground mb-4">{project.clientes?.nombre_empresa}</p>
            
            <button
                onClick={onSelect}
                disabled={isActive}
                className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${isActive ? 'bg-accent/20 text-accent cursor-default' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            >
                {isActive ? 'Activo en este momento' : 'Trabajar en este'}
            </button>
        </div>
    );
};

export default ProjectCard;