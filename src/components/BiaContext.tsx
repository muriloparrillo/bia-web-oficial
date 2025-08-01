import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { databaseService } from '../services/databaseService';

// Tipos de dados
interface Site {
  id: number;
  nome: string;
  url: string;
  descricao?: string;
  categoria?: string;
  status: 'ativo' | 'inativo';
  wordpressUrl?: string;
  wordpressUsername?: string;
  wordpressPassword?: string;
  wordpressData?: any;
  createdAt: string;
  updatedAt: string;
}

interface Idea {
  id: number;
  titulo: string;
  conteudo: string;
  categoria: string;
  tags: string[];
  siteId: number;
  status: 'pendente' | 'produzido' | 'excluido';
  articleId?: number;
  wordpressData?: any;
  cta?: any;
  generationParams?: any;
  createdAt: string;
  updatedAt: string;
  deletedDate?: string;
}

interface Article {
  id: number;
  titulo: string;
  conteudo: string;
  status: 'Pendente' | 'Concluído';
  siteId: number;
  ideaId?: number;
  imageUrl?: string;
  publishedUrl?: string;
  publishedDate?: string;
  scheduledDate?: string;
  scheduledUrl?: string;
  wordpressPostId?: number;
  wordpressData?: any;
  generationParams?: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id?: string;
  name: string;
  email: string;
  cpf?: string;
  whatsapp?: string;
  dataNascimento?: string;
  plano?: string;
}

// Estado da aplicação
interface BiaState {
  user: User | null;
  sites: Site[];
  ideas: Idea[];
  articles: Article[];
  isLoading: boolean;
  lastSyncAt: string | null;
  stats: {
    totalSites: number;
    totalIdeas: number;
    totalArticles: number;
    publishedArticles: number;
  };
}

// Tipos de ações
type BiaAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_SITES'; payload: Site[] }
  | { type: 'ADD_SITE'; payload: Site }
  | { type: 'UPDATE_SITE'; payload: { id: number; data: Partial<Site> } }
  | { type: 'DELETE_SITE'; payload: number }
  | { type: 'SET_IDEAS'; payload: Idea[] }
  | { type: 'ADD_IDEA'; payload: Idea }
  | { type: 'UPDATE_IDEA'; payload: { id: number; data: Partial<Idea> } }
  | { type: 'DELETE_IDEA'; payload: number }
  | { type: 'SET_ARTICLES'; payload: Article[] }
  | { type: 'ADD_ARTICLE'; payload: Article }
  | { type: 'UPDATE_ARTICLE'; payload: { id: number; data: Partial<Article> } }
  | { type: 'DELETE_ARTICLE'; payload: number }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'CLEAR_ALL_DATA' };

// Estado inicial
const initialState: BiaState = {
  user: null,
  sites: [],
  ideas: [],
  articles: [],
  isLoading: false,
  lastSyncAt: null,
  stats: {
    totalSites: 0,
    totalIdeas: 0,
    totalArticles: 0,
    publishedArticles: 0
  }
};

// Função para calcular estatísticas
const calculateStats = (state: BiaState) => {
  return {
    totalSites: state.sites.filter(s => s.status === 'ativo').length,
    totalIdeas: state.ideas.filter(i => i.status !== 'excluido').length,
    totalArticles: state.articles.length,
    publishedArticles: state.articles.filter(a => a.publishedUrl).length
  };
};

