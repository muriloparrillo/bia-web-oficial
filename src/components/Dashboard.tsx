import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Monitor, FileText, Clock, CreditCard, TrendingUp, Users, Calendar, Lightbulb, ArrowUpRight, Plus } from './icons';
import { useBia } from './BiaContext';
import { ARTICLE_SAVINGS_VALUE, ARTICLE_TIME_SAVED_HOURS, FREE_PLAN_LIMITS, getPlanLimits, isFreePlan } from '../utils/constants';

interface DashboardProps {
  userData: any;
  onNavigate?: (page: string) => void; // Make it optional
}

export function Dashboard({ userData, onNavigate }: DashboardProps) {
  const { state, actions } = useBia();

  // Default navigation function if not provided
  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      // Fallback navigation using hash
      window.location.hash = page;
    }
  };

  // Remover verificação de modo demo - sistema funciona transparentemente

  // Usar dados reais do contexto BIA
  const sites = state.sites || [];
  const ideas = state.ideas || [];
  const articles = state.articles || [];

  // Verificar se é plano gratuito e obter limites
  const userPlan = userData?.plano || 'Free';
  const isFree = isFreePlan(userPlan);
  const planLimits = getPlanLimits(userPlan);
  const currentPlan = userData?.plano || 'Free';

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const completedArticles = articles.filter(a => a.status === 'Concluído' || a.status === 'Publicado');
  const publishedArticles = articles.filter(a => a.status === 'Publicado');
  const activeSites = sites.filter(s => s.status === 'ativo');

  const stats = [
    {
      title: 'Sites Conectados',
      value: sites.length,
      icon: Monitor,
      color: '#8B5FBF',
      description: 'Sites ativos',
      trend: `+${activeSites.length} ativos`,
      action: 'sites'
    },
    {
      title: 'Ideias Geradas',
      value: ideas.length,
      icon: Lightbulb,
      color: '#F59E0B',
      description: 'Total de ideias',
      trend: `+${ideas.length} disponíveis`,
      action: 'ideas'
    },
    {
      title: 'Artigos Produzidos',
      value: completedArticles.length,
      icon: FileText,
      color: '#4F46E5',
      description: 'Total de artigos',
      trend: `+${publishedArticles.length} publicados`,
      action: 'articles'
    },
    {
      title: 'Tempo Economizado',
      value: `${(completedArticles.length * ARTICLE_TIME_SAVED_HOURS).toFixed(1)}h`,
      subValue: formatMoney(completedArticles.length * ARTICLE_SAVINGS_VALUE),
      icon: Clock,
      color: '#059669',
      description: 'Horas poupadas',
      trend: `R$ ${ARTICLE_SAVINGS_VALUE}/artigo economizado`,
      action: 'articles'
    }
  ];

  const recentActivities = [
    ...articles
      .filter(a => a.status === 'Publicado')
      .slice(0, 2)
      .map(article => ({
        id: `article-${article.id}`,
        title: `Artigo "${article.titulo.substring(0, 30)}..." publicado`,
        time: new Date(article.updatedAt).toLocaleDateString('pt-BR'),
        type: 'published',
        icon: FileText
      })),
    ...ideas
      .slice(0, 2)
      .map(idea => ({
        id: `idea-${idea.id}`,
        title: `Nova ideia: "${idea.titulo.substring(0, 30)}..."`,
        time: new Date(idea.createdAt).toLocaleDateString('pt-BR'),
        type: 'ideas',
        icon: Lightbulb
      })),
    ...sites
      .slice(0, 1)
      .map(site => ({
        id: `site-${site.id}`,
        title: `Site "${site.nome}" conectado`,
        time: new Date(site.createdAt).toLocaleDateString('pt-BR'),
        type: 'connected',
        icon: Monitor
      }))
  ].slice(0, 4);

  const quickActions = [
    {
      title: 'Gerar Ideias',
      description: 'Crie novos temas para artigos',
      icon: Lightbulb,
      color: '#8B5FBF',
      action: 'ideas',
      count: 0
    },
    {
      title: 'Produzir Artigos',
      description: 'Gere conteúdo com IA',
      icon: FileText,
      color: '#059669',
      action: 'articles',
      count: ideas.length
    },
    {
      title: 'Meus Sites',
      description: 'Gerencie sites conectados',
      icon: Monitor,
      color: '#4F46E5',
      action: 'sites',
      count: 0
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'published': return FileText;
      case 'connected': return Monitor;
      case 'scheduled': return Calendar;
      case 'ideas': return Lightbulb;
      default: return FileText;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'published': return '#059669';
      case 'connected': return '#8B5FBF';
      case 'scheduled': return '#4F46E5';
      case 'ideas': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-poppins text-2xl sm:text-3xl text-black mb-1 sm:mb-2">
            Dashboard
          </h1>
          <p className="font-montserrat text-gray-600 text-sm sm:text-base">
            Bem-vindo de volta, {userData?.name || 'Usuário'}! Aqui está um resumo da sua conta BIA.
          </p>
        </div>
        
        {/* Quick Add Button */}
        <Button 
          onClick={() => handleNavigate('ideas')}
          className="font-montserrat text-white self-start sm:self-center"
          style={{ backgroundColor: '#8B5FBF' }}
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Gerar Ideias</span>
          <span className="sm:hidden">Ideias</span>
        </Button>
      </div>



      {/* Plano Info */}
      <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-poppins text-lg text-purple-800 mb-2">
                Plano {currentPlan}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-montserrat text-purple-700">Sites</span>
                    <span className="font-montserrat text-purple-600">
                      {sites.length}/{planLimits.isUnlimited ? '∞' : planLimits.sites}
                    </span>
                  </div>
                  <Progress 
                    value={planLimits.isUnlimited ? 20 : Math.min(100, (sites.length / planLimits.sites) * 100)} 
                    className="h-2" 
                  />
                  {!planLimits.isUnlimited && sites.length >= planLimits.sites && (
                    <p className="font-montserrat text-xs text-red-600 mt-1">Limite atingido</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-montserrat text-purple-700">Ideias</span>
                    <span className="font-montserrat text-purple-600">
                      {ideas.length}/{isFree ? planLimits.ideas : '∞'}
                    </span>
                  </div>
                  <Progress 
                    value={isFree ? Math.min(100, (ideas.length / planLimits.ideas) * 100) : 40} 
                    className="h-2" 
                  />
                  {isFree && ideas.length >= planLimits.ideas && (
                    <p className="font-montserrat text-xs text-red-600 mt-1">Limite atingido</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-montserrat text-purple-700">Artigos</span>
                    <span className="font-montserrat text-purple-600">
                      {articles.filter(a => a.status === 'Concluído').length}/{planLimits.articles}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, (articles.filter(a => a.status === 'Concluído').length / planLimits.articles) * 100)} 
                    className="h-2" 
                  />
                  {articles.filter(a => a.status === 'Concluído').length >= planLimits.articles && (
                    <p className="font-montserrat text-xs text-red-600 mt-1">Limite atingido</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - Responsivo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => handleNavigate(stat.action)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="font-montserrat text-xs sm:text-sm text-gray-600 leading-tight">
                  {stat.title}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Icon 
                    size={16} 
                    className="sm:w-5 sm:h-5 flex-shrink-0"
                    style={{ color: stat.color }}
                  />
                  <ArrowUpRight size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-1">
                  <div className="font-poppins text-lg sm:text-2xl text-black">
                    {stat.value}
                  </div>
                  {stat.subValue && (
                    <div className="font-montserrat text-sm sm:text-lg" style={{ color: stat.color }}>
                      {stat.subValue}
                    </div>
                  )}
                  <p className="font-montserrat text-xs text-gray-500 hidden sm:block">
                    {stat.description}
                  </p>
                  <p className="font-montserrat text-xs" style={{ color: stat.color }}>
                    {stat.trend}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid - Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Recent Activities */}
        <Card className="border border-gray-200 xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-poppins text-lg sm:text-xl text-black flex items-center space-x-2">
              <TrendingUp size={20} className="sm:w-6 sm:h-6" style={{ color: '#8B5FBF' }} />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                
                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon size={14} className="sm:w-4 sm:h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-montserrat text-sm text-black truncate">
                        {activity.title}
                      </p>
                      <p className="font-montserrat text-xs text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-6 sm:py-8">
                  <TrendingUp size={32} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-4" />
                  <p className="font-montserrat text-gray-600 text-sm sm:text-base">Nenhuma atividade recente</p>
                  <p className="font-montserrat text-xs sm:text-sm text-gray-500">Comece gerando algumas ideias!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-poppins text-lg sm:text-xl text-black flex items-center space-x-2">
              <Users size={20} className="sm:w-6 sm:h-6" style={{ color: '#8B5FBF' }} />
              <span>Ações Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full h-auto p-3 sm:p-4 justify-start hover:border-gray-300 group"
                  onClick={() => handleNavigate(action.action)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${action.color}20` }}
                    >
                      <Icon size={16} className="sm:w-5 sm:h-5" style={{ color: action.color }} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-montserrat font-medium text-black text-sm truncate">
                          {action.title}
                        </p>
                        {action.count > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs flex-shrink-0">
                            {action.count}
                          </Badge>
                        )}
                      </div>
                      <p className="font-montserrat text-xs text-gray-600 truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowUpRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section - Responsivo */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-lg sm:text-xl text-black flex items-center space-x-2">
            <Lightbulb size={20} className="sm:w-6 sm:h-6" style={{ color: '#8B5FBF' }} />
            <span>Dicas da BIA para Maximizar Resultados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f8f4ff' }}>
              <h4 className="font-montserrat font-medium text-black mb-2 text-sm sm:text-base">
                📝 Otimize suas palavras-chave
              </h4>
              <p className="font-montserrat text-xs sm:text-sm text-gray-600">
                Use palavras-chave de cauda longa nos títulos para melhorar o SEO e atrair tráfego mais qualificado.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f8f4ff' }}>
              <h4 className="font-montserrat font-medium text-black mb-2 text-sm sm:text-base">
                ⏰ Programe seus posts estrategicamente
              </h4>
              <p className="font-montserrat text-xs sm:text-sm text-gray-600">
                Publique nos horários de maior engajamento do seu público para maximizar o alcance dos artigos.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f8f4ff' }}>
              <h4 className="font-montserrat font-medium text-black mb-2 text-sm sm:text-base">
                🎯 Diversifique seus nichos
              </h4>
              <p className="font-montserrat text-xs sm:text-sm text-gray-600">
                Explore diferentes ângulos do seu nicho para criar conteúdo mais variado e atrair audiências diversas.
              </p>
            </div>
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#f8f4ff' }}>
              <h4 className="font-montserrat font-medium text-black mb-2 text-sm sm:text-base">
                📊 Monitore suas métricas
              </h4>
              <p className="font-montserrat text-xs sm:text-sm text-gray-600">
                Acompanhe o desempenho dos artigos no Analytics para identificar os melhores tipos de conteúdo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}