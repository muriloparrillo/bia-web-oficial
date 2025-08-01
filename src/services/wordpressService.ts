import { toast } from 'sonner';

export interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  applicationPassword: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  postCount: number;
  categories: WordPressCategory[];
  authors: WordPressAuthor[];
  tags: WordPressTag[];
  isActive: boolean;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

export interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count?: number;
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'future';
  categories?: number[];
  tags?: number[];
  author?: number;
  excerpt?: string;
  date?: string;
  featured_media?: {
    imageUrl: string;
    alt: string;
  };
  meta?: {
    [key: string]: any;
  };
}

export interface ScheduledPost {
  id: string;
  siteId: string;
  siteName: string;
  title: string;
  content: string;
  scheduledDate: string;
  status: 'pending' | 'published' | 'failed';
  categories: number[];
  tags: number[];
  author?: number;
  error?: string;
  wpPostId?: number;
  createdAt: string;
}

class WordPressService {
  private readonly SITES_STORAGE_KEY = 'bia-wordpress-sites';
  private readonly POSTS_STORAGE_KEY = 'bia-scheduled-posts';
  private readonly INACCESSIBLE_SITES_KEY = 'bia-inaccessible-sites';
  
  // Cache de sites inacessíveis para evitar tentativas desnecessárias
  private inaccessibleSites: Map<string, number> = new Map(); // url -> timestamp
  
  // Reference to BiaContext data
  private biaContextData: any = null;
  private isContextSynced: boolean = false;

  // Método auxiliar para normalizar URLs
  private normalizeUrl(url: string): string {
    if (!url) return '';
    
    // Remover barra final
    let normalized = url.replace(/\/$/, '');
    
    // Garantir que tenha protocolo
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    return normalized;
  }

  // Método auxiliar para validar URL WordPress
  private isValidWordPressUrl(url: string): boolean {
    try {
      const normalizedUrl = this.normalizeUrl(url);
      const urlObj = new URL(normalizedUrl);
      
      // Verificar se é um domínio válido
      return urlObj.hostname.includes('.') && 
             (urlObj.protocol === 'http:' || urlObj.protocol === 'https:');
    } catch (error) {
      return false;
    }
  }

