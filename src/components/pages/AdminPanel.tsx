import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Cpu, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  TrendingUp,
  Eye,
  AlertTriangle,
  Loader2,
  Save,
  Monitor,
  FileText,
  Lightbulb
} from '../icons';
import { adminService, AIModel, SystemConfig, AdminUser } from '../../services/adminService';
import { woocommerceService } from '../../services/woocommerceService';
import { UserManagement } from './admin/UserManagement';
import { ApiKeyManager } from './admin/ApiKeyManager';
import { useBia } from '../BiaContext';
import { useUserManagement } from '../../hooks/useUserManagement';
import { toast } from 'sonner';

export function AdminPanel() {
  const { state } = useBia(); // Acessar dados reais do contexto
  const { users: dbUsers, isLoading: dbLoading, error: dbError, refreshUsers } = useUserManagement();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showAddModel, setShowAddModel] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);

  // Estado temporário para API keys antes de salvar
  const [tempApiKeys, setTempApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [apiKeysChanged, setApiKeysChanged] = useState(false);

  // WooCommerce credentials state
  const [wooCredentials, setWooCredentials] = useState({
    consumerKey: '',
    consumerSecret: ''
  });
  const [wooCredentialsChanged, setWooCredentialsChanged] = useState(false);

  const [newModel, setNewModel] = useState<Partial<AIModel>>({
    name: '',
    provider: 'openai',
    model: '',
    description: '',
    costPer1kTokens: 0,
    maxTokens: 4096,
    capabilities: ['content']
  });

  useEffect(() => {
    loadData();
  }, []);

  // Sincronizar API keys temporárias quando config carrega
  useEffect(() => {
    if (systemConfig) {
      setTempApiKeys({
        openai: systemConfig.apiKeys.openai || '',
        anthropic: systemConfig.apiKeys.anthropic || '',
        google: systemConfig.apiKeys.google || ''
      });
      setApiKeysChanged(false);
    }
  }, [systemConfig]);

  const loadData = () => {
    setSystemConfig(adminService.getSystemConfig());
    setAIModels(adminService.getAIModels());
    setUsers(adminService.getAllUsers());
  };

  // Usar estatísticas reais do adminService
  const realStats = adminService.getSystemStats();

  const handleUpdateConfig = (updates: Partial<SystemConfig>) => {
    if (systemConfig) {
      const updated = { ...systemConfig, ...updates };
      setSystemConfig(updated);
      adminService.updateSystemConfig(updates);
      toast.success('Configuração atualizada com sucesso!');
    }
  };

  const handleApiKeyChange = (provider: 'openai' | 'anthropic' | 'google', value: string) => {
    setTempApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    setApiKeysChanged(true);
  };

  const handleSaveApiKeys = () => {
    if (systemConfig) {
      const success = adminService.updateSystemConfig({
        apiKeys: tempApiKeys
      });
      
      if (success) {
        setSystemConfig({
          ...systemConfig,
          apiKeys: tempApiKeys
        });
        setApiKeysChanged(false);
        toast.success('Chaves de API salvas com sucesso! IA ativada no sistema.');
      }
    }
  };

  const handleResetApiKeys = () => {
    if (systemConfig) {
      setTempApiKeys({
        openai: systemConfig.apiKeys.openai || '',
        anthropic: systemConfig.apiKeys.anthropic || '',
        google: systemConfig.apiKeys.google || ''
      });
      setApiKeysChanged(false);
    }
  };

  // WooCommerce functions
  const handleWooCredentialChange = (field: 'consumerKey' | 'consumerSecret', value: string) => {
    setWooCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setWooCredentialsChanged(true);
  };

  const handleSaveWooCredentials = () => {
    woocommerceService.setCredentials(wooCredentials.consumerKey, wooCredentials.consumerSecret);
    setWooCredentialsChanged(false);
    toast.success('Credenciais WooCommerce salvas com sucesso!');
  };

  const handleResetWooCredentials = () => {
    setWooCredentials({
      consumerKey: '',
      consumerSecret: ''
    });
    setWooCredentialsChanged(false);
  };

  const handleAddModel = () => {
    if (!newModel.name || !newModel.model || !newModel.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const success = adminService.addAIModel({
      ...newModel as Omit<AIModel, 'id' | 'createdAt'>,
      isActive: false
    });

    if (success) {
      setAIModels(adminService.getAIModels());
      setShowAddModel(false);
      setNewModel({
        name: '',
        provider: 'openai',
        model: '',
        description: '',
        costPer1kTokens: 0,
        maxTokens: 4096,
        capabilities: ['content']
      });
      toast.success('Modelo de IA adicionado com sucesso!');
    }
  };

  const handleUpdateModel = (id: string, updates: Partial<AIModel>) => {
    const success = adminService.updateAIModel(id, updates);
    if (success) {
      setAIModels(adminService.getAIModels());
      setEditingModel(null);
      toast.success('Modelo atualizado com sucesso!');
    }
  };

  const handleTestModel = async (modelId: string) => {
    setTestingModel(modelId);
    const result = await adminService.testAIModel(modelId);
    
    if (result.success) {
      toast.success('Conexão testada com sucesso!');
    } else {
      toast.error(`Erro no teste: ${result.error}`);
    }
    
    setTestingModel(null);
  };

  const handleRemoveModel = (id: string) => {
    if (confirm('Tem certeza que deseja remover este modelo?')) {
      const success = adminService.removeAIModel(id);
      if (success) {
        setAIModels(adminService.getAIModels());
        toast.success('Modelo removido com sucesso!');
      }
    }
  };

  // Verificar status das API keys
  const getApiKeyStatus = () => {
    const hasOpenAI = tempApiKeys.openai.trim().length > 0;
    const hasAnthropic = tempApiKeys.anthropic.trim().length > 0;
    const hasGoogle = tempApiKeys.google.trim().length > 0;
    return { hasOpenAI, hasAnthropic, hasGoogle };
  };

  if (!systemConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const apiStatus = getApiKeyStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-poppins text-2xl sm:text-3xl text-black">Painel Administrativo</h1>
              <p className="font-montserrat text-gray-600 text-sm sm:text-base">
                Gerencie configurações, IAs e usuários do sistema BIA
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(apiStatus.hasOpenAI || apiStatus.hasAnthropic || apiStatus.hasGoogle) ? (
                <Badge className="bg-green-100 text-green-800 self-start sm:self-center">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  IA Configurada
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 self-start sm:self-center">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  IA não configurada
                </Badge>
              )}
              <Badge className="bg-green-100 text-green-800 self-start sm:self-center">
                <CheckCircle className="mr-1 h-3 w-3" />
                Sistema Online
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs - Responsive */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 p-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2 p-3">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="ai-models" className="flex items-center gap-2 p-3">
              <Cpu className="h-4 w-4" />
              <span className="hidden sm:inline">IAs</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 p-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 p-3">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab - Dados Reais */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards - Dados Reais do Sistema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card className="border border-blue-200 bg-blue-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-montserrat text-sm text-blue-600">Total de Usuários</p>
                      <p className="font-poppins text-xl sm:text-2xl text-blue-800">{realStats.totalUsers}</p>
                    </div>
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-green-200 bg-green-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-montserrat text-sm text-green-600">Sites Conectados</p>
                      <p className="font-poppins text-xl sm:text-2xl text-green-800">{realStats.totalSites}</p>
                    </div>
                    <Monitor className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-purple-200 bg-purple-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-montserrat text-sm text-purple-600">Ideias Geradas</p>
                      <p className="font-poppins text-xl sm:text-2xl text-purple-800">{realStats.totalIdeas}</p>
                    </div>
                    <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-orange-200 bg-orange-50">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-montserrat text-sm text-orange-600">Artigos Produzidos</p>
                      <p className="font-poppins text-xl sm:text-2xl text-orange-800">{realStats.totalArticles}</p>
                    </div>
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas Detalhadas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="border border-gray-200">
                <CardContent className="p-4 sm:p-6 text-center">
                  <h3 className="font-poppins text-lg text-black mb-2">Sites Ativos</h3>
                  <p className="font-montserrat text-3xl text-green-600">{realStats.activeSites}</p>
                  <p className="font-montserrat text-sm text-gray-500">de {realStats.totalSites} total</p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-4 sm:p-6 text-center">
                  <h3 className="font-poppins text-lg text-black mb-2">Artigos Concluídos</h3>
                  <p className="font-montserrat text-3xl text-blue-600">{realStats.completedArticles}</p>
                  <p className="font-montserrat text-sm text-gray-500">prontos para publicação</p>
                </CardContent>
              </Card>

              <Card className="border border-gray-200">
                <CardContent className="p-4 sm:p-6 text-center">
                  <h3 className="font-poppins text-lg text-black mb-2">Artigos Publicados</h3>
                  <p className="font-montserrat text-3xl text-purple-600">{realStats.publishedArticles}</p>
                  <p className="font-montserrat text-sm text-gray-500">já no ar</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts and Activity - Dados Reais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Planos Mais Populares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realStats.topPlans.length > 0 ? realStats.topPlans.map((plan: any, index: number) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-montserrat font-medium text-black">{plan.name}</p>
                          <p className="font-montserrat text-sm text-gray-600">{plan.users} usuários</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 self-start sm:self-center">
                          R$ {plan.revenue.toFixed(2)}
                        </Badge>
                      </div>
                    )) : (
                      <p className="font-montserrat text-gray-500 text-center py-4">
                        Nenhum usuário cadastrado ainda
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {realStats.recentActivity.length > 0 ? realStats.recentActivity.map((activity: any, index: number) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-montserrat text-sm text-black">{activity.action}</p>
                          <p className="font-montserrat text-xs text-gray-600">{activity.user}</p>
                        </div>
                        <span className="font-montserrat text-xs text-gray-500 self-start sm:self-center">
                          {activity.time}
                        </span>
                      </div>
                    )) : (
                      <p className="font-montserrat text-gray-500 text-center py-4">
                        Nenhuma atividade recente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Receita Mensal */}
            <Card className="border border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <h3 className="font-poppins text-xl text-green-800 mb-2">Receita Mensal Estimada</h3>
                <p className="font-montserrat text-4xl text-green-700 mb-2">R$ {realStats.monthlyRevenue}</p>
                <p className="font-montserrat text-sm text-green-600">
                  Baseada nos planos ativos dos {realStats.totalUsers} usuários cadastrados
                </p>
              </CardContent>
            </Card>

            {/* Erros do Sistema */}
            {(() => {
              const systemErrors = adminService.getSystemErrors();
              return systemErrors.length > 0 ? (
                <Card className="border border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="font-poppins text-lg text-red-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Erros do Sistema ({systemErrors.length})
                      </span>
                      <Button
                        onClick={() => adminService.clearSystemErrors()}
                        size="sm"
                        variant="outline"
                        className="text-red-700 border-red-300 hover:bg-red-100"
                      >
                        Limpar Erros
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {systemErrors.slice(0, 3).map((error, index) => (
                      <div key={index} className="bg-white border border-red-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-montserrat text-sm text-red-800 font-medium">
                              {error.message}
                            </p>
                            <p className="font-montserrat text-xs text-red-600 mt-1">
                              {new Date(error.timestamp).toLocaleString('pt-BR')}
                            </p>
                            {error.details?.error?.message && (
                              <p className="font-montserrat text-xs text-red-500 mt-1 font-mono">
                                {error.details.error.message}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {error.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {systemErrors.length > 3 && (
                      <p className="font-montserrat text-xs text-red-600 text-center">
                        ... e mais {systemErrors.length - 3} erro(s)
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Status do Banco de Dados */}
            <Card className="border border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="font-poppins text-lg text-blue-800">Status do Banco de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-montserrat text-sm text-blue-700">
                      Usuários no banco: {dbUsers.length}
                    </p>
                    <p className="font-montserrat text-sm text-blue-600">
                      Status: {dbError ? 'Erro na conexão' : 'Conectado'}
                    </p>
                    {dbError && (
                      <p className="font-montserrat text-xs text-red-600 mt-1">
                        {dbError}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={refreshUsers}
                      disabled={dbLoading}
                      variant="outline"
                      className="font-montserrat"
                    >
                      {dbLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Testar Conexão
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {dbUsers.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-poppins text-sm text-blue-800 mb-2">Últimos usuários do banco:</h4>
                    <div className="space-y-2">
                      {dbUsers.slice(0, 3).map((user, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-montserrat text-blue-700">{user.name}</span>
                          <span className="font-montserrat text-blue-600">{user.email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Models Tab */}
          <TabsContent value="ai-models" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-poppins text-xl text-black">Modelos de IA</h2>
              <Button 
                onClick={() => setShowAddModel(true)}
                className="font-montserrat text-white self-start sm:self-center"
                style={{ backgroundColor: '#8B5FBF' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Modelo
              </Button>
            </div>

            {/* Current Default Model */}
            <Alert className="border-blue-200 bg-blue-50">
              <Cpu className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Modelo Padrão:</strong> {systemConfig.defaultAIModel}
              </AlertDescription>
            </Alert>

            {/* Add Model Form */}
            {showAddModel && (
              <Card className="border border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Adicionar Novo Modelo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-montserrat">Nome do Modelo *</Label>
                      <Input
                        value={newModel.name || ''}
                        onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                        placeholder="GPT-4 Turbo"
                        className="font-montserrat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-montserrat">Provedor *</Label>
                      <Select 
                        value={newModel.provider} 
                        onValueChange={(value) => setNewModel({ ...newModel, provider: value as any })}
                      >
                        <SelectTrigger className="font-montserrat">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-montserrat">ID do Modelo *</Label>
                      <Input
                        value={newModel.model || ''}
                        onChange={(e) => setNewModel({ ...newModel, model: e.target.value })}
                        placeholder="gpt-4-turbo"
                        className="font-montserrat"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-montserrat">Custo por 1k Tokens</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={newModel.costPer1kTokens || 0}
                        onChange={(e) => setNewModel({ ...newModel, costPer1kTokens: parseFloat(e.target.value) })}
                        className="font-montserrat"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-montserrat">Descrição *</Label>
                    <Input
                      value={newModel.description || ''}
                      onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                      placeholder="Descrição do modelo..."
                      className="font-montserrat"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAddModel} className="font-montserrat text-white" style={{ backgroundColor: '#8B5FBF' }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                    <Button onClick={() => setShowAddModel(false)} variant="outline" className="font-montserrat">
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Models List */}
            <div className="grid gap-4">
              {aiModels.map((model) => (
                <Card key={model.id} className="border border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-poppins text-lg text-black">{model.name}</h3>
                          <div className="flex flex-wrap gap-2">
                            <Badge className={`${model.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {model.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">{model.provider}</Badge>
                          </div>
                        </div>
                        <p className="font-montserrat text-sm text-gray-600 mb-2">{model.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="font-montserrat">Modelo: {model.model}</span>
                          <span className="font-montserrat">Custo: ${model.costPer1kTokens}/1k tokens</span>
                          <span className="font-montserrat">Max Tokens: {model.maxTokens}</span>
                        </div>
                      </div>
                      <div className="flex flex-row lg:flex-col gap-2">
                        <Button
                          onClick={() => handleUpdateModel(model.id, { isActive: !model.isActive })}
                          variant="outline"
                          size="sm"
                          className="font-montserrat flex-1 lg:flex-none"
                        >
                          {model.isActive ? (
                            <>
                              <XCircle className="mr-1 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleTestModel(model.id)}
                          disabled={testingModel === model.id}
                          variant="outline"
                          size="sm"
                          className="font-montserrat flex-1 lg:flex-none"
                        >
                          {testingModel === model.id ? (
                            <>
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-1 h-4 w-4" />
                              Testar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleRemoveModel(model.id)}
                          variant="destructive"
                          size="sm"
                          className="font-montserrat"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <ApiKeyManager />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagement users={users} onRefresh={loadData} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="font-poppins text-xl text-black">Configurações do Sistema</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-poppins text-lg">Configurações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="font-montserrat">Modelo de IA Padrão</Label>
                    <Select 
                      value={systemConfig.defaultAIModel} 
                      onValueChange={(value) => handleUpdateConfig({ defaultAIModel: value })}
                    >
                      <SelectTrigger className="font-montserrat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.filter(m => m.isActive).map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name} ({model.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-montserrat">Máximo de Ideias por Solicitação</Label>
                    <Input
                      type="number"
                      value={systemConfig.maxIdeasPerRequest}
                      onChange={(e) => handleUpdateConfig({ maxIdeasPerRequest: parseInt(e.target.value) })}
                      className="font-montserrat"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-montserrat">Máximo de Artigos por Dia</Label>
                    <Input
                      type="number"
                      value={systemConfig.maxArticlesPerDay}
                      onChange={(e) => handleUpdateConfig({ maxArticlesPerDay: parseInt(e.target.value) })}
                      className="font-montserrat"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="font-montserrat">Modo de Manutenção</Label>
                    <Switch
                      checked={systemConfig.maintenanceMode}
                      onCheckedChange={(checked) => handleUpdateConfig({ maintenanceMode: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* API Keys */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-poppins text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Chaves de API
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Cole suas chaves de API e clique em "Salvar Configurações"</strong> para ativar a IA real no sistema.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-montserrat">OpenAI API Key</Label>
                        {apiStatus.hasOpenAI && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configurada
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="password"
                        value={tempApiKeys.openai}
                        onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                        placeholder="sk-proj-..."
                        className="font-montserrat"
                      />
                      <p className="font-montserrat text-xs text-gray-500">
                        Obtenha sua chave em: https://platform.openai.com/api-keys
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-montserrat">Anthropic API Key</Label>
                        {apiStatus.hasAnthropic && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configurada
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="password"
                        value={tempApiKeys.anthropic}
                        onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                        placeholder="sk-ant-..."
                        className="font-montserrat"
                      />
                      <p className="font-montserrat text-xs text-gray-500">
                        Obtenha sua chave em: https://console.anthropic.com/
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-montserrat">Google API Key</Label>
                        {apiStatus.hasGoogle && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configurada
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="password"
                        value={tempApiKeys.google}
                        onChange={(e) => handleApiKeyChange('google', e.target.value)}
                        placeholder="AIza..."
                        className="font-montserrat"
                      />
                      <p className="font-montserrat text-xs text-gray-500">
                        Obtenha sua chave em: https://console.cloud.google.com/
                      </p>
                    </div>
                  </div>

                  {apiKeysChanged && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={handleSaveApiKeys}
                        className="font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configurações
                      </Button>
                      <Button 
                        onClick={handleResetApiKeys}
                        variant="outline"
                        className="font-montserrat"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resetar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* WooCommerce Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="font-poppins text-lg">Integração WooCommerce</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Configure as credenciais para integrar com WooCommerce e gerenciar assinaturas automaticamente.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-montserrat">Consumer Key</Label>
                    <Input
                      type="password"
                      value={wooCredentials.consumerKey}
                      onChange={(e) => handleWooCredentialChange('consumerKey', e.target.value)}
                      placeholder="ck_..."
                      className="font-montserrat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-montserrat">Consumer Secret</Label>
                    <Input
                      type="password"
                      value={wooCredentials.consumerSecret}
                      onChange={(e) => handleWooCredentialChange('consumerSecret', e.target.value)}
                      placeholder="cs_..."
                      className="font-montserrat"
                    />
                  </div>
                </div>

                {wooCredentialsChanged && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      onClick={handleSaveWooCredentials}
                      className="font-montserrat text-white"
                      style={{ backgroundColor: '#8B5FBF' }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Salvar WooCommerce
                    </Button>
                    <Button 
                      onClick={handleResetWooCredentials}
                      variant="outline"
                      className="font-montserrat"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resetar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}