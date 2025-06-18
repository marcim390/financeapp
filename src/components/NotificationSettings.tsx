import React, { useState } from 'react';
import { X, Bell, Mail, Monitor, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationSettingsProps {
  onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { notificationSettings, updateNotificationSettings } = useApp();
  const [formData, setFormData] = useState(notificationSettings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings(formData);
    
    // Request browser notification permission if enabled
    if (formData.browserNotifications && 'Notification' in window) {
      Notification.requestPermission();
    }
    
    onClose();
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('FinanceApp', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/vite.svg'
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurações de Notificação</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="text-blue-600" size={20} />
              <div>
                <p className="font-medium text-gray-900">Ativar Notificações</p>
                <p className="text-sm text-gray-600">Receba alertas sobre despesas próximas ao vencimento</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {formData.enabled && (
            <>
              {/* Days Before Due */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notificar com quantos dias de antecedência?
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.daysBeforeDue}
                  onChange={(e) => setFormData({ ...formData, daysBeforeDue: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Você será notificado quando uma despesa estiver próxima do vencimento
                </p>
              </div>

              {/* Browser Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Notificações do Navegador</p>
                    <p className="text-sm text-gray-600">Receba notificações push no seu navegador</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.browserNotifications}
                    onChange={(e) => setFormData({ ...formData, browserNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.browserNotifications && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    Para receber notificações do navegador, você precisa permitir o acesso.
                  </p>
                  <button
                    type="button"
                    onClick={requestNotificationPermission}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Permitir Notificações
                  </button>
                </div>
              )}

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Mail className="text-purple-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">Notificações por Email</p>
                    <p className="text-sm text-gray-600">Receba lembretes por email (em breve)</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer opacity-50">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
            </>
          )}

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
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}