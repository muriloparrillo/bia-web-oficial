import { toast } from 'sonner';

// Database service for syncing BIA data with Supabase backend
export class DatabaseService {
  private static instance: DatabaseService;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async getApiCredentials() {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      return { projectId, publicAnonKey };
    } catch (error) {
      console.error('❌ Erro ao obter credenciais da API:', error);
      throw error;
    }
  }

  // Check if the API is available
  private async checkApiAvailability(): Promise<boolean> {
    try {
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      console.warn('⚠️ API não disponível:', error);
      return false;
    }
  }

  // Debounce function to avoid too many API calls
  private debounce(key: string, func: () => Promise<void>, delay: number = 2000) {
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      try {
        await func();
      } catch (error) {
        console.error(`Erro na operação debounced para ${key}:`, error);
        // Não mostrar toast para operações em debounce para evitar spam
      } finally {
        this.debounceTimers.delete(key);
      }
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // Save sites to database
  async saveSites(userId: string, sites: any[]): Promise<boolean> {
    try {
      console.log('💾 Salvando sites no banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/sites/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ sites }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Sites salvos no banco com sucesso');
        return true;
      } else {
        console.error('❌ Erro ao salvar sites:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (sites):', error);
      return false;
    }
  }

  // Load sites from database
  async loadSites(userId: string): Promise<any[]> {
    try {
      console.log('📥 Carregando sites do banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/sites/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Sites carregados do banco:', result.sites?.length || 0);
        return result.sites || [];
      } else {
        console.warn('⚠️ Erro ao carregar sites:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (load sites):', error);
      return [];
    }
  }

  // Save ideas to database
  async saveIdeas(userId: string, ideas: any[]): Promise<boolean> {
    try {
      console.log('💾 Salvando ideias no banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/ideas/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ ideas }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Ideias salvas no banco com sucesso');
        return true;
      } else {
        console.error('❌ Erro ao salvar ideias:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (ideas):', error);
      return false;
    }
  }

  // Load ideas from database
  async loadIdeas(userId: string): Promise<any[]> {
    try {
      console.log('📥 Carregando ideias do banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/ideas/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Ideias carregadas do banco:', result.ideas?.length || 0);
        return result.ideas || [];
      } else {
        console.warn('⚠️ Erro ao carregar ideias:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (load ideas):', error);
      return [];
    }
  }

  // Save articles to database
  async saveArticles(userId: string, articles: any[]): Promise<boolean> {
    try {
      console.log('💾 Salvando artigos no banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/articles/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ articles }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Artigos salvos no banco com sucesso');
        return true;
      } else {
        console.error('❌ Erro ao salvar artigos:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (articles):', error);
      return false;
    }
  }

  // Load articles from database
  async loadArticles(userId: string): Promise<any[]> {
    try {
      console.log('📥 Carregando artigos do banco de dados para usuário:', userId);
      
      const { projectId, publicAnonKey } = await this.getApiCredentials();
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/articles/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Artigos carregados do banco:', result.articles?.length || 0);
        return result.articles || [];
      } else {
        console.warn('⚠️ Erro ao carregar artigos:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Erro na comunicação com o banco (load articles):', error);
      return [];
    }
  }

  // Load all user data from database
  async loadUserData(userId: string): Promise<{ sites: any[], ideas: any[], articles: any[] }> {
    try {
      console.log('📥 Carregando todos os dados do usuário do banco:', userId);
      
      const [sites, ideas, articles] = await Promise.all([
        this.loadSites(userId),
        this.loadIdeas(userId),
        this.loadArticles(userId)
      ]);

      console.log('✅ Dados do usuário carregados:', {
        sites: sites.length,
        ideas: ideas.length,
        articles: articles.length
      });

      return { sites, ideas, articles };
    } catch (error) {
      console.error('❌ Erro ao carregar dados do usuário:', error);
      return { sites: [], ideas: [], articles: [] };
    }
  }

  // Save all user data to database (debounced) - VERSÃO SILENCIOSA
  saveUserDataDebounced(userId: string, data: { sites?: any[], ideas?: any[], articles?: any[] }) {
    if (data.sites) {
      this.debounce(`sites_${userId}`, async () => {
        const success = await this.saveSites(userId, data.sites!);
        if (!success) {
          console.warn('⚠️ Falha ao salvar sites no banco, mas dados locais foram preservados');
        }
      }, 3000);
    }
    if (data.ideas) {
      this.debounce(`ideas_${userId}`, async () => {
        const success = await this.saveIdeas(userId, data.ideas!);
        if (!success) {
          console.warn('⚠️ Falha ao salvar ideias no banco, mas dados locais foram preservados');
        }
      }, 3000);
    }
    if (data.articles) {
      this.debounce(`articles_${userId}`, async () => {
        const success = await this.saveArticles(userId, data.articles!);
        if (!success) {
          console.warn('⚠️ Falha ao salvar artigos no banco, mas dados locais foram preservados');
        }
      }, 3000);
    }
  }

  // Sync local data to database immediately - COM FEEDBACK
  async syncUserData(userId: string, data: { sites?: any[], ideas?: any[], articles?: any[] }): Promise<boolean> {
    try {
      console.log('🔄 Sincronizando dados do usuário com o banco:', userId);
      
      // Verificar se a API está disponível
      const apiAvailable = await this.checkApiAvailability();
      if (!apiAvailable) {
        console.warn('⚠️ API não disponível, operação cancelada');
        toast.warning('Sincronização adiada - dados salvos localmente', {
          description: 'Seus dados estão seguros no dispositivo. A sincronização será tentada novamente automaticamente.'
        });
        return false;
      }

      const promises: Promise<boolean>[] = [];
      const operations: string[] = [];
      
      if (data.sites) {
        promises.push(this.saveSites(userId, data.sites));
        operations.push('sites');
      }
      if (data.ideas) {
        promises.push(this.saveIdeas(userId, data.ideas));
        operations.push('ideias');
      }
      if (data.articles) {
        promises.push(this.saveArticles(userId, data.articles));
        operations.push('artigos');
      }

      if (promises.length === 0) {
        console.log('✅ Nenhum dado para sincronizar');
        return true;
      }

      const results = await Promise.all(promises);
      const successes = results.filter(result => result).length;
      const failures = results.length - successes;

      if (successes === results.length) {
        console.log('✅ Sincronização completa com sucesso');
        toast.success('Dados sincronizados com sucesso!', {
          description: `${operations.join(', ')} salvos na nuvem.`
        });
        return true;
      } else if (successes > 0) {
        console.warn(`⚠️ Sincronização parcial: ${successes}/${results.length} operações bem-sucedidas`);
        toast.warning('Sincronização parcial concluída', {
          description: `${successes} de ${results.length} operações foram bem-sucedidas. Dados locais preservados.`
        });
        return false;
      } else {
        console.error('❌ Todas as operações de sincronização falharam');
        toast.error('Falha na sincronização', {
          description: 'Não foi possível salvar na nuvem, mas seus dados estão seguros localmente.'
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error('Erro de conectividade', {
        description: 'Falha ao conectar com o servidor. Dados mantidos localmente.'
      });
      return false;
    }
  }

  // Force sync all pending debounced operations
  async flushPendingOperations(): Promise<void> {
    console.log('🚀 Forçando execução de operações pendentes...');
    
    const pendingOperations = Array.from(this.debounceTimers.entries());
    
    // Clear all timers and execute immediately
    for (const [key, timer] of pendingOperations) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
    
    if (pendingOperations.length > 0) {
      console.log(`⚡ ${pendingOperations.length} operação(ões) pendente(s) executada(s) imediatamente`);
      toast.info('Sincronizando dados pendentes...', {
        description: 'Finalizando operações de backup.'
      });
    }
  }

  // Clear all pending operations (useful for cleanup)
  clearPendingOperations(): void {
    console.log('🗑️ Limpando operações pendentes...');
    
    for (const [key, timer] of this.debounceTimers.entries()) {
      clearTimeout(timer);
    }
    
    this.debounceTimers.clear();
    console.log('✅ Operações pendentes limpas');
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();