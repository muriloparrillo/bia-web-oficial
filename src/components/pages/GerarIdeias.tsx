import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Lightbulb, CheckCircle, AlertCircle, Loader2, Zap, Monitor, RefreshCw, RotateCcw, User, Tag, FolderOpen, Megaphone, Image, Link, Type, Eye, ExternalLink, Edit3, ChevronRight, Plus } from '../icons';
import { useBia } from '../BiaContext';
import { FREE_PLAN_LIMITS, getPlanLimits, isFreePlan } from '../../utils/constants';
import { toast } from 'sonner';
import { wordpressService, WordPressCategory, WordPressAuthor, WordPressTag } from '../../services/wordpressService';
import { contentService, IdeaGenerationParams } from '../../services/contentService';

interface GerarIdeiasProps {
  userData: any;
  onPageChange?: (page: string) => void;
}

interface FormData {
  siteId: string;
  nicho: string;
  palavrasChave: string;
  quantidade: number;
  idioma: string;
  contexto: string;
  autor: string;
  categorias: string[];
  tags: string[];
  ctaTitulo: string;
  ctaDescricao: string;
  ctaBotao: string;
  ctaLink: string;
  ctaImagem: string;
  ctaPosicao: 'inicio' | 'meio' | 'final';
}

interface WordPressData {
  categories: WordPressCategory[];
  authors: WordPressAuthor[];
  tags: WordPressTag[];
}

