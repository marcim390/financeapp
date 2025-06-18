import React from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Bell, 
  Calendar, 
  Check, 
  CreditCard, 
  DollarSign, 
  Heart, 
  PieChart, 
  Shield, 
  Star, 
  TrendingUp, 
  Users, 
  Zap 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  const features = [
    {
      icon: BarChart3,
      title: 'Dashboard Inteligente',
      description: 'Visualize seus gastos com gráficos interativos e relatórios detalhados em tempo real.'
    },
    {
      icon: Users,
      title: 'Controle para Casais',
      description: 'Gerencie finanças individuais ou compartilhadas com seu parceiro de forma simples.'
    },
    {
      icon: Bell,
      title: 'Notificações Inteligentes',
      description: 'Nunca mais esqueça um pagamento com alertas personalizados para suas contas.'
    },
    {
      icon: Calendar,
      title: 'Despesas Recorrentes',
      description: 'Configure pagamentos automáticos e mantenha suas contas sempre em dia.'
    },
    {
      icon: PieChart,
      title: 'Categorização Automática',
      description: 'Organize seus gastos por categorias personalizáveis e acompanhe tendências.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados financeiros protegidos com criptografia de nível bancário.'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Silva',
      role: 'Empresária',
      content: 'Revolucionou como eu e meu marido controlamos nossas finanças. Agora conseguimos economizar 30% mais!',
      rating: 5
    },
    {
      name: 'João Santos',
      role: 'Desenvolvedor',
      content: 'Interface intuitiva e funcionalidades incríveis. Finalmente um app que entende casais!',
      rating: 5
    },
    {
      name: 'Ana Costa',
      role: 'Professora',
      content: 'As notificações me salvaram várias vezes. Nunca mais paguei multa por atraso!',
      rating: 5
    }
  ];

  const pricingFeatures = {
    free: [
      'Até 5 transações por mês',
      'Dashboard básico',
      '3 categorias personalizadas',
      'Suporte por email'
    ],
    premium: [
      'Transações ilimitadas',
      'Dashboard completo com gráficos avançados',
      'Categorias ilimitadas',
      'Despesas recorrentes',
      'Notificações inteligentes',
      'Controle para casais',
      'Relatórios detalhados',
      'Suporte prioritário',
      'Backup automático na nuvem'
    ]
  };

  const handleDashboardClick = () => {
    if (user && profile) {
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <DollarSign className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold text-gray-900">FinanceApp</span>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Carregando...</span>
                </div>
              ) : user && profile ? (
                <button
                  onClick={handleDashboardClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ir para Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Entrar
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Começar Grátis
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Controle Financeiro
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
                Inteligente para Casais
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transforme a forma como você e seu parceiro gerenciam as finanças. 
              Dashboard inteligente, notificações automáticas e controle total dos seus gastos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {loading ? (
                <div className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Carregando...</span>
                </div>
              ) : user && profile ? (
                <button
                  onClick={handleDashboardClick}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
                >
                  <span>Ir para Dashboard</span>
                  <ArrowRight size={20} />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/register')}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg flex items-center justify-center space-x-2"
                  >
                    <span>Começar Grátis Agora</span>
                    <ArrowRight size={20} />
                  </button>
                  <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl hover:border-gray-400 transition-colors font-semibold text-lg">
                    Ver Demonstração
                  </button>
                </>
              )}
            </div>
            {!user && !loading && (
              <p className="text-sm text-gray-500 mt-4">
                ✨ Grátis para sempre • 💳 Sem cartão de crédito • 🚀 Comece em 2 minutos
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa para controlar suas finanças
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Funcionalidades pensadas especialmente para casais que querem ter controle total de suas finanças
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mais de 10.000 casais já transformaram suas finanças
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Veja o que nossos usuários estão dizendo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Planos que se adaptam às suas necessidades
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Comece grátis e evolua quando precisar de mais funcionalidades
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Gratuito</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">R$ 0</div>
                <p className="text-gray-600">Para sempre</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {pricingFeatures.free.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="text-green-500 flex-shrink-0" size={20} />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Começar Grátis
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-8 relative">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                Mais Popular
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Plano Premium</h3>
                <div className="text-4xl font-bold mb-2">R$ 13,90</div>
                <p className="text-blue-100">por mês</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                {pricingFeatures.premium.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Check className="text-green-400 flex-shrink-0" size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => navigate('/register')}
                className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Começar Teste Grátis
              </button>
              <p className="text-center text-blue-100 text-sm mt-2">
                7 dias grátis, cancele quando quiser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8">
            Junte-se a milhares de casais que já estão no controle de suas finanças
          </p>
          {loading ? (
            <div className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Carregando...</span>
            </div>
          ) : user && profile ? (
            <button
              onClick={handleDashboardClick}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg inline-flex items-center space-x-2"
            >
              <span>Ir para Dashboard</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg inline-flex items-center space-x-2"
            >
              <span>Começar Agora - É Grátis</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <span className="text-xl font-bold">FinanceApp</span>
              </div>
              <p className="text-gray-400">
                O controle financeiro inteligente para casais modernos.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Segurança</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FinanceApp. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}