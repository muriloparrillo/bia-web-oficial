import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { History, CheckCircle, ExternalLink, CalendarDays, Globe, FileText, Clock, Eye } from '../icons';
import { useBia } from '../BiaContext';

interface HistoricoProps {
  userData: any;
}

export function Historico({ userData }: HistoricoProps) {
  const { state } = useBia();
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getFilteredArticles = () => {
    // Usar state.articles em vez de state.temas
    let filtered = [...state.articles];
    
    // Filtrar por status se não for 'all'
    if (filterStatus !== 'all') {
      filtered = filtered.filter(article => article.status === filterStatus);
    }

    // Ordenar
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      filtered.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }

    return filtered;
  };

  const filteredArticles = getFilteredArticles();
  const publishedArticles = state.articles.filter(a => a.status === 'Publicado');
  const completedArticles = state.articles.filter(a => a.status === 'Concluído');
  const scheduledArticles = state.articles.filter(a => a.status === 'Agendado');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Publicado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Concluído':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'Agendado':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Publicado':
        return 'bg-green-100 text-green-800';
      case 'Concluído':
        return 'bg-blue-100 text-blue-800';
      case 'Agendado':
        return 'bg-orange-100 text-orange-800';
      case 'Produzindo':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-poppins text-3xl text-black mb-2">Histórico</h1>
          <p className="font-montserrat text-gray-600">Acompanhe todos os artigos processados e suas atividades</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40 font-montserrat">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Publicado">Publicado</SelectItem>
              <SelectItem value="Agendado">Agendado</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-40 font-montserrat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Por Data</SelectItem>
              <SelectItem value="title">Por Título</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas do histórico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
            <p className="font-poppins text-2xl text-green-800">{publishedArticles.length}</p>
            <p className="font-montserrat text-sm text-green-600">Publicados</p>
          </CardContent>
        </Card>
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <FileText size={24} className="mx-auto text-blue-600 mb-2" />
            <p className="font-poppins text-2xl text-blue-800">{completedArticles.length}</p>
            <p className="font-montserrat text-sm text-blue-600">Concluídos</p>
          </CardContent>
        </Card>
        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <Clock size={24} className="mx-auto text-orange-600 mb-2" />
            <p className="font-poppins text-2xl text-orange-800">{scheduledArticles.length}</p>
            <p className="font-montserrat text-sm text-orange-600">Agendados</p>
          </CardContent>
        </Card>
        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <CalendarDays size={24} className="mx-auto text-purple-600 mb-2" />
            <p className="font-poppins text-2xl text-purple-800">
              {state.articles.filter(a => {
                const articleDate = new Date(a.updatedAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return articleDate >= thirtyDaysAgo && a.status === 'Concluído';
              }).length}
            </p>
            <p className="font-montserrat text-sm text-purple-600">Últimos 30 dias</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
            <History size={20} style={{ color: '#8B5FBF' }} />
            <span>
              {filterStatus === 'all' 
                ? `Todos os Artigos (${filteredArticles.length})` 
                : `Artigos ${filterStatus} (${filteredArticles.length})`
              }
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div key={article.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-montserrat font-medium text-black flex-1 mr-4">{article.titulo}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Criado:</span><br />
                        {formatDate(article.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">Atualizado:</span><br />
                        {formatDate(article.updatedAt)}
                      </div>
                      <div>
                        <span className="font-medium">Site:</span><br />
                        {article.siteId 
                          ? state.sites.find(s => s.id === article.siteId)?.nome || 'Site não encontrado'
                          : 'Não vinculado'
                        }
                      </div>
                    </div>

                    {article.conteudo && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="font-montserrat text-sm text-gray-700 line-clamp-2">
                          {article.conteudo.length > 200 
                            ? `${article.conteudo.substring(0, 200)}...` 
                            : article.conteudo
                          }
                        </p>
                      </div>
                    )}

                    {article.scheduledDate && (
                      <div className="mt-2 p-2 bg-orange-50 rounded border-l-4 border-orange-400">
                        <p className="font-montserrat text-xs text-orange-700">
                          📅 Agendado para: {formatDate(article.scheduledDate)}
                        </p>
                      </div>
                    )}

                    {article.publishedDate && (
                      <div className="mt-2 p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="font-montserrat text-xs text-green-700">
                          ✅ Publicado em: {formatDate(article.publishedDate)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <Badge className={`font-montserrat ${getStatusColor(article.status)}`}>
                      {getStatusIcon(article.status)}
                      <span className="ml-1">{article.status}</span>
                    </Badge>
                    
                    {article.status === 'Concluído' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-montserrat"
                        onClick={() => {
                          // Processar conteúdo e abrir preview
                          let processedContent = article.conteudo
                            .replace(/### (.*?)(\\n|$)/g, '<h3 style=\"color: #333; margin: 20px 0 10px 0;\">$1</h3>')
                            .replace(/## (.*?)(\\n|$)/g, '<h2 style=\"color: #333; margin: 25px 0 15px 0;\">$1</h2>')
                            .replace(/# (.*?)(\\n|$)/g, '<h1 style=\"color: #333; margin: 30px 0 20px 0;\">$1</h1>')
                            .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')
                            .replace(/\\*(.*?)\\*/g, '<em>$1</em>')
                            .replace(/\\n\\n/g, '</p><p style=\"line-height: 1.6; margin: 15px 0;\">')
                            .replace(/\\n/g, '<br>');

                          if (!processedContent.startsWith('<')) {
                            processedContent = '<p style=\"line-height: 1.6; margin: 15px 0;\">' + processedContent + '</p>';
                          }

                          const htmlContent = `
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta charset=\"UTF-8\">
                                <title>${article.titulo}</title>
                                <style>
                                  body { 
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                                    max-width: 900px; 
                                    margin: 0 auto; 
                                    padding: 40px 20px; 
                                    line-height: 1.7;
                                    color: #333;
                                    background: #f9f9f9;
                                  }
                                  .container {
                                    background: white;
                                    padding: 40px;
                                    border-radius: 10px;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                                  }
                                  h1 { 
                                    color: #2c3e50; 
                                    border-bottom: 3px solid #8B5FBF; 
                                    padding-bottom: 15px;
                                  }
                                  .footer {
                                    margin-top: 40px;
                                    padding-top: 20px;
                                    border-top: 1px solid #eee;
                                    font-size: 0.9em;
                                    color: #666;
                                    text-align: center;
                                  }
                                </style>
                              </head>
                              <body>
                                <div class=\"container\">
                                  ${processedContent}
                                  <div class=\"footer\">
                                    <p><em>Artigo produzido pela BIA - Blog Infinito Automático</em></p>
                                    <p>Status: ${article.status} | Criado em: ${formatDate(article.createdAt)}</p>
                                  </div>
                                </div>
                              </body>
                            </html>
                          `;
                          const blob = new Blob([htmlContent], { type: 'text/html' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }}
                      >
                        <Eye className="mr-1" size={14} />
                        Visualizar
                      </Button>
                    )}

                    {(article.status === 'Publicado' || article.status === 'Agendado') && article.wpPostUrl && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-montserrat border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          window.open(article.wpPostUrl, '_blank');
                        }}
                      >
                        <ExternalLink className="mr-1" size={14} />
                        Ver no WordPress
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-poppins text-lg text-gray-600 mb-2">
                {filterStatus === 'all' 
                  ? 'Nenhum artigo no histórico' 
                  : `Nenhum artigo com status "${filterStatus}"`
                }
              </h3>
              <p className="font-montserrat text-gray-500 mb-4">
                {filterStatus === 'all' 
                  ? 'Produza alguns artigos para vê-los aparecer aqui.'
                  : 'Tente alterar o filtro ou produzir mais artigos.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button 
                  className="font-montserrat text-white"
                  style={{ backgroundColor: '#8B5FBF' }}
                  onClick={() => window.location.hash = 'articles'}
                >
                  Produzir Artigos
                </Button>
                {filterStatus !== 'all' && (
                  <Button 
                    variant="outline"
                    className="font-montserrat"
                    onClick={() => setFilterStatus('all')}
                  >
                    Ver Todos
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo de atividades */}
      {state.articles.length > 0 && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="font-poppins text-lg text-blue-800">
              Resumo de Atividades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Estatísticas Gerais:</h4>
                <ul className="space-y-1 font-montserrat text-blue-700">
                  <li>• Total de artigos: {state.articles.length}</li>
                  <li>• Artigos concluídos: {completedArticles.length}</li>
                  <li>• Artigos publicados: {publishedArticles.length}</li>
                  <li>• Artigos agendados: {scheduledArticles.length}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Sites Conectados:</h4>
                <ul className="space-y-1 font-montserrat text-blue-700">
                  {state.sites.length > 0 ? (
                    state.sites.map(site => (
                      <li key={site.id}>
                        • {site.nome} ({site.status})
                      </li>
                    ))
                  ) : (
                    <li>• Nenhum site conectado</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}