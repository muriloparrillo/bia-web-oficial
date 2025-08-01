import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Edit3, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Eye,
  ExternalLink,
  Zap,
  PlayCircle,
  Settings,
  Send,
  CalendarDays,
  Trash2,
  Globe,
  Star,
  Plus,
  Lightbulb
} from '../icons';
import { useBia } from '../BiaContext';
import { FREE_PLAN_LIMITS, getPlanLimits } from '../../utils/constants';
import { toast } from 'sonner';
import { contentService, ContentGenerationParams } from '../../services/contentService';
import { wordpressService } from '../../services/wordpressService';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ProduzirArtigosProps {
  userData: any;
}

export function ProduzirArtigos({ userData }: ProduzirArtigosProps) {
  const { state, actions } = useBia();
  
  // Estados de seleção
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set());
  
  // Estados para operações individuais
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [publishingItems, setPublishingItems] = useState<Set<number>>(new Set());
  const [schedulingItems, setSchedulingItems] = useState<Set<number>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  
  // Estados para agendamento
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [currentSchedulingArticle, setCurrentSchedulingArticle] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('08:00');

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  // Cache WordPress
  const [wordpressSitesCache, setWordpressSitesCache] = useState<Map<string, boolean>>(new Map());

  // Forçar sincronização do WordPress ao carregar a página
  useEffect(() => {
    const syncWordPress = async () => {
      try {
        console.log('🔄 Sincronizando WordPress na ProduzirArtigos...');
        await wordpressService.syncFromBiaContext();
        
        // Carregar cache de sites WordPress
        const wpSites = wordpressService.getSites();
        const cache = new Map<string, boolean>();
        wpSites.forEach(site => {
          cache.set(site.id, !!(site.url && site.username && site.applicationPassword));
        });
        setWordpressSitesCache(cache);
        
        console.log('✅ Sincronização WordPress concluída, cache carregado:', cache.size);
      } catch (error) {
        console.warn('⚠️ Erro na sincronização WordPress:', error);
      }
    };
    
    syncWordPress();
  }, []);

  // Verificar limites do plano
  const limits = actions.checkFreePlanLimits();
  const isFreePlan = actions.isFreePlan();
  const userPlan = userData?.plano || 'Free';
  const planLimits = getPlanLimits(userPlan);

  // Filtrar ideias disponíveis (não excluídas)
  const availableIdeas = useMemo(() => {
    return state.ideas.filter(idea => idea.status !== 'excluido');
  }, [state.ideas]);

  // Paginação
  const totalPages = Math.ceil(availableIdeas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageIdeas = useMemo(() => {
    return availableIdeas.slice(startIndex, endIndex);
  }, [availableIdeas, startIndex, endIndex]);

  // Estatísticas
  const articlesUsed = useMemo(() => 
    state.articles.filter(a => a.status === 'Concluído').length, 
    [state.articles]
  );
  const articlesRemaining = Math.max(0, planLimits.articles - articlesUsed);
  const progressValue = (articlesUsed / planLimits.articles) * 100;

  // FUNÇÕES DE SELEÇÃO
  const handleSelectIdea = useCallback((ideaId: number, checked: boolean) => {
    setSelectedIdeas(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(ideaId);
      } else {
        newSelection.delete(ideaId);
      }
      return newSelection;
    });
  }, []);

  const handleSelectAllIdeas = useCallback((checked: boolean) => {
    if (checked) {
      const currentPageIds = currentPageIdeas.map(idea => idea.id);
      setSelectedIdeas(new Set(currentPageIds));
    } else {
      setSelectedIdeas(new Set());
    }
  }, [currentPageIdeas]);

  // Verificar se todas as ideias da página atual estão selecionadas
  const allCurrentPageSelected = useMemo(() => {
    const currentPageIds = currentPageIdeas.map(idea => idea.id);
    return currentPageIds.length > 0 && currentPageIds.every(id => selectedIdeas.has(id));
  }, [currentPageIdeas, selectedIdeas]);

  // FUNÇÃO PARA CONTAR PALAVRAS
  const countWords = useCallback((htmlContent: string): number => {
    if (!htmlContent) return 0;
    
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').trim();
    const words = textContent.split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }, []);

  // FUNÇÃO DE PRODUÇÃO INDIVIDUAL
  const handleProduceFromIdea = useCallback(async (ideaId: number) => {
    if (!limits.articles) {
      toast.error(`Limite atingido! Seu plano permite apenas ${planLimits.articles} artigos.`);
      return;
    }

    const idea = state.ideas.find(i => i.id === ideaId);
    if (!idea) {
      toast.error('Ideia não encontrada');
      return;
    }

    setLoadingItems(prev => new Set([...prev, ideaId]));

    try {
      const generationParams: ContentGenerationParams = {
        tema: idea.titulo,
        nicho: idea.generationParams?.nicho || idea.categoria || 'Geral',
        palavrasChave: idea.generationParams?.palavrasChave || idea.tags?.join(', ') || '',
        idioma: idea.generationParams?.idioma || 'Português',
        contexto: idea.generationParams?.contexto,
        siteId: idea.siteId || 0,
        ideaId: ideaId,
        cta: idea.cta || undefined
      };

      const result = await contentService.generateContent(generationParams);

      if (!result.success) {
        toast.error(`Erro ao produzir artigo: ${result.error}`);
        return;
      }

      const articleData = {
        titulo: idea.titulo,
        conteudo: result.content || '',
        status: 'Concluído' as const,
        siteId: idea.siteId,
        ideaId: ideaId,
        imageUrl: result.imageUrl,
        wordpressData: idea.wordpressData,
        generationParams: idea.generationParams
      };

      const success = actions.addArticle(articleData);
      
      if (success) {
        actions.updateIdea(ideaId, { 
          status: 'produzido',
          articleId: Date.now()
        });
        
        toast.success(result.imageUrl 
          ? 'Artigo produzido com sucesso! (Conteúdo + Imagem gerada)'
          : 'Artigo produzido com sucesso!'
        );
      }

    } catch (error) {
      console.error('❌ Erro ao produzir artigo:', error);
      toast.error('Erro inesperado ao produzir artigo. Tente novamente.');
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(ideaId);
        return newSet;
      });
    }
  }, [limits.articles, planLimits.articles, state.ideas, actions]);

  // Verificar se uma ideia foi produzida
  const isIdeaProduced = useCallback((ideaId: number) => {
    const idea = state.ideas.find(i => i.id === ideaId);
    return idea?.status === 'produzido';
  }, [state.ideas]);

  // Obter artigo relacionado à ideia
  const getArticleFromIdea = useCallback((ideaId: number) => {
    return state.articles.find(a => a.ideaId === ideaId);
  }, [state.articles]);

  // Função para visualizar artigo
  const openArticleInNewTab = useCallback((article: any) => {
    const wordCount = countWords(article.conteudo);
    const articleWindow = window.open('', '_blank');
    if (articleWindow) {
      articleWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${article.titulo}</title>
          <style>
            body { font-family: 'Montserrat', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #fff; }
            .article-title { font-family: 'Poppins', Arial, sans-serif; font-size: 2rem; margin-bottom: 20px; color: #8B5FBF; line-height: 1.3; }
            .article-meta { color: #666; margin-bottom: 20px; font-size: 0.9rem; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .article-content { line-height: 1.6; color: #333; }
            .article-content h2 { color: #8B5FBF; margin-top: 30px; }
            .article-content h3 { color: #6B4C93; margin-top: 25px; }
            .article-image { width: 100%; max-width: 600px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          </style>
        </head>
        <body>
          <h1 class="article-title">${article.titulo}</h1>
          <div class="article-meta">
            📅 Criado em ${new Date(article.createdAt).toLocaleDateString('pt-BR')} • 📊 ${wordCount} palavras
          </div>
          ${article.imageUrl ? `<img src="${article.imageUrl}" alt="${article.titulo}" class="article-image" />` : ''}
          <div class="article-content">${article.conteudo || '<p>Conteúdo não disponível</p>'}</div>
        </body>
        </html>
      `);
      articleWindow.document.close();
    }
  }, [countWords]);

  // VERIFICAÇÃO WORDPRESS OTIMIZADA
  const hasWordPressIntegration = useCallback((article: any) => {
    const cached = wordpressSitesCache.get(article.siteId.toString());
    if (cached !== undefined) {
      return cached;
    }

    const site = state.sites.find(s => s.id === article.siteId);
    const hasIntegration = !!(site && site.wordpressUrl && site.wordpressUsername && site.wordpressPassword);
    
    setWordpressSitesCache(prev => new Map(prev).set(article.siteId.toString(), hasIntegration));
    
    return hasIntegration;
  }, [wordpressSitesCache, state.sites]);

  // FUNÇÃO PARA PUBLICAR ARTIGO
  const handlePublishArticle = useCallback(async (article: any) => {
    if (publishingItems.has(article.id)) return;
    
    setPublishingItems(prev => new Set([...prev, article.id]));
    
    try {
      if (!hasWordPressIntegration(article)) {
        toast.error('Site não possui integração WordPress configurada. Configure na aba "Meus Sites".');
        return;
      }

      const result = await wordpressService.publishPost(article.siteId.toString(), {
        title: article.titulo,
        content: article.conteudo,
        status: 'publish',
        categories: article.wordpressData?.categorias || [],
        tags: article.wordpressData?.tags || [],
        author: article.wordpressData?.autor || 1,
        excerpt: article.conteudo ? article.conteudo.substring(0, 150) + '...' : undefined,
        featured_media: article.imageUrl ? { imageUrl: article.imageUrl, alt: article.titulo } : undefined
      });

      if (result.success && result.postUrl) {
        actions.updateArticle(article.id, {
          ...article,
          publishedUrl: result.postUrl,
          publishedDate: new Date().toISOString(),
          wordpressPostId: result.postId
        });
        
        toast.success('Artigo publicado com sucesso no WordPress!');
      } else {
        const errorMsg = result.error || 'Erro desconhecido na publicação';
        toast.error(`Erro ao publicar: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Erro crítico na publicação:', error);
      toast.error('Erro inesperado ao publicar artigo. Verifique sua conexão.');
    } finally {
      setPublishingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(article.id);
        return newSet;
      });
    }
  }, [publishingItems, actions, hasWordPressIntegration]);

  // FUNÇÃO PARA AGENDAR ARTIGO
  const handleScheduleArticle = useCallback(async (article: any) => {
    if (!hasWordPressIntegration(article)) {
      toast.error('Este artigo não possui integração WordPress configurada. Configure na aba "Meus Sites".');
      return;
    }
    
    setCurrentSchedulingArticle(article.id);
    setSelectedDate(undefined);
    setSelectedTime('08:00');
    setScheduleDialogOpen(true);
  }, [hasWordPressIntegration]);

  // Confirmar agendamento individual
  const confirmScheduleArticle = useCallback(async () => {
    if (!currentSchedulingArticle || !selectedDate || !selectedTime) {
      toast.error('Selecione uma data e horário para o agendamento');
      return;
    }

    const article = state.articles.find(a => a.id === currentSchedulingArticle);
    if (!article) return;

    setSchedulingItems(prev => new Set([...prev, currentSchedulingArticle]));

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      if (scheduledDateTime <= new Date()) {
        toast.error('A data e horário devem ser no futuro');
        return;
      }

      const result = await wordpressService.publishPost(article.siteId.toString(), {
        title: article.titulo,
        content: article.conteudo,
        status: 'future',
        date: scheduledDateTime.toISOString(),
        categories: article.wordpressData?.categorias || [],
        tags: article.wordpressData?.tags || [],
        author: article.wordpressData?.autor || 1,
        excerpt: article.conteudo ? article.conteudo.substring(0, 150) + '...' : undefined,
        featured_media: article.imageUrl ? { imageUrl: article.imageUrl, alt: article.titulo } : undefined
      });

      if (result.success) {
        actions.updateArticle(article.id, {
          ...article,
          scheduledDate: scheduledDateTime.toISOString(),
          wordpressPostId: result.postId,
          scheduledUrl: result.postUrl
        });
        
        toast.success(`Artigo agendado para ${scheduledDateTime.toLocaleDateString('pt-BR')} às ${selectedTime}!`);
        setScheduleDialogOpen(false);
        setCurrentSchedulingArticle(null);
      } else {
        toast.error(`Erro ao agendar artigo: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao agendar artigo:', error);
      toast.error('Erro inesperado ao agendar artigo');
    } finally {
      setSchedulingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentSchedulingArticle!);
        return newSet;
      });
    }
  }, [currentSchedulingArticle, selectedDate, selectedTime, state.articles, actions]);

  // FUNÇÃO PARA EXCLUIR IDEIA
  const handleDeleteIdea = useCallback(async (ideaId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta ideia?')) {
      return;
    }

    setDeletingItems(prev => new Set([...prev, ideaId]));

    try {
      actions.updateIdea(ideaId, { 
        status: 'excluido', 
        deletedDate: new Date().toISOString() 
      });
      
      toast.success('Ideia excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir ideia:', error);
      toast.error('Erro ao excluir ideia');
    } finally {
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(ideaId);
        return newSet;
      });
    }
  }, [actions]);

  // Renderizar status da ideia/artigo
  const renderStatus = useCallback((idea: any) => {
    const article = getArticleFromIdea(idea.id);
    
    if (loadingItems.has(idea.id)) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Produzindo...
        </Badge>
      );
    }
    
    if (article) {
      if (article.publishedUrl) {
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            Publicado
          </Badge>
        );
      }
      
      if (article.scheduledDate) {
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Clock className="mr-1 h-3 w-3" />
            Agendado
          </Badge>
        );
      }
      
      return (
        <Badge className="bg-orange-100 text-orange-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          Produzido
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-gray-600">
        <AlertCircle className="mr-1 h-3 w-3" />
        Pendente
      </Badge>
    );
  }, [getArticleFromIdea, loadingItems]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-black mb-2">Produzir Artigos</h1>
        <p className="font-montserrat text-gray-600">Transforme suas ideias em conteúdo completo usando IA avançada</p>
      </div>

      {/* Status do usuário */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-montserrat text-sm text-blue-700">
                <strong>Plano {userData?.plano || 'Free'}:</strong> {articlesRemaining} artigos restantes
              </p>
              <p className="font-montserrat text-xs text-blue-600 mt-1">
                {articlesUsed} de {planLimits.articles} artigos utilizados
              </p>
            </div>
            <div className="w-full sm:w-48">
              <Progress value={progressValue} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta de limite */}
      {!limits.articles && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 font-montserrat">
            <strong>Limite atingido!</strong> Você utilizou todos os {planLimits.articles} artigos do seu plano.
            {isFreePlan && ' Faça upgrade para produzir mais conteúdo.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de ideias */}
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              Seus Temas ({availableIdeas.length})
            </div>
            {selectedIdeas.size > 0 && (
              <Badge className="bg-purple-100 text-purple-700">
                {selectedIdeas.size} selecionado{selectedIdeas.size > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPageIdeas.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-poppins text-gray-500 mb-2">Nenhum tema encontrado</h3>
              <p className="font-montserrat text-gray-400 text-sm">
                Vá para a aba "Gerar Ideias" para começar a criar conteúdo
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tabela responsiva */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center p-3 font-poppins text-sm w-[50px]">
                        <Checkbox
                          checked={allCurrentPageSelected}
                          onCheckedChange={handleSelectAllIdeas}
                          className="mx-auto"
                        />
                      </th>
                      <th className="text-left p-3 font-poppins text-sm">Tema</th>
                      <th className="text-center p-3 font-poppins text-sm min-w-[100px]">Produzir</th>
                      <th className="text-center p-3 font-poppins text-sm min-w-[100px]">Agendar</th>
                      <th className="text-center p-3 font-poppins text-sm min-w-[120px]">Publicar</th>
                      <th className="text-center p-3 font-poppins text-sm min-w-[80px]">Excluir</th>
                      <th className="text-center p-3 font-poppins text-sm min-w-[100px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPageIdeas.map((idea) => {
                      const article = getArticleFromIdea(idea.id);
                      const isProduced = !!article;
                      const isLoading = loadingItems.has(idea.id);
                      const isPublishing = article && publishingItems.has(article.id);
                      const isScheduling = article && schedulingItems.has(article.id);
                      const isDeleting = deletingItems.has(idea.id);
                      const hasWPIntegration = article ? hasWordPressIntegration(article) : false;
                      const isPublished = article && !!article.publishedUrl;
                      const isScheduled = article && !!article.scheduledDate;

                      return (
                        <tr key={idea.id} className="border-b hover:bg-gray-50">
                          {/* Coluna Selecionar */}
                          <td className="p-3 text-center">
                            <Checkbox
                              checked={selectedIdeas.has(idea.id)}
                              onCheckedChange={(checked) => handleSelectIdea(idea.id, checked as boolean)}
                            />
                          </td>

                          {/* Coluna Tema */}
                          <td className="p-3">
                            <div className="space-y-1">
                              <h4 className="font-montserrat text-sm text-black line-clamp-2">
                                {idea.titulo}
                              </h4>
                              <div className="flex flex-wrap gap-1">
                                {idea.categoria && (
                                  <Badge variant="outline" className="text-xs">
                                    {idea.categoria}
                                  </Badge>
                                )}
                                {idea.tags?.slice(0, 2).map((tag, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </td>

                          {/* Coluna Produzir */}
                          <td className="p-3 text-center">
                            {!isProduced ? (
                              <Button
                                size="sm"
                                onClick={() => handleProduceFromIdea(idea.id)}
                                disabled={isLoading || !limits.articles}
                                className="font-montserrat text-white"
                                style={{ backgroundColor: '#8B5FBF' }}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Produzindo...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="mr-1 h-3 w-3" />
                                    Produzir
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openArticleInNewTab(article)}
                                className="font-montserrat border-green-500 text-green-600 hover:bg-green-50"
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Ver Artigo
                              </Button>
                            )}
                          </td>

                          {/* Coluna Agendar */}
                          <td className="p-3 text-center">
                            {isProduced && hasWPIntegration && !isPublished && !isScheduled ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleScheduleArticle(article)}
                                disabled={isScheduling}
                                className="font-montserrat border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                {isScheduling ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Calendar className="mr-1 h-3 w-3" />
                                )}
                                Agendar
                              </Button>
                            ) : isScheduled ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="font-montserrat border-blue-500 text-blue-600"
                                disabled
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                {new Date(article.scheduledDate).toLocaleDateString('pt-BR')}
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>

                          {/* Coluna Publicar */}
                          <td className="p-3 text-center">
                            {isProduced && hasWPIntegration && !isPublished && !isScheduled ? (
                              <Button
                                size="sm"
                                onClick={() => handlePublishArticle(article)}
                                disabled={isPublishing}
                                className="font-montserrat text-white"
                                style={{ backgroundColor: '#8B5FBF' }}
                              >
                                {isPublishing ? (
                                  <>
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    Publicando...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-1 h-3 w-3" />
                                    Publicar
                                  </>
                                )}
                              </Button>
                            ) : isPublished ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(article.publishedUrl, '_blank')}
                                className="font-montserrat border-green-500 text-green-600 hover:bg-green-50"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                Ver Online
                              </Button>
                            ) : !hasWPIntegration && isProduced ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="font-montserrat border-gray-300 text-gray-500"
                                title="Configure WordPress na aba 'Meus Sites'"
                              >
                                <Settings className="mr-1 h-3 w-3" />
                                Config. WP
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>

                          {/* Coluna Excluir */}
                          <td className="p-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteIdea(idea.id)}
                              disabled={isDeleting}
                              className="font-montserrat border-red-500 text-red-600 hover:bg-red-50"
                            >
                              {isDeleting ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="mr-1 h-3 w-3" />
                              )}
                              Excluir
                            </Button>
                          </td>

                          {/* Coluna Status */}
                          <td className="p-3 text-center">
                            {renderStatus(idea)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="font-montserrat"
                  >
                    Anterior
                  </Button>
                  
                  <span className="font-montserrat text-sm px-3">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="font-montserrat"
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de agendamento */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins">Agendar Publicação</DialogTitle>
            <DialogDescription className="font-montserrat">
              Selecione a data e horário para publicar o artigo no WordPress
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="font-montserrat">Data</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            
            <div>
              <Label className="font-montserrat">Horário</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="font-montserrat"
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setScheduleDialogOpen(false)}
                className="font-montserrat flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmScheduleArticle}
                disabled={!selectedDate || !selectedTime}
                className="font-montserrat flex-1 text-white"
                style={{ backgroundColor: '#8B5FBF' }}
              >
                Confirmar Agendamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}