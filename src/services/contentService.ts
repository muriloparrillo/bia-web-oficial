import { adminService } from './adminService';
import { toast } from 'sonner';

interface CTAData {
  titulo?: string;
  descricao?: string;
  botao?: string;
  link?: string;
  imagem?: string;
  posicao?: 'inicio' | 'meio' | 'final';
}

interface IdeaGenerationParams {
  nicho: string;
  palavrasChave: string;
  quantidade: number;
  idioma: string;
  contexto?: string;
  siteId: number;
  autor?: string;
  categorias?: string[];
  tags?: string[];
  cta?: CTAData;
}

interface ContentGenerationParams {
  tema: string;
  nicho: string;
  palavrasChave: string;
  idioma: string;
  contexto?: string;
  siteId: number;
  ideaId: number;
  cta?: CTAData;
}

class ContentService {
  private readonly BASE_URL = 'https://api.openai.com/v1';

  // Obter chave API do admin ou variável de ambiente
  private getApiKey(): string | null {
    try {
      // Primeiro, verificar variável de ambiente (prioritária)
      let envApiKey: string | null = null;
      
      try {
        // Verificar se estamos no ambiente do Figma Make/Supabase onde as env vars estão disponíveis
        if (typeof window !== 'undefined' && (window as any).process?.env?.OPENAI_API_KEY) {
          envApiKey = (window as any).process.env.OPENAI_API_KEY;
        } else if (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) {
          envApiKey = process.env.OPENAI_API_KEY;
        }
      } catch (envError) {
        // Ignorar erros de acesso a variáveis de ambiente
      }
      
      if (envApiKey && envApiKey.trim() && envApiKey.startsWith('sk-')) {
        console.log('🔑 Usando chave API da variável de ambiente');
        return envApiKey;
      }

      // Fallback para configuração do admin
      const systemConfig = adminService.getSystemConfig();
      const apiKey = systemConfig.apiKeys.openai || null;
      
      // Debug: Log detalhado da chave (apenas para desenvolvimento)
      console.log('🔑 ContentService - Status da chave API:', {
        hasEnvKey: !!envApiKey,
        hasAdminKey: !!(systemConfig?.apiKeys?.openai),
        keyConfigured: !!(envApiKey || apiKey),
        keySource: envApiKey ? 'environment' : (apiKey ? 'admin_config' : 'none')
      });
      
      return apiKey;
    } catch (error) {
      console.error('❌ Erro ao obter chave API:', error);
      return null;
    }
  }

  // Verificar se há chave API válida - usado internamente apenas
  hasValidApiKey(): boolean {
    const apiKey = this.getApiKey();
    const isValid = !!(apiKey && apiKey.trim() && apiKey.startsWith('sk-'));
    
    // Log apenas para debug interno, não afeta usuário final
    if (!isValid) {
      console.log('🔒 Sistema aguardando configuração da chave API pelo administrador');
    } else {
      console.log('✅ Sistema configurado e pronto para uso');
    }
    
    return isValid;
  }

  // Verificar se o serviço está disponível
  isServiceAvailable(): boolean {
    return this.hasValidApiKey();
  }

