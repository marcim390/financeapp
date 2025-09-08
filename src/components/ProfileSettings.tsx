import React, { useState, useEffect } from 'react';
import { X, Save, User, Phone, MapPin, Mail, Users, UserPlus, UserMinus, AlertCircle, Bell, Monitor, Calendar, Crown, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProfileSettingsProps {
  onClose: () => void;
}

interface Invitation {
  id: string;
  sender_id: string;
  recipient_email: string;
  status: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string | null;
  sender: {
    full_name: string;
    email: string;
  };
}

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { profile, couple, updateProfile, sendCoupleInvitation, removeCoupleRelationship, acceptCoupleInvitation } = useAuth();
  const { notificationSettings, updateNotificationSettings } = useApp();
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'relationship'>('profile');
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [acceptedInvitations, setAcceptedInvitations] = useState<Invitation[]>([]);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false)
  const [formData, setFormData] = useState({ 
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    gender: profile?.gender || '',
  });
  const [notificationFormData, setNotificationFormData] = useState(notificationSettings);


  useEffect(() => {
    if (profile) {
      fetchAllInvitations()
    }
  }, [profile]);

  // Busca convites recebidos (pendentes e aceitos) e enviados
  const fetchAllInvitations = async () => {
    if (!profile) return;
    try {
      // Convites recebidos (pendentes) 
      const { data: pending, error: errorPending } = await supabase
        .from('invitations')
        .select(`
          id,
          sender_id,
          recipient_email,
          status,
          expires_at,
          created_at,
          accepted_at,
          sender:sender_id(full_name, email)
        `)
        .eq('recipient_email', profile.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      setPendingInvitations(pending || [])
      if (errorPending) console.error('Error fetching pending invitations:', errorPending);

      // Convites recebidos (aceitos)
      const { data: accepted, error: errorAccepted } = await supabase
        .from('invitations')
        .select(`
          id,
          sender_id,
          recipient_email,
          status,
          expires_at,
          created_at,
          accepted_at,
          sender:sender_id(full_name, email)
        `)
        .eq('recipient_email', profile.email)
        .eq('status', 'accepted');
      setAcceptedInvitations(accepted || []);
      if (errorAccepted) console.error('Error fetching accepted invitations:', errorAccepted)

      // Convites enviados
      const { data: sent, error: errorSent } = await supabase
        .from('invitations')
        .select(`
          id,
          sender_id,
          recipient_email,
          status,
          expires_at,
          created_at,
          accepted_at
        `)
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });
      setSentInvitations(sent || []);
      if (errorSent) console.error('Error fetching sent invitations:', errorSent)
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await updateProfile(formData);

    if (error) {
      alert('Erro ao atualizar perfil. Tente novamente.');
    } else {
      alert('Perfil atualizado com sucesso!');
    }

    setLoading(false);
  };

  const handleNotificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationSettings(notificationFormData);
    
    // Request browser notification permission if enabled
    if (notificationFormData.browserNotifications && 'Notification' in window) {
      Notification.requestPermission();
    }
    
    alert('Configurações de notificação salvas com sucesso!');
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true)
    setLoading(true)
    setInviteSuccess(false);

    try {
      const { error } = await sendCoupleInvitation(inviteEmail);

      if (error) {
        alert(error.message || 'Erro ao enviar convite. Tente novamente.');
        setInviteLoading(false)
      } else {
        setInviteSuccess(true);
        setInviteEmail('');
        setShowInviteForm(false);
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setInviteSuccess(false);
          setInviteLoading(false)
        }, 3000);
        
        // Refresh invitations list
        await fetchAllInvitations()
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('Erro inesperado ao enviar convite. Tente novamente.');
      setInviteLoading(false)
    } finally {
      setLoading(false)
    } }

  const handleAcceptInvitation = async (invitationId: string) => {
    setLoading(true);
    // Atualiza status para 'accepted' e registra accepted_at
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitationId);

    if (error) {
      alert('Erro ao aceitar convite. Tente novamente.');
    } else {
      alert('Convite aceito com sucesso!')
      await fetchAllInvitations()
    }

    setLoading(false)
    setLoading(false);
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) {
        alert('Erro ao rejeitar convite.');
      } else {
        alert('Convite rejeitado.');
        fetchPendingInvitations();
      } 
    } catch (error) {
      alert('Erro ao rejeitar convite.');
    }
  };

  const handleCancelInvitation = async (invitationId: string, recipientEmail: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este convite?')) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId)
        .eq('sender_id', profile?.id)

      if (error) {
        alert('Erro ao cancelar convite.')
      } else {
        alert('Convite cancelado com sucesso.')
        await fetchAllInvitations()
      }
    } catch (error) {
    } catch (error) {
      alert('Erro ao rejeitar convite.');
    }
  };

  const handleRemoveCouple = async () => {
    if (!window.confirm('Tem certeza que deseja desfazer a relação com seu parceiro(a)?')) {
      setLoading(false)
      return;
    }

    setLoading(true);
    const { error } = await removeCoupleRelationship();

    if (error) {
      alert('Erro ao remover relação. Tente novamente.');
    } else {
      alert('Relação removida com sucesso!');
      await fetchAllInvitations()
    }

    setLoading(false);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('FinanceApp', {
          body: 'Notificações ativadas com sucesso!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const getGenderEmoji = (gender: string | null) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return 'Não definido';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurações</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {inviteSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 m-6">
            <div className="flex items-center">
              <CheckCircle className="text-green-400 mr-3" size={20} />
              <div>
                <p className="text-green-800 font-medium">Convite enviado com sucesso!</p>
                <p className="text-green-700 text-sm">O usuário foi criado automaticamente e receberá um email para definir a senha.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <User size={16} />
              <span>Perfil</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Bell size={16} />
              <span>Notificações</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('relationship')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'relationship'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Users size={16} />
              <span>Relacionamento</span>
            </div>
          </button>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Informações Pessoais</h3>
                
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                </div>

                {/* Email (readonly) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={profile?.email || ''}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      disabled
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seu endereço completo"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sexo
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'male' })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.gender === 'male'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      👨 Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'female' })}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        formData.gender === 'female'
                          ? 'border-pink-500 bg-pink-50 text-pink-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      👩 Feminino
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} />
                  <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
              </form>

              {/* Subscription Info */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
                  <Crown className={profile?.plan_type === 'premium' ? 'text-yellow-500' : 'text-gray-400'} size={20} />
                  <span>Informações da Assinatura</span>
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Plano Atual</p>
                      <p className={`text-lg font-semibold ${profile?.plan_type === 'premium' ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {profile?.plan_type === 'premium' ? 'Premium' : 'Gratuito'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Status</p>
                      <p className={`text-lg font-semibold ${profile?.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                        {profile?.subscription_status === 'active' ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    {profile?.plan_type === 'premium' && profile?.subscription_expires_at && (
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                          <Calendar size={16} />
                          <span>Vencimento da Assinatura</span>
                        </p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatExpirationDate(profile.subscription_expires_at)}
                        </p>
                      </div>
                    )}
                    {profile?.plan_type === 'free' && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600 mb-2">
                          Você está usando o plano gratuito com <strong>{profile.monthly_transactions_used}/5</strong> transações este mês.
                        </p>
                        <p className="text-xs text-gray-500">
                          Upgrade para Premium e tenha transações ilimitadas!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationSubmit} className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Notificação</h3>

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
                    checked={notificationFormData.enabled}
                    onChange={(e) => setNotificationFormData({ ...notificationFormData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {notificationFormData.enabled && (
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
                      value={notificationFormData.daysBeforeDue}
                      onChange={(e) => setNotificationFormData({ ...notificationFormData, daysBeforeDue: parseInt(e.target.value) })}
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
                        checked={notificationFormData.browserNotifications}
                        onChange={(e) => setNotificationFormData({ ...notificationFormData, browserNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {notificationFormData.browserNotifications && (
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
              <button
                type="submit"
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={16} />
                <span>Salvar Configurações</span>
              </button>
            </form>
          )}

          {/* Relationship Tab */}
          {activeTab === 'relationship' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Relacionamento</h3>

              {/* Convites Pendentes Recebidos */}
              {pendingInvitations.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                    <UserPlus className="text-blue-500" size={18} /> Convites Pendentes Recebidos
                  </h4>
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="bg-white rounded-lg p-4 border border-blue-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-block px-2 py-1 text-xs rounded-full font-semibold bg-blue-100 text-blue-700 border border-blue-200 mr-2">Pendente</span>
                          <div>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              {getGenderEmoji(null)} {invitation.sender?.full_name || 'Desconhecido'}
                            </p>
                            <p className="text-sm text-gray-600">{invitation.sender?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Expira em {format(new Date(invitation.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id)}
                            disabled={loading}
                            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 shadow"
                          >
                            <CheckCircle size={14} /> Aceitar
                          </button>
                          <button
                            onClick={() => handleRejectInvitation(invitation.id)}
                            className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors shadow"
                          >
                            <X size={14} /> Rejeitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convites Recebidos Aceitos */}
              {acceptedInvitations.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} /> Convites Aceitos
                  </h4>
                  <div className="space-y-3">
                    {acceptedInvitations.map((invitation) => (
                      <div key={invitation.id} className="bg-white rounded-lg p-4 border border-green-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-block px-2 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-700 border border-green-200 mr-2">Aceito</span>
                          <div>
                            <p className="font-medium text-gray-900 flex items-center gap-1">
                              {getGenderEmoji(null)} {invitation.sender?.full_name || 'Desconhecido'}
                            </p>
                            <p className="text-sm text-gray-600">{invitation.sender?.email}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Aceito em {invitation.accepted_at ? format(new Date(invitation.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Convites Enviados */}
              {sentInvitations.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                    <Mail className="text-purple-500" size={18} /> Convites Enviados
                  </h4>
                  <div className="space-y-3">
                    {sentInvitations.map((invitation) => (
                      <div key={invitation.id} className="bg-white rounded-lg p-4 border border-purple-300 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold border mr-2 ${
                            invitation.status === 'pending'
                              ? 'bg-blue-100 text-blue-700 border-blue-200'
                              : invitation.status === 'accepted'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }`}>
                            {invitation.status === 'pending' ? 'Pendente' : invitation.status === 'accepted' ? 'Aceito' : 'Rejeitado'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">
                              Para: {invitation.recipient_email}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Enviado em {format(new Date(invitation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            {invitation.accepted_at && (
                              <p className="text-xs text-green-600 mt-1">
                                Aceito em {format(new Date(invitation.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Botão de exclusão/cancelamento para convites enviados pendentes */}
                        {invitation.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (window.confirm('Deseja cancelar este convite?')) {
                                setLoading(true);
                                await handleCancelInvitation(invitation.id, invitation.recipient_email)
                                  .from('invitations')
                                  .delete()
                                  .eq('id', invitation.id);
                                setLoading(false);
                                if (error) {
                                  alert('Erro ao cancelar convite.');
                                } else {
                                  fetchAllInvitations();
                              }
                            }}
                            className="flex items-center gap-1 bg-red-100 text-red-700 border border-red-300 px-3 py-1 rounded text-xs hover:bg-red-200 transition-colors shadow"
                            disabled={loading}
                          >
                            <X size={14} /> Cancelar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Relacionamento ativo */}
              {couple ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="text-green-600" size={24} />
                      <div>
                        <p className="font-medium text-green-800">
                          Conectado com {getGenderEmoji(couple.partner.gender)} {couple.partner.full_name}
                        </p>
                        <p className="text-sm text-green-600">{couple.partner.email}</p>
                        {couple.partner.plan_type === 'premium' && couple.partner.subscription_expires_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Assinatura Premium expira em {formatExpirationDate(couple.partner.subscription_expires_at)}
                          </p>
                        )}
                        {/* Data de aceitação do vínculo (se disponível) */}
                        {acceptedInvitations.length > 0 && (
                          <p className="text-xs text-green-700 mt-1">
                            Vínculo aceito em {acceptedInvitations[0].accepted_at ? format(new Date(acceptedInvitations[0].accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCouple}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <UserMinus size={16} />
                      <span>Desfazer</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!showInviteForm ? (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <UserPlus size={16} />
                      <span>Convidar Parceiro(a)</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSendInvitation} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email do Parceiro(a)
                        </label>
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="email@exemplo.com"
                          required
                        />
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInviteForm(false);
                            setInviteEmail('');
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                          {loading ? 'Enviando...' : 'Enviar Convite'}
                        </button>
                      </div>
                    </form>
                  )}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Como funciona o novo fluxo de convite:</p>
                        <ul className="space-y-1 text-xs">
                          <li>• O usuário é criado automaticamente quando você envia o convite</li>
                          <li>• Se você tem plano premium, o convidado também terá acesso premium</li>
                          <li>• Um email será enviado com link para definir a senha</li>
                          <li>• Após definir a senha, vocês estarão conectados automaticamente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}