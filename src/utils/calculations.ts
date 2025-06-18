import { Expense, Summary } from '../types';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export function calculateSummary(
  expenses: Expense[],
  view: 'individual' | 'couple',
  currentUser?: string
): Summary {
  const filteredExpenses = view === 'individual' 
    ? expenses.filter(e => e.person === currentUser || e.person === 'shared')
    : expenses;

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyExpenses = filteredExpenses.filter(e => 
    e.type === 'expense' && 
    isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
  );

  const monthlyIncome = filteredExpenses.filter(e => 
    e.type === 'income' && 
    isWithinInterval(new Date(e.date), { start: monthStart, end: monthEnd })
  );

  const totalExpenses = filteredExpenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalIncome = filteredExpenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const monthlyExpensesTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyIncomeTotal = monthlyIncome.reduce((sum, e) => sum + e.amount, 0);

  return {
    totalExpenses,
    totalIncome,
    balance: totalIncome - totalExpenses,
    monthlyExpenses: monthlyExpensesTotal,
    monthlyIncome: monthlyIncomeTotal,
  };
}

export function getCategoryExpenses(
  expenses: Expense[],
  categories: any[],
  view: 'individual' | 'couple',
  currentUser?: string
) {
  const filteredExpenses = view === 'individual' 
    ? expenses.filter(e => e.person === currentUser || e.person === 'shared')
    : expenses;

  const expensesByCategory = filteredExpenses
    .filter(e => e.type === 'expense')
    .reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

  return categories.map(category => ({
    name: category.name,
    value: expensesByCategory[category.id] || 0,
    color: category.color,
  })).filter(item => item.value > 0);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}