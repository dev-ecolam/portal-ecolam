import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Users, CalendarDays, Clock, ShieldCheck } from 'lucide-react';
import { EmployeesPanel } from '../components/rh/EmployeesPanel';
import { AttendancePanel } from '../components/rh/AttendancePanel';
import { HolidaysPanel } from '../components/rh/HolidaysPanel';

const HRDashboard = () => {
    const [view, setView] = useState('empleados');

    return (
        <DashboardLayout>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary">Recursos Humanos</h1>
                    <p className="text-muted-foreground mt-1">Gestión de talento, vacaciones y control de asistencia (LFT).</p>
                </div>
            </div>

            {/* Pestañas de Navegación Modernas */}
            <div className="mb-6 border-b border-border overflow-x-auto">
                <nav className="flex space-x-8 min-w-max px-2" aria-label="Tabs">
                    {[
                        { id: 'empleados', label: 'Nómina y Vacaciones', icon: <Users className="w-4 h-4 mr-2"/> },
                        { id: 'checadas', label: 'Control de Asistencias (Checadas)', icon: <Clock className="w-4 h-4 mr-2"/> },
                        { id: 'festivos', label: 'Calendario y Festivos', icon: <CalendarDays className="w-4 h-4 mr-2"/> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setView(tab.id)}
                            className={`flex items-center py-4 px-1 border-b-2 font-bold text-sm transition-colors ${
                                view === tab.id ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Vistas Dinámicas */}
            <div className="animate-in fade-in duration-300">
                {view === 'empleados' && <EmployeesPanel />}
                {view === 'checadas' && <AttendancePanel />}
                {view === 'festivos' && <HolidaysPanel />}
            </div>
        </DashboardLayout>
    );
};

export default HRDashboard;