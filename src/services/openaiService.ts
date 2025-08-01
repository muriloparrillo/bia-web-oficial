import { toast } from 'sonner';
import { adminService } from './adminService';

export interface UserPlan {
  name: string;
  monthlyIdeas: number;
  monthlyArticles: number;
  sites: number;
}

export interface UsageStats {
  ideasGenerated: number;
  articlesProduced: number;
  lastReset: string;
}

export interface OpenAIRequest {
  type: 'ideas' | 'content';
  userId: number;
  prompt: string;
  parameters?: any;
}

class OpenAIService {
  private readonly BASE_URL = 'https://api.openai.com/v1';
  
  // Planos disponíveis e suas cotas
  private readonly PLANS: Record<string, UserPlan> = {
    'Free': {
      name: 'Free',
      monthlyIdeas: 10,
      monthlyArticles: 3,
      sites: 1
    },
    '5 Sites': {
      name: '5 Sites',
      monthlyIdeas: 100,
      monthlyArticles: 50,
      sites: 5
    },
    '20 Sites': {
      name: '20 Sites',
      monthlyIdeas: 300,
      monthlyArticles: 150,
      sites: 20
    },
    'Sites Ilimitados': {
      name: 'Sites Ilimitados',
      monthlyIdeas: 1000,
      monthlyArticles: 500,
      sites: -1 // -1 = ilimitado
    }
  };

  // Armazenar uso dos usuários (localStorage para persistência)
  private readonly USAGE_STORAGE_KEY = 'bia-usage-stats';

  // Gerar imagem usando DALL-E
  async generateImage(prompt: string, imageStyle: string = 'realistic'): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      const apiKey = this.getActiveApiKey();
      
      if (!apiKey) {
        return { 
          success: false, 
          error: 'Chave API não configurada. Contate o administrador do sistema.' 
        };
      }

      // API real para DALL-E
      const imagePrompt = `Professional, high-quality ${imageStyle} image for blog article about: ${prompt}. Clean, modern, suitable for business blog.`;
      
