export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  person: 'person1' | 'person2' | 'shared';
  type: 'expense' | 'income';
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Summary {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  monthlyExpenses: number;
  monthlyIncome: number;
}

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  person: 'person1' | 'person2' | 'shared';
  type: 'expense' | 'income';
  frequency: 'monthly' | 'weekly' | 'yearly';
  dueDay: number; // Day of month (1-31) or day of week (1-7)
  isActive: boolean;
  nextDueDate: string;
  lastPaidDate?: string;
  notificationDays: number; // Days before due date to notify
}

export interface NotificationSettings {
  enabled: boolean;
  daysBeforeDue: number;
  emailNotifications: boolean;
  browserNotifications: boolean;
}