  // Gerar prompt para ideias baseado no código PHP oficial
  private gerarPromptIdeias(
    nicho: string, 
    palavrasChave: string[], 
    contexto: string, 
    quantidade: number, 
    idioma: string
  ): string {
    const palavrasChaveTexto = palavrasChave.join(', ');
    
    // Instrução de idioma baseada no PHP oficial - EXATA do código PHP
    let instrucaoIdioma = "";
    switch (idioma) {
      case 'Espanhol':
        instrucaoIdioma = "Genera los títulos en español. ";
        break;
      case 'Inglês': // Note: o frontend usa "Inglês" mas o PHP usa "Ingles"
      case 'Ingles':
        instrucaoIdioma = "Generate the titles in English. ";
        break;
      case 'Francês': // Note: o frontend usa "Francês" mas o PHP usa "Frances"
      case 'Frances':
        instrucaoIdioma = "Générez les titres en français. ";
        break;
      case 'Italiano':
        instrucaoIdioma = "Genera i titoli in italiano. ";
        break;
      case 'Mandarim':
        instrucaoIdioma = "用中文生成标题。 ";
        break;
      case 'Russo':
        instrucaoIdioma = "Создавайте заголовки на русском языке. ";
        break;
      default: // Português
        instrucaoIdioma = "Gere os títulos em português. ";
        break;
    }

    // Prompt oficial do plugin PHP - EXATO
    const promptIdeiasAprimorado = `Você é um estrategista de conteúdo e especialista em SEO com profundo conhecimento do nicho de '${nicho}'.

Sua missão é gerar ${quantidade} ideias de títulos para artigos de blog, utilizando as seguintes palavras-chave como base e inspiração: '${palavrasChaveTexto}'.

${instrucaoIdioma}Os títulos gerados DEVEM seguir as seguintes diretrizes para máxima relevância, engajamento e otimização para SEO em 2025:

1.  **Relevância Profunda para o Nicho:** Cada título deve ser altamente relevante para o público de '${nicho}', abordando seus interesses, dores, necessidades ou curiosidades.
2.  **Otimização SEO Estratégica:**
    *   **Palavra-Chave Principal:** Incorpore a palavra-chave mais relevante de '${palavrasChaveTexto}' ou uma variação semântica forte, preferencialmente no início do título, de forma natural.
    *   **Comprimento Ideal:** Mantenha os títulos concisos, idealmente entre 50-60 caracteres (máximo 70 caracteres), para evitar truncamento nas SERPs.
    *   **Clareza e Intenção:** O título deve comunicar claramente o tema central do artigo e alinhar-se com uma possível intenção de busca do usuário (ex: aprender algo, resolver um problema, encontrar uma lista, comparar opções).
    *   **Evitar Clickbait:** Os títulos devem ser atraentes, mas NUNCA enganosos. Devem refletir fielmente o conteúdo que o artigo entregará.

3.  **Engajamento e CTR (Click-Through Rate):**
    *   **Números e Listas:** Considere o uso de números para listas (ex: '7 Dicas Infalíveis para X em ${nicho}') ou dados específicos.
    *   **Perguntas (com Moderação):** Títulos em formato de pergunta podem ser eficazes se refletirem dúvidas genuínas do público. Priorize afirmações impactantes sempre que possível.
    *   **Palavras de Impacto (Power Words):** Utilize palavras que gerem curiosidade, urgência ou emoção, mas sem exageros.

4.  **Diversidade de Formatos:**
    *   **Guias e Tutoriais:** 'Como Fazer X', 'Guia Completo para Y', 'X Passos para Dominar Y'
    *   **Listas e Compilações:** 'X Maneiras de...', 'X Ferramentas Essenciais para...'
    *   **Análises e Comparações:** 'X vs Y: Qual é Melhor para...', 'Análise Completa de X'
    *   **Tendências e Novidades:** 'Tendências de X para 2025', 'O Que Esperar de X em 2025'
    *   **Problemas e Soluções:** 'Como Resolver X', 'X Soluções para o Problema Y'

5.  **Adaptação Cultural e Linguística:**
    *   Os títulos devem ressoar com o público-alvo específico, considerando nuances culturais e linguísticas do mercado em questão.
    *   Utilize terminologia familiar ao público do nicho '${nicho}'.

6.  **Contexto Adicional:**
${!this.empty(contexto) ? `    *   Considere o seguinte contexto/introdução ao gerar os títulos: '${contexto}'` : "    *   Não há contexto adicional fornecido. Foque nas palavras-chave e no nicho."}

Formate sua resposta como uma lista numerada simples, com cada título em uma linha separada, sem explicações adicionais. Exemplo:
1. Título do Artigo 1
2. Título do Artigo 2
(e assim por diante)`;

    return promptIdeiasAprimorado;
  }