      const response = await fetch(`${this.BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: imagePrompt,
          size: "1024x1024",
          quality: "standard",
          n: 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API DALL-E: ${response.status}`);
      }

      const data = await response.json();
      return { 
        success: true, 
        imageUrl: data.data[0].url 
      };
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      return { 
        success: false, 
        error: 'Erro ao gerar imagem. Tente novamente.' 
      };
    }
  }

  // Obter chave API ativa do sistema
  private getActiveApiKey(): string | null {
    try {
      const systemConfig = adminService.getSystemConfig();
      const activeModel = adminService.getActiveAIModel();
      
      if (!activeModel) {
        return systemConfig.apiKeys.openai || null;
      }

      // Retornar a chave correspondente ao provedor do modelo ativo
      switch (activeModel.provider) {
        case 'openai':
          return systemConfig.apiKeys.openai || null;
        case 'anthropic':
          return systemConfig.apiKeys.anthropic || null;
        case 'google':
          return systemConfig.apiKeys.google || null;
        default:
          return systemConfig.apiKeys.openai || null;
      }
    } catch (error) {
      console.error('Erro ao obter chave API:', error);
      return null;
    }
  }

  // Verificar se há chave API configurada
  hasValidApiKey(): boolean {
    const apiKey = this.getActiveApiKey();
    
    if (!apiKey || !apiKey.trim()) {
      return false;
    }

    // Aceitar apenas chaves que começam com padrões conhecidos de APIs reais
    return apiKey.startsWith('sk-') || 
           apiKey.startsWith('sk-ant-') || 
           apiKey.startsWith('AIza') || 
           apiKey.startsWith('ya29.');
  }

  // Obter plano do usuário
  getUserPlan(planName: string): UserPlan {
    return this.PLANS[planName] || this.PLANS['Free'];
  }

  // Obter estatísticas de uso do usuário
  getUserUsage(userId: number): UsageStats {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    try {
      const saved = localStorage.getItem(this.USAGE_STORAGE_KEY);
      const allUsage = saved ? JSON.parse(saved) : {};
      let userUsage = allUsage[userId];

      // Reset mensal
      if (!userUsage || userUsage.lastReset !== currentMonth) {
        userUsage = {
          ideasGenerated: 0,
          articlesProduced: 0,
          lastReset: currentMonth
        };
        allUsage[userId] = userUsage;
        localStorage.setItem(this.USAGE_STORAGE_KEY, JSON.stringify(allUsage));
      }

      return userUsage;
    } catch (error) {
      console.error('Erro ao carregar estatísticas de uso:', error);
      return {
        ideasGenerated: 0,
        articlesProduced: 0,
        lastReset: currentMonth
      };
    }
  }

  // Salvar estatísticas de uso
  private saveUserUsage(userId: number, usage: UsageStats): void {
    try {
      const saved = localStorage.getItem(this.USAGE_STORAGE_KEY);
      const allUsage = saved ? JSON.parse(saved) : {};
      allUsage[userId] = usage;
      localStorage.setItem(this.USAGE_STORAGE_KEY, JSON.stringify(allUsage));
    } catch (error) {
      console.error('Erro ao salvar estatísticas de uso:', error);
    }
  }

  // Verificar se usuário pode usar o serviço
  canUseService(userId: number, userPlan: string, type: 'ideas' | 'content', quantity: number = 1, userEmail?: string): { allowed: boolean; reason?: string } {
    // Super admin tem acesso ilimitado
    if (userEmail && adminService.isSuperAdmin(userEmail)) {
      return { allowed: true };
    }

    // Verificar API key primeiro
    if (!this.hasValidApiKey()) {
      return {
        allowed: false,
        reason: 'Sistema indisponível. Contate o administrador.'
      };
    }

    const plan = this.getUserPlan(userPlan);
    const usage = this.getUserUsage(userId);

    if (type === 'ideas') {
      const newTotal = usage.ideasGenerated + quantity;
      if (newTotal > plan.monthlyIdeas) {
        return {
          allowed: false,
          reason: `Limite mensal de ${plan.monthlyIdeas} ideias atingido. Você já usou ${usage.ideasGenerated} ideias este mês.`
        };
      }
    } else if (type === 'content') {
      const newTotal = usage.articlesProduced + quantity;
      if (newTotal > plan.monthlyArticles) {
        return {
          allowed: false,
          reason: `Limite mensal de ${plan.monthlyArticles} artigos atingido. Você já produziu ${usage.articlesProduced} artigos este mês.`
        };
      }
    }

    return { allowed: true };
  }

  // Gerar ideias usando OpenAI
  async generateIdeas(request: OpenAIRequest & { type: 'ideas' }): Promise<{ success: boolean; ideas?: string[]; error?: string }> {
    const { userId, parameters } = request;
    
    // Verificar cotas
    const canUse = this.canUseService(userId, parameters.userPlan || 'Free', 'ideas', parameters.quantidade, parameters.userEmail);
    if (!canUse.allowed) {
      return { success: false, error: canUse.reason };
    }

    try {
      const apiKey = this.getActiveApiKey();
      const activeModel = adminService.getActiveAIModel();
      
      if (!apiKey) {
        return { success: false, error: 'Chave de API não configurada no sistema' };
      }

      const prompt = `Você é um especialista em marketing de conteúdo e SEO. Gere ${parameters.quantidade} ideias de títulos para artigos de blog sobre o nicho "${parameters.nicho}".

REQUISITOS:
- Títulos devem ser atraentes e clickbait sem serem enganosos
- Focar nas palavras-chave: ${parameters.palavrasChave}
- Idioma: ${parameters.idioma}
- Cada título deve ter entre 40-60 caracteres para SEO
${parameters.contexto ? `- Contexto adicional: ${parameters.contexto}` : ''}

FORMATO DE RESPOSTA:
Retorne apenas os títulos, um por linha, sem numeração, sem aspas, sem explicações adicionais.

EXEMPLOS DE BONS TÍTULOS:
- "Como [Fazer Algo] em 7 Passos Simples"
- "[Número] Segredos de [Nicho] Que Profissionais Não Contam"
- "O Guia Definitivo para [Tópico] em 2025"
- "[Problema] Resolvido: [Solução] que Funciona"

Agora gere ${parameters.quantidade} títulos seguindo essas diretrizes:`;

      const modelToUse = activeModel?.model || 'gpt-3.5-turbo';

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um especialista em criação de títulos para blogs com foco em SEO e engajamento. Responda sempre seguindo exatamente o formato solicitado.'
            },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API Error:', response.status, errorData);
        throw new Error(`Erro da API OpenAI: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const ideas = content.split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .slice(0, parameters.quantidade);

      // Atualizar uso
      const usage = this.getUserUsage(userId);
      usage.ideasGenerated += parameters.quantidade;
      this.saveUserUsage(userId, usage);

      return { success: true, ideas };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro na geração de ideias:', error);
      return { success: false, error: `Erro na API: ${errorMessage}` };
    }
  }

  // Produzir conteúdo usando OpenAI
  async generateContent(request: OpenAIRequest & { type: 'content' }): Promise<{ success: boolean; content?: string; error?: string }> {
    const { userId, prompt, parameters } = request;
    
    // Verificar cotas
    const canUse = this.canUseService(userId, parameters.userPlan || 'Free', 'content', 1, parameters.userEmail);
    if (!canUse.allowed) {
      return { success: false, error: canUse.reason };
    }

    try {
      const apiKey = this.getActiveApiKey();
      const activeModel = adminService.getActiveAIModel();

      if (!apiKey) {
        return { success: false, error: 'Chave de API não configurada no sistema' };
      }

      const fullPrompt = `Você é um redator profissional especializado em SEO e marketing de conteúdo. Escreva um artigo completo e otimizado sobre: "${prompt}"

PARÂMETROS DO ARTIGO:
- Nicho: ${parameters.nicho}
- Palavras-chave principais: ${parameters.palavrasChave}
- Idioma: ${parameters.idioma}
- Tom: Profissional, mas acessível
${parameters.contexto ? `- Contexto: ${parameters.contexto}` : ''}

ESTRUTURA OBRIGATÓRIA:
1. Título H1 otimizado para SEO (incluir palavra-chave principal)
2. Introdução envolvente (2-3 parágrafos)
3. Pelo menos 4 seções principais com subtítulos H2
4. Subseções H3 quando necessário
5. Conclusão impactante com call-to-action
6. Mínimo de 1200 palavras

DIRETRIZES SEO:
- Use as palavras-chave naturalmente ao longo do texto
- Densidade de palavra-chave entre 1-2%
- Inclua variações e sinônimos das palavras-chave
- Use listas numeradas e com bullets quando adequado
- Inclua perguntas frequentes se relevante

FORMATAÇÃO:
- Use Markdown para formatação
- **Negrito** para pontos importantes
- *Itálico* para ênfase
- Listas organizadas
- Links internos sugeridos [texto do link](URL-sugerida)

Escreva o artigo completo seguindo essas diretrizes:`;

      const modelToUse = activeModel?.model || 'gpt-3.5-turbo';

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { 
              role: 'system', 
              content: 'Você é um redator profissional especializado em SEO e marketing de conteúdo. Escreva artigos completos, bem estruturados e otimizados para mecanismos de busca.'
            },
            { role: 'user', content: fullPrompt }
          ],
          max_tokens: 3500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('OpenAI API Error:', response.status, errorData);
        throw new Error(`Erro da API OpenAI: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Atualizar uso
      const usage = this.getUserUsage(userId);
      usage.articlesProduced += 1;
      this.saveUserUsage(userId, usage);

      return { success: true, content };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Erro na geração de conteúdo:', error);
      return { success: false, error: `Erro na API: ${errorMessage}` };
    }
  }

  // Obter limites e uso atual do usuário
  getUserLimits(userId: number, planName: string, userEmail?: string) {
    // Super admin tem acesso ilimitado
    if (userEmail && adminService.isSuperAdmin(userEmail)) {
      return {
        plan: {
          name: 'Super Admin',
          limits: {
            monthlyIdeas: -1,
            monthlyArticles: -1,
            sites: -1
          }
        },
        usage: {
          ideasGenerated: 0,
          articlesProduced: 0,
          ideasRemaining: -1,
          articlesRemaining: -1,
          resetDate: 'Acesso Ilimitado'
        },
        apiStatus: {
          hasApiKey: this.hasValidApiKey(),
          activeModel: adminService.getActiveAIModel()?.name || 'Nenhum modelo ativo'
        }
      };
    }

    const plan = this.getUserPlan(planName);
    const usage = this.getUserUsage(userId);

    return {
      plan: {
        name: plan.name,
        limits: {
          monthlyIdeas: plan.monthlyIdeas,
          monthlyArticles: plan.monthlyArticles,
          sites: plan.sites
        }
      },
      usage: {
        ideasGenerated: usage.ideasGenerated,
        articlesProduced: usage.articlesProduced,
        ideasRemaining: Math.max(0, plan.monthlyIdeas - usage.ideasGenerated),
        articlesRemaining: Math.max(0, plan.monthlyArticles - usage.articlesProduced),
        resetDate: new Date(usage.lastReset + '-01').toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        })
      },
      apiStatus: {
        hasApiKey: this.hasValidApiKey(),
        activeModel: adminService.getActiveAIModel()?.name || 'Nenhum modelo ativo'
      }
    };
  }
}

export const openaiService = new OpenAIService();