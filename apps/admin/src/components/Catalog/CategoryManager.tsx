import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { Category } from '../../../../../packages/domain/catalog';

interface CategoryManagerProps {
  categories: Category[];
  onUpsert: (cat: Partial<Category>) => void;
  onClose: () => void;
}

export function CategoryManager({ categories, onUpsert, onClose }: CategoryManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category>>({
    name: '',
    parentId: '',
    order: 0
  });

  const rootCategories = categories.filter(c => !c.parentId);
  const getChildren = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setIsEditing(true);
  };

  const handleAdd = (parentId?: string) => {
    setEditingCat({ name: '', parentId: parentId || '', order: categories.length });
    setIsEditing(true);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[80vh] transition-colors">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className=" text-lg uppercase tracking-tighter">Category Architecture</h3>
        <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"><X size={20} /></button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {!isEditing ? (
          <div className="space-y-2">
            {rootCategories.map(cat => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group">
                  <GripVertical size={14} className="text-gray-300 dark:text-gray-600 cursor-grab" />
                  <span className="text-sm  flex-1">{cat.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button onClick={() => handleAdd(cat.id)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"><Plus size={14} /></button>
                    <button onClick={() => handleEdit(cat)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"><Edit2 size={14} /></button>
                  </div>
                </div>
                {/* Children */}
                <div className="ml-6 border-l border-gray-100 dark:border-gray-800 pl-2 space-y-1">
                  {getChildren(cat.id).map(child => (
                    <div key={child.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded group">
                      <span className="text-xs  flex-1 text-gray-600 dark:text-gray-300">{child.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button onClick={() => handleEdit(child)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white"><Edit2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button 
              onClick={() => handleAdd()}
              className="w-full py-2 mt-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded text-xs  text-gray-400 dark:text-gray-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
            >
              + NEW ROOT CATEGORY
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Category Name</label>
              <input 
                type="text" 
                value={editingCat.name} 
                onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none "
              />
            </div>
            <div>
              <label className="block text-[10px]  text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Parent Category</label>
              <select 
                value={editingCat.parentId || ''} 
                onChange={e => setEditingCat({...editingCat, parentId: e.target.value})}
                className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2 text-sm focus:border-black dark:focus:border-white outline-none"
              >
                <option value="">(Root)</option>
                {categories.filter(c => c.id !== editingCat.id).map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded  text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800">Back</button>
              <button 
                onClick={() => {
                  onUpsert(editingCat);
                  setIsEditing(false);
                }} 
                className="flex-1 px-4 py-2 bg-black text-white rounded  text-xs uppercase tracking-widest hover:bg-gray-800 shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
