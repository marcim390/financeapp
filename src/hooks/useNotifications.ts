import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { differenceInDays, isBefore } from 'date-fns';

export function useNotifications() {
  const { recurringExpenses, notificationSettings, currentView, currentUser } = useApp();

  useEffect(() => {
    if (!notificationSettings.enabled || !notificationSettings.browserNotifications) {
      return;
    }

    // Check for notifications every hour
    const checkNotifications = () => {
      const filteredExpenses = currentView === 'individual' 
        ? recurringExpenses.filter(e => e.person === currentUser || e.person === 'shared')
        : recurringExpenses;

      const now = new Date();

      filteredExpenses.forEach(expense => {
        if (!expense.isActive) return;

        const dueDate = new Date(expense.nextDueDate);
        const daysUntilDue = differenceInDays(dueDate, now);
        const isOverdue = isBefore(dueDate, now);

        // Show notification for overdue expenses
        if (isOverdue && 'Notification' in window && Notification.permission === 'granted') {
          const daysOverdue = Math.abs(daysUntilDue);
          new Notification('💰 FinanceApp - Despesa em Atraso!', {
            body: `${expense.description} está ${daysOverdue} dia(s) em atraso. Valor: R$ ${expense.amount.toFixed(2)}`,
            icon: '/vite.svg',
            tag: `overdue-${expense.id}`,
          });
        }

        // Show notification for upcoming expenses
        if (daysUntilDue <= notificationSettings.daysBeforeDue && daysUntilDue > 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💰 FinanceApp - Despesa Próxima ao Vencimento', {
              body: `${expense.description} vence em ${daysUntilDue} dia(s). Valor: R$ ${expense.amount.toFixed(2)}`,
              icon: '/vite.svg',
              tag: `upcoming-${expense.id}`,
            });
          }
        }
      });
    };

    // Check immediately
    checkNotifications();

    // Set up interval to check every hour
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [recurringExpenses, notificationSettings, currentView, currentUser]);
}