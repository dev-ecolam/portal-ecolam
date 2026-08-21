import React, { } from 'react';

// ==============================================================================
// VISOR DE REVISTA 3D (dFlip) VÍA IFRAME LOCAL
// ==============================================================================
const HeyzineViewerModal = ({ url, onClose }) => {
    // Codificamos la URL para que no se rompa si tiene espacios o caracteres raros
    const visorUrl = `/visor.html?pdf=${encodeURIComponent(url)}`;

    return (
        <div className="fixed inset-0 bg-primary/90 backdrop-blur-sm flex justify-center items-center z-[100] p-2 md:p-6">
            <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full h-full flex flex-col overflow-hidden border border-zinc-700">
                
                {/* Cabecera del Visor */}
                <div className="flex justify-between items-center p-3 md:p-4 bg-zinc-950 border-b border-zinc-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Documento Interactivo
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-destructive hover:text-destructive-foreground transition-colors text-white font-bold"
                    >
                        &times;
                    </button>
                </div>

                {/* Iframe que carga nuestro archivo dFlip local */}
                <div className="flex-grow bg-zinc-900 relative">
                    <iframe 
                        src={visorUrl} 
                        title="Visor 3D" 
                        className="absolute inset-0 w-full h-full" 
                        frameBorder="0" 
                        allowFullScreen>
                    </iframe>
                </div>

            </div>
        </div>
    );
};

export default HeyzineViewerModal;