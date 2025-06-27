import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { differenceInDays, isBefore } from 'date-fns';

export function useNotifications() {
  const { recurringExpenses, notificationSettings, currentView, currentUser } = useApp();
  const { profile } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  // Calculate recurring expense notifications
  const getRecurringNotificationCount = () => {
    if (!notificationSettings.enabled || !profile) return 0;

    const filteredExpenses = currentView === 'individual' 
      ? recurringExpenses.filter(e => e.person === currentUser || e.person === 'shared')
      : recurringExpenses;

    const now = new Date();
    let count = 0;

    filteredExpenses.forEach(expense => {
      if (!expense.isActive) return;

      const dueDate = new Date(expense.nextDueDate);
      const daysUntilDue = differenceInDays(dueDate, now);
      const isOverdue = isBefore(dueDate, now);

      // Count overdue expenses
      if (isOverdue) {
        count++;
      }

      // Count upcoming expenses
      if (daysUntilDue <= notificationSettings.daysBeforeDue && daysUntilDue > 0) {
        count++;
      }
    });

    return count;
  };

  // Check for admin notifications
  const checkAdminNotifications = async () => {
    if (!profile) return 0;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('is_active', true)
        .in('target_users', ['all', profile.plan_type]);

      if (error) {
        console.error('Error fetching notification count:', error);
        return 0;
      }

      // Get shown notifications from localStorage
      const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
      const unreadCount = data ? data.filter(n => !shownNotifications.includes(n.id)).length : 0;
      
      return unreadCount;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  };

  // Update notification count
  useEffect(() => {
    const updateNotificationCount = async () => {
      const recurringCount = getRecurringNotificationCount();
      const adminCount = await checkAdminNotifications();
      setNotificationCount(recurringCount + adminCount);
    };

    updateNotificationCount();

    // Update every minute
    const interval = setInterval(updateNotificationCount, 60 * 1000);
    return () => clearInterval(interval);
  }, [recurringExpenses, notificationSettings, currentView, currentUser, profile]);

  // Browser notifications
  useEffect(() => {
    if (!notificationSettings.enabled || !notificationSettings.browserNotifications || !profile) {
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
            icon: '/favicon.ico',
            tag: `overdue-${expense.id}`,
          });
        }

        // Show notification for upcoming expenses
        if (daysUntilDue <= notificationSettings.daysBeforeDue && daysUntilDue > 0) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💰 FinanceApp - Despesa Próxima ao Vencimento', {
              body: `${expense.description} vence em ${daysUntilDue} dia(s). Valor: R$ ${expense.amount.toFixed(2)}`,
              icon: '/favicon.ico',
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
  }, [recurringExpenses, notificationSettings, currentView, currentUser, profile]);

  // Check for admin notifications
  useEffect(() => {
    if (!profile) return;

    const checkAdminNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('is_active', true)
          .in('target_users', ['all', profile.plan_type])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching admin notifications:', error);
          return;
        }

        if (data && data.length > 0) {
          const notification = data[0];
          
          // Check if we've already shown this notification
          const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
          
          if (!shownNotifications.includes(notification.id)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`💰 ${notification.title}`, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: `admin-${notification.id}`,
              });
            }
            
            // Mark as shown
            shownNotifications.push(notification.id);
            localStorage.setItem('shownNotifications', JSON.stringify(shownNotifications));
          }
        }
      } catch (error) {
        console.error('Error checking admin notifications:', error);
      }
    };

    // Check admin notifications on load and every 30 minutes
    checkAdminNotifications();
    const adminInterval = setInterval(checkAdminNotifications, 30 * 60 * 1000);

    return () => clearInterval(adminInterval);
  }, [profile]);

  return { notificationCount };
}