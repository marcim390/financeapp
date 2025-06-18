import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Filter, Search, Calendar, Tag, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/calculations';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExpenseListProps {
  onEditExpense: (expense: any) => void;
}

export function ExpenseList({ onEditExpense }: ExpenseListProps) {
  const { expenses, categories, users, deleteExpense, currentView, currentUser } = useApp();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    person: '',
    type: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const filteredExpenses = useMemo(() => {
    let filtered = currentView === 'individual' 
      ? expenses.filter(e => e.person === currentUser || e.person === 'shared')
      : expenses;

    if (filters.search) {
      filtered = filtered.filter(e => 
        e.description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.category) {
      filtered = filtered.filter(e => e.category === filters.category);
    }

    if (filters.person && currentView === 'couple') {
      filtered = filtered.filter(e => e.person === filters.person);
    }

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }

    if (filters.startDate) {
      filtered = filtered.filter(e => new Date(e.date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(e => new Date(e.date) <= new Date(filters.endDate));
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filters, currentView, currentUser]);

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteExpense(id);
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const getUserInfo = (userId: string) => {
    if (userId === 'shared') return { name: 'Compartilhado', avatar: '👥' };
    return users.find(u => u.id === userId);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter size={20} />
            <span>Filtros</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>

            {currentView === 'couple' && (
              <select
                value={filters.person}
                onChange={(e) => setFilters({ ...filters, person: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as pessoas</option>
                <option value="person1">{users[0]?.avatar} {users[0]?.name}</option>
                <option value="person2">{users[1]?.avatar} {users[1]?.name}</option>
                <option value="shared">👥 Compartilhado</option>
              </select>
            )}

            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>

            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Expense List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Transações ({filteredExpenses.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            filteredExpenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              const user = getUserInfo(expense.person);
              
              return (
                <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: category?.color || '#6b7280' }}
                      >
                        {category?.name.charAt(0) || '?'}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900">{expense.description}</h4>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Tag size={14} />
                            <span>{category?.name || 'Categoria não encontrada'}</span>
                          </div>
                          {currentView === 'couple' && (
                            <div className="flex items-center space-x-1">
                              <User size={14} />
                              <span>{user?.avatar} {user?.name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          expense.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {expense.type === 'income' ? '+' : '-'}{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{expense.type === 'income' ? 'Receita' : 'Despesa'}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditExpense(expense)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}