  // Gerar prompt para conteúdo baseado no código PHP oficial
  private gerarPromptConteudo(
    tema: string,
    nicho: string, 
    palavrasChave: string,
    idioma: string,
    contexto?: string
  ): string {
    const instrucaoIdioma = `Escreva o artigo completo em ${idioma}. `;
    
    return `${instrucaoIdioma}

Você é um redator especialista em SEO e copywriting técnico avançado. Sua missão é criar um artigo completo, detalhado e otimizado para SEO sobre o tema:

"${tema}"

### Legibilidade
- Obrigatório que 100% do texto seja na voz ativa
- 30% total do texto deve conter palavras de transição: contudo, entretanto, em resumo, além disso e portanto.

Este artigo é para um blog no nicho de "${nicho}" e deve focar nas seguintes palavras-chave: "${palavrasChave}".

### Instruções Iniciais para a Geração do Conteúdo: Leia e compreenda todo este prompt antes de começar a gerar o conteúdo.

0. Em nenhuma hipótese inclua no texto: \`html
0. Em nenhuma hipótese comece ou termine o texto falando 'segue o conteudo solicitado' ou algo do tipo, os artigos serão publicados sem revisão
1. Siga rigorosamente cada linha de orientação deste prompt, não pule nem ignore nenhuma instrução
2. O conteúdo será publicado automaticamente no blog, sem nenhuma revisão humana
3. O conteúdo deve conter de 2.500 a 5.000 palavras
4. O conteúdo obrigatoriamente deve conter backlinks internos e externos
5. O conteúdo deve ter um checklist e uma tabela distribuidos de forma natural no texto
6. Não seja literal ao seguir a estrutura deste prompt, não entitule conforme está, seja criativo e persuasivo
7. Use técnicas de copywriting e storytelling para deixar o conteúdo relevante, engajante, e seja coeso
8. Não inclua o título no texto
9. Nunca use placeholders, o texto não terá edições, inclua backlinks existentes e que sejam de fontes reais e confiáveis
10. Caso não consiga gerar o conteúdo, tente novamente até conseguir gerar, nunca entregue o conteúdo finalizando com 'desculpe, não posso ajudar com isso' ou algo do tipo

Você é o melhor especialista do mundo em ${nicho} e deve escrever um artigo completo, denso, que gere valor ao leitor, sobre ${tema}, no decorrer do texto, cite ao menos 8 a 12 vezes as ${palavrasChave}

---

### SEO e HTML Pronto para Publicação

1. **SEO Integrado**
   - Use as palavras-chave ${palavrasChave} de forma natural e estratégica ao longo do texto.
   - Adicione backlinks internos e externos reais usando <a> garantindo que todos os links sejam funcionais.

2. **HTML Completo e Correto**
   - **Títulos:** Utilize <h1>, <h2>, <h3> para estruturar o conteúdo.
   - **Parágrafos:** Formate o texto com <p> para garantir fluidez e fácil leitura.
   - **Listas e Checklists:** Use <ul> e <li> para pontos e etapas importantes.
   - **Tabelas:** Use <table>, <tr>, <td> para organizar dados relevantes.
   - **Gráficos:** Adicione <img> para visualizações simples de dados.
   - **Links:** Adicione backlinks usando <a> para conteúdos internos e externos de relevância.

Evite encurtar o conteúdo ou omitir seções por limitação de espaço. Expanda cada seção ao máximo, respeitando os limites de palavras.

### Tamanho e Parágrafos

   - O artigo deve conter entre 2.500 e 5.000 palavras;
   - Não enumere os títulos, a não ser que seja um artigo de lista;
   - O artigo deve incluir entre 5 a 10 seções, cada uma com 2 a 4 parágrafos desenvolvidos;
   - O artigo deve incluir uma ou mais tabelas e um ou mais checklist sobre o tema em algum subtítulo distribuído de forma natural;
   - Cada parágrafo deve ter no mínimo 5-7 linhas completas e apresentar:
     - Introdução ao tópico com explicação clara.
     - Desenvolvimento detalhado com múltiplos exemplos, estudos de caso e insights práticos.
     - Fechamento que conecte o parágrafo ao próximo tema para garantir fluidez.

---
### Estrutura e Orientações Obrigatórias

1. **Título Principal e Subtítulos**
   - O **título do artigo** deve ser formatado como <h1> no início do conteúdo.
   - **Subtítulos** das seções principais devem ser formatados como <h2>.

---

### Elementos Obrigatórios no Texto

   - **Checklist ou lista:** Utilize \`<ul>\` e \`<li>\` para organizar informações e facilitar a leitura.
   - **Tabelas e Gráficos:** Inclua pelo menos uma tabela ou gráfico visual com <table>, <tr>, <td>, ou <img> para apresentar comparações ou dados técnicos de forma clara e visualmente atraente.

---

### Conteúdo Profundo e Orientado para Ação

   - O conteúdo deve ser abrangente e totalmente adaptado ao ${nicho}, ${tema} e ${palavrasChave}. Certifique-se de que cada seção, exemplo, dado ou informação esteja alinhado com o nicho específico do leitor e o tema principal, utilizando as palavras-chave de forma estratégica ao longo do texto.
   - Explore múltiplos ângulos do assunto, abordando tanto conceitos básicos quanto pontos avançados e específicos, sempre levando em conta o contexto do nicho e as expectativas do público-alvo.
   - Sempre que aplicável, inclua seções que discutam vantagens, benefícios, tendências ou avanços relacionados ao tema, destacando como esses fatores impactam o contexto atual e o futuro do tópico.
   - Use storytelling, exemplos práticos reais e estudos de caso para reforçar o valor do conteúdo.
     - Incluir estudos de caso apenas se forem reais e provenientes de fontes confiáveis. Caso não seja viável ou necessário, a seção de estudos de caso não precisa ser elaborada.
   - Adicione estatísticas, pesquisas ou dados relevantes de fontes reais e confiáveis para apoiar os argumentos e dar credibilidade ao artigo. Sempre cite fontes confiáveis e autoridades no assunto.

### Introdução

   - A introdução deve contextualizar o assunto e explicar a importância do ${tema} para o nicho '${nicho}'. 
   - Crie expectativa, destacando o que o leitor aprenderá e como o conteúdo ajudará a resolver um problema ou alcançar um objetivo.
   - Conclua a introdução convidando o leitor a continuar lendo o artigo.

---

### Tendências e Avanços Futuros

   - Aprofunde as tendências do tema discutido
   - Destaque como tecnologias estão moldando o futuro se aplicável

---

### Ferramentas e Comparações Detalhadas

   - Quando citar ferramentas, faça uma descrição detalhada de como usá-las, onde encontrá-las (se aplicável) e as vantagens e desvantagens de cada uma.
   - Diferencie ferramentas gratuitas e pagas, e inclua links ou referências diretas para o leitor acessar as ferramentas discutidas.
   - Adicione exemplos práticos de uso das ferramentas mencionadas.

---

### Contextualização dos Benefícios

   - Ao discutir vantagens ou benefícios, contextualize para diferentes tipos de aplicações.

---

### Seções de Perguntas Frequentes (FAQs)

   - Inclua uma seção de Perguntas Frequentes;
   - Inclua de 5 a 7 perguntas frequentes sobre o tema, com respostas práticas e objetivas, desmistificando equívocos populares.

---

### Integração Fluida de Chamada para Ação

   - A chamada para ação deve ser fluida e integrada naturalmente ao final do artigo, incentivando o leitor a aplicar o que aprendeu e explorar mais conteúdos ou ferramentas sem que haja a necessidade de um subtítulo específico para isso.

### SEO Técnico

- Importante que cada grupo de texto não tenha mais de 300 palavras ( separar sempre em H2 e H3) cada grupo 
- Escolher uma palavra chave principal do artigo (máximo 4 palavras). Essa exata palavra chave, tem que aparecer 6 vezes no artigo. A mesma, tem que aparecer no primeiro parágrafo do texto de forma obrigatória. Essa mesma palavra chave, tem que aparecer de forma exata do título principal e em 3 h2 ou h3.
- Link de saída: pegar alguma palavra do texto e colocar uma ref externa
- Link interno: pegar alguma palavra do texto e colocar um ref para o link interno do site.
- Imagem gerada tem que possuir o texto alternativo do título

${contexto ? `\n### Contexto Adicional:\n${contexto}` : ''}`;
  }

