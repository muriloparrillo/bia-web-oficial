import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Monitor, CheckCircle, XCircle, ExternalLink, Trash2, FileText, Settings, Loader2, AlertCircle } from '../icons';
import { useBia } from '../BiaContext';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';
import { FREE_PLAN_LIMITS, getPlanLimits } from '../../utils/constants';

interface MeusSitesProps {
  userData: any;
}

interface WordPressCredentials {
  url: string;
  username: string;
  applicationPassword: string;
}

export function MeusSites({ userData }: MeusSitesProps) {
  const { state, actions } = useBia();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWordPressForm, setShowWordPressForm] = useState<number | null>(null);
  const [connectingWP, setConnectingWP] = useState(false);
  const [syncing, setSyncing] = useState(true);
  const [newSite, setNewSite] = useState({ 
    nome: '', 
    url: '',
    status: 'ativo' as const
  });
  const [wordpressCredentials, setWordpressCredentials] = useState<WordPressCredentials>({
    url: '',
    username: '',
    applicationPassword: ''
  });

  // Sincronizar dados WordPress na inicialização
  React.useEffect(() => {
    const syncData = async () => {
      try {
        const { wordpressService } = await import('../../services/wordpressService');
        
        // Fazer sincronização discreta em background
        setTimeout(async () => {
          try {
            await wordpressService.syncFromBiaContext();
            console.log('✅ Sincronização WordPress concluída em MeusSites');
          } catch (error) {
            console.warn('⚠️ Sincronização WordPress falhou (não crítico):', error?.message || error);
          }
        }, 3000); // Aguardar mais tempo para evitar conflitos
        
      } catch (error) {
        console.warn('Erro ao carregar serviço WordPress:', error);
      } finally {
        setSyncing(false);
      }
    };

    // Executar apenas uma vez
    syncData();
  }, []); // Dependências vazias para executar apenas uma vez

  // Verificar limites do plano
  const limits = actions.checkFreePlanLimits();
  const isFreePlan = actions.isFreePlan();
  const userPlan = userData?.plano || 'Free';
  const planLimits = getPlanLimits(userPlan);

  const handleAddSite = () => {
    if (!newSite.nome.trim()) {
      toast.error('Nome do site é obrigatório');
      return;
    }
    
    if (newSite.url && !newSite.url.startsWith('http')) {
      toast.error('URL deve começar com http:// ou https://');
      return;
    }

    // Verificar limite de sites
    if (!limits.sites) {
      toast.error(`Limite de ${planLimits.sites} sites atingido. Faça upgrade do seu plano.`);
      return;
    }
    
    const success = actions.addSite(newSite);
    if (success) {
      toast.success('Site adicionado com sucesso!');
      setNewSite({ nome: '', url: '', status: 'ativo' });
      setShowAddForm(false);
    } else {
      toast.error('Erro ao adicionar site. Limite atingido.');
    }
  };

  const handleToggleStatus = (site: any) => {
    const newStatus = site.status === 'ativo' ? 'inativo' : 'ativo';
    actions.updateSite(site.id, { status: newStatus });
    toast.success(`Site ${newStatus === 'ativo' ? 'ativado' : 'pausado'} com sucesso!`);
  };

  const handleRemoveSite = (site: any) => {
    if (confirm('Tem certeza que deseja remover este site? Todos os artigos e ideias relacionados também serão removidos.')) {
      actions.deleteSite(site.id);
      toast.success('Site removido com sucesso!');
    }
  };

  const handleConnectWordPress = async (siteId: number) => {
    if (!wordpressCredentials.url || !wordpressCredentials.username || !wordpressCredentials.applicationPassword) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    // Validar URL
    if (!wordpressCredentials.url.startsWith('http')) {
      toast.error('URL deve começar com http:// ou https://');
      return;
    }

    setConnectingWP(true);
    
    try {
      console.log('🔧 Iniciando processo de conexão WordPress...');
      
      // Mostrar toast de progresso
      toast.info('🔍 Testando conexão WordPress via servidor...', { duration: 3000 });
      
      // Teste de conexão WordPress via servidor (nova implementação)
      const { wordpressService } = await import('../../services/wordpressService');
      const testResult = await wordpressService.testConnection({
        url: wordpressCredentials.url,
        username: wordpressCredentials.username,
        applicationPassword: wordpressCredentials.applicationPassword
      });

      if (!testResult.success) {
        console.error('❌ Falha no teste de conexão:', testResult);
        
        // Preparar mensagem de erro baseada na resposta do servidor
        let errorTitle = '🚫 Falha na Conexão WordPress';
        let errorMessage = testResult.error || 'Erro desconhecido na conexão';
        let suggestions: string[] = [];
        
        // Categorizar tipos de erro baseado na categoria retornada pelo servidor
        const errorCategory = testResult.errorCategory || 'general';
        
        switch (errorCategory) {
          case 'credentials':
            errorTitle = '🔑 Credenciais Inválidas';
            suggestions.push('• Verifique se o nome de usuário está exatamente correto');
            suggestions.push('• Gere uma nova Application Password no WordPress:');
            suggestions.push('   - Acesse: Painel WordPress → Usuários → Perfil');
            suggestions.push('   - Role até "Application Passwords"');
            suggestions.push('   - Digite um nome (ex: "BIA") e clique "Add New"');
            suggestions.push('   - Copie a senha COMPLETA incluindo todos os espaços');
            suggestions.push('• Use apenas usuários com papel de Administrador');
            suggestions.push('• NÃO use sua senha normal do WordPress');
            break;
            
          case 'permissions':
            errorTitle = '⛔ Permissões Insuficientes';
            suggestions.push('• Use um usuário com papel de Administrador ou Editor');
            suggestions.push('• Verifique se o usuário pode criar e editar posts');
            suggestions.push('• Se necessário, contate o administrador do site');
            suggestions.push('• Confirme que não há plugins bloqueando a API REST');
            break;
            
          case 'connectivity':
            errorTitle = '🚫 Site Completamente Inacessível';
            suggestions.push('• Verifique se a URL está correta e completa');
            suggestions.push('• Teste abrir a URL no navegador para confirmar se está online');
            suggestions.push('• Verifique se não há problemas de DNS ou servidor');
            suggestions.push('• Aguarde alguns minutos se houver problemas temporários');
            suggestions.push('• Entre em contato com sua hospedagem se o problema persistir');
            break;
            
          case 'cors':
            errorTitle = '✅ Site WordPress Online - Problema de CORS';
            suggestions.push('• 🎉 Ótima notícia! Seu site WordPress está online e funcionando');
            suggestions.push('• 🔧 É apenas uma questão de configuração de CORS (muito comum)');
            suggestions.push('• ⚡ Solução Mais Rápida: Instale o plugin "CORS WP" (gratuito)');
            suggestions.push('   - Vá em: Plugins → Adicionar Novo → Busque "CORS WP"');
            suggestions.push('   - Instale e ative o plugin');
            suggestions.push('• 🛠️ Solução Manual: Adicione ao wp-config.php:');
            suggestions.push('   header("Access-Control-Allow-Origin: *");');
            suggestions.push('• 📞 Alternativa: Peça para sua hospedagem configurar CORS');
            break;
            
          case 'server_error':
            errorTitle = '🔧 Erro de Comunicação';
            suggestions.push('• Verifique sua conexão com a internet');
            suggestions.push('• Aguarde alguns minutos e tente novamente');
            suggestions.push('• Se o problema persistir, contate o suporte técnico');
            break;
            
          default:
            // Análise genérica baseada na mensagem de erro
            if (errorMessage.includes('muito lento') || errorMessage.includes('timeout')) {
              errorTitle = '⏰ Site Muito Lento';
              suggestions.push('• Aguarde alguns minutos e tente novamente');
              suggestions.push('• Verifique a performance do seu servidor WordPress');
              suggestions.push('• Otimize plugins pesados e sistema de cache');
              suggestions.push('• Considere migrar para hospedagem mais rápida');
              
            } else if (errorMessage.includes('API REST') || errorMessage.includes('wp-json')) {
              errorTitle = '🔧 Problema na API REST';
              suggestions.push('• Teste o endpoint no navegador: seusite.com/wp-json/wp/v2/');
              suggestions.push('• Atualize o WordPress para a versão mais recente');
              suggestions.push('• Desative plugins que podem interferir na API REST');
              suggestions.push('• Verifique se a API REST não foi desabilitada manualmente');
              suggestions.push('• Entre em contato com sua hospedagem se necessário');
              
            } else if (errorMessage.includes('CORS')) {
              errorTitle = '🔒 Configuração CORS Necessária';
              suggestions.push('• Instale o plugin "CORS WP" (solução mais fácil)');
              suggestions.push('• Ou configure CORS manualmente no servidor');
              suggestions.push('• Adicione headers CORS no .htaccess ou wp-config.php');
              suggestions.push('• Contate seu provedor sobre políticas de CORS');
            }
        }
        
        // Preparar mensagem final estruturada
        let finalMessage = `${errorTitle}\n\n${errorMessage}`;
        
        if (suggestions.length > 0) {
          finalMessage += '\n\n💡 Possíveis Soluções:\n' + suggestions.join('\n');
        }
        
        // Adicionar informações técnicas se disponíveis
        if (testResult.details) {
          finalMessage += '\n\n🔍 Para suporte técnico: inclua esta informação - Erro categoria: ' + errorCategory;
        }
        
        // Exibir erro com toast expandido
        toast.error(finalMessage, { 
          duration: 15000,
          style: {
            maxWidth: '700px',
            whiteSpace: 'pre-line',
            fontSize: '14px',
            lineHeight: '1.5'
          }
        });
        return;
      }

      console.log('✅ Teste de conexão bem-sucedido:', testResult);
      
      // Exibir informações de sucesso
      let successMessage = '✅ Conexão WordPress estabelecida com sucesso!';
      
      if (testResult.serverTested) {
        successMessage += '\n\n🎯 Conexão testada e validada via servidor - bypass CORS completo';
      }
      
      if (testResult.connectivityMessage) {
        successMessage += '\n\n📊 Status: ' + testResult.connectivityMessage;
      }
      
      // Mostrar dados encontrados
      const { categories = [], authors = [], tags = [] } = testResult;
      if (categories.length > 0 || authors.length > 0 || tags.length > 0) {
        successMessage += '\n\n📋 Dados WordPress carregados:';
        if (categories.length > 0) successMessage += `\n• ${categories.length} categorias`;
        if (authors.length > 0) successMessage += `\n• ${authors.length} autores`;
        if (tags.length > 0) successMessage += `\n• ${tags.length} tags`;
      }
      
      toast.success(successMessage, { 
        duration: 6000,
        style: { whiteSpace: 'pre-line' }
      });

      // Atualizar o site com as credenciais do WordPress
      const wordpressData = {
        wordpressUrl: wordpressCredentials.url,
        wordpressUsername: wordpressCredentials.username,
        wordpressPassword: wordpressCredentials.applicationPassword
      };

      actions.updateSite(siteId, wordpressData);
      
      // Forçar sincronização imediata com o banco de dados
      console.log('💾 Forçando sincronização imediata com o banco após conectar WordPress...');
      setTimeout(async () => {
        try {
          const syncSuccess = await actions.forceSyncToDatabase();
          if (syncSuccess) {
            console.log('✅ Dados salvos no banco imediatamente após conexão WordPress');
            toast.success('Dados salvos com segurança no banco de dados!', { duration: 2000 });
          } else {
            console.warn('⚠️ Falha ao salvar no banco, mas dados locais foram preservados');
          }
        } catch (syncError) {
          console.error('❌ Erro na sincronização forçada:', syncError);
        }
      }, 500);
      
      // Sincronizar dados WordPress de forma silenciosa em background
      setTimeout(async () => {
        try {
          // Sincronização silenciosa - sem toast inicial para não incomodar o usuário
          console.log('🔄 Iniciando sincronização silenciosa para site:', siteId);
          
          // Primeiro, garantir que o site existe no WordPress service
          await wordpressService.syncFromBiaContext();
          
          // Agora tentar recarregar dados do site
          const success = await wordpressService.reloadSiteData(siteId);
          
          if (success) {
            console.log('✅ Dados WordPress sincronizados silenciosamente para site:', siteId);
          } else {
            console.warn('⚠️ Falha na sincronização silenciosa para site:', siteId);
          }
        } catch (syncError) {
          console.warn('⚠️ Erro na sincronização silenciosa:', syncError?.message || syncError);
        }
      }, 2000);
      
      setShowWordPressForm(null);
      setWordpressCredentials({ url: '', username: '', applicationPassword: '' });
      toast.success('🎉 Site conectado ao WordPress com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro geral ao conectar WordPress:', error);
      
      let errorMessage = '❌ Erro Inesperado\n\nErro inesperado ao conectar com o WordPress.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = `🌐 Erro de Rede\n\nNão foi possível acessar ${wordpressCredentials.url}.\n\n💡 Soluções:\n• Verifique sua conexão com a internet\n• Confirme se o site está online\n• Tente novamente em alguns minutos`;
        } else {
          errorMessage = `❌ Erro Técnico\n\n${error.message}\n\n💡 Dica: Se o problema persistir, contate o suporte técnico.`;
        }
      }
      
      toast.error(errorMessage, { 
        duration: 10000,
        style: {
          maxWidth: '600px',
          whiteSpace: 'pre-line'
        }
      });
    } finally {
      setConnectingWP(false);
    }
  };

  const handleStartWordPressIntegration = (siteId: number) => {
    // Buscar o site para pré-preencher a URL se disponível
    const site = state.sites.find(s => s.id === siteId);
    if (site && site.url) {
      setWordpressCredentials(prev => ({
        ...prev,
        url: site.url
      }));
    }
    setShowWordPressForm(siteId);
  };

  const activeSites = state.sites.filter(s => s.status === 'ativo');
  const pausedSites = state.sites.filter(s => s.status === 'inativo');
  const connectedWordPressSites = state.sites.filter(s => s.wordpressUrl);

  // Calcular estatísticas
  const totalArticles = state.articles.length;
  const siteArticles = state.sites.map(site => ({
    ...site,
    articleCount: state.articles.filter(article => article.siteId === site.id).length
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-poppins text-3xl text-black mb-2">Meus Sites</h1>
          <p className="font-montserrat text-gray-600">Gerencie seus sites WordPress para publicação automática</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          disabled={!limits.sites}
          className="font-montserrat text-white" 
          style={{ backgroundColor: '#8B5FBF' }}
        >
          <Plus className="mr-2" size={16} />
          Conectar Site
        </Button>
      </div>

      {/* Alerta sobre limite */}
      {!limits.sites && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Você atingiu o limite de {planLimits.isUnlimited ? '∞' : planLimits.sites} sites do seu plano atual. 
            <button 
              onClick={() => window.location.hash = 'store'}
              className="ml-1 text-orange-800 underline hover:no-underline"
            >
              {planLimits.isUnlimited ? 'Erro inesperado' : 'Faça upgrade para conectar mais sites'}.
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas dos sites */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <Monitor size={24} className="mx-auto text-green-600 mb-2" />
            <p className="font-poppins text-2xl text-green-800">{activeSites.length}</p>
            <p className="font-montserrat text-sm text-green-600">Sites Ativos</p>
          </CardContent>
        </Card>
        <Card className="border border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 text-center">
            <XCircle size={24} className="mx-auto text-yellow-600 mb-2" />
            <p className="font-poppins text-2xl text-yellow-800">{pausedSites.length}</p>
            <p className="font-montserrat text-sm text-yellow-600">Sites Pausados</p>
          </CardContent>
        </Card>
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <FileText size={24} className="mx-auto text-blue-600 mb-2" />
            <p className="font-poppins text-2xl text-blue-800">{totalArticles}</p>
            <p className="font-montserrat text-sm text-blue-600">Total de Artigos</p>
          </CardContent>
        </Card>
        <Card className="border border-purple-200 bg-purple-50">
          <CardContent className="p-4 text-center">
            <Settings size={24} className="mx-auto text-purple-600 mb-2" />
            <p className="font-poppins text-2xl text-purple-800">{connectedWordPressSites.length}</p>
            <p className="font-montserrat text-sm text-purple-600">Sites Conectados</p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de adicionar site */}
      {showAddForm && (
        <Card className="border border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="font-poppins text-lg text-black">Conectar Novo Site</CardTitle>
            <p className="font-montserrat text-sm text-gray-600">
              Adicione os dados básicos do seu site WordPress. Após salvar, você poderá configurar a integração.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteName" className="font-montserrat">Nome do Site *</Label>
                <Input
                  id="siteName"
                  value={newSite.nome}
                  onChange={(e) => setNewSite({ ...newSite, nome: e.target.value })}
                  placeholder="Ex: MeuBlog.com"
                  className="font-montserrat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteUrl" className="font-montserrat">URL do Site</Label>
                <Input
                  id="siteUrl"
                  value={newSite.url}
                  onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                  placeholder="https://meublog.com"
                  className="font-montserrat"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteStatus" className="font-montserrat">Status</Label>
              <Select value={newSite.status} onValueChange={(value) => setNewSite({ ...newSite, status: value as 'ativo' | 'inativo' })}>
                <SelectTrigger className="font-montserrat">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAddSite} className="font-montserrat text-white" style={{ backgroundColor: '#8B5FBF' }}>
                <Plus className="mr-2" size={16} />
                Salvar Site
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline" className="font-montserrat">
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário WordPress */}
      {showWordPressForm !== null && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="font-poppins text-lg text-blue-800">Configurar Integração WordPress</CardTitle>
            <p className="font-montserrat text-sm text-blue-600">
              Configure a conexão para publicação automática no seu site
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Como obter uma Application Password:</strong><br />
                1. Acesse: Painel WordPress → Usuários → Perfil<br />
                2. Role até "Application Passwords"<br />
                3. Digite um nome (ex: "BIA") e clique "Add New"<br />
                4. Copie a senha gerada e cole no campo abaixo
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wpUrl" className="font-montserrat">URL do Site *</Label>
                <Input
                  id="wpUrl"
                  value={wordpressCredentials.url}
                  onChange={(e) => setWordpressCredentials({ ...wordpressCredentials, url: e.target.value })}
                  placeholder="https://meublog.com"
                  className="font-montserrat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wpUsername" className="font-montserrat">Nome de Usuário *</Label>
                <Input
                  id="wpUsername"
                  value={wordpressCredentials.username}
                  onChange={(e) => setWordpressCredentials({ ...wordpressCredentials, username: e.target.value })}
                  placeholder="admin"
                  className="font-montserrat"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wpPassword" className="font-montserrat">Application Password *</Label>
                <Input
                  id="wpPassword"
                  type="password"
                  value={wordpressCredentials.applicationPassword}
                  onChange={(e) => setWordpressCredentials({ ...wordpressCredentials, applicationPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                  className="font-montserrat"
                />
                <p className="font-montserrat text-xs text-gray-500">
                  NÃO use sua senha normal. Use apenas Application Password do WordPress.
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button 
                onClick={() => handleConnectWordPress(showWordPressForm)}
                disabled={connectingWP}
                className="font-montserrat text-white" 
                style={{ backgroundColor: '#8B5FBF' }}
              >
                {connectingWP ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando conexão...
                  </>
                ) : (
                  <>
                    <Settings className="mr-2" size={16} />
                    Conectar Site
                  </>
                )}
              </Button>
              <Button 
                onClick={() => {
                  setShowWordPressForm(null);
                  setWordpressCredentials({ url: '', username: '', applicationPassword: '' });
                }} 
                variant="outline" 
                className="font-montserrat"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de sites */}
      <div className="grid gap-4">
        {state.sites.map((site) => {
          const siteStats = siteArticles.find(s => s.id === site.id);
          const articleCount = siteStats?.articleCount || 0;
          
          return (
            <Card key={site.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Monitor size={24} style={{ color: '#8B5FBF' }} />
                    <div>
                      <h3 className="font-poppins text-lg text-black">{site.nome}</h3>
                      {site.url && (
                        <p className="font-montserrat text-sm text-blue-600 hover:underline">
                          <a href={site.url} target="_blank" rel="noopener noreferrer">{site.url}</a>
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="font-montserrat">
                          {articleCount} artigos • Adicionado em {formatDate(site.createdAt)}
                        </span>
                        {site.wordpressUrl && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Settings size={10} className="mr-1" />
                            WordPress Conectado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`font-montserrat text-white ${
                      site.status === 'ativo' ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      {site.status === 'ativo' ? (
                        <CheckCircle className="mr-1" size={12} />
                      ) : (
                        <XCircle className="mr-1" size={12} />
                      )}
                      {site.status === 'ativo' ? 'Ativo' : 'Pausado'}
                    </Badge>
                    <Button 
                      onClick={() => handleToggleStatus(site)}
                      variant="outline" 
                      size="sm"
                      className="font-montserrat"
                    >
                      {site.status === 'ativo' ? 'Pausar' : 'Ativar'}
                    </Button>
                    {/* Botão WordPress apenas para sites sem WordPress configurado */}
                    {!site.wordpressUrl && (
                      <Button 
                        onClick={() => handleStartWordPressIntegration(site.id)}
                        variant="outline" 
                        size="sm"
                        className="font-montserrat"
                        style={{ borderColor: '#8B5FBF', color: '#8B5FBF' }}
                      >
                        <Settings size={14} className="mr-1" />
                        Configurar WordPress
                      </Button>
                    )}
                    {site.url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="font-montserrat"
                        onClick={() => window.open(site.url, '_blank')}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Visitar
                      </Button>
                    )}
                    <Button 
                      onClick={() => handleRemoveSite(site)}
                      variant="destructive" 
                      size="sm"
                      className="font-montserrat"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tela vazia */}
      {state.sites.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="text-center py-12">
            <Monitor size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-poppins text-lg text-gray-600 mb-2">Nenhum site conectado</h3>
            <p className="font-montserrat text-gray-500 mb-4">
              Conecte seu primeiro site para começar a automatizar a publicação de conteúdo.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="font-montserrat text-white" 
              style={{ backgroundColor: '#8B5FBF' }}
            >
              <Plus className="mr-2" size={16} />
              Conectar Primeiro Site
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Guia de integração */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="font-poppins text-lg text-blue-800">🚀 Sistema de Conexão Atualizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>✅ Novo Sistema de Conexão via Servidor:</strong><br />
                • Teste de conectividade robusta via servidor<br />
                • Bypass automático de problemas CORS<br />
                • Diagnóstico inteligente de problemas<br />
                • Mensagens de erro específicas com soluções práticas
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-2 font-montserrat">1</div>
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Conectar Site</h4>
                <p className="font-montserrat text-sm text-blue-700">
                  Adicione os dados básicos do seu site (nome e URL)
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-2 font-montserrat">2</div>
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Testar WordPress</h4>
                <p className="font-montserrat text-sm text-blue-700">
                  Sistema inteligente testa a conexão via servidor com diagnóstico detalhado
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center mx-auto mb-2 font-montserrat">3</div>
                <h4 className="font-montserrat font-medium text-blue-800 mb-2">Automatizar</h4>
                <p className="font-montserrat text-sm text-blue-700">
                  Artigos são publicados automaticamente no seu site
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}