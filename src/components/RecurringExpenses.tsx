import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Plus, Edit, Trash2, Play, Pause, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RecurringExpense } from '../types';
import { formatCurrency } from '../utils/calculations';
import { format, addDays, addMonths, addWeeks, addYears, differenceInDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function RecurringExpenses() {
  const { 
    recurringExpenses, 
    categories, 
    users, 
    currentView, 
    currentUser,
    addExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    notificationSettings
  } = useApp();
  
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | undefined>();

  // Filter recurring expenses based on current view
  const filteredRecurringExpenses = currentView === 'individual' 
    ? recurringExpenses.filter(e => e.person === currentUser || e.person === 'shared')
    : recurringExpenses;

  // Get upcoming due expenses
  const upcomingExpenses = filteredRecurringExpenses.filter(expense => {
    if (!expense.isActive) return false;
    const daysUntilDue = differenceInDays(new Date(expense.nextDueDate), new Date());
    return daysUntilDue <= notificationSettings.daysBeforeDue && daysUntilDue >= 0;
  });

  // Get overdue expenses
  const overdueExpenses = filteredRecurringExpenses.filter(expense => {
    if (!expense.isActive) return false;
    return isBefore(new Date(expense.nextDueDate), new Date());
  });

  const handleEdit = (expense: RecurringExpense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa recorrente?')) {
      deleteRecurringExpense(id);
    }
  };

  const handleToggleActive = (expense: RecurringExpense) => {
    updateRecurringExpense({ ...expense, isActive: !expense.isActive });
  };

  const handleMarkAsPaid = (expense: RecurringExpense) => {
    // Add the expense to regular expenses
    const newExpense = {
      id: Date.now().toString(),
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: new Date().toISOString().split('T')[0],
      person: expense.person,
      type: expense.type,
    };
    
    addExpense(newExpense);

    // Update next due date
    let nextDueDate = new Date(expense.nextDueDate);
    switch (expense.frequency) {
      case 'weekly':
        nextDueDate = addWeeks(nextDueDate, 1);
        break;
      case 'monthly':
        nextDueDate = addMonths(nextDueDate, 1);
        break;
      case 'yearly':
        nextDueDate = addYears(nextDueDate, 1);
        break;
    }

    updateRecurringExpense({
      ...expense,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      lastPaidDate: new Date().toISOString().split('T')[0],
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const getUserInfo = (userId: string) => {
    if (userId === 'shared') return { name: 'Compartilhado', avatar: '👥' };
    return users.find(u => u.id === userId);
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Despesas Recorrentes</h2>
          <p className="text-gray-600">Gerencie suas despesas fixas e nunca mais esqueça um pagamento</p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(undefined);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nova Despesa Recorrente</span>
        </button>
      </div>

      {/* Alerts */}
      {(overdueExpenses.length > 0 || upcomingExpenses.length > 0) && (
        <div className="space-y-4">
          {/* Overdue Expenses */}
          {overdueExpenses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="text-red-600" size={20} />
                <h3 className="font-semibold text-red-800">Despesas em Atraso ({overdueExpenses.length})</h3>
              </div>
              <div className="space-y-2">
                {overdueExpenses.map(expense => {
                  const category = getCategoryInfo(expense.category);
                  const user = getUserInfo(expense.person);
                  const daysOverdue = Math.abs(getDaysUntilDue(expense.nextDueDate));
                  
                  return (
                    <div key={expense.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category?.color || '#6b7280' }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(expense.amount)} • {user?.avatar} {user?.name} • {daysOverdue} dias em atraso
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkAsPaid(expense)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Marcar como Pago
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Expenses */}
          {upcomingExpenses.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Bell className="text-yellow-600" size={20} />
                <h3 className="font-semibold text-yellow-800">Próximas a Vencer ({upcomingExpenses.length})</h3>
              </div>
              <div className="space-y-2">
                {upcomingExpenses.map(expense => {
                  const category = getCategoryInfo(expense.category);
                  const user = getUserInfo(expense.person);
                  const daysUntilDue = getDaysUntilDue(expense.nextDueDate);
                  
                  return (
                    <div key={expense.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category?.color || '#6b7280' }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(expense.amount)} • {user?.avatar} {user?.name} • Vence em {daysUntilDue} dias
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleMarkAsPaid(expense)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Marcar como Pago
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recurring Expenses List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Todas as Despesas Recorrentes ({filteredRecurringExpenses.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredRecurringExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Nenhuma despesa recorrente cadastrada</p>
              <p className="text-sm mt-2">Adicione suas despesas fixas para nunca mais esquecer um pagamento</p>
            </div>
          ) : (
            filteredRecurringExpenses.map((expense) => {
              const category = getCategoryInfo(expense.category);
              const user = getUserInfo(expense.person);
              const daysUntilDue = getDaysUntilDue(expense.nextDueDate);
              const isOverdue = daysUntilDue < 0;
              const isUpcoming = daysUntilDue <= notificationSettings.daysBeforeDue && daysUntilDue >= 0;
              
              return (
                <div key={expense.id} className={`p-6 hover:bg-gray-50 transition-colors ${
                  !expense.isActive ? 'opacity-60' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: category?.color || '#6b7280' }}
                      >
                        {category?.name.charAt(0) || '?'}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{expense.description}</h4>
                          {!expense.isActive && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                              Pausado
                            </span>
                          )}
                          {isOverdue && expense.isActive && (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                              Em Atraso
                            </span>
                          )}
                          {isUpcoming && expense.isActive && (
                            <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs">
                              Próximo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{getFrequencyLabel(expense.frequency)}</span>
                          <span>•</span>
                          <span>{category?.name || 'Categoria não encontrada'}</span>
                          {currentView === 'couple' && (
                            <>
                              <span>•</span>
                              <span>{user?.avatar} {user?.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>Próximo: {format(new Date(expense.nextDueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
                        <p className="text-xs text-gray-500 capitalize">
                          {expense.type === 'income' ? 'Receita' : 'Despesa'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(expense)}
                          className={`p-2 rounded-lg transition-colors ${
                            expense.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={expense.isActive ? 'Pausar' : 'Ativar'}
                        >
                          {expense.isActive ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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

      {/* Form Modal */}
      {showForm && (
        <RecurringExpenseForm
          expense={editingExpense}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(undefined);
          }}
        />
      )}
    </div>
  );
}

// Recurring Expense Form Component
function RecurringExpenseForm({ 
  expense, 
  onClose 
}: { 
  expense?: RecurringExpense; 
  onClose: () => void; 
}) {
  const { 
    addRecurringExpense, 
    updateRecurringExpense, 
    categories, 
    users, 
    currentView, 
    currentUser 
  } = useApp();
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    person: currentView === 'individual' ? currentUser : 'person1',
    type: 'expense' as 'expense' | 'income',
    frequency: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    dueDay: 1,
    notificationDays: 3,
    isActive: true,
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        person: expense.person,
        type: expense.type,
        frequency: expense.frequency,
        dueDay: expense.dueDay,
        notificationDays: expense.notificationDays,
        isActive: expense.isActive,
      });
    }
  }, [expense]);

  const calculateNextDueDate = () => {
    const today = new Date();
    let nextDue = new Date();

    switch (formData.frequency) {
      case 'weekly':
        // For weekly, dueDay is day of week (1=Monday, 7=Sunday)
        const daysUntilDue = (parseInt(formData.dueDay.toString()) - today.getDay() + 7) % 7;
        nextDue = addDays(today, daysUntilDue || 7);
        break;
      case 'monthly':
        nextDue.setDate(formData.dueDay);
        if (nextDue <= today) {
          nextDue = addMonths(nextDue, 1);
        }
        break;
      case 'yearly':
        nextDue.setMonth(0, formData.dueDay);
        if (nextDue <= today) {
          nextDue = addYears(nextDue, 1);
        }
        break;
    }

    return nextDue.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const recurringExpenseData: RecurringExpense = {
      id: expense?.id || Date.now().toString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      person: formData.person as 'person1' | 'person2' | 'shared',
      type: formData.type,
      frequency: formData.frequency,
      dueDay: formData.dueDay,
      isActive: formData.isActive,
      nextDueDate: expense?.nextDueDate || calculateNextDueDate(),
      lastPaidDate: expense?.lastPaidDate,
      notificationDays: formData.notificationDays,
    };

    if (expense) {
      updateRecurringExpense(recurringExpenseData);
    } else {
      addRecurringExpense(recurringExpenseData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {expense ? 'Editar Despesa Recorrente' : 'Nova Despesa Recorrente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  formData.type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Aluguel, Internet, Academia"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0,00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.frequency === 'weekly' ? 'Dia da Semana *' : 
               formData.frequency === 'monthly' ? 'Dia do Mês *' : 'Dia do Ano *'}
            </label>
            {formData.frequency === 'weekly' ? (
              <select
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value={1}>Segunda-feira</option>
                <option value={2}>Terça-feira</option>
                <option value={3}>Quarta-feira</option>
                <option value={4}>Quinta-feira</option>
                <option value={5}>Sexta-feira</option>
                <option value={6}>Sábado</option>
                <option value={0}>Domingo</option>
              </select>
            ) : (
              <input
                type="number"
                min={1}
                max={formData.frequency === 'monthly' ? 31 : 365}
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
          </div>

          {/* Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pessoa *
            </label>
            <select
              value={formData.person}
              onChange={(e) => setFormData({ ...formData, person: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={currentView === 'individual'}
            >
              <option value="person1">{users[0]?.avatar} {users[0]?.name}</option>
              <option value="person2">{users[1]?.avatar} {users[1]?.name}</option>
              <option value="shared">👥 Compartilhado</option>
            </select>
          </div>

          {/* Notification Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notificar com quantos dias de antecedência?
            </label>
            <input
              type="number"
              min={0}
              max={30}
              value={formData.notificationDays}
              onChange={(e) => setFormData({ ...formData, notificationDays: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {expense ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}