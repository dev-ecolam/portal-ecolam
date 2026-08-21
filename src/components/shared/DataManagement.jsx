import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';

const DataManagement = ({ collectionName, title, fields, placeholderTexts }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({});
    
    const fetchData = async () => {
        const { data } = await supabase.from(collectionName).select('*').eq('activo', true);
        setItems(data || []);
    };
    
    useEffect(() => { fetchData(); }, [collectionName]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await supabase.from(collectionName).insert([newItem]);
        setNewItem({});
        fetchData();
    };

    const handleDesactivar = async (itemId) => {
        if (!window.confirm(`¿Seguro que deseas dar de baja este ${title.slice(0, -1)}?`)) return;
        try {
            await supabase.from(collectionName)
                .update({ activo: false, fecha_baja: new Date().toISOString() })
                .eq('id', itemId);
            fetchData();
        } catch (error) {
            console.error("Error al dar de baja:", error);
        }
    };

    return (
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
            <h3 className="text-xl font-bold mb-4">Añadir {title}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {fields.map((field, i) => (
                    <input key={field} type="text" placeholder={placeholderTexts[i]} className="w-full p-2 border rounded" 
                        value={newItem[field] || ''} onChange={e => setNewItem({...newItem, [field]: e.target.value})} required/>
                ))}
                <button type="submit" className="w-full bg-accent text-primary-foreground py-2 rounded">Añadir</button>
            </form>
            <div className="mt-6 border-t pt-4 max-h-64 overflow-y-auto pr-2">
                <h4 className="font-semibold mb-2">Activos:</h4>
                {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b text-sm">
                        <span>{item[fields[0]]}</span>
                        <button 
                            onClick={() => handleDesactivar(item.id)}
                            className="text-xs text-destructive hover:underline"
                        >
                            Dar de baja
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};