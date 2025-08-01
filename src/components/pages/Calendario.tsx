import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, CalendarDays, CheckCircle, Filter, Monitor, ExternalLink } from '../icons';
import { useBia } from '../BiaContext';
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from '../../utils/helpers';
import { MONTH_NAMES } from '../../utils/constants';

interface CalendarioProps {
  userData: any;
}

export function Calendario({ userData }: CalendarioProps) {
  const { state } = useBia();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all'); // 'all' para todos os sites

  // Sites disponíveis (incluir apenas sites ativos)
  const availableSites = state.sites.filter(site => site.status === 'ativo');

  // Função para filtrar posts por site
  const filterPostsBySite = (posts: any[]) => {
    if (selectedSiteId === 'all') {
      return posts;
    }
    return posts.filter(post => post.siteId && post.siteId.toString() === selectedSiteId);
  };

  // Buscar posts agendados e publicados dos artigos
  const scheduledPosts = filterPostsBySite(
    state.articles
      .filter(article => article.status === 'Agendado' && article.scheduledDate)
      .map(article => ({
        id: article.id,
        title: article.titulo,
        content: article.conteudo,
        scheduledDate: article.scheduledDate!,
        status: 'pending',
        siteId: article.siteId,
        createdAt: article.createdAt
      }))
  );

  const publishedPosts = filterPostsBySite(
    state.articles
      .filter(article => article.status === 'Publicado')
      .map(article => ({
        id: article.id,
        title: article.titulo,
        content: article.conteudo,
        publishedDate: article.publishedDate || article.updatedAt,
        status: 'published',
        siteId: article.siteId,
        createdAt: article.createdAt,
        wpPostUrl: article.wpPostUrl
      }))
  );
  
  // Combinar todos os posts para o calendário
  const allPosts = [
    ...scheduledPosts.map(post => ({
      ...post,
      date: post.scheduledDate,
      status: 'scheduled'
    })),
    ...publishedPosts.map(post => ({
      ...post,
      date: post.publishedDate,
      status: 'published'
    }))
  ];

  // Buscar posts agendados do localStorage também (de agendamentos manuais)
  const getStoredScheduledPosts = () => {
    try {
      const stored = localStorage.getItem('scheduledPosts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const storedScheduledPosts = filterPostsBySite(
    getStoredScheduledPosts()
      .filter((post: any) => post.status === 'pending')
      .map((post: any) => ({
        ...post,
        date: post.scheduledDate,
        status: 'scheduled'
      }))
  );

  // Combinar todos os posts incluindo os armazenados
  const allPostsIncludingStored = [...allPosts, ...storedScheduledPosts];

  const getPostsForDay = (day: number) => {
    return allPostsIncludingStored.filter(post => {
      const postDate = new Date(post.date);
      return postDate.getDate() === day && 
             postDate.getMonth() === currentDate.getMonth() &&
             postDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 border border-gray-200 bg-gray-50"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayPosts = getPostsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      const isPast = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date();

      days.push(
        <div 
          key={day} 
          className={`h-24 border border-gray-200 p-2 overflow-y-auto ${
            isToday ? 'bg-blue-50 border-blue-300' : isPast ? 'bg-gray-50' : 'bg-white'
          } hover:bg-gray-100 transition-colors cursor-pointer`}
        >
          <div className={`font-montserrat text-sm font-medium mb-1 ${
            isToday ? 'text-blue-800' : isPast ? 'text-gray-500' : 'text-black'
          }`}>
            {day}
            {isToday && <span className="ml-1 text-xs">(Hoje)</span>}
          </div>
          {dayPosts.slice(0, 2).map(post => (
            <div 
              key={post.id} 
              className={`text-xs p-1 mb-1 rounded truncate cursor-pointer hover:opacity-80 ${
                post.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}
              title={`${post.title} - ${post.status} - Site: ${state.sites.find(s => s.id === post.siteId)?.nome || 'N/A'}`}
            >
              {post.title}
            </div>
          ))}
          {dayPosts.length > 2 && (
            <div className="text-xs text-gray-500">
              +{dayPosts.length - 2} mais
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const scheduledCount = scheduledPosts.length + storedScheduledPosts.length;
  const publishedCount = publishedPosts.length;

  const upcomingPosts = [...scheduledPosts, ...storedScheduledPosts]
    .filter(p => new Date(p.scheduledDate) >= new Date())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5);

  const recentPublishedPosts = publishedPosts
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime())
    .slice(0, 5);

  // Obter nome do site selecionado
  const getSelectedSiteName = () => {
    if (selectedSiteId === 'all') return 'Todos os sites';
    const site = availableSites.find(s => s.id.toString() === selectedSiteId);
    return site ? site.nome : 'Site não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="font-poppins text-3xl text-black mb-2">Calendário</h1>
          <p className="font-montserrat text-gray-600">
            Visualize seus posts ({scheduledCount} agendados, {publishedCount} publicados) 
            {selectedSiteId !== 'all' && ` - ${getSelectedSiteName()}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32 font-montserrat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="font-montserrat"
            >
              ← Anterior
            </Button>
            <span className="font-poppins text-lg text-black min-w-48 text-center whitespace-nowrap">
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button 
              variant="outline"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="font-montserrat"
            >
              Próximo →
            </Button>
          </div>
        </div>
      </div>

      {/* Filtro de Sites */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Filter size={20} style={{ color: '#8B5FBF' }} />
              <div>
                <h3 className="font-poppins text-lg text-purple-800">Filtrar por Site</h3>
                <p className="font-montserrat text-sm text-purple-700">
                  Visualize conteúdos de um site específico ou todos os sites
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-64 font-montserrat bg-white">
                  <SelectValue placeholder="Selecione um site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <Monitor size={16} />
                      <span>Todos os Sites ({availableSites.length})</span>
                    </div>
                  </SelectItem>
                  {availableSites.map(site => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Monitor size={16} />
                        <span>{site.nome}</span>
                        {site.url && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs ml-auto">
                            {new URL(site.url).hostname}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSiteId !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSiteId('all')}
                  className="font-montserrat"
                >
                  Limpar Filtro
                </Button>
              )}
            </div>
          </div>
          
          {/* Informação sobre o filtro aplicado */}
          {selectedSiteId !== 'all' && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-100 text-purple-800">
                    <Filter size={12} className="mr-1" />
                    Filtro Ativo
                  </Badge>
                  <span className="font-montserrat text-sm text-gray-700">
                    Mostrando apenas conteúdos de: <strong>{getSelectedSiteName()}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="font-montserrat">
                    {scheduledCount} agendados
                  </span>
                  <span className="font-montserrat">
                    {publishedCount} publicados
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerta quando não há conteúdo para o site selecionado */}
      {selectedSiteId !== 'all' && allPostsIncludingStored.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-8">
            <Monitor size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-poppins text-lg text-gray-600 mb-2">
              Nenhum conteúdo encontrado para {getSelectedSiteName()}
            </h3>
            <p className="font-montserrat text-gray-500 mb-4">
              Este site ainda não possui artigos agendados ou publicados.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                onClick={() => window.location.hash = 'articles'}
                className="font-montserrat text-white"
                style={{ backgroundColor: '#8B5FBF' }}
              >
                Produzir Artigos
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedSiteId('all')}
                className="font-montserrat"
              >
                Ver Todos os Sites
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendário ou Lista */}
      {allPostsIncludingStored.length > 0 && (
        <>
          {viewMode === 'month' ? (
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <div className="grid grid-cols-7 gap-0 overflow-x-auto">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="h-12 flex items-center justify-center bg-gray-100 border border-gray-200 min-w-24">
                      <span className="font-montserrat text-sm font-medium text-gray-700">{day}</span>
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="font-poppins text-xl text-black">Próximos Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingPosts.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingPosts.map(post => (
                        <div key={post.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-montserrat font-medium text-black truncate">{post.title}</h3>
                            <p className="font-montserrat text-sm text-gray-600">
                              {formatDate(post.scheduledDate, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })} às {new Date(post.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {post.siteId && (
                              <p className="font-montserrat text-xs text-gray-500">
                                Site: {state.sites.find(s => s.id === post.siteId)?.nome || 'Site não encontrado'}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-purple-100 text-purple-800 ml-2">
                            <Calendar size={12} className="mr-1" />
                            Agendado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="font-montserrat text-gray-600">
                        {selectedSiteId === 'all' ? 'Nenhum post agendado' : `Nenhum post agendado para ${getSelectedSiteName()}`}
                      </p>
                      <p className="font-montserrat text-sm text-gray-500 mt-2">
                        Use "Agendar Posts" para programar publicações
                      </p>
                      <Button 
                        onClick={() => window.location.hash = 'schedule'}
                        className="font-montserrat text-white mt-4"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        Agendar Posts
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle className="font-poppins text-xl text-black">Posts Publicados Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  {publishedCount > 0 ? (
                    <div className="space-y-3">
                      {recentPublishedPosts.map(post => (
                        <div key={post.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-montserrat font-medium text-black truncate">{post.title}</h3>
                            <p className="font-montserrat text-sm text-gray-600">
                              {formatDate(post.publishedDate)}
                            </p>
                            {post.siteId && (
                              <p className="font-montserrat text-xs text-gray-500">
                                Site: {state.sites.find(s => s.id === post.siteId)?.nome || 'Site não encontrado'}
                              </p>
                            )}
                            {post.wpPostUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => window.open(post.wpPostUrl, '_blank')}
                              >
                                <ExternalLink size={12} className="mr-1" />
                                Ver no WordPress
                              </Button>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800 ml-2">
                            <CheckCircle size={12} className="mr-1" />
                            Publicado
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="font-montserrat text-gray-600">
                        {selectedSiteId === 'all' ? 'Nenhum post publicado ainda' : `Nenhum post publicado em ${getSelectedSiteName()}`}
                      </p>
                      <p className="font-montserrat text-sm text-gray-500 mt-2">
                        Seus artigos publicados aparecerão aqui
                      </p>
                      <Button 
                        onClick={() => window.location.hash = 'articles'}
                        className="font-montserrat text-white mt-4"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        Produzir Artigos
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Legenda e estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="font-montserrat text-sm text-gray-600">Publicado ({publishedCount})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
            <span className="font-montserrat text-sm text-gray-600">Agendado ({scheduledCount})</span>
          </div>
          {selectedSiteId !== 'all' && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-purple-100 text-purple-800">
                <Filter size={12} className="mr-1" />
                {getSelectedSiteName()}
              </Badge>
            </div>
          )}
        </div>
        
        {allPostsIncludingStored.length === 0 && selectedSiteId === 'all' && (
          <div className="text-center sm:text-right">
            <p className="font-montserrat text-sm text-gray-500">
              Use "Agendar Posts" para começar
            </p>
          </div>
        )}
      </div>
    </div>
  );
}