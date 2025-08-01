import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, AlertCircle, Loader2, CheckCircle, Clock, Monitor } from '../icons';
import { useBia } from '../BiaContext';
import { toast } from 'sonner';

interface AgendarPostsProps {
  userData: any;
}

export function AgendarPosts({ userData }: AgendarPostsProps) {
  const { state, actions } = useBia();
  
  const [formData, setFormData] = useState({
    siteId: '',
    total: 1,
    quantidade: 1,
    frequencia: 'diaria',
    horario: '08:00'
  });

  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([]);

  // Sites WordPress conectados (verificar se tem configuração WordPress)
  const connectedSites = state.sites.filter(site => 
    site.status === 'ativo' && site.wordpressUrl && site.wordpressUsername && site.wordpressPassword
  );

  // Artigos concluídos disponíveis para agendamento (filtrados por site selecionado)
  const availableArticles = state.articles.filter(article => {
    const isCompleted = article.status === 'Concluído';
    const isSiteSelected = formData.siteId ? article.siteId.toString() === formData.siteId : true;
    return isCompleted && isSiteSelected;
  });

  // Site selecionado
  const selectedSite = formData.siteId 
    ? connectedSites.find(site => site.id.toString() === formData.siteId)
    : null;

  // Carregar posts agendados do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('scheduledPosts');
    if (saved) {
      try {
        setScheduledPosts(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar posts agendados:', error);
      }
    }
  }, []);

  // Salvar posts agendados no localStorage
  const saveScheduledPosts = (posts: any[]) => {
    setScheduledPosts(posts);
    localStorage.setItem('scheduledPosts', JSON.stringify(posts));
  };

  // Atualizar total baseado nos artigos disponíveis
  useEffect(() => {
    if (availableArticles.length > 0 && formData.total > availableArticles.length) {
      setFormData(prev => ({
        ...prev,
        total: Math.min(10, availableArticles.length)
      }));
    }
  }, [availableArticles.length, formData.total]);

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'diaria': return 'Diária';
      case 'semanal': return 'Semanal';
      case 'mensal': return 'Mensal';
      default: return freq;
    }
  };

  const calculateNextDates = (total: number, frequencia: string, quantidade: number) => {
    const dates = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // Começar amanhã
    
    let remaining = total;
    while (remaining > 0) {
      const postsThisPeriod = Math.min(quantidade, remaining);
      
      for (let i = 0; i < postsThisPeriod; i++) {
        const postDate = new Date(currentDate);
        postDate.setHours(parseInt(formData.horario.split(':')[0]));
        postDate.setMinutes(parseInt(formData.horario.split(':')[1]));
        
        if (i > 0) {
          // Se mais de um post no mesmo período, espaçar por algumas horas
          postDate.setHours(postDate.getHours() + (i * 2));
        }
        
        dates.push(postDate);
        remaining--;
      }
      
      // Próximo período
      switch (frequencia) {
        case 'diaria':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'semanal':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'mensal':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
      }
    }
    
    return dates;
  };

  const handleSchedule = async () => {
    if (!formData.siteId) {
      toast.error('Selecione um site para agendar os posts.');
      return;
    }

    if (availableArticles.length === 0) {
      toast.error(`Você não tem artigos concluídos disponíveis para o site ${selectedSite?.nome || 'selecionado'}.`);
      return;
    }

    if (formData.total > availableArticles.length) {
      toast.error(`Você só tem ${availableArticles.length} artigos disponíveis para este site.`);
      return;
    }

    setIsScheduling(true);

    try {
      // Simular agendamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const dates = calculateNextDates(formData.total, formData.frequencia, formData.quantidade);
      const articlesToSchedule = availableArticles.slice(0, formData.total);
      
      const newScheduledPosts = articlesToSchedule.map((article, index) => ({
        id: Date.now() + index,
        articleId: article.id,
        title: article.titulo,
        content: article.conteudo,
        scheduledDate: dates[index].toISOString(),
        status: 'pending',
        siteId: selectedSite!.id, // Usar o site selecionado
        siteName: selectedSite!.nome,
        createdAt: new Date().toISOString()
      }));

      // Atualizar artigos para status 'Agendado'
      for (const article of articlesToSchedule) {
        actions.updateArticle(article.id, { 
          status: 'Agendado',
          scheduledDate: dates[articlesToSchedule.indexOf(article)].toISOString()
        });
      }

      // Salvar posts agendados
      const updatedScheduledPosts = [...scheduledPosts, ...newScheduledPosts];
      saveScheduledPosts(updatedScheduledPosts);

      toast.success(`${formData.total} posts agendados com sucesso!`);
      
      // Reset form (mantendo o site selecionado)
      setFormData({
        siteId: formData.siteId,
        total: 1,
        quantidade: 1,
        frequencia: 'diaria',
        horario: '08:00'
      });

    } catch (error) {
      toast.error('Erro ao agendar posts. Tente novamente.');
    } finally {
      setIsScheduling(false);
    }
  };

  const pendingScheduledPosts = scheduledPosts.filter(p => p.status === 'pending');

  const calculateEndDate = () => {
    const dates = calculateNextDates(formData.total, formData.frequencia, formData.quantidade);
    if (dates.length > 0) {
      return dates[dates.length - 1].toLocaleDateString('pt-BR');
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Agendar Posts</h1>
        <p className="font-montserrat text-gray-600">Configure o agendamento automático dos seus posts</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-montserrat text-sm text-green-600">
                  {formData.siteId ? `Artigos Disponíveis (${selectedSite?.nome})` : 'Artigos Disponíveis'}
                </p>
                <p className="font-poppins text-2xl text-green-800">{availableArticles.length}</p>
              </div>
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-montserrat text-sm text-blue-600">Sites Conectados</p>
                <p className="font-poppins text-2xl text-blue-800">{connectedSites.length}</p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-orange-200 bg-orange-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-montserrat text-sm text-orange-600">Posts Agendados</p>
                <p className="font-poppins text-2xl text-orange-800">{pendingScheduledPosts.length}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {!formData.siteId && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Selecione um site</strong> para ver os artigos disponíveis para agendamento.
          </AlertDescription>
        </Alert>
      )}

      {formData.siteId && availableArticles.length === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {selectedSite?.nome ? `O site "${selectedSite.nome}" não tem artigos` : 'Você não tem artigos'} <strong>concluídos</strong> disponíveis para agendamento.
            <button 
              onClick={() => window.location.hash = 'articles'}
              className="ml-1 text-orange-800 underline hover:no-underline"
            >
              Vá para "Produzir Artigos" primeiro →
            </button>
          </AlertDescription>
        </Alert>
      )}
      
      {connectedSites.length === 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Você precisa ter pelo menos um <strong>site WordPress conectado</strong> para agendar posts.
            <button 
              onClick={() => window.location.hash = 'sites'}
              className="ml-1 text-orange-800 underline hover:no-underline"
            >
              Vá para "Meus Sites" e configure WordPress →
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
              <Calendar size={20} style={{ color: '#8B5FBF' }} />
              <span>Configurações de Agendamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Site - PRIMEIRO CAMPO */}
            <div className="space-y-2">
              <Label htmlFor="siteId" className="font-montserrat flex items-center space-x-2">
                <Monitor size={16} />
                <span>Selecionar Site *</span>
              </Label>
              <Select 
                value={formData.siteId} 
                onValueChange={(value) => setFormData({...formData, siteId: value, total: 1})}
                disabled={isScheduling}
              >
                <SelectTrigger className="font-montserrat">
                  <SelectValue placeholder="Escolha um site WordPress conectado" />
                </SelectTrigger>
                <SelectContent>
                  {connectedSites.map(site => (
                    <SelectItem key={site.id} value={site.id.toString()}>
                      {site.nome} - {site.url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {connectedSites.length === 0 && (
                <p className="font-montserrat text-sm text-red-600">
                  Nenhum site WordPress conectado encontrado
                </p>
              )}
            </div>

            {/* Quantidade Total - só aparece quando site estiver selecionado */}
            {formData.siteId && (
              <div className="space-y-2">
                <Label htmlFor="total" className="font-montserrat">Quantidade Total de Posts</Label>
                <Input
                  id="total"
                  type="number"
                  min="1"
                  max={availableArticles.length || 1}
                  value={formData.total}
                  onChange={(e) => setFormData({...formData, total: parseInt(e.target.value) || 1})}
                  className="font-montserrat"
                  disabled={isScheduling || availableArticles.length === 0}
                />
                <p className="font-montserrat text-sm text-gray-500">
                  {availableArticles.length} artigos concluídos disponíveis para {selectedSite?.nome}
                </p>
              </div>
            )}

            {/* Configurações de agendamento - só aparecem quando site estiver selecionado */}
            {formData.siteId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="font-montserrat">Posts por Período</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({...formData, quantidade: parseInt(e.target.value) || 1})}
                    className="font-montserrat"
                    disabled={isScheduling}
                  />
                  <p className="font-montserrat text-sm text-gray-500">
                    Quantos posts publicar por período
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequencia" className="font-montserrat">Frequência</Label>
                  <Select 
                    value={formData.frequencia} 
                    onValueChange={(value) => setFormData({...formData, frequencia: value})}
                    disabled={isScheduling}
                  >
                    <SelectTrigger className="font-montserrat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario" className="font-montserrat">Horário de Publicação</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({...formData, horario: e.target.value})}
                    className="font-montserrat"
                    disabled={isScheduling}
                  />
                  <p className="font-montserrat text-sm text-gray-500">
                    Horário padrão para todas as publicações
                  </p>
                </div>
              </>
            )}

            {isScheduling && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="font-montserrat text-sm text-gray-600">Agendando posts...</span>
                </div>
              </div>
            )}

            {formData.siteId && (
              <Button 
                onClick={handleSchedule}
                disabled={isScheduling || !formData.siteId || availableArticles.length === 0 || formData.total > availableArticles.length}
                className="w-full font-montserrat text-white"
                style={{ backgroundColor: '#8B5FBF' }}
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2" size={16} />
                    Agendar {formData.total} Posts
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Prévia do agendamento - só aparece quando site estiver selecionado */}
        {formData.siteId && (
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="font-poppins text-xl text-blue-800">Prévia do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-blue-700">Site selecionado:</span>
                  <span className="font-montserrat text-sm font-medium text-blue-800">{selectedSite?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-blue-700">Total de posts:</span>
                  <span className="font-montserrat text-sm font-medium text-blue-800">{formData.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-blue-700">Frequência:</span>
                  <span className="font-montserrat text-sm font-medium text-blue-800">{getFrequencyLabel(formData.frequencia)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-blue-700">Posts por período:</span>
                  <span className="font-montserrat text-sm font-medium text-blue-800">{formData.quantidade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-montserrat text-sm text-blue-700">Horário:</span>
                  <span className="font-montserrat text-sm font-medium text-blue-800">{formData.horario}</span>
                </div>
                {calculateEndDate() && (
                  <div className="flex justify-between">
                    <span className="font-montserrat text-sm text-blue-700">Término previsto:</span>
                    <span className="font-montserrat text-sm font-medium text-blue-800">{calculateEndDate()}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-blue-200 pt-4">
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Cronograma:</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Primeiro post: Amanhã às {formData.horario}</li>
                  <li>• Publicação {formData.frequencia}</li>
                  <li>• {formData.quantidade} post(s) por vez</li>
                  <li>• Site: {selectedSite?.nome}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Posts agendados existentes */}
      {pendingScheduledPosts.length > 0 && (
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-poppins text-xl text-black">
              Posts Já Agendados ({pendingScheduledPosts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingScheduledPosts
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                .slice(0, 5)
                .map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-montserrat text-sm font-medium text-black">{post.title}</p>
                      <p className="font-montserrat text-xs text-gray-600">
                        {new Date(post.scheduledDate).toLocaleDateString('pt-BR')} às {new Date(post.scheduledDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {post.siteName && ` • ${post.siteName}`}
                      </p>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800">
                      <Calendar size={12} className="mr-1" />
                      Agendado
                    </Badge>
                  </div>
                ))}
              {pendingScheduledPosts.length > 5 && (
                <p className="font-montserrat text-sm text-gray-500 text-center pt-2">
                  E mais {pendingScheduledPosts.length - 5} posts...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="font-poppins text-lg text-blue-800">
            Dicas para Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-2 font-montserrat text-sm text-blue-700">
              <li>• Mantenha uma frequência consistente de publicação</li>
              <li>• Escolha horários com maior engajamento do seu público</li>
              <li>• Monitore o desempenho dos posts agendados</li>
            </ul>
            <ul className="space-y-2 font-montserrat text-sm text-blue-700">
              <li>• Prepare conteúdo suficiente antes de agendar</li>
              <li>• Ajuste a frequência conforme sua capacidade de produção</li>
              <li>• Use o calendário para visualizar as publicações</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}