  // Método para sincronizar com BiaContext
  async syncFromBiaContext(): Promise<void> {
    try {
      console.log('🔄 Sincronizando dados WordPress com BiaContext...');
      
      if (typeof window !== 'undefined') {
        // Tentar tanto bia-app-state quanto contexto direto
        let biaData = localStorage.getItem('bia-app-state');
        let parsedData: any = null;
        
        if (biaData) {
          try {
            parsedData = JSON.parse(biaData);
            console.log('📦 Dados encontrados em bia-app-state');
          } catch (parseError) {
            console.warn('❌ Erro ao fazer parse de bia-app-state:', parseError);
          }
        }
        
        // Se não encontrou dados válidos, usar método alternativo
        if (!parsedData?.sites) {
          // Tentar obter dados do contexto global (se disponível)
          try {
            // Verificar se existe um hook global ou estado compartilhado
            const globalBiaState = (window as any)?.__BIA_STATE__;
            if (globalBiaState?.sites) {
              parsedData = globalBiaState;
              console.log('📦 Dados encontrados no estado global BIA');
            }
          } catch (error) {
            console.warn('⚠️ Não foi possível acessar estado global:', error);
          }
        }
        
        if (parsedData?.sites && Array.isArray(parsedData.sites)) {
          console.log('🏢 Sites encontrados no BiaContext:', parsedData.sites.length);
          
          // Converter sites do BiaContext para formato WordPress
          const wpSites: WordPressSite[] = parsedData.sites
            .filter((site: any) => {
              const hasWordPressData = site.wordpressUrl && site.wordpressUsername && site.wordpressPassword;
              if (!hasWordPressData) {
                console.log(`⏭️ Site ${site.nome || site.id} não tem dados WordPress completos`);
              }
              return hasWordPressData;
            })
            .map((site: any) => ({
              id: site.id.toString(),
              name: site.nome || site.name || 'Site sem nome',
              url: this.normalizeUrl(site.wordpressUrl),
              username: site.wordpressUsername || '',
              applicationPassword: site.wordpressPassword || '',
              status: 'connected' as const,
              lastSync: new Date().toISOString(),
              postCount: 0,
              categories: [],
              authors: [],
              tags: [],
              isActive: site.status === 'ativo'
            }));

          console.log('✅ Sites WordPress válidos encontrados:', wpSites.length);

          if (wpSites.length > 0) {
            // Preservar dados já carregados do localStorage próprio
            const existingSites = this.getStoredSites();
            const mergedSites = wpSites.map(newSite => {
              const existing = existingSites.find(s => s.id === newSite.id);
              if (existing) {
                console.log(`🔄 Mesclando dados do site ${newSite.name} (${newSite.id}):`, {
                  categories: existing.categories?.length || 0,
                  authors: existing.authors?.length || 0,
                  tags: existing.tags?.length || 0
                });
                return {
                  ...newSite,
                  categories: existing.categories || [],
                  authors: existing.authors || [],
                  tags: existing.tags || [],
                  lastSync: existing.lastSync || newSite.lastSync,
                  status: existing.status || newSite.status
                };
              }
              console.log(`🆕 Novo site adicionado: ${newSite.name} (${newSite.id})`);
              return newSite;
            });

            this.saveSites(mergedSites);
            this.biaContextData = parsedData;
            this.isContextSynced = true;
            
            console.log(`✅ Sincronização concluída: ${mergedSites.length} sites WordPress`);
            return; // Sucesso
          } else {
            console.log('⚠️ Nenhum site com dados WordPress válidos encontrado');
          }
        } else {
          console.log('⚠️ Nenhum array de sites encontrado nos dados do BiaContext');
        }
      }
      
      // Se chegou aqui, não conseguiu sincronizar
      console.log('❌ Falha na sincronização: dados inválidos ou indisponíveis');
      this.isContextSynced = false;
    } catch (error) {
      console.error('❌ Erro na sincronização forçada:', error);
      this.isContextSynced = false;
      throw error; // Re-lançar para tratamento superior
    }
  }

  // Método para obter sites - sempre retorna dados já processados e salvos
  getSites(): WordPressSite[] {
    try {
      // Usar dados do localStorage próprio do WordPressService
      const sitesData = localStorage.getItem(this.SITES_STORAGE_KEY);
      const sites = sitesData ? JSON.parse(sitesData) : [];
      
      console.log('📦 Retornando sites do WordPressService:', 
        sites.map((s: any) => `${s.id} (${s.name}) - Categories: ${s.categories?.length || 0}, Authors: ${s.authors?.length || 0}`)
      );
      
      return sites;
    } catch (error) {
      console.error('❌ Erro ao carregar sites:', error);
      return [];
    }
  }

  // Método auxiliar para obter sites diretamente do storage (sem logs)
  private getStoredSites(): WordPressSite[] {
    try {
      const sitesData = localStorage.getItem(this.SITES_STORAGE_KEY);
      return sitesData ? JSON.parse(sitesData) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar sites do storage:', error);
      return [];
    }
  }

  // Método para salvar sites no localStorage
  saveSites(sites: WordPressSite[]): void {
    try {
      localStorage.setItem(this.SITES_STORAGE_KEY, JSON.stringify(sites));
      console.log('💾 Sites salvos no localStorage do WordPressService:', 
        sites.map(s => `${s.id} (${s.name})`)
      );
    } catch (error) {
      console.error('❌ Erro ao salvar sites no localStorage:', error);
    }
  }

