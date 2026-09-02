import React, { useState } from 'react';

// ==========================================
// BADGE DE ESTADO (Unificado para todo el ERP)
// ==========================================
export const StatusBadge = ({ status }) => {
    const statusStyles = {
        // Proyectos
        'Atrasado': 'bg-red-100 text-red-800 border border-red-200',
        'Por Vencer': 'bg-orange-100 text-orange-800 border border-orange-200',
        'A Tiempo': 'bg-green-100 text-green-800 border border-green-200',
        'En Espera de Proveedor': 'bg-purple-100 text-purple-800 border border-purple-200',
        'Sin Fecha': 'bg-gray-100 text-gray-600 border border-gray-200',
        'Activo': 'bg-blue-100 text-blue-800 border border-blue-200',
        'En Revisión Final': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        'Terminado Internamente': 'bg-teal-100 text-teal-800 border border-teal-200',
        'Pendiente de Factura': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'Facturado': 'bg-green-100 text-green-800 border border-green-200',
        'Completado': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        'Cotización': 'bg-gray-200 text-gray-800 border border-gray-300',
        
        // Empleados y Finanzas
        'Baja': 'bg-red-100 text-red-800 border border-red-200',
        'Suspendido': 'bg-orange-100 text-orange-800 border border-orange-200',
        'Pagada': 'bg-green-100 text-green-800 border border-green-200',
        'Vencida': 'bg-red-100 text-red-800 border border-red-200',
        'Prog. a Pago': 'bg-blue-100 text-blue-800 border border-blue-200',
        'Pend. de Autorización': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'Cancelada': 'bg-gray-100 text-gray-700 border border-gray-200',
    };
    
    // Fallback normalizado (ej: 'cotizacion' -> 'Cotización')
    const normalizedStatus = status?.charAt(0).toUpperCase() + status?.slice(1);
    const classes = statusStyles[normalizedStatus] || statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-200';

    return <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded-full shadow-sm ${classes}`}>{status}</span>;
};

// ==========================================
// MODAL DE CONFIRMACIÓN SIMPLE
// ==========================================
export const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", confirmColor = "bg-primary" }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-sm border border-border">
                <h3 className="text-lg font-black text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{message}</p>
                <div className="flex justify-end space-x-3">
                    <button onClick={onCancel} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg transition-colors">{cancelText}</button>
                    <button onClick={onConfirm} className={`${confirmColor} text-primary-foreground font-bold py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity`}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// MODAL DE ACCIÓN CON RAZÓN (Ej. Rechazos)
// ==========================================
export const ActionWithReasonModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirmar", cancelText = "Cancelar", confirmColor = "bg-destructive" }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100] p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-card p-6 rounded-2xl shadow-xl w-full max-w-md border border-border">
                <h3 className="text-lg font-black text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{message}</p>
                <textarea 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Escribe el motivo detallado aquí..." 
                    rows="3"
                    className="w-full p-3 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-accent resize-none"
                ></textarea>
                <div className="flex justify-end space-x-3 mt-6">
                    <button onClick={onCancel} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg transition-colors">{cancelText}</button>
                    <button 
                        onClick={() => onConfirm(reason)} 
                        disabled={!reason.trim()}
                        className={`${confirmColor} text-white font-bold py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

// ==========================================
// ALERTAS EN LÍNEA (Banners estáticos)
// ==========================================
export const Alert = ({ message, type = 'info', onClose }) => {
    if (!message) return null;

    // Diccionario de estilos e íconos según el tipo de alerta
    const typeConfig = {
        error: {
            classes: "bg-destructive/10 text-destructive border-destructive/20",
            icon: <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
        },
        success: {
            classes: "bg-green-50 text-green-800 border-green-200",
            icon: <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
        },
        warning: {
            classes: "bg-orange-50 text-orange-800 border-orange-200",
            icon: <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
        },
        info: {
            classes: "bg-blue-50 text-blue-800 border-blue-200",
            icon: <Info className="w-5 h-5 mr-3 flex-shrink-0" />
        }
    };

    const config = typeConfig[type] || typeConfig.info;

    return (
        <div className={`flex items-start p-4 mb-4 border rounded-xl relative animate-in fade-in duration-300 ${config.classes}`} role="alert">
            {config.icon}
            <div className="flex-grow font-medium text-sm pt-0.5 pr-6">
                {message}
            </div>
            
            {onClose && (
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 transition-all"
                    aria-label="Cerrar alerta"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};