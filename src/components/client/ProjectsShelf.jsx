import React, { } from 'react';

const ProjectsShelf = ({ projects, onOpenModal }) => {
    const coverTemplateUrl = "https://firebasestorage.googleapis.com/v0/b/portal-ecolam.firebasestorage.app/o/portada-portal.jpg?alt=media&token=4e059216-8863-48ca-ba08-47c4c0fe9bea";

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {projects.map(project => (
                <button key={project.id} className="group text-left focus:outline-none flex flex-col" onClick={() => onOpenModal(project.url_estudio_r2)}>
                    <div className="relative pt-[141%] bg-muted rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 overflow-hidden border border-border">
                        <img src={coverTemplateUrl} alt="Portada" className="absolute inset-0 w-full h-full object-cover"/>
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            {/* Obtenemos el nombre de la empresa a través del objeto clientes generado por el JOIN */}
                            <h4 className="font-bold text-sm md:text-base leading-tight drop-shadow-md">
                                {project.clientes?.nombre_empresa || "Proyecto"}
                            </h4>
                            <div className="w-8 h-0.5 bg-accent my-2"></div>
                            <p className="text-xs text-gray-200 line-clamp-2">{project.nombre_estudio}</p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default ProjectsShelf;