  // Método para obter site por ID
  getSiteById(siteId: string): WordPressSite | null {
    try {
      console.log('🔍 Buscando site por ID:', siteId);
      
      const sites = this.getSites();
      
      if (sites.length === 0) {
        console.log('⚠️ Nenhum site WordPress encontrado no storage');
        return null;
      }
      
      // Tentar múltiplas formas de comparação
      let site = sites.find(s => s.id === siteId);
      if (!site) {
        site = sites.find(s => s.id === siteId.toString());
      }
      if (!site) {
        site = sites.find(s => s.id.toString() === siteId);
      }
      if (!site) {
        site = sites.find(s => parseInt(s.id).toString() === siteId);
      }
      
      if (site) {
        console.log('✅ Site encontrado:', {
          id: site.id,
          name: site.name,
          categories: site.categories?.length || 0,
          authors: site.authors?.length || 0,
          tags: site.tags?.length || 0
        });
      } else {
        console.log('❌ Site não encontrado. Sites disponíveis:', 
          sites.map(s => `${s.id} (${s.name})`)
        );
      }
      
      return site || null;
    } catch (error) {
      console.error('Erro ao buscar site por ID:', error);
      return null;
    }
  }

  // Método para recarregar dados FRESCOS de um site específico
  async reloadSiteData(siteId: string | number): Promise<boolean> {
    try {
      console.log('🚀 FORÇANDO recarregamento de dados FRESCOS do site:', siteId);
      
      // Primeiro, sincronizar com BiaContext para ter dados atualizados
      await this.syncFromBiaContext();
      
      const site = this.getSiteById(siteId.toString());
      
      if (!site) {
        console.warn('❌ Site não encontrado para recarregamento:', siteId);
        return false;
      }

      console.log('📋 Site encontrado, verificando credenciais WordPress:', {
        hasUrl: !!site.url,
        hasUsername: !!site.username,
        hasPassword: !!site.applicationPassword
      });

      // Verificar se tem credenciais WordPress
      if (!site.url || !site.username || !site.applicationPassword) {
        console.warn('⚠️ Site sem credenciais WordPress completas');
        return false;
      }

      // Criar credenciais para o teste de conexão
      const credentials = {
        url: site.url,
        username: site.username,
        applicationPassword: site.applicationPassword
      };

      console.log('🧪 Testando conexão WordPress para obter dados FRESCOS...');

      // Testar conexão para obter dados atualizados DIRETO do WordPress
      const testResult = await this.testConnection(credentials);
      
      if (testResult.success) {
        console.log('✅ Conexão bem-sucedida, processando dados FRESCOS:', {
          categories: testResult.categories?.length || 0,
          authors: testResult.authors?.length || 0,
          tags: testResult.tags?.length || 0
        });

        // Atualizar dados do site com dados FRESCOS
        const updatedSite = {
          ...site,
          categories: testResult.categories || [],
          authors: testResult.authors || [],
          tags: testResult.tags || [],
          status: 'connected' as const,
          lastSync: new Date().toISOString()
        };

        // Atualizar no storage
        const currentSites = this.getSites();
        const updatedSites = currentSites.map(s => 
          s.id === siteId.toString() ? updatedSite : s
        );
        
        this.saveSites(updatedSites);

        console.log('✅ Dados FRESCOS do site recarregados e salvos com sucesso!');
        return true;
      }

      console.warn('❌ Falha ao recarregar dados do site:', testResult.error);
      return false;
      
    } catch (error) {
      console.error('❌ Erro ao recarregar dados do site:', error);
      return false;
    }
  }

