import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CheckCircle, Star, Zap, Package, TrendingUp, Users, Globe, AlertCircle, Palette, Rocket, Target } from '../icons';
import { PLAN_DATA, ARTICLE_PACKS, FREE_PLAN_LIMITS } from '../../utils/constants';
import { useBia } from '../BiaContext';

interface LojaBIAProps {
  userData: any;
}

export function LojaBIA({ userData }: LojaBIAProps) {
  const { actions, state } = useBia();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePurchase = async (planName: string, link: string) => {
    setLoadingPlan(planName);
    
    // Simular compra para demonstração
    const productId = PLAN_DATA.findIndex(p => p.name === planName) + 1;
    await actions.simulatePurchase(productId);
    
    // Em produção, redirecionar para o link de compra
    // window.open(link, '_blank');
    
    setLoadingPlan(null);
  };

  const handlePackPurchase = (pack: any) => {
    // Em produção, redirecionar para o link de compra
    window.open(pack.link, '_blank');
  };

  const handleAdditionalPurchase = (product: any) => {
    // Em produção, redirecionar para o link de compra
    window.open(product.link, '_blank');
  };

  const currentPlan = userData?.plano || 'Free';
  const isFreePlan = currentPlan === 'Free' || !currentPlan;

  // Calcular uso atual do plano gratuito
  const usedSites = state.sites?.length || 0;
  const usedIdeas = state.ideas?.length || 0;
  const usedArticles = state.articles?.filter(a => a.status === 'Concluído').length || 0;

  // Produtos adicionais - APENAS MODELO DE BLOG PRONTO
  const additionalProducts = [
    {
      name: 'Modelo de Blog Pronto',
      price: 'R$ 197',
      originalPrice: 'R$ 497',
      description: 'Site WordPress completo otimizado para SEO com tema profissional',
      features: [
        'Instalação 100% automática com 1 clique',
        'Design moderno, responsivo e otimizado',
        'Estrutura pensada para conversão e SEO',
        'Páginas modelo (home, blog, sobre, contato)',
        'Plugins essenciais pré-configurados',
        'Compatível com Elementor e WooCommerce'
      ],
      icon: Globe,
      link: 'https://bloginfinitoautomatico.com.br/produto/modelo-de-blog-pronto/',
      popular: false
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Planos</h1>
        <p className="font-montserrat text-gray-600">
          {isFreePlan 
            ? 'Você está no plano gratuito. Faça upgrade para liberar todo o potencial da BIA!'
            : 'Gerencie seu plano atual ou adquira recursos extras para potencializar seu marketing de conteúdo'
          }
        </p>
      </div>

      {/* Status do Plano Gratuito */}
      {isFreePlan && (
        <Card className="border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-poppins text-lg text-amber-800 mb-2">
                  Status do Plano Gratuito
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="font-poppins text-2xl text-amber-800 mb-1">
                      {usedSites}/{FREE_PLAN_LIMITS.sites}
                    </div>
                    <div className="font-montserrat text-sm text-amber-700">Sites Conectados</div>
                    {usedSites >= FREE_PLAN_LIMITS.sites && (
                      <Badge variant="destructive" className="mt-1 text-xs">Limite Atingido</Badge>
                    )}
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="font-poppins text-2xl text-amber-800 mb-1">
                      {usedIdeas}/{FREE_PLAN_LIMITS.ideas}
                    </div>
                    <div className="font-montserrat text-sm text-amber-700">Ideias Geradas</div>
                    {usedIdeas >= FREE_PLAN_LIMITS.ideas && (
                      <Badge variant="destructive" className="mt-1 text-xs">Limite Atingido</Badge>
                    )}
                  </div>
                  <div className="text-center p-3 bg-white/50 rounded-lg">
                    <div className="font-poppins text-2xl text-amber-800 mb-1">
                      {usedArticles}/{FREE_PLAN_LIMITS.articles}
                    </div>
                    <div className="font-montserrat text-sm text-amber-700">Artigos Produzidos</div>
                    {usedArticles >= FREE_PLAN_LIMITS.articles && (
                      <Badge variant="destructive" className="mt-1 text-xs">Limite Atingido</Badge>
                    )}
                  </div>
                </div>
                <p className="font-montserrat text-sm text-amber-700 mt-4">
                  ⚠️ <strong>Importante:</strong> Os limites não são cumulativos. Após usar todos os recursos disponíveis, 
                  será necessário fazer upgrade para um plano pago para continuar gerando conteúdo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="plans" className="font-montserrat">
            <Globe className="mr-2 h-4 w-4" />
            Planos Mensais
          </TabsTrigger>
          <TabsTrigger value="packs" className="font-montserrat">
            <Package className="mr-2 h-4 w-4" />
            Packs de Artigos
          </TabsTrigger>
          <TabsTrigger value="additional" className="font-montserrat">
            <Palette className="mr-2 h-4 w-4" />
            Adicionais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6">
          {/* Estatísticas de valor */}
          <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-poppins font-medium text-purple-800 mb-1">Economia Real</h3>
                  <p className="font-montserrat text-sm text-purple-600">
                    Cada artigo economiza <strong>R$ 50</strong> em produção manual
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-poppins font-medium text-blue-800 mb-1">Múltiplos Sites</h3>
                  <p className="font-montserrat text-sm text-blue-600">
                    Gerencie todos os seus projetos em uma única plataforma
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-poppins font-medium text-green-800 mb-1">IA Avançada</h3>
                  <p className="font-montserrat text-sm text-green-600">
                    Conteúdo de alta qualidade gerado automaticamente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade de planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLAN_DATA.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border transition-all hover:shadow-lg ${
                  plan.popular 
                    ? 'border-purple-300 ring-2 ring-purple-200 scale-105' 
                    : 'border-gray-200'
                } ${currentPlan === plan.name ? 'bg-green-50 border-green-300' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white">
                      <Star className="mr-1 h-3 w-3" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {currentPlan === plan.name && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Ativo
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-poppins text-xl text-black mb-2">
                    {plan.name}
                  </CardTitle>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-poppins text-3xl text-black">
                        {plan.price}
                      </span>
                      <span className="font-montserrat text-sm text-gray-500">/mês</span>
                    </div>
                    
                    {plan.originalPrice && (
                      <div className="text-center">
                        <span className="font-montserrat text-sm text-gray-500 line-through">
                          {plan.originalPrice}
                        </span>
                        <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                          {Math.round((1 - parseInt(plan.price.replace(/\D/g, '')) / parseInt(plan.originalPrice.replace(/\D/g, ''))) * 100)}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="font-poppins text-lg text-purple-600">
                        {typeof plan.sites === 'number' ? plan.sites : plan.sites}
                      </div>
                      <div className="font-montserrat text-xs text-gray-600">Sites</div>
                    </div>
                    <div className="text-center">
                      <div className="font-poppins text-lg text-purple-600">
                        {typeof plan.articles === 'number' ? plan.articles : plan.articles}
                      </div>
                      <div className="font-montserrat text-xs text-gray-600">Artigos</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="font-montserrat text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    {currentPlan === plan.name ? (
                      <Button 
                        disabled 
                        className="w-full font-montserrat text-green-600"
                        variant="outline"
                        style={{ borderColor: '#10B981' }}
                      >
                        Plano Atual
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePurchase(plan.name, plan.link)}
                        disabled={loadingPlan === plan.name}
                        className="w-full font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        {loadingPlan === plan.name ? 'Processando...' : 'Escolher Plano'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informações sobre o plano Free */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-poppins text-xl text-blue-800 mb-2">
                {isFreePlan ? 'Você está no Plano Gratuito' : 'Plano Gratuito Disponível'}
              </h3>
              <p className="font-montserrat text-blue-700 max-w-2xl mx-auto mb-4">
                {isFreePlan 
                  ? 'Aproveite ao máximo seus recursos limitados e faça upgrade quando precisar de mais!'
                  : 'Novos usuários podem começar gratuitamente com 1 site, 10 ideias e 5 artigos.'
                }
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="font-poppins text-lg text-blue-800">{FREE_PLAN_LIMITS.sites}</div>
                  <div className="font-montserrat text-xs text-blue-600">Site</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="font-poppins text-lg text-blue-800">{FREE_PLAN_LIMITS.ideas}</div>
                  <div className="font-montserrat text-xs text-blue-600">Ideias</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="font-poppins text-lg text-blue-800">{FREE_PLAN_LIMITS.articles}</div>
                  <div className="font-montserrat text-xs text-blue-600">Artigos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="packs" className="space-y-6">
          {/* Header dos Packs */}
          <Card className="border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <Package className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-poppins text-xl text-orange-800 mb-2">
                Packs de Artigos Extras
              </h3>
              <p className="font-montserrat text-orange-700 max-w-2xl mx-auto">
                Precisa de mais artigos? Adquira packs extras com preços especiais e aumente sua produção de conteúdo.
              </p>
              {isFreePlan && (
                <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                  <p className="font-montserrat text-sm text-orange-800">
                    <strong>Atenção:</strong> Para usar packs de artigos, você precisa primeiro fazer upgrade para um plano pago.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Grade de packs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICLE_PACKS.map((pack, index) => (
              <Card 
                key={index} 
                className={`relative border transition-all hover:shadow-lg ${
                  pack.popular 
                    ? 'border-orange-300 ring-2 ring-orange-200 scale-105' 
                    : 'border-gray-200'
                } ${isFreePlan ? 'opacity-60' : ''}`}
              >
                {pack.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-orange-600 text-white">
                      <Star className="mr-1 h-3 w-3" />
                      Mais Vendido
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="h-8 w-8 text-orange-600" />
                  </div>
                  
                  <CardTitle className="font-poppins text-xl text-black mb-2">
                    {pack.quantity} Artigos
                  </CardTitle>
                  
                  <div className="space-y-2">
                    <div className="font-poppins text-3xl text-black">
                      {pack.price}
                    </div>
                    <div className="font-montserrat text-sm text-gray-600">
                      {pack.pricePerArticle} por artigo
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {pack.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="font-montserrat text-sm text-gray-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <Button
                      onClick={() => !isFreePlan && handlePackPurchase(pack)}
                      disabled={isFreePlan}
                      className="w-full font-montserrat text-white"
                      style={{ backgroundColor: isFreePlan ? '#D1D5DB' : '#8B5FBF' }}
                    >
                      {isFreePlan ? 'Requer Plano Pago' : 'Comprar Pack'}
                    </Button>
                  </div>

                  <div className="text-center pt-2 border-t border-gray-200">
                    <div className="font-montserrat text-xs text-gray-500">
                      Economia vs preço individual
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Informações adicionais dos packs */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h3 className="font-poppins text-lg text-blue-800 mb-4 text-center">
                Como funcionam os Packs de Artigos?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-montserrat font-medium text-blue-800 mb-2">✨ Uso Imediato</h4>
                  <p className="font-montserrat text-sm text-blue-700">
                    Os artigos são creditados instantaneamente na sua conta após a compra.
                  </p>
                </div>
                <div>
                  <h4 className="font-montserrat font-medium text-blue-800 mb-2">⏰ Validade Estendida</h4>
                  <p className="font-montserrat text-sm text-blue-700">
                    Quanto maior o pack, mais tempo você tem para usar os artigos.
                  </p>
                </div>
                <div>
                  <h4 className="font-montserrat font-medium text-blue-800 mb-2">💰 Economia Progressiva</h4>
                  <p className="font-montserrat text-sm text-blue-700">
                    Packs maiores oferecem preço por artigo mais baixo.
                  </p>
                </div>
                <div>
                  <h4 className="font-montserrat font-medium text-blue-800 mb-2">🔄 Acumulativo</h4>
                  <p className="font-montserrat text-sm text-blue-700">
                    Os artigos do pack se somam aos do seu plano mensal atual.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-6">
          {/* Header dos Produtos Adicionais */}
          <Card className="border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <Palette className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-poppins text-xl text-green-800 mb-2">
                Produtos Adicionais
              </h3>
              <p className="font-montserrat text-green-700 max-w-2xl mx-auto">
                Expanda ainda mais suas possibilidades com nossos produtos complementares para marketing digital.
              </p>
            </CardContent>
          </Card>

          {/* Grade de produtos adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalProducts.map((product, index) => {
              const Icon = product.icon;
              return (
                <Card 
                  key={index} 
                  className={`relative border transition-all hover:shadow-lg ${
                    product.popular 
                      ? 'border-green-300 ring-2 ring-green-200 scale-105' 
                      : 'border-gray-200'
                  }`}
                >
                  {product.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-green-600 text-white">
                        <Star className="mr-1 h-3 w-3" />
                        Mais Vendido
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon className="h-8 w-8 text-green-600" />
                    </div>
                    
                    <CardTitle className="font-poppins text-xl text-black mb-2">
                      {product.name}
                    </CardTitle>
                    
                    <p className="font-montserrat text-sm text-gray-600 mb-4">
                      {product.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="font-poppins text-3xl text-black">
                        {product.price}
                      </div>
                      {product.originalPrice && (
                        <div className="text-center">
                          <span className="font-montserrat text-sm text-gray-500 line-through">
                            {product.originalPrice}
                          </span>
                          <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                            {Math.round((1 - parseInt(product.price.replace(/\D/g, '')) / parseInt(product.originalPrice.replace(/\D/g, ''))) * 100)}% OFF
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="font-montserrat text-sm text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      <Button
                        onClick={() => handleAdditionalPurchase(product)}
                        className="w-full font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        Comprar Agora
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Informações sobre os produtos adicionais */}
          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <h3 className="font-poppins text-lg text-purple-800 mb-4 text-center">
                Por que escolher nossos produtos adicionais?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-montserrat font-medium text-purple-800 mb-2">Qualidade Garantida</h4>
                  <p className="font-montserrat text-sm text-purple-700">
                    Produtos desenvolvidos por especialistas em marketing digital com resultados comprovados.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-montserrat font-medium text-purple-800 mb-2">Integração Perfeita</h4>
                  <p className="font-montserrat text-sm text-purple-700">
                    Todos os produtos são desenvolvidos para trabalhar em harmonia com a plataforma BIA.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-montserrat font-medium text-purple-800 mb-2">Suporte Especializado</h4>
                  <p className="font-montserrat text-sm text-purple-700">
                    Suporte dedicado para instalação, configuração e otimização de todos os produtos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}