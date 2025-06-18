import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, Save, Palette } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';

interface CategoryManagerProps {
  onClose: () => void;
  category?: Category | null;
}

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#6b7280', '#374151', '#1f2937'
];

export function CategoryManager({ onClose, category }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [editingCategory, setEditingCategory] = useState<Category | null>(category || null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    color: colorOptions[0],
    icon: 'Tag',
  });

  React.useEffect(() => {
    setEditingCategory(category || null);
    if (category) {
      setFormData({
        name: category.name,
        color: category.color,
        icon: category.icon,
      });
      setShowForm(true);
    } else {
      setFormData({ name: '', color: colorOptions[0], icon: 'Tag' });
      setShowForm(true);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor, insira um nome para a categoria.');
      return;
    }

    const categoryData: Category = {
      id: editingCategory?.id || Date.now().toString(),
      name: formData.name.trim(),
      color: formData.color,
      icon: formData.icon,
    };

    if (editingCategory) {
      updateCategory(categoryData);
    } else {
      addCategory(categoryData);
    }

    setEditingCategory(null);
    setShowForm(false);
    setFormData({ name: '', color: colorOptions[0], icon: 'Tag' });
    onClose(); // Fecha o modal principal após criar/editar
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategory(id);
    }
  };

  const cancelForm = () => {
    setEditingCategory(null);
    setShowForm(false);
    setFormData({ name: '', color: colorOptions[0], icon: 'Tag' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Categorias</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Add New Category Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors mb-6"
            >
              <Plus size={20} />
              <span>Nova Categoria</span>
            </button>
          )}

          {/* Category Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Alimentação"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor
                  </label>
                  <div className="grid grid-cols-10 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save size={16} />
                    <span>{editingCategory ? 'Atualizar' : 'Criar'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}