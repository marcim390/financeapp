import React from 'react';
import { useApp } from '../context/AppContext';
import { Edit, Trash2, Plus } from 'lucide-react';
import { Category } from '../types';

interface CategoryListPageProps {
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryListPage({ onAddCategory, onEditCategory, onDeleteCategory }: CategoryListPageProps) {
  const { categories } = useApp();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Categorias</h2>
        <button
          onClick={onAddCategory}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" /> Nova Categoria
        </button>
      </div>
      <ul className="divide-y divide-gray-200">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <span className="w-4 h-4 rounded-full" style={{ background: cat.color }} />
              <span className="font-medium">{cat.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => onEditCategory(cat)} className="p-2 text-gray-500 hover:text-blue-600">
                <Edit size={18} />
              </button>
              <button onClick={() => onDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-red-600">
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