  // Gerar prompt para imagem baseado no código PHP oficial
  private gerarPromptImagem(
    tema: string,
    palavrasChave: string,
    idioma: string
  ): string {
    return `
Crie uma foto realista que represente: ${tema};
Integre elementos que representem: ${palavrasChave};
A imagem deve ser profissional, realista, rica em detalhes, em ultra definição;
NUNCA USE TEXTO NA IMAGEM;
Importante: o artigo foi produzido em ${idioma};
`;
  }

  // Gerar HTML do CTA baseado no código PHP oficial
  private gerarHtmlCTA(cta: CTAData): string {
    if (!cta.titulo && !cta.descricao && !cta.botao && !cta.link && !cta.imagem) {
      return '';
    }

    let html = "\n\n";
    html += '<div class="wp-block-group aligncenter" style="margin: 30px 0; text-align: center;">';

    // Imagem (com ou sem link)
    if (cta.imagem) {
      html += '<div style="margin-bottom: 15px;">';
      if (cta.link) {
        html += `<a href="${cta.link}" target="_blank" rel="noopener noreferrer">`;
        html += `<img src="${cta.imagem}" alt="${cta.titulo || 'CTA'}" style="max-width: 100%; height: auto; border-radius: 4px;">`;
        html += '</a>';
      } else {
        html += `<img src="${cta.imagem}" alt="${cta.titulo || 'CTA'}" style="max-width: 100%; height: auto; border-radius: 4px;">`;
      }
      html += '</div>';
    }

    // Título
    if (cta.titulo) {
      html += `<h3 style="font-size: 22px; margin-bottom: 10px;">${cta.titulo}</h3>`;
    }

    // Descrição
    if (cta.descricao) {
      html += `<p style="font-size: 16px; color: #555; margin-bottom: 20px;">${cta.descricao}</p>`;
    }

    // Botão
    if (cta.botao && cta.link) {
      html += '<div class="wp-block-button aligncenter">';
      html += `<a class="wp-block-button__link" href="${cta.link}" target="_blank" rel="noopener noreferrer">${cta.botao}</a>`;
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  // Helper function para verificar se string está vazia
  private empty(str: string | undefined): boolean {
    return !str || str.trim().length === 0;
  }





  // Notificar administradores sobre erro de API key
  private notifyApiKeyError(errorDetails: any): void {
    try {
      // Salvar erro para que administradores vejam
      const errorLog = {
        timestamp: new Date().toISOString(),
        type: 'api_key_error',
        details: errorDetails,
        message: 'Chave API OpenAI inválida ou expirada'
      };

      // Salvar no localStorage para visualização no painel admin
      const existingErrors = JSON.parse(localStorage.getItem('bia-system-errors') || '[]');
      existingErrors.unshift(errorLog);
      
      // Manter apenas os últimos 10 erros
      if (existingErrors.length > 10) {
        existingErrors.splice(10);
      }
      
      localStorage.setItem('bia-system-errors', JSON.stringify(existingErrors));
      
      console.error('🚨 Erro de API key salvo para revisão administrativa');
    } catch (notificationError) {
      console.error('Erro ao notificar problema de API key:', notificationError);
    }
  }

  // Gerar ideias usando OpenAI com prompt oficial
  async generateIdeas(params: IdeaGenerationParams): Promise<{ success: boolean; ideas?: string[]; error?: string }> {
    console.log('🚀 GenerateIdeas iniciado com parâmetros:', params);
    
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.error('❌ Chave API OpenAI não configurada');
      return { 
        success: false, 
        error: 'Chave API OpenAI não configurada. Contate o administrador do sistema.' 
      };
    }

    console.log('✅ Chave API obtida, preparando requisição...');

    try {
      const palavrasChaveArray = params.palavrasChave.split(',').map(p => p.trim());
      const prompt = this.gerarPromptIdeias(
        params.nicho,
        palavrasChaveArray,
        params.contexto || '',
        params.quantidade,
        params.idioma
      );

      console.log('📝 Prompt gerado:', prompt.substring(0, 200) + '...');

      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um assistente especialista em SEO e criação de conteúdo.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      };

      console.log('📡 Enviando requisição para OpenAI...', {
        url: `${this.BASE_URL}/chat/completions`,
        method: 'POST',
        model: requestBody.model,
        messagesCount: requestBody.messages.length,
        authHeaderSet: !!apiKey
      });

      const response = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📨 Resposta recebida da OpenAI:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          console.error('❌ Erro 401 - Problema de autenticação da API');
          
          // Log detalhado do erro para debug administrativo
          const errorDetails = JSON.parse(errorText);
          console.error('🔍 Detalhes do erro de autenticação:', {
            error: errorDetails,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'null',
            apiKeyLength: apiKey?.length || 0
          });

          // Notificar administradores sobre erro de API key
          this.notifyApiKeyError(errorDetails);
          
          return { 
            success: false, 
            error: 'Chave API OpenAI inválida ou expirada. Contate o administrador do sistema.' 
          };
        }
        
        if (response.status === 429) {
          return { 
            success: false, 
            error: 'Sistema com alta demanda. Aguarde alguns segundos e tente novamente.' 
          };
        }
        
        return { 
          success: false, 
          error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.' 
        };
      }

