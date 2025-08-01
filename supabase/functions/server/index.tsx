import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { userService } from "./userService.ts";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-53322c0b/health", (c) => {
  return c.json({ status: "ok" });
});

// User registration endpoint
app.post("/make-server-53322c0b/users/register", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Registro de usuário recebido:", body);

    const { email, name, cpf, whatsapp, dataNascimento, plano } = body;

    if (!email || !name) {
      return c.json({
        success: false,
        error: "Email e nome são obrigatórios"
      }, 400);
    }

    const result = await userService.registerUser({
      email,
      name,
      cpf: cpf || '',
      whatsapp: whatsapp || '',
      dataNascimento: dataNascimento || '',
      plano: plano || 'Free'
    });

    if (result.success) {
      return c.json(result, 201);
    } else {
      const statusCode = result.error?.includes('já cadastrado') ? 409 : 500;
      return c.json(result, statusCode);
    }

  } catch (error) {
    console.error("Erro inesperado no registro:", error);
    return c.json({
      success: false,
      error: error.message || "Erro interno do servidor"
    }, 500);
  }
});

// User login endpoint
app.post("/make-server-53322c0b/users/login", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Login de usuário recebido:", body);

    const { email } = body;

    if (!email) {
      return c.json({
        success: false,
        error: "Email é obrigatório"
      }, 400);
    }

    const result = await userService.loginUser(email);
    
    if (result.success) {
      return c.json(result, 200);
    } else {
      const statusCode = result.error?.includes('não encontrado') ? 404 : 500;
      return c.json(result, statusCode);
    }

  } catch (error) {
    console.error("Erro inesperado no login:", error);
    return c.json({
      success: false,
      error: error.message || "Erro interno do servidor"
    }, 500);
  }
});

// User login by CPF endpoint
app.post("/make-server-53322c0b/users/login-by-cpf", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Login de usuário por CPF recebido");

    const { cpf } = body;

    if (!cpf) {
      return c.json({
        success: false,
        error: "CPF é obrigatório"
      }, 400);
    }

    const result = await userService.loginUserByCpf(cpf);
    
    if (result.success) {
      return c.json(result, 200);
    } else {
      const statusCode = result.error?.includes('não encontrado') ? 404 : 500;
      return c.json(result, statusCode);
    }

  } catch (error) {
    console.error("Erro inesperado no login por CPF:", error);
    return c.json({
      success: false,
      error: error.message || "Erro interno do servidor"
    }, 500);
  }
});

