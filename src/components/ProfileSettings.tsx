import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Crown, Users, X, Send, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface Invitation {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  invited_user?: {
    full_name: string;
  };
}

interface ProfileSettingsProps {
  onClose: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const { user, profile, refreshProfile } = useAuth();
  const { refreshPartnerProfile } = useApp();
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('couple_invitations')
        .select(`
          id,
          email,
          status,
          created_at,
          invited_user:invited_user_id (
            full_name
          )
        `)
        .eq('inviter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, [user]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !user) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.rpc('send_couple_invitation_improved', {
        p_email: inviteEmail.trim(),
        p_inviter_id: user.id
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Convite enviado com sucesso! O usuário receberá um email para definir sua senha.'
      });
      setInviteEmail('');
      
      // Reload invitations to show the new one
      await loadInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Erro ao enviar convite. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este convite?')) return;

    try {
      const { error } = await supabase
        .from('couple_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Convite cancelado com sucesso!'
      });
      
      // Reload invitations
      await loadInvitations();
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao cancelar convite. Tente novamente.'
      });
    }
  };

  const handleBreakCouple = async () => {
    if (!confirm('Tem certeza que deseja desfazer a relação de casal? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase.rpc('break_couple_relationship', {
        p_user_id: user?.id
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Relação de casal desfeita com sucesso!'
      });

      // Refresh profiles
      await refreshProfile();
      await refreshPartnerProfile();
    } catch (error: any) {
      console.error('Error breaking couple:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao desfazer relação. Tente novamente.'
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Aceito';
      case 'rejected': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Configurações do Perfil</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">Informações Pessoais</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{profile?.full_name || 'Nome não definido'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  Membro desde {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </span>
              </div>
              {profile?.is_premium && (
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 font-medium">Usuário Premium</span>
                </div>
              )}
            </div>
          </div>

          {/* Couple Status */}
          {profile?.couple_id ? (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">Status de Casal</h3>
                </div>
                <button
                  onClick={handleBreakCouple}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Desfazer Relação
                </button>
              </div>
              <p className="text-sm text-green-700">
                Você está em uma relação de casal. Pode visualizar e gerenciar finanças conjuntas.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Convidar Parceiro(a)</h3>
              </div>
              
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email do parceiro(a)
                  </label>
                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Enviando...' : 'Enviar Convite'}</span>
                </button>
              </form>

              {/* Invitations List */}
              {invitations.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Convites Enviados</h4>
                  <div className="space-y-2">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between bg-white p-3 rounded border">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {invitation.invited_user?.full_name || invitation.email}
                            </span>
                            <span className={`text-xs font-medium ${getStatusColor(invitation.status)}`}>
                              {getStatusText(invitation.status)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Enviado em {formatDate(invitation.created_at)}
                          </p>
                        </div>
                        {invitation.status === 'pending' && (
                          <button
                            onClick={() => handleCancelInvite(invitation.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Cancelar convite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;