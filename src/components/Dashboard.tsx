import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { calculateSummary, getCategoryExpenses, formatCurrency } from '../utils/calculations';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Dashboard() {
  const { expenses, categories, currentView, currentUser } = useApp();
  
  const summary = calculateSummary(expenses, currentView, currentUser);
  const categoryData = getCategoryExpenses(expenses, categories, currentView, currentUser);

  // Monthly trend data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    
    const filteredExpenses = currentView === 'individual' 
      ? expenses.filter(e => e.person === currentUser || e.person === 'shared')
      : expenses;

    const monthExpenses = filteredExpenses
      .filter(e => e.type === 'expense' && new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const monthIncome = filteredExpenses
      .filter(e => e.type === 'income' && new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month: format(date, 'MMM', { locale: ptBR }),
      expenses: monthExpenses,
      income: monthIncome,
    };
  });

  const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(value)}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Total"
          value={summary.balance}
          icon={DollarSign}
          color={summary.balance >= 0 ? 'bg-green-500' : 'bg-red-500'}
        />
        <StatCard
          title="Receitas do Mês"
          value={summary.monthlyIncome}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          title="Gastos do Mês"
          value={summary.monthlyExpenses}
          icon={TrendingDown}
          color="bg-red-500"
        />
        <StatCard
          title="Total de Gastos"
          value={summary.totalExpenses}
          icon={Calendar}
          color="bg-blue-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoria</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-300 text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Mensal</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Bar dataKey="income" fill="#10b981" name="Receitas" />
              <Bar dataKey="expenses" fill="#ef4444" name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Atividade</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{expenses.length}</p>
            <p className="text-sm text-gray-600">Total de Transações</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {expenses.filter(e => e.type === 'income').length}
            </p>
            <p className="text-sm text-gray-600">Receitas</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">
              {expenses.filter(e => e.type === 'expense').length}
            </p>
            <p className="text-sm text-gray-600">Despesas</p>
          </div>
        </div>
      </div>
    </div>
  );
}