// WordPress publish post endpoint
app.post("/make-server-53322c0b/wordpress/publish-post", async (c) => {
  try {
    const body = await c.req.json();
    console.log("📝 Publicação de post WordPress recebida:", body);

    const { siteId, postData, siteData } = body;

    if (!siteId || !postData) {
      return c.json({
        success: false,
        error: "siteId e postData são obrigatórios"
      }, 400);
    }

    let site = null;

    // Estratégia 1: Se siteData foi enviado como fallback, usar ele diretamente
    if (siteData && siteData.url && siteData.username && siteData.applicationPassword) {
      console.log('🎯 Usando dados do site enviados como fallback');
      site = siteData;
    } else {
      // Estratégia 2: Buscar sites de diferentes usuários
      console.log(`🔍 Buscando site ${siteId} no banco de dados...`);
      
      try {
        const siteKeys = await kv.getByPrefix('sites_');
        console.log(`📊 Encontradas ${siteKeys.length} chaves de sites para pesquisar`);
        
        for (const key of siteKeys) {
          try {
            const userSites = await kv.get(key) || [];
            const foundSite = userSites.find(s => {
              const siteIdStr = s.id?.toString();
              const searchIdStr = siteId?.toString();
              const siteIdNum = parseInt(s.id);
              const searchIdNum = parseInt(siteId);
              
              return s.id === siteId || 
                     s.id === parseInt(siteId) || 
                     s.id.toString() === siteId ||
                     parseInt(s.id) === parseInt(siteId) ||
                     siteIdStr === searchIdStr ||
                     (!isNaN(siteIdNum) && !isNaN(searchIdNum) && siteIdNum === searchIdNum);
            });
            
            if (foundSite) {
              site = foundSite;
              console.log(`✅ Site encontrado em ${key}:`, {
                id: site.id,
                name: site.nome || site.name,
                url: site.wordpressUrl || site.url
              });
              break;
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao buscar sites em ${key}:`, error.message);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar chaves de sites:', error);
      }
    }
    
    if (!site) {
      console.error(`❌ Site não encontrado: ${siteId}`);
      return c.json({
        success: false,
        error: `Site não encontrado: ${siteId}. Verifique se o site está configurado corretamente.`
      }, 404);
    }

    // Extrair credenciais WordPress do site
    const url = site.wordpressUrl || site.url;
    const username = site.wordpressUsername || site.username;
    const applicationPassword = site.wordpressPassword || site.applicationPassword;

    if (!url || !username || !applicationPassword) {
      const missingFields = [];
      if (!url) missingFields.push('URL');
      if (!username) missingFields.push('username');
      if (!applicationPassword) missingFields.push('application password');
      
      return c.json({
        success: false,
        error: `Site não possui credenciais WordPress completas. Faltando: ${missingFields.join(', ')}`
      }, 400);
    }

    const normalizeUrl = (inputUrl: string): string => {
      let normalized = inputUrl.replace(/\/$/, '');
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
      }
      return normalized;
    };

    const normalizedUrl = normalizeUrl(url);
    const postEndpoint = `${normalizedUrl}/wp-json/wp/v2/posts`;

    console.log(`📡 Publicando post em: ${postEndpoint}`);

    // Função para melhorar formatação HTML com SEO
    const improveHTMLContent = (content: string): string => {
      if (!content) return '';
      
      let improved = content;
      
      // Se não contém HTML, converter markdown básico para HTML
      if (!improved.includes('<h1>') && !improved.includes('<h2>') && !improved.includes('<p>')) {
        improved = improved
          .replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>\n')
          .replace(/## (.*?)(?:\n|$)/g, '<h2>$1</h2>\n')
          .replace(/# (.*?)(?:\n|$)/g, '<h1>$1</h1>\n')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        
        if (!improved.startsWith('<')) {
          improved = '<p>' + improved + '</p>';
        }
      }
      
      return improved;
    };

    // Preparar dados do post para a API WordPress
    const wpPostData = {
      title: postData.title,
      content: improveHTMLContent(postData.content),
      status: postData.status || 'publish',
      excerpt: postData.excerpt || '',
      categories: postData.categories || [],
      tags: postData.tags || [],
      author: postData.author || undefined,
      date: postData.date || undefined,
      meta: postData.meta || {}
    };

    // Remover campos undefined/null
    Object.keys(wpPostData).forEach(key => {
      if (wpPostData[key] === undefined || wpPostData[key] === null) {
        delete wpPostData[key];
      }
    });

    // Função para fazer upload da imagem para WordPress Media Library
    const uploadFeaturedImage = async (imageUrl: string, postTitle: string): Promise<number | null> => {
      try {
        if (!imageUrl || !imageUrl.startsWith('http')) return null;
        
        console.log('📸 Fazendo upload da imagem featured:', imageUrl);
        
        // Download da imagem
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.warn('❌ Falha ao baixar imagem:', imageResponse.status);
          return null;
        }
        
        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
        const fileExtension = contentType.includes('png') ? 'png' : 'jpg';
        
        console.log(`📷 Imagem baixada: ${imageBuffer.byteLength} bytes, tipo: ${contentType}`);
        
        // Upload para WordPress Media Library
        const mediaEndpoint = `${normalizedUrl}/wp-json/wp/v2/media`;
        const fileName = `bia-article-${Date.now()}.${fileExtension}`;
        
        const mediaResponse = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${applicationPassword}`)}`,
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'User-Agent': 'BIA-WordPress-Client/1.0'
          },
          body: imageBuffer
        });
        
        if (!mediaResponse.ok) {
          console.warn('❌ Falha no upload da imagem:', mediaResponse.status);
          return null;
        }
        
        const mediaData = await mediaResponse.json();
        console.log('✅ Imagem enviada com sucesso, ID:', mediaData.id);
        
        return mediaData.id;
      } catch (error) {
        console.error('❌ Erro no upload da imagem featured:', error);
        return null;
      }
    };

    // Se há imagem featured, fazer upload primeiro
    if (postData.featured_media?.imageUrl) {
      console.log('🖼️ Processando imagem featured...');
      const featuredMediaId = await uploadFeaturedImage(postData.featured_media.imageUrl, postData.title);
      if (featuredMediaId) {
        wpPostData.featured_media = featuredMediaId;
        console.log('✅ Imagem featured configurada com ID:', featuredMediaId);
      }
    }

    console.log('📤 Enviando post para WordPress:', wpPostData);

    // Publicar o post
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(postEndpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Basic ${btoa(`${username}:${applicationPassword}`)}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BIA-WordPress-Client/1.0'
      },
      body: JSON.stringify(wpPostData)
    });

    clearTimeout(timeoutId);

    console.log(`📋 Resposta da publicação: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.text();
      let parsedError;
      
      try {
        parsedError = JSON.parse(errorData);
      } catch (parseError) {
        parsedError = errorData;
      }

      console.error('❌ Erro na publicação:', parsedError);
      
      let errorMessage = 'Erro desconhecido na publicação';
      
      if (response.status === 401) {
        errorMessage = 'Credenciais inválidas ou expiradas';
      } else if (response.status === 403) {
        errorMessage = 'Usuário sem permissões para publicar posts';
      } else if (response.status === 400) {
        errorMessage = parsedError.message || 'Dados do post inválidos';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do servidor WordPress';
      }
      
      return c.json({
        success: false,
        error: errorMessage,
        details: parsedError
      }, response.status);
    }

    const postResult = await response.json();
    
    console.log('✅ Post publicado com sucesso:', {
      id: postResult.id,
      link: postResult.link,
      status: postResult.status
    });

    return c.json({
      success: true,
      postId: postResult.id,
      link: postResult.link,
      status: postResult.status,
      message: 'Post publicado com sucesso no WordPress'
    });

  } catch (error) {
    console.error('❌ Erro geral na publicação WordPress:', error);
    
    let errorMessage = 'Erro interno na publicação';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout na publicação. O site WordPress pode estar lento.';
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Erro de conectividade. Verifique se o site WordPress está acessível.';
    } else if (error instanceof Error) {
      errorMessage = `Erro técnico: ${error.message}`;
    }
    
    return c.json({
      success: false,
      error: errorMessage,
      details: error.message
    }, 500);
  }
});

// WordPress test connection endpoint
app.post("/make-server-53322c0b/wordpress/test-connection", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Teste de conexão WordPress recebido:", body);

    const { url, username, applicationPassword } = body;

    if (!url || !username || !applicationPassword) {
      return c.json({
        success: false,
        error: "URL, username e applicationPassword são obrigatórios"
      }, 400);
    }

    // Normalizar URL
    const normalizeUrl = (inputUrl: string): string => {
      if (!inputUrl) return '';
      
      let normalized = inputUrl.replace(/\/$/, '');
      
      if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
      }
      
      return normalized;
    };

    const normalizedUrl = normalizeUrl(url);

    // Validar URL básica
    try {
      new URL(normalizedUrl);
    } catch (urlError) {
      return c.json({
        success: false,
        error: "URL inválida. Use o formato: https://seusite.com"
      }, 400);
    }

    // Testar autenticação WordPress
    console.log("🔐 Testando autenticação WordPress...");
    
    const authEndpoints = [
      `${normalizedUrl}/wp-json/wp/v2/users/me`,
      `${normalizedUrl}/wp-json/wp/v2/posts?per_page=1`
    ];

    let authSuccess = false;

    for (const authEndpoint of authEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(authEndpoint, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${applicationPassword}`)}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'BIA-WordPress-Client/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (response.status === 401) {
          return c.json({
            success: false,
            error: "Credenciais inválidas. Verifique o nome de usuário e Application Password."
          }, 401);
        }

        if (response.status === 403) {
          return c.json({
            success: false,
            error: "Usuário sem permissões suficientes. Use um usuário Administrador ou Editor."
          }, 403);
        }

        if (response.ok) {
          authSuccess = true;
          break;
        }

      } catch (authError) {
        console.log(`Erro de auth em ${authEndpoint}:`, authError.message);
        continue;
      }
    }

    if (!authSuccess) {
      return c.json({
        success: false,
        error: "Falha na autenticação WordPress"
      }, 400);
    }

    // Buscar dados básicos do WordPress
    const dataEndpoints = [
      { name: 'categories', url: `${normalizedUrl}/wp-json/wp/v2/categories?per_page=100` },
      { name: 'users', url: `${normalizedUrl}/wp-json/wp/v2/users?per_page=50` },
      { name: 'tags', url: `${normalizedUrl}/wp-json/wp/v2/tags?per_page=100` }
    ];

    const wpData = {};
    
    await Promise.allSettled(dataEndpoints.map(async (endpoint) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(endpoint.url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Authorization': `Basic ${btoa(`${username}:${applicationPassword}`)}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'BIA-WordPress-Client/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          wpData[endpoint.name] = Array.isArray(data) ? data : [];
        } else {
          wpData[endpoint.name] = [];
        }
      } catch (error) {
        wpData[endpoint.name] = [];
      }
    }));

    return c.json({
      success: true,
      message: "Conexão WordPress estabelecida com sucesso",
      data: {
        url: normalizedUrl,
        username,
        categories: wpData.categories || [],
        authors: wpData.users || [],
        tags: wpData.tags || []
      }
    });

  } catch (error) {
    console.error("❌ Erro geral no teste WordPress:", error);
    return c.json({
      success: false,
      error: "Erro interno no teste de conexão",
      details: error.message
    }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: "Endpoint não encontrado",
    path: c.req.path
  }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Erro não tratado:", err);
  return c.json({
    success: false,
    error: "Erro interno do servidor",
    details: err.message
  }, 500);
});

Deno.serve(app.fetch);