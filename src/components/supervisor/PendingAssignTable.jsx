import React from 'react';
import { formatDate } from '../../utils/helpers';
import { Clock } from 'lucide-react';

const PendingAssignTable = ({ projects, onAssign }) => {
    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm animate-in fade-in">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Fecha Alta</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">NPU / Estudio</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Planta</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Acción</th>
                    </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                    {projects.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-10 text-muted-foreground italic">No hay proyectos pendientes de asignar.</td></tr>
                    ) : (
                        projects.map(p => (
                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {formatDate(p.fecha_apertura)}
                                </td>
                                <td className="px-6 py-4">
                                    <p className="whitespace-nowrap text-sm font-bold text-primary">{p.npu}</p>
                                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{p.servicios?.nombre_servicio || '---'}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                    {p.plantas?.nombre_planta || '---'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onAssign(p)} 
                                        className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-primary-foreground font-bold px-4 py-2 rounded-lg shadow-sm transition-colors text-sm"
                                    >
                                        Asignar
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default PendingAssignTable;