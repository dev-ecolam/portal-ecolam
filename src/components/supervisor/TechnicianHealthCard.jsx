import React, { } from 'react';

// =========================================================================
// TARJETA DE SALUD DEL TÉCNICO (Basada en Carga y Tiempos)
// =========================================================================
const TechnicianHealthCard = ({ techData }) => {
    const { nombre, proyectosActivos, proyectosEntregados, aTiempo, porVencer, atrasados } = techData;

    return (
        <div className="bg-card p-4 rounded-xl flex flex-col space-y-3 relative overflow-hidden">
            {atrasados > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-destructive"></div>}
            
            <h3 className="text-lg font-bold text-foreground truncate pr-4">{nombre}</h3>
            
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded p-2">
                    <p className="text-xl font-bold text-primary">{proyectosActivos}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Activos</p>
                </div>
                <div className="bg-muted rounded p-2">
                    <p className="text-xl font-bold text-amber-600">{porVencer}</p>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Por Vencer</p>
                </div>
                <div className="bg-destructive/10 rounded p-2">
                    <p className="text-xl font-bold text-destructive">{atrasados}</p>
                    <p className="text-[10px] uppercase text-destructive font-bold">Atrasados</p>
                </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-right pt-2 border-t border-border">
                {proyectosEntregados} proyectos entregados este año
            </p>
        </div>
    );
};

export default TechnicianHealthCard;