  // Testar conexão usando a API do servidor (bypass CORS)
  async testConnection(credentials: { url: string; username: string; applicationPassword: string }): Promise<{ success: boolean; error?: string; categories?: any[]; authors?: any[]; tags?: any[]; preCheck?: any }> {
    try {
      console.log('🧪 Iniciando teste de conexão WordPress via servidor:', {
        url: credentials.url,
        username: credentials.username,
        hasPassword: !!credentials.applicationPassword
      });

      // Validações básicas
      if (!credentials.url || !credentials.username || !credentials.applicationPassword) {
        return { success: false, error: 'Todos os campos são obrigatórios' };
      }
      
      // Validar formato da URL
      if (!this.isValidWordPressUrl(credentials.url)) {
        return { success: false, error: 'URL inválida. Use o formato completo: https://seusite.com' };
      }

      console.log('🚀 Enviando teste para o servidor...');

      // Usar a API do servidor para testar conexão
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/wordpress/test-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          url: credentials.url,
          username: credentials.username,
          applicationPassword: credentials.applicationPassword
        })
      });

      const result = await response.json();
      
      console.log('📋 Resposta do servidor:', result);

      if (!response.ok || !result.success) {
        console.log('❌ Falha na conexão via servidor:', result);
        
        // Mapear erros específicos do servidor
        let errorMessage = result.error || 'Erro desconhecido na conexão';
        let errorCategory = 'general';
        
        // Analisar tipo de erro baseado no status HTTP
        if (response.status === 401) {
          errorCategory = 'credentials';
          errorMessage = 'Credenciais inválidas. Verifique o nome de usuário e Application Password.';
        } else if (response.status === 403) {
          errorCategory = 'permissions';
          errorMessage = 'Usuário sem permissões suficientes. Use um usuário Administrador ou Editor.';
        } else if (response.status === 400) {
          if (result.error?.includes('inacessível') || result.error?.includes('offline')) {
            errorCategory = 'connectivity';
            errorMessage = 'Site completamente inacessível ou offline. Verifique se a URL está correta.';
          } else if (result.error?.includes('CORS') || result.error?.includes('bloqueando')) {
            errorCategory = 'cors';
            errorMessage = 'Site está online mas a API WordPress está bloqueada por CORS ou configurações de segurança.';
          }
        }
        
        return { 
          success: false, 
          error: errorMessage,
          errorCategory,
          details: result.details
        };
      }

      console.log('✅ Teste de conexão bem-sucedido via servidor');

      // Extrair dados retornados pelo servidor
      const serverData = result.data || {};
      
      return { 
        success: true, 
        categories: serverData.categories || [],
        authors: serverData.authors || [],
        tags: serverData.tags || [],
        serverTested: true,
        connectivityMessage: serverData.connectivityMessage
      };

    } catch (error) {
      console.error('❌ Erro geral no teste de conexão via servidor:', error);
      
      let errorMessage = 'Erro de comunicação com o servidor';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Erro de conectividade. Verifique sua conexão com a internet.';
      } else if (error instanceof Error) {
        errorMessage = `Erro técnico: ${error.message}`;
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorCategory: 'server_error'
      };
    }
  }

  // Obter status de conectividade de um site
  getSiteConnectivityStatus(siteId: string): { status: string; message: string; canRetry: boolean } {
    const sites = this.getSites();
    const site = sites.find(s => s.id === siteId);
    
    if (!site) {
      return { status: 'not_found', message: 'Site não encontrado', canRetry: false };
    }
    
    switch (site.status) {
      case 'connected':
        const lastSyncTime = new Date(site.lastSync).getTime();
        const hoursSinceSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);
        
        if (hoursSinceSync > 48) {
          return { 
            status: 'outdated', 
            message: 'Dados desatualizados. Sincronização recomendada.', 
            canRetry: true 
          };
        }
        
        return { 
          status: 'connected', 
          message: 'Site conectado e funcionando', 
          canRetry: false 
        };
        
      case 'error':
        return { 
          status: 'error', 
          message: 'Site com problemas de conectividade. Usando dados em cache.', 
          canRetry: true 
        };
        
      case 'disconnected':
      default:
        return { 
          status: 'disconnected', 
          message: 'Site não testado ou desconectado. Clique para conectar.', 
          canRetry: true 
        };
    }
  }

  // Método para obter categorias de um site
  async getCategories(site: any): Promise<WordPressCategory[]> {
    try {
      console.log('📂 Buscando categorias do WordPress...');

      const normalizedUrl = this.normalizeUrl(site.url);
      const endpoint = `${normalizedUrl}/wp-json/wp/v2/categories?per_page=100`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${site.username}:${site.applicationPassword}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const categories = await response.json();
      
      return categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        parent: cat.parent
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [{ id: 1, name: 'Sem categoria', slug: 'sem-categoria', parent: 0 }];
    }
  }

  // Método para obter autores de um site
  async getAuthors(site: any): Promise<WordPressAuthor[]> {
    try {
      console.log('👥 Buscando autores do WordPress...');

      const normalizedUrl = this.normalizeUrl(site.url);
      const endpoint = `${normalizedUrl}/wp-json/wp/v2/users?per_page=100&context=edit`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${site.username}:${site.applicationPassword}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const authors = await response.json();
      
      return authors.map((author: any) => ({
        id: author.id,
        name: author.name,
        slug: author.slug,
        description: author.description || ''
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar autores:', error);
      return [{ id: 1, name: 'Admin', slug: 'admin', description: 'Administrador' }];
    }
  }

  // Método para obter tags de um site
  async getTags(site: any): Promise<WordPressTag[]> {
    try {
      console.log('🏷️ Buscando tags do WordPress...');

      const normalizedUrl = this.normalizeUrl(site.url);
      const endpoint = `${normalizedUrl}/wp-json/wp/v2/tags?per_page=100`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${site.username}:${site.applicationPassword}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const tags = await response.json();
      
      return tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag.count || 0
      }));

    } catch (error) {
      console.error('❌ Erro ao buscar tags:', error);
      return [];
    }
  }

  // Método para criar uma nova tag no WordPress
  async createTag(site: any, tagData: { name: string; slug: string }): Promise<WordPressTag> {
    try {
      console.log('🏷️ Criando nova tag no WordPress:', tagData);

      const normalizedUrl = this.normalizeUrl(site.url);
      const endpoint = `${normalizedUrl}/wp-json/wp/v2/tags`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${site.username}:${site.applicationPassword}`)}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          name: tagData.name,
          slug: tagData.slug
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const createdTag = await response.json();
      
      console.log('✅ Tag criada com sucesso:', createdTag);
      
      return {
        id: createdTag.id,
        name: createdTag.name,
        slug: createdTag.slug,
        count: createdTag.count || 0
      };

    } catch (error) {
      console.error('❌ Erro ao criar tag:', error);
      throw error;
    }
  }

  // Método para publicar posts no WordPress via servidor
  async publishPost(siteId: string, postData: WordPressPost): Promise<{ success: boolean; postId?: number; postUrl?: string; error?: string }> {
    try {
      console.log('🚀 Iniciando publicação no WordPress via servidor:', {
        siteId,
        title: postData.title,
        status: postData.status
      });

      // Buscar dados do site localmente primeiro
      const site = this.getSiteById(siteId);
      if (!site) {
        console.error(`❌ Site não encontrado localmente: ${siteId}`);
        return { 
          success: false, 
          error: `Site não encontrado: ${siteId}` 
        };
      }

      console.log('✅ Site encontrado localmente:', {
        id: site.id,
        name: site.name,
        hasWordPressUrl: !!site.url,
        hasCredentials: !!(site.username && site.applicationPassword)
      });

      // Usar a API do servidor para publicar posts (bypass CORS)
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/wordpress/publish-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          siteId,
          postData,
          // Enviar dados completos do site como fallback
          siteData: {
            id: site.id,
            name: site.name,
            url: site.url,
            username: site.username,
            applicationPassword: site.applicationPassword
          }
        })
      });

      const result = await response.json();
      
      console.log('📋 Resposta do servidor para publicação:', result);

      if (!response.ok || !result.success) {
        console.log('❌ Falha na publicação via servidor:', result);
        return { 
          success: false, 
          error: result.error || `Erro HTTP ${response.status}: ${response.statusText}` 
        };
      }

      console.log('✅ Publicação bem-sucedida via servidor:', {
        postId: result.postId,
        status: postData.status
      });

      return { 
        success: true, 
        postId: result.postId,
        postUrl: result.link 
      };

    } catch (error) {
      console.error('❌ Erro geral na publicação via servidor:', error);
      
      let errorMessage = 'Erro de comunicação com o servidor de publicação';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'Erro de conectividade. Verifique sua conexão com a internet.';
      } else if (error instanceof Error) {
        errorMessage = `Erro técnico: ${error.message}`;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }
}

// Exportar instância singleton
export const wordpressService = new WordPressService();