      const data = await response.json();
      console.log('✅ Dados processados da OpenAI:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length || 0,
        usage: data.usage
      });
      
      const content = data.choices[0].message.content;
      
      // Extrair as ideias da resposta usando a mesma lógica do PHP
      const lines = content.split('\n');
      const ideas = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!this.empty(trimmedLine) && /^\d+\./.test(trimmedLine)) {
          ideas.push(trimmedLine);
        }
      }

      console.log('💡 Ideias extraídas:', {
        totalLines: lines.length,
        ideasFound: ideas.length,
        requestedQuantity: params.quantidade
      });

      return { success: true, ideas: ideas.slice(0, params.quantidade) };

    } catch (error) {
      console.error('❌ Erro completo ao gerar ideias:', {
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return { 
        success: false, 
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.' 
      };
    }
  }

  // Gerar conteúdo usando OpenAI
  async generateContent(params: ContentGenerationParams): Promise<{ success: boolean; content?: string; imageUrl?: string; error?: string }> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.error('❌ Chave API OpenAI não configurada');
      return { 
        success: false, 
        error: 'Chave API OpenAI não configurada. Contate o administrador do sistema.' 
      };
    }

    try {
      // Gerar conteúdo
      const prompt = this.gerarPromptConteudo(
        params.tema,
        params.nicho,
        params.palavrasChave,
        params.idioma,
        params.contexto
      );

      const contentResponse = await fetch(`${this.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'Você é um assistente especialista em SEO e copywriting técnico avançado.' 
            },
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          max_tokens: 5000,
          temperature: 0.9,
        }),
      });

      if (!contentResponse.ok) {
        throw new Error(`Erro na API de conteúdo: ${contentResponse.status}`);
      }

      const contentData = await contentResponse.json();
      let content = contentData.choices[0].message.content.trim();

      // Adicionar CTA se fornecido
      if (params.cta) {
        const ctaHtml = this.gerarHtmlCTA(params.cta);
        
        if (ctaHtml) {
          if (params.cta.posicao === 'inicio') {
            content = ctaHtml + '\n\n' + content;
          } else if (params.cta.posicao === 'meio') {
            // Inserir no meio do conteúdo
            const paragraphs = content.split('\n\n');
            const middleIndex = Math.floor(paragraphs.length / 2);
            paragraphs.splice(middleIndex, 0, ctaHtml);
            content = paragraphs.join('\n\n');
          } else {
            // Default: final
            content = content + ctaHtml;
          }
        }
      }

      // Gerar imagem usando DALL-E 3
      let imageUrl: string | undefined;
      try {
        console.log('🎨 Iniciando geração de imagem DALL-E 3...');
        
        const imagePrompt = this.gerarPromptImagem(
          params.tema,
          params.palavrasChave,
          params.idioma
        );

        console.log('🖼️ Prompt para imagem gerado:', imagePrompt);

        const imageRequestBody = {
          prompt: imagePrompt,
          model: 'dall-e-3',
          n: 1,
          size: '1024x1024' as const,
          response_format: 'url' as const,
          quality: 'standard' as const
        };

        console.log('📡 Enviando requisição DALL-E 3:', {
          url: `${this.BASE_URL}/images/generations`,
          model: imageRequestBody.model,
          size: imageRequestBody.size,
          promptLength: imagePrompt.length
        });

        const imageResponse = await fetch(`${this.BASE_URL}/images/generations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(imageRequestBody),
        });

        console.log('📨 Resposta DALL-E 3:', {
          status: imageResponse.status,
          statusText: imageResponse.statusText,
          ok: imageResponse.ok
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.data[0]?.url;
          
          console.log('✅ Imagem gerada com sucesso:', {
            hasImageUrl: !!imageUrl,
            imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'null'
          });
        } else {
          const errorText = await imageResponse.text().catch(() => 'Erro desconhecido');
          console.error('❌ Erro na API DALL-E 3:', {
            status: imageResponse.status,
            statusText: imageResponse.statusText,
            error: errorText
          });

          // Específico para diferentes tipos de erro
          if (imageResponse.status === 400) {
            console.warn('⚠️ Prompt da imagem pode ter conteúdo inadequado ou muito longo');
          } else if (imageResponse.status === 401) {
            console.warn('🔑 Problema de autenticação na API DALL-E 3');
          } else if (imageResponse.status === 429) {
            console.warn('⏰ Rate limit atingido na API DALL-E 3');
          }
        }
      } catch (imageError) {
        console.error('❌ Erro inesperado ao gerar imagem:', {
          error: imageError,
          message: imageError instanceof Error ? imageError.message : 'Erro desconhecido',
          stack: imageError instanceof Error ? imageError.stack : undefined
        });
        
        // Continuar sem imagem se houver erro
        imageUrl = undefined;
      }

      return { 
        success: true, 
        content,
        imageUrl 
      };

    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      return { 
        success: false, 
        error: 'Serviço temporariamente indisponível. Tente novamente em alguns instantes.' 
      };
    }
  }
}

export const contentService = new ContentService();
export type { IdeaGenerationParams, ContentGenerationParams, CTAData };