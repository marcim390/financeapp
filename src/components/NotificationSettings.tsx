import React, { useState, useEffect } from 'react';
import { X, Bell, AlertCircle, Check, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  target_users: 'all' | 'free' | 'premium';
  is_active: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationSettingsProps {
  onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      // Buscar notificações relevantes para o usuário
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .in('target_users', ['all', profile.plan_type])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Aqui você pode implementar uma tabela de leitura de notificações
      // Por enquanto, vamos apenas remover da lista local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (targetUsers: string) => {
    switch (targetUsers) {
      case 'premium':
        return <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <Bell className="text-yellow-600" size={16} />
        </div>;
      case 'free':
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="text-blue-600" size={16} />
        </div>;
      default:
        return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
          <Bell className="text-gray-600" size={16} />
        </div>;
    }
  };

  const getTargetLabel = (targetUsers: string) => {
    switch (targetUsers) {
      case 'premium': return 'Premium';
      case 'free': return 'Gratuito';
      default: return 'Geral';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="text-blue-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto mb-4 text-gray-300" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
              <p className="text-gray-600">Você está em dia! Não há notificações no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">
                  {notifications.length} notificação{notifications.length !== 1 ? 'ões' : ''}
                </h3>
                <button
                  onClick={() => setNotifications([])}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Marcar todas como lidas
                </button>
              </div>

              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.target_users)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            notification.target_users === 'premium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : notification.target_users === 'free'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getTargetLabel(notification.target_users)}
                          </span>
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Marcar como lida"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-gray-500">
                        {format(new Date(notification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">💡 Dica:</p>
                <p>As configurações de notificações podem ser ajustadas na seção "Configurações do Perfil".</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}