export function GerarIdeias({ userData, onPageChange }: GerarIdeiasProps) {
  const { state, actions } = useBia();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    siteId: '',
    nicho: '',
    palavrasChave: '',
    quantidade: 5,
    idioma: 'Português',
    contexto: '',
    autor: 'none',
    categorias: [],
    tags: [],
    ctaTitulo: '',
    ctaDescricao: '',
    ctaBotao: '',
    ctaLink: '',
    ctaImagem: '',
    ctaPosicao: 'final'
  });

  const [wordpressData, setWordpressData] = useState<WordPressData>({
    categories: [],
    authors: [],
    tags: []
  });
  const [isLoadingWordPress, setIsLoadingWordPress] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Usar ref para evitar recarregamentos desnecessários
  const loadingRef = useRef<string | null>(null);
  const lastLoadedSiteRef = useRef<string | null>(null);

  // Verificar limites do plano e obter dados corretos
  const limits = actions.checkFreePlanLimits();
  const isFree = actions.isFreePlan();
  const userPlan = userData?.plano || 'Free';
  const planLimits = getPlanLimits(userPlan);

  // Filtrar apenas sites ativos - memorizar para evitar recriação
  const activeSites = React.useMemo(() => 
    state.sites.filter(site => site.status === 'ativo'), 
    [state.sites]
  );

  // Filtrar ideias pendentes para exibir na seção "Produzir a partir de Ideias"
  const pendingIdeas = React.useMemo(() => 
    state.ideas.filter(idea => idea.status === 'pendente'),
    [state.ideas]
  );

  // Estatísticas
  const ideasUsed = state.ideas.length;
  const ideasRemaining = isFree ? Math.max(0, planLimits.ideas - ideasUsed) : 'Ilimitado';
  const progressValue = isFree ? (ideasUsed / planLimits.ideas) * 100 : 0;

  // Verificar se tem dados suficientes para mostrar preview do CTA
  const hasCtaContent = formData.ctaTitulo || formData.ctaDescricao || formData.ctaBotao || formData.ctaLink;

  // Sincronizar dados WordPress na inicialização
  useEffect(() => {
    const syncWordPressData = async () => {
      try {
        await wordpressService.syncFromBiaContext();
      } catch (error) {
        console.warn('Erro ao sincronizar dados WordPress:', error);
      }
    };

    syncWordPressData();
  }, []);

  // Função para carregar dados já em cache do WordPress Service
  const loadCachedWordPressData = useCallback((site: any) => {
    try {
      console.log('🔍 Tentando carregar dados WordPress do cache para site:', site.nome);
      
      const cachedSite = wordpressService.getSiteById(site.id.toString());
      
      if (cachedSite) {
        const hasRealData = (cachedSite.categories?.length || 0) > 0 || 
                           (cachedSite.authors?.length || 0) > 0 || 
                           (cachedSite.tags?.length || 0) > 0;
        
        console.log('📦 Site encontrado no cache:', {
          categories: cachedSite.categories?.length || 0,
          authors: cachedSite.authors?.length || 0,
          tags: cachedSite.tags?.length || 0,
          hasRealData
        });
        
        if (hasRealData) {
          console.log('✅ Cache contém dados reais, usando cache');
          
          setWordpressData({
            categories: cachedSite.categories || [],
            authors: cachedSite.authors || [],
            tags: cachedSite.tags || []
          });
          
          setIsLoadingWordPress(false);
          return true; // Cache tem dados reais
        } else {
          console.log('⚠️ Cache existe mas está vazio, precisará carregar dados frescos');
          return false; // Cache vazio, precisa carregar dados frescos
        }
      } else {
        console.log('⚠️ Site não encontrado no cache do wordpressService');
      }
    } catch (error) {
      console.warn('❌ Erro ao carregar dados do cache:', error);
    }
    
    return false;
  }, []);

  const loadWordPressData = useCallback(async (site: any) => {
    // Evitar carregamentos duplicados
    const siteKey = `${site.id}-${site.wordpressUrl}`;
    if (loadingRef.current === siteKey) {
      console.log('🔄 Carregamento já em andamento para este site, ignorando...');
      return;
    }

    loadingRef.current = siteKey;
    setIsLoadingWordPress(true);
    
    try {
      console.log('🔄 Carregando dados FRESCOS do WordPress para site:', site.nome);
      
      // Verificar se tem dados WordPress obrigatórios
      if (!site.wordpressUrl || !site.wordpressUsername || !site.wordpressPassword) {
        console.warn('⚠️ Site não tem dados WordPress completos');
        setWordpressData({
          categories: [{ id: 1, name: 'Sem categoria', slug: 'sem-categoria', parent: 0 }],
          authors: [{ id: 1, name: 'Admin', slug: 'admin', description: 'Administrador' }],
          tags: []
        });
        lastLoadedSiteRef.current = siteKey;
        return;
      }

      // SEMPRE tentar recarregar dados frescos diretamente do wordpressService
      try {
        console.log('🚀 Forçando recarregamento de dados FRESCOS através do wordpressService...');
        
        const success = await wordpressService.reloadSiteData(site.id);
        
        if (success) {
          // Buscar dados atualizados do cache
          const updatedSite = wordpressService.getSiteById(site.id.toString());
          
          if (updatedSite && (updatedSite.categories.length > 0 || updatedSite.authors.length > 0)) {
            console.log('✅ Dados WordPress FRESCOS recarregados com sucesso:', {
              categories: updatedSite.categories.length,
              authors: updatedSite.authors.length,
              tags: updatedSite.tags.length
            });
            
            setWordpressData({
              categories: updatedSite.categories,
              authors: updatedSite.authors,
              tags: updatedSite.tags
            });
            
            lastLoadedSiteRef.current = siteKey;
            return; // Sucesso, dados frescos carregados
          }
        }
        
        console.warn('⚠️ wordpressService não conseguiu carregar dados frescos, tentando método direto...');
      } catch (serviceError) {
        console.warn('❌ Erro no wordpressService, tentando método direto:', serviceError);
      }

      // Se o wordpressService falhar, tentar método direto
      console.log('📡 Fallback: Buscando dados WordPress diretamente...');

      // Criar objeto de site compatível com o serviço WordPress
      const wpSite = {
        id: site.id.toString(),
        name: site.nome,
        url: site.wordpressUrl,
        username: site.wordpressUsername,
        applicationPassword: site.wordpressPassword,
        status: 'connected' as const,
        lastSync: new Date().toISOString(),
        postCount: 0,
        categories: [],
        authors: [],
        tags: [],
        isActive: true
      };

      // Buscar todos os dados em paralelo com Promise.allSettled para não falhar se uma API der erro
      const [categoriesResult, authorsResult, tagsResult] = await Promise.allSettled([
        wordpressService.getCategories(wpSite),
        wordpressService.getAuthors(wpSite),
        wordpressService.getTags(wpSite)
      ]);

      // Processar resultados
      const categories = categoriesResult.status === 'fulfilled' 
        ? categoriesResult.value 
        : [{ id: 1, name: 'Sem categoria', slug: 'sem-categoria', parent: 0 }];

      const authors = authorsResult.status === 'fulfilled' 
        ? authorsResult.value 
        : [{ id: 1, name: 'Admin', slug: 'admin', description: 'Administrador' }];

      const tags = tagsResult.status === 'fulfilled' 
        ? tagsResult.value 
        : [];

      console.log('✅ Dados WordPress obtidos (fallback):', {
        categories: categories.length,
        authors: authors.length,
        tags: tags.length,
        errors: [
          categoriesResult.status === 'rejected' ? 'categorias' : null,
          authorsResult.status === 'rejected' ? 'autores' : null,
          tagsResult.status === 'rejected' ? 'tags' : null
        ].filter(Boolean)
      });

      // Log de erros específicos se houver
      if (categoriesResult.status === 'rejected') {
        console.warn('❌ Erro ao buscar categorias:', categoriesResult.reason);
      }
      if (authorsResult.status === 'rejected') {
        console.warn('❌ Erro ao buscar autores:', authorsResult.reason);
      }
      if (tagsResult.status === 'rejected') {
        console.warn('❌ Erro ao buscar tags:', tagsResult.reason);
      }

      setWordpressData({
        categories,
        authors,
        tags
      });
      
      lastLoadedSiteRef.current = siteKey;
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar dados do WordPress:', error);
      // Definir dados padrão em caso de erro
      setWordpressData({
        categories: [{ id: 1, name: 'Sem categoria', slug: 'sem-categoria', parent: 0 }],
        authors: [{ id: 1, name: 'Admin', slug: 'admin', description: 'Administrador' }],
        tags: []
      });
      lastLoadedSiteRef.current = siteKey;
    } finally {
      setIsLoadingWordPress(false);
      loadingRef.current = null;
    }
  }, []);

  // Carregar dados do WordPress quando um site for selecionado
  useEffect(() => {
    const loadSiteData = async () => {
      if (!formData.siteId) {
        setWordpressData({
          categories: [],
          authors: [],
          tags: []
        });
        setIsLoadingWordPress(false);
        lastLoadedSiteRef.current = null;
        return;
      }

      console.log('🔄 Site selecionado:', formData.siteId);

      const site = activeSites.find(s => s.id.toString() === formData.siteId);
      if (!site) {
        console.warn('❌ Site não encontrado no BiaContext:', formData.siteId);
        return;
      }

      console.log('✅ Site encontrado no BiaContext:', {
        id: site.id,
        nome: site.nome,
        hasWordPress: !!(site.wordpressUrl && site.wordpressUsername && site.wordpressPassword)
      });

      if (site.wordpressUrl && site.wordpressUsername && site.wordpressPassword) {
        console.log('🔗 Site tem dados WordPress, iniciando carregamento...');
        
        // Forçar sincronização antes de carregar dados
        try {
          await wordpressService.syncFromBiaContext();
          console.log('✅ Sincronização WordPress concluída');
        } catch (error) {
          console.warn('⚠️ Erro na sincronização WordPress:', error);
        }
        
        // Tentar carregar dados do cache primeiro (apenas para mostrar algo enquanto carrega)
        const hasCachedData = loadCachedWordPressData(site);
        
        if (hasCachedData) {
          console.log('✅ Dados em cache encontrados e carregados');
          // Mesmo com cache, vamos tentar atualizar os dados em background para garantir dados frescos
          console.log('🔄 Atualizando dados em background para garantir informações atualizadas...');
          loadWordPressData(site);
        } else {
          console.log('📡 Sem dados válidos no cache, carregando dados frescos...');
          // Definir estado de carregamento e buscar dados frescos
          setIsLoadingWordPress(true);
          loadWordPressData(site);
        }
      } else {
        console.log('⚠️ Site sem dados WordPress completos, definindo dados vazios');
        // Site sem integração WordPress
        setWordpressData({
          categories: [],
          authors: [],
          tags: []
        });
        setIsLoadingWordPress(false);
        lastLoadedSiteRef.current = null;
      }
    };

    loadSiteData();
  }, [formData.siteId, loadCachedWordPressData, loadWordPressData]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      categorias: checked 
        ? [...prev.categorias, categoryId]
        : prev.categorias.filter(id => id !== categoryId)
    }));
  };

  const handleTagToggle = (tagSlug: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tags: checked 
        ? [...prev.tags, tagSlug]
        : prev.tags.filter(slug => slug !== tagSlug)
    }));
  };

  const handleAddNewTag = () => {
    if (!newTag.trim()) {
      toast.error('Digite o nome da nova tag');
      return;
    }

    const tagSlug = newTag.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    
    // Verificar se a tag já existe
    if (wordpressData.tags.some(tag => tag.slug === tagSlug)) {
      toast.error('Esta tag já existe');
      return;
    }

    // Adicionar temporariamente à lista para seleção
    const newTagObject = {
      id: Date.now(), // ID temporário
      name: newTag.trim(),
      slug: tagSlug,
      count: 0
    };

    setWordpressData(prev => ({
      ...prev,
      tags: [...prev.tags, newTagObject]
    }));

    // Selecionar automaticamente a nova tag
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagSlug]
    }));

    setNewTag('');
    toast.success(`Tag "${newTag.trim()}" adicionada e selecionada`);
  };

  const handleGenerate = async () => {
    if (!limits.ideas) {
      toast.error(`Limite atingido! Seu plano permite apenas ${planLimits.ideas} ideias. Faça upgrade para gerar mais ideias.`);
      return;
    }

    if (!formData.siteId) {
      toast.error('Selecione um site para gerar ideias.');
      return;
    }

    if (!formData.nicho.trim() || !formData.palavrasChave.trim()) {
      toast.error('Preencha o nicho e as palavras-chave para gerar ideias.');
      return;
    }

    // O serviço sempre está "disponível" na interface - erros são tratados internamente

    setIsGenerating(true);

    try {
      const selectedSite = activeSites.find(site => site.id.toString() === formData.siteId);
      const selectedAuthor = formData.autor && formData.autor !== 'none'
        ? wordpressData.authors.find(author => author.id.toString() === formData.autor)
        : null;
      
      const selectedCategories = formData.categorias.map(catId => 
        wordpressData.categories.find(cat => cat.id.toString() === catId)
      ).filter(Boolean);

      // Preparar parâmetros para geração de ideias
      const generationParams: IdeaGenerationParams = {
        nicho: formData.nicho,
        palavrasChave: formData.palavrasChave,
        quantidade: formData.quantidade,
        idioma: formData.idioma,
        contexto: formData.contexto,
        siteId: parseInt(formData.siteId),
        autor: formData.autor !== 'none' ? formData.autor : undefined,
        categorias: formData.categorias,
        tags: formData.tags,
        cta: formData.ctaTitulo || formData.ctaDescricao || formData.ctaBotao ? {
          titulo: formData.ctaTitulo,
          descricao: formData.ctaDescricao,
          botao: formData.ctaBotao,
          link: formData.ctaLink,
          imagem: formData.ctaImagem,
          posicao: formData.ctaPosicao
        } : undefined
      };

      // Gerar ideias usando OpenAI
      const result = await contentService.generateIdeas(generationParams);

      if (!result.success) {
        toast.error(`Erro ao gerar ideias: ${result.error}`);
        return;
      }

      if (!result.ideas || result.ideas.length === 0) {
        toast.error('Nenhuma ideia foi gerada. Tente novamente.');
        return;
      }

      // Criar novas tags no WordPress se necessário
      if (formData.tags.length > 0 && selectedSite) {
        const newTags = formData.tags.filter(tagSlug => {
          const tag = wordpressData.tags.find(t => t.slug === tagSlug);
          return tag && tag.id > 1000000000; // IDs temporários são timestamps (maiores que 1 bilhão)
        });

        if (newTags.length > 0) {
          try {
            const wpSite = {
              id: selectedSite.id.toString(),
              name: selectedSite.nome,
              url: selectedSite.wordpressUrl,
              username: selectedSite.wordpressUsername,
              applicationPassword: selectedSite.wordpressPassword,
              status: 'connected' as const,
              lastSync: new Date().toISOString(),
              postCount: 0,
              categories: [],
              authors: [],
              tags: [],
              isActive: true
            };

            for (const tagSlug of newTags) {
              const tempTag = wordpressData.tags.find(t => t.slug === tagSlug);
              if (tempTag) {
                try {
                  console.log(`Criando tag "${tempTag.name}" no WordPress...`);
                  await wordpressService.createTag(wpSite, {
                    name: tempTag.name,
                    slug: tempTag.slug
                  });
                  toast.success(`Tag "${tempTag.name}" criada no WordPress`);
                } catch (tagError) {
                  console.warn(`Erro ao criar tag "${tempTag.name}":`, tagError);
                  // Continuar mesmo se uma tag falhar
                }
              }
            }

            // Recarregar dados WordPress para obter as novas tags com IDs reais
            try {
              await loadWordPressData(selectedSite);
            } catch (reloadError) {
              console.warn('Erro ao recarregar dados após criar tags:', reloadError);
            }
          } catch (error) {
            console.warn('Erro ao criar tags no WordPress:', error);
            // Continuar com a geração mesmo se as tags falharem
          }
        }
      }

      // Criar objetos de ideia para adicionar ao contexto
      const newIdeas = result.ideas.map((titulo, index) => {
        // Remove a numeração do título se presente (ex: "1. Título" -> "Título")
        const tituloLimpo = titulo.replace(/^\d+\.\s*/, '').replace(/['"]/g, '').trim();
        
        return {
          titulo: tituloLimpo,
          conteudo: `Ideia gerada para o nicho de ${formData.nicho}, focando nas palavras-chave: ${formData.palavrasChave}. Site: ${selectedSite?.nome}. ${selectedAuthor ? `Autor: ${selectedAuthor.name}. ` : ''}${selectedCategories.length > 0 ? `Categorias: ${selectedCategories.map(c => c?.name).join(', ')}. ` : ''}${formData.contexto ? `Contexto adicional: ${formData.contexto}` : ''}`,
          categoria: selectedCategories.length > 0 ? selectedCategories[0]?.name || formData.nicho : formData.nicho,
          tags: [
            ...formData.palavrasChave.split(',').map(tag => tag.trim()),
            ...formData.tags.map(tagSlug => {
              const tag = wordpressData.tags.find(t => t.slug === tagSlug);
              return tag ? tag.name : tagSlug;
            })
          ],
          siteId: parseInt(formData.siteId),
          status: 'pendente' as const,
          // Dados WordPress adicionais para quando produzir o artigo
          wordpressData: {
            authorId: selectedAuthor?.id || null,
            categoryIds: formData.categorias.map(id => parseInt(id)),
            tagSlugs: formData.tags,
            // Adicionar tagIds para resolver problema da API
            tagIds: formData.tags.map(tagSlug => {
              const tag = wordpressData.tags.find(t => t.slug === tagSlug);
              return tag ? tag.id : null;
            }).filter(id => id !== null)
          },
          // Dados CTA
          cta: formData.ctaTitulo || formData.ctaDescricao || formData.ctaBotao ? {
            titulo: formData.ctaTitulo,
            descricao: formData.ctaDescricao,
            botao: formData.ctaBotao,
            link: formData.ctaLink,
            imagem: formData.ctaImagem,
            posicao: formData.ctaPosicao
          } : null,
          // Parâmetros de geração para usar na produção de conteúdo
          generationParams: {
            nicho: formData.nicho,
            palavrasChave: formData.palavrasChave,
            idioma: formData.idioma,
            contexto: formData.contexto
          }
        };
      });

      // Adicionar cada ideia
      let successCount = 0;
      for (const ideaData of newIdeas) {
        const success = actions.addIdea(ideaData);
        if (success) {
          successCount++;
        } else {
          break; // Parar se atingir o limite
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ideia(s) gerada(s) com sucesso usando IA para ${selectedSite?.nome}!`);
        // Reset form on success
        setFormData({
          siteId: '',
          nicho: '',
          palavrasChave: '',
          quantidade: 5,
          idioma: 'Português',
          contexto: '',
          autor: 'none',
          categorias: [],
          tags: [],
          ctaTitulo: '',
          ctaDescricao: '',
          ctaBotao: '',
          ctaLink: '',
          ctaImagem: '',
          ctaPosicao: 'final'
        });
        setWordpressData({
          categories: [],
          authors: [],
          tags: []
        });
        // Limpar cache de carregamento
        lastLoadedSiteRef.current = null;
      }

    } catch (error) {
      console.error('Erro ao gerar ideias:', error);
      toast.error('Erro inesperado ao gerar ideias. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Função para navegação para aba de produzir artigos
  const handleGoToArticles = () => {
    if (onPageChange) {
      onPageChange('articles');
    }
  };

  // Função para exibir artigo gerado
  const handleViewArticle = (idea: any) => {
    const article = state.articles.find(article => article.ideaId === idea.id);
    if (article && article.content) {
      // Abrir visualização do artigo
      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${article.title}</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: 'Montserrat', sans-serif; 
                max-width: 800px; 
                margin: 40px auto; 
                padding: 20px; 
                line-height: 1.6;
                color: #333;
              }
              h1 { 
                font-family: 'Poppins', sans-serif; 
                color: #8B5FBF; 
                text-align: center;
                margin-bottom: 30px;
              }
              .content { 
                margin: 20px 0; 
              }
              .image {
                text-align: center;
                margin: 20px 0;
              }
              .image img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .content h2 { 
                color: #8B5FBF; 
                margin-top: 30px;
              }
              .content h3 { 
                color: #666; 
              }
              .content p { 
                margin-bottom: 15px; 
              }
              .content ul, .content ol { 
                margin: 15px 0; 
                padding-left: 30px; 
              }
              .content li { 
                margin-bottom: 8px; 
              }
            </style>
          </head>
          <body>
            ${article.image ? `<div class="image"><img src="${article.image}" alt="${article.title}" /></div>` : ''}
            <h1>${article.title}</h1>
            <div class="content">${article.content}</div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  };

  // Componente para renderizar o preview do CTA
  const renderCtaPreview = () => {
    if (!hasCtaContent) return null;

    const ctaComponent = (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
        <div className="max-w-md mx-auto">
          {formData.ctaImagem && (
            <div className="mb-4">
              <img 
                src={formData.ctaImagem} 
                alt="CTA" 
                className="w-full max-w-sm h-32 object-cover rounded-lg mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {formData.ctaTitulo && (
            <h3 className="font-poppins text-xl text-purple-800 mb-3">
              {formData.ctaTitulo}
            </h3>
          )}
          
          {formData.ctaDescricao && (
            <p className="font-montserrat text-gray-700 mb-4">
              {formData.ctaDescricao}
            </p>
          )}
          
          {formData.ctaBotao && (
            <Button 
              className="font-montserrat text-white px-6 py-2"
              style={{ backgroundColor: '#8B5FBF' }}
              disabled
            >
              {formData.ctaBotao}
              {formData.ctaLink && <ExternalLink className="ml-2 h-4 w-4" />}
            </Button>
          )}
          
          {formData.ctaLink && (
            <div className="mt-2">
              <span className="font-montserrat text-xs text-gray-500">
                Link: {formData.ctaLink}
              </span>
            </div>
          )}
        </div>
      </div>
    );

    return ctaComponent;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Gerar Ideias</h1>
        <p className="font-montserrat text-gray-600">Gere ideias de conteúdo inteligentes usando IA avançada</p>
      </div>

      {/* Status do usuário - Informativo (azul) */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-montserrat text-sm text-blue-700">
                <strong>Plano {userData?.plano || 'Free'}:</strong> {typeof ideasRemaining === 'number' ? `${ideasRemaining} ideias restantes` : 'Ideias ilimitadas'}
              </p>
              <p className="font-montserrat text-xs text-blue-600">
                Você já usou {ideasUsed} de {isFree ? planLimits.ideas : '∞'} ideias
              </p>
              <p className="font-montserrat text-xs text-blue-600 mt-1">
                Sistema de IA: ✅ Disponível
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-800 self-start sm:self-center">
              {isFree ? `${Math.round(progressValue)}% usado` : 'Ilimitado'}
            </Badge>
          </div>
          {isFree && (
            <Progress 
              value={progressValue} 
              className="mt-2" 
            />
          )}
        </CardContent>
      </Card>

      {/* Seção "Produzir a partir de Ideias" */}
      {pendingIdeas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins text-lg flex items-center space-x-2">
              <Zap size={20} className="text-purple-600" />
              <span>Produzir a partir de Ideias</span>
              <Badge className="bg-purple-100 text-purple-800 ml-2">
                {pendingIdeas.length} disponível{pendingIdeas.length > 1 ? 'is' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-montserrat text-sm text-purple-700 mb-2">
                    Você tem <strong>{pendingIdeas.length} ideia{pendingIdeas.length > 1 ? 's' : ''}</strong> pronta{pendingIdeas.length > 1 ? 's' : ''} para produção de conteúdo
                  </p>
                  <p className="font-montserrat text-xs text-purple-600">
                    Vá para a aba "Produzir Artigos" para gerar conteúdo completo usando IA
                  </p>
                </div>
                <Button
                  onClick={handleGoToArticles}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-montserrat"
                >
                  Ir para Produzir Artigos
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Preview das últimas 6 ideias com keys únicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingIdeas.slice(0, 6).map((idea, index) => {
                const site = activeSites.find(s => s.id === idea.siteId);
                
                return (
                  <div key={`gerar-ideias-pending-${idea.id}-${index}-${Date.now()}`} className="bg-white rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="font-poppins font-medium text-sm text-black mb-2 line-clamp-2">{idea.titulo}</h4>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-montserrat text-xs text-gray-500">
                        {new Date(idea.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-montserrat text-xs text-gray-500">
                        {site?.nome || 'Site desconhecido'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pendente
                      </Badge>
                      <Button
                        size="sm"
                        onClick={handleGoToArticles}
                        className="font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        <ChevronRight className="mr-1 h-3 w-3" />
                        Produzir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de seleção de site obrigatória */}
      {activeSites.length === 0 && (
        <Alert className="border border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Nenhum site ativo encontrado:</strong> Você precisa ter pelo menos um site ativo para gerar ideias. 
            Vá para "Meus Sites" e adicione um site ou ative um existente.
          </AlertDescription>
        </Alert>
      )}

      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins text-lg font-semibold text-zinc-900 flex items-center space-x-2">
            <Lightbulb size={20} className="text-purple-600" />
            <span>Informações Básicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-zinc-900">
          {/* Seleção de Site - OBRIGATÓRIO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-purple-700 flex items-center space-x-2 text-sm text-zinc-900"> 
                <Monitor size={16} />
                <span>Selecionar Site *</span>
              </Label>
              {formData.siteId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const site = activeSites.find(s => s.id.toString() === formData.siteId);
                    if (site) {
                      console.log('🔄 Forçando recarregamento manual de dados WordPress...');
                      // Limpar cache forçadamente
                      lastLoadedSiteRef.current = null;
                      loadingRef.current = null;
                      
                      setIsLoadingWordPress(true);
                      toast.info('Recarregando dados do WordPress...');
                      
                      try {
                        await loadWordPressData(site);
                        toast.success('Dados WordPress atualizados!');
                      } catch (error) {
                        console.error('Erro ao recarregar:', error);
                        toast.error('Erro ao recarregar dados WordPress');
                      }
                    }
                  }}
                  disabled={isLoadingWordPress}
                  className="font-montserrat text-sm text-zinc-900 font-medium"
                >
                  {isLoadingWordPress ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Recarregar Dados
                    </>
                  )}
                </Button>
              )}
            </div>
            <Select 
              value={formData.siteId} 
              onValueChange={(value) => handleInputChange('siteId', value)}
            >
              <SelectTrigger className="font-montserrat">
                <SelectValue placeholder="Escolha um site ativo" />
              </SelectTrigger>
              <SelectContent>
                {activeSites.map(site => (
                  <SelectItem key={`site-option-${site.id}`} value={site.id.toString()}>
                    {site.nome} - {site.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeSites.length === 0 && (
              <p className="text-xs text-red-600">Nenhum site ativo disponível</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900 font-medium">
  Qual é o Seu Nicho de Negócio? *
</Label>
              <Input
                value={formData.nicho}
                onChange={(e) => handleInputChange('nicho', e.target.value)}
                placeholder="Ex: Marketing Digital, Nutrição, Tecnologia..."
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>

            <div className="space-y-2">
<Label className="font-montserrat text-sm text-zinc-900 font-medium">
  Palavras-chave Principais *
</Label>
              <Input
                value={formData.palavrasChave}
                onChange={(e) => handleInputChange('palavrasChave', e.target.value)}
                placeholder="Ex: SEO, Marketing de Conteúdo, Redes Sociais"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900 font-medium">
  Quantidade de Ideias
</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={formData.quantidade.toString()}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    handleInputChange('quantidade', 1);
                    return;
                  }
                  const numValue = parseInt(inputValue);
                  if (!isNaN(numValue)) {
                    const value = Math.max(1, Math.min(50, numValue));
                    handleInputChange('quantidade', value);
                  }
                }}
                placeholder="Digite a quantidade (1-50)"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
              <p className="font-montserrat text-xs text-gray-500">
                Mínimo: 1 ideia | Máximo: 50 ideias
              </p>
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900 font-medium">
  Idioma do Conteúdo
</Label>
              <Select 
                value={formData.idioma} 
                onValueChange={(value) => handleInputChange('idioma', value)}
              >
                <SelectTrigger className="font-montserrat text-sm text-zinc-900 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Português">Português</SelectItem>
                  <SelectItem value="Inglês">Inglês</SelectItem>
                  <SelectItem value="Espanhol">Espanhol</SelectItem>
                  <SelectItem value="Francês">Francês</SelectItem>
                  <SelectItem value="Italiano">Italiano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat text-sm text-zinc-900 font-medium">
  Contexto Adicional (Opcional)
</Label>
            <Textarea
              value={formData.contexto}
              onChange={(e) => handleInputChange('contexto', e.target.value)}
              placeholder="Forneça informações adicionais sobre seu público-alvo, tom de voz desejado ou objetivos específicos..."
              className="font-montserrat text-sm text-zinc-900 font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* WordPress Integration */}
      {formData.siteId && (
        <Card>
          <CardHeader>
            <CardTitle className="font-poppins text-lg font-semibold text-zinc-900 flex items-center space-x-2">
              <FolderOpen size={20} className="text-purple-600" />
              <span>Integração WordPress</span>
              {isLoadingWordPress && <Loader2 className="ml-2 h-4 w-4 animate-spin text-purple-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-zinc-900">
            {/* Autor WordPress */}
            {wordpressData.authors.length > 0 && (
              <div className="space-y-2">
                <Label className="font-montserrat text-zinc-900 flex items-center space-x-2">
                  <User size={16} />
                  <span>Autor WordPress</span>
                </Label>
                <Select 
                  value={formData.autor} 
                  onValueChange={(value) => handleInputChange('autor', value)}
                >
                  <SelectTrigger className="font-montserrat">
                    <SelectValue placeholder="Selecionar autor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum autor específico</SelectItem>
                    {wordpressData.authors.map(author => (
                      <SelectItem key={`author-${author.id}`} value={author.id.toString()}>
                        {author.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Categorias */}
            {wordpressData.categories.length > 0 && (
              <div className="space-y-3">
                <Label className="font-montserrat text-zinc-900 flex items-center space-x-2">
                  <FolderOpen size={16} />
                  <span>Categorias do WordPress</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                  {wordpressData.categories.map(category => (
                    <div key={`category-${category.id}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={formData.categorias.includes(category.id.toString())}
                        onCheckedChange={(checked) => 
                          handleCategoryToggle(category.id.toString(), checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`category-${category.id}`}
                        className="font-montserrat text-sm cursor-pointer"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-3">
              <Label className="font-montserrat text-zinc-900 flex items-center space-x-2">
                <Tag size={16} />
                <span>Tags do WordPress</span>
              </Label>
              
              {/* Campo para adicionar nova tag */}
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma nova tag..."
                  className="font-montserrat flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddNewTag}
                  disabled={!newTag.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-montserrat"
                >
                  <Plus size={16} className="mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Tags existentes */}
              {wordpressData.tags.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                  {wordpressData.tags.slice(0, 20).map(tag => (
                    <div key={`tag-${tag.id}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={formData.tags.includes(tag.slug)}
                        onCheckedChange={(checked) => 
                          handleTagToggle(tag.slug, checked as boolean)
                        }
                      />
                      <Label 
                        htmlFor={`tag-${tag.id}`}
                        className="font-montserrat text-zinc-900 flex items-center space-x-2"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              
              {wordpressData.tags.length > 20 && (
                <p className="font-montserrat text-xs text-gray-500">
                  Mostrando as primeiras 20 tags. Total: {wordpressData.tags.length}
                </p>
              )}

              {wordpressData.tags.length === 0 && !isLoadingWordPress && formData.siteId && (
                <p className="font-montserrat text-sm text-gray-500">
                  Nenhuma tag encontrada. Você pode criar uma nova tag acima.
                </p>
              )}
            </div>

            {/* Status de carregamento ou dados não encontrados */}
            {isLoadingWordPress && (
              <div className="text-center py-4">
                <p className="font-montserrat text-sm text-gray-600">
                  Carregando dados do WordPress...
                </p>
              </div>
            )}

            {!isLoadingWordPress && wordpressData.categories.length === 0 && wordpressData.authors.length === 0 && formData.siteId && (
              <div className="text-center py-4">
                <p className="font-montserrat text-sm text-gray-600">
                  Nenhum dado WordPress encontrado para este site.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CTA Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins text-lg font-semibold text-zinc-900 flex items-center space-x-2">
            <Megaphone size={20} className="text-purple-600" />
            <span>Call-to-Action (CTA) - Opcional</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900">Título do CTA</Label>
              <Input
                value={formData.ctaTitulo}
                onChange={(e) => handleInputChange('ctaTitulo', e.target.value)}
                placeholder="Ex: Transforme Seu Negócio Hoje!"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900">Texto do Botão</Label>
              <Input
                value={formData.ctaBotao}
                onChange={(e) => handleInputChange('ctaBotao', e.target.value)}
                placeholder="Ex: Saiba Mais, Comprar Agora, Baixar E-book"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat text-sm text-zinc-900">Descrição do CTA</Label>
            <Textarea
              value={formData.ctaDescricao}
              onChange={(e) => handleInputChange('ctaDescricao', e.target.value)}
              placeholder="Descrição persuasiva do que o leitor vai receber..."
              className="font-montserrat text-sm text-zinc-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900 flex items-center space-x-2">
                <Link size={16} />
                <span>Link do CTA</span>
              </Label>
              <Input
                value={formData.ctaLink}
                onChange={(e) => handleInputChange('ctaLink', e.target.value)}
                placeholder="https://seusite.com/oferta"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-montserrat text-sm text-zinc-900 flex items-center space-x-2">
                <Image size={16} />
                <span>URL da Imagem</span>
              </Label>
              <Input
                value={formData.ctaImagem}
                onChange={(e) => handleInputChange('ctaImagem', e.target.value)}
                placeholder="https://seusite.com/imagem.jpg"
                className="font-montserrat text-sm text-zinc-900 font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-montserrat text-sm text-zinc-900">Posição do CTA no Artigo</Label>
            <Select 
              value={formData.ctaPosicao} 
              onValueChange={(value: 'inicio' | 'meio' | 'final') => handleInputChange('ctaPosicao', value)}
            >
              <SelectTrigger className="font-montserrat text-sm text-zinc-900 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inicio">Início do artigo</SelectItem>
                <SelectItem value="meio">Meio do artigo</SelectItem>
                <SelectItem value="final">Final do artigo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview do CTA */}
          {hasCtaContent && (
            <div className="space-y-2">
              <Label className="font-montserrat flex items-center space-x-2">
                <Eye size={16} />
                <span>Preview do CTA</span>
              </Label>
              {renderCtaPreview()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Gerar Ideias */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.siteId || !formData.nicho.trim() || !formData.palavrasChave.trim() || !limits.ideas}
              className="font-montserrat px-8 py-3 text-lg"
              style={{ 
                backgroundColor: !limits.ideas ? '#9CA3AF' : '#8B5FBF',
                color: 'white'
              }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando Ideias...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Gerar Ideias com IA
                </>
              )}
            </Button>
            
            {!limits.ideas && (
              <p className="font-montserrat text-sm text-red-600">
                Limite de ideias atingido. Faça upgrade do seu plano para continuar gerando ideias.
              </p>
            )}
            
            <p className="font-montserrat text-xs text-gray-500 max-w-2xl mx-auto">
              Nossa IA avançada analisará suas informações e gerará ideias personalizadas de alta qualidade para seu nicho específico.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}