// Reducer
function biaReducer(state: BiaState, action: BiaAction): BiaState {
  let newState: BiaState;
  
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_SITES':
      newState = { ...state, sites: action.payload };
      break;

    case 'ADD_SITE':
      newState = { ...state, sites: [...state.sites, action.payload] };
      break;

    case 'UPDATE_SITE':
      newState = {
        ...state,
        sites: state.sites.map(site =>
          site.id === action.payload.id
            ? { ...site, ...action.payload.data, updatedAt: new Date().toISOString() }
            : site
        )
      };
      break;

    case 'DELETE_SITE':
      newState = {
        ...state,
        sites: state.sites.filter(site => site.id !== action.payload)
      };
      break;

    case 'SET_IDEAS':
      newState = { ...state, ideas: action.payload };
      break;

    case 'ADD_IDEA':
      newState = { ...state, ideas: [...state.ideas, action.payload] };
      break;

    case 'UPDATE_IDEA':
      newState = {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.id
            ? { ...idea, ...action.payload.data, updatedAt: new Date().toISOString() }
            : idea
        )
      };
      break;

    case 'DELETE_IDEA':
      newState = {
        ...state,
        ideas: state.ideas.filter(idea => idea.id !== action.payload)
      };
      break;

    case 'SET_ARTICLES':
      newState = { ...state, articles: action.payload };
      break;

    case 'ADD_ARTICLE':
      newState = { ...state, articles: [...state.articles, action.payload] };
      break;

    case 'UPDATE_ARTICLE':
      newState = {
        ...state,
        articles: state.articles.map(article =>
          article.id === action.payload.id
            ? { ...article, ...action.payload.data, updatedAt: new Date().toISOString() }
            : article
        )
      };
      break;

    case 'DELETE_ARTICLE':
      newState = {
        ...state,
        articles: state.articles.filter(article => article.id !== action.payload)
      };
      break;

    case 'SET_LAST_SYNC':
      return { ...state, lastSyncAt: action.payload };

    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        user: state.user // Manter o usuário logado
      };

    default:
      return state;
  }

  // Recalcular estatísticas para qualquer mudança nos dados
  newState.stats = calculateStats(newState);
  return newState;
}

// Context
const BiaContext = createContext<{
  state: BiaState;
  actions: {
    // Usuário
    login: (user: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
    
    // Sites
    addSite: (siteData: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
    updateSite: (id: number, data: Partial<Site>) => void;
    deleteSite: (id: number) => void;
    
    // Ideias
    addIdea: (ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
    updateIdea: (id: number, data: Partial<Idea>) => void;
    deleteIdea: (id: number) => void;
    
    // Artigos
    addArticle: (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => boolean;
    updateArticle: (id: number, data: Partial<Article>) => void;
    deleteArticle: (id: number) => void;
    
    // Utilitários
    checkFreePlanLimits: () => { sites: boolean; ideas: boolean; articles: boolean };
    isFreePlan: () => boolean;
    syncData: () => Promise<void>;
    forceSyncToDatabase: () => Promise<void>;
    clearAllData: () => void;
  };
} | null>(null);

// Provider
export function BiaProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(biaReducer, initialState);

  // Função para salvar dados no localStorage para compatibilidade
  const saveToLocalStorage = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && state.user?.id) {
        const appState = {
          user: state.user,
          sites: state.sites,
          ideas: state.ideas,
          articles: state.articles,
          lastSyncAt: state.lastSyncAt
        };
        localStorage.setItem('bia-app-state', JSON.stringify(appState));
        console.log('📱 Estado salvo no localStorage para compatibilidade');
      }
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no localStorage:', error);
    }
  }, [state]);

  // Carregar dados do banco na inicialização
  useEffect(() => {
    const loadInitialData = async () => {
      if (!state.user || !state.user.id) {
        console.log('⚠️ Usuário não logado, pulando carregamento de dados');
        return;
      }
      
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        console.log('🔄 Carregando dados iniciais do banco para usuário:', state.user.id);
        
        // Carregar todos os dados do usuário
        const userData = await databaseService.loadUserData(state.user.id);

        // Definir dados carregados
        dispatch({ type: 'SET_SITES', payload: userData.sites || [] });
        dispatch({ type: 'SET_IDEAS', payload: userData.ideas || [] });
        dispatch({ type: 'SET_ARTICLES', payload: userData.articles || [] });

        console.log('✅ Dados iniciais carregados:', {
          sites: userData.sites?.length || 0,
          ideas: userData.ideas?.length || 0,
          articles: userData.articles?.length || 0
        });

        dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados iniciais:', error);
        // Em caso de erro, definir arrays vazios para não quebrar a interface
        dispatch({ type: 'SET_SITES', payload: [] });
        dispatch({ type: 'SET_IDEAS', payload: [] });
        dispatch({ type: 'SET_ARTICLES', payload: [] });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadInitialData();
  }, [state.user?.id]);

  // Salvar automaticamente no localStorage quando dados mudarem
  useEffect(() => {
    saveToLocalStorage();
  }, [state.sites, state.ideas, state.articles, saveToLocalStorage]);

  // Sincronização automática de dados a cada 5 minutos
  useEffect(() => {
    if (!state.user?.id) return;

    const syncInterval = setInterval(async () => {
      try {
        console.log('🔄 Sincronização automática de dados...');
        await actions.syncData();
      } catch (error) {
        console.warn('⚠️ Erro na sincronização automática:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(syncInterval);
  }, [state.user?.id]);

  // Actions
  const actions = {
    // Usuário
    login: useCallback((user: User) => {
      console.log('👤 Login do usuário:', user.email);
      // Garantir que o usuário tenha um ID único
      const userWithId = {
        ...user,
        id: user.id || user.email || user.cpf || `user_${Date.now()}`
      };
      dispatch({ type: 'SET_USER', payload: userWithId });
    }, []),

    logout: useCallback(() => {
      console.log('👤 Logout do usuário');
      dispatch({ type: 'CLEAR_ALL_DATA' });
      dispatch({ type: 'SET_USER', payload: null });
    }, []),

    updateUser: useCallback((userData: Partial<User>) => {
      dispatch({ type: 'SET_USER', payload: { ...state.user, ...userData } as User });
    }, [state.user]),

    // Sites
    addSite: useCallback((siteData: Omit<Site, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newSite: Site = {
          ...siteData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_SITE', payload: newSite });
        
        // Salvar no banco de forma assíncrona (silencioso)
        if (state.user?.id) {
          const updatedSites = [...state.sites, newSite];
          databaseService.saveUserDataDebounced(state.user.id, { sites: updatedSites });
        }

        console.log('✅ Site adicionado:', newSite.nome);
        return true;
      } catch (error) {
        console.error('❌ Erro ao adicionar site:', error);
        return false;
      }
    }, [state.sites, state.user?.id]),

    updateSite: useCallback((id: number, data: Partial<Site>) => {
      dispatch({ type: 'UPDATE_SITE', payload: { id, data } });
      
      // Salvar no banco de forma assíncrona (silencioso)
      const userId = state.user?.id;
      if (userId) {
        // Use um setTimeout para pegar o estado atualizado
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { sites: state.sites });
        }, 100);
      }

      console.log('✅ Site atualizado:', id);
    }, [state.sites, state.user?.id]),

    deleteSite: useCallback((id: number) => {
      dispatch({ type: 'DELETE_SITE', payload: id });
      
      // Salvar lista atualizada no banco de forma assíncrona
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { sites: state.sites });
        }, 100);
      }

      console.log('✅ Site excluído:', id);
    }, [state.sites, state.user?.id]),

    // Ideias
    addIdea: useCallback((ideaData: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newIdea: Idea = {
          ...ideaData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_IDEA', payload: newIdea });
        
        // Salvar no banco de forma assíncrona (silencioso)
        if (state.user?.id) {
          const updatedIdeas = [...state.ideas, newIdea];
          databaseService.saveUserDataDebounced(state.user.id, { ideas: updatedIdeas });
        }

        console.log('✅ Ideia adicionada:', newIdea.titulo);
        return true;
      } catch (error) {
        console.error('❌ Erro ao adicionar ideia:', error);
        return false;
      }
    }, [state.ideas, state.user?.id]),

    updateIdea: useCallback((id: number, data: Partial<Idea>) => {
      dispatch({ type: 'UPDATE_IDEA', payload: { id, data } });
      
      // Salvar no banco de forma assíncrona
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { ideas: state.ideas });
        }, 100);
      }

      console.log('✅ Ideia atualizada:', id);
    }, [state.ideas, state.user?.id]),

    deleteIdea: useCallback((id: number) => {
      dispatch({ type: 'DELETE_IDEA', payload: id });
      
      // Salvar lista atualizada no banco de forma assíncrona  
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { ideas: state.ideas });
        }, 100);
      }

      console.log('✅ Ideia excluída:', id);
    }, [state.ideas, state.user?.id]),

    // Artigos
    addArticle: useCallback((articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const newArticle: Article = {
          ...articleData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        dispatch({ type: 'ADD_ARTICLE', payload: newArticle });
        
        // Salvar no banco de forma assíncrona (silencioso)
        if (state.user?.id) {
          const updatedArticles = [...state.articles, newArticle];
          databaseService.saveUserDataDebounced(state.user.id, { articles: updatedArticles });
        }

        console.log('✅ Artigo adicionado:', newArticle.titulo);
        return true;
      } catch (error) {
        console.error('❌ Erro ao adicionar artigo:', error);
        return false;
      }
    }, [state.articles, state.user?.id]),

    updateArticle: useCallback((id: number, data: Partial<Article>) => {
      dispatch({ type: 'UPDATE_ARTICLE', payload: { id, data } });
      
      // Salvar no banco de forma assíncrona
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { articles: state.articles });
        }, 100);
      }

      console.log('✅ Artigo atualizado:', id);
    }, [state.articles, state.user?.id]),

    deleteArticle: useCallback((id: number) => {
      dispatch({ type: 'DELETE_ARTICLE', payload: id });
      
      // Salvar lista atualizada no banco de forma assíncrona
      const userId = state.user?.id;
      if (userId) {
        setTimeout(() => {
          databaseService.saveUserDataDebounced(userId, { articles: state.articles });
        }, 100);
      }

      console.log('✅ Artigo excluído:', id);
    }, [state.articles, state.user?.id]),

    // Utilitários
    checkFreePlanLimits: useCallback(() => {
      const userPlan = state.user?.plano || 'Free';
      
      if (userPlan === 'Free') {
        return {
          sites: state.sites.filter(s => s.status === 'ativo').length < 1,
          ideas: state.ideas.filter(i => i.status !== 'excluido').length < 5,
          articles: state.articles.length < 3
        };
      }
      
      // Para planos pagos, não há limites (ou limites muito altos)
      return {
        sites: true,
        ideas: true,
        articles: true
      };
    }, [state.user, state.sites, state.ideas, state.articles]),

    isFreePlan: useCallback(() => {
      return (state.user?.plano || 'Free') === 'Free';
    }, [state.user]),

    syncData: useCallback(async () => {
      if (!state.user?.id) return;
      
      try {
        console.log('🔄 Sincronizando dados com o banco...');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Sincronizar dados locais para o banco (com feedback ao usuário)
        const syncSuccess = await databaseService.syncUserData(state.user.id, {
          sites: state.sites,
          ideas: state.ideas,
          articles: state.articles
        });

        if (syncSuccess) {
          // Só recarregar dados se a sincronização foi bem-sucedida
          const userData = await databaseService.loadUserData(state.user.id);
          
          dispatch({ type: 'SET_SITES', payload: userData.sites || [] });
          dispatch({ type: 'SET_IDEAS', payload: userData.ideas || [] });
          dispatch({ type: 'SET_ARTICLES', payload: userData.articles || [] });
          
          dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
        }
        
      } catch (error) {
        console.error('❌ Erro na sincronização de dados:', error);
        // Não mostrar toast aqui pois o databaseService já trata isso
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.user?.id, state.sites, state.ideas, state.articles]),

    // NOVA FUNÇÃO: Forçar sincronização completa com o banco
    forceSyncToDatabase: useCallback(async () => {
      if (!state.user?.id) {
        console.warn('⚠️ Usuário não identificado para sincronização forçada');
        return;
      }
      
      try {
        console.log('🔄 FORÇANDO sincronização completa com o banco...');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Primeiro, executar operações pendentes
        await databaseService.flushPendingOperations();
        
        // Depois, forçar sincronização imediata de todos os dados
        const syncSuccess = await databaseService.syncUserData(state.user.id, {
          sites: state.sites,
          ideas: state.ideas,
          articles: state.articles
        });

        if (syncSuccess) {
          dispatch({ type: 'SET_LAST_SYNC', payload: new Date().toISOString() });
          console.log('✅ Sincronização forçada concluída com sucesso');
        } else {
          console.warn('⚠️ Sincronização forçada parcialmente bem-sucedida');
        }
        
      } catch (error) {
        console.error('❌ Erro na sincronização forçada:', error);
        // Não relançar erro para não quebrar a interface
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, [state.user?.id, state.sites, state.ideas, state.articles]),

    clearAllData: useCallback(() => {
      console.log('🗑️ Limpando todos os dados');
      dispatch({ type: 'CLEAR_ALL_DATA' });
    }, [])
  };

  return (
    <BiaContext.Provider value={{ state, actions }}>
      {children}
    </BiaContext.Provider>
  );
}

// Hook personalizado
export function useBia() {
  const context = useContext(BiaContext);
  if (!context) {
    throw new Error('useBia deve ser usado dentro de um BiaProvider');
  }
  return context;
}

export type { Site, Idea, Article, User, BiaState };