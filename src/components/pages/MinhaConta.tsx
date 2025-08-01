import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { User, Settings, CheckCircle, AlertCircle, Save, TrendingUp, FileText, Calendar, Monitor, Lightbulb, Edit3, Clock, Lock } from '../icons';
import { useBia } from '../BiaContext';
import { FREE_PLAN_LIMITS } from '../../utils/constants';
import { toast } from 'sonner';

interface MinhaContaProps {
  userData: any;
  onNavigate?: (page: string) => void;
}

export function MinhaConta({ userData, onNavigate }: MinhaContaProps) {
  const { actions, state } = useBia();
  const [formData, setFormData] = useState({
    nome: userData?.name || '',
    email: userData?.email || '',
    whatsapp: userData?.whatsapp || '',
    cpf: userData?.cpf || '',
    dataNascimento: userData?.dataNascimento || ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Verificar limites do plano gratuito
  const limits = actions.checkFreePlanLimits();
  const isFreePlan = actions.isFreePlan();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    setIsUpdating(true);
    try {
      // Simular atualização (em produção seria uma chamada API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...userData,
        name: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf,
        dataNascimento: formData.dataNascimento
      };
      
      // Atualizar no contexto BIA
      actions.login(updatedUser);
      
      // Atualizar no localStorage para persistir entre navegações
      localStorage.setItem('bia-user', JSON.stringify(updatedUser));
      
      setUpdateSuccess(true);
      toast.success('Informações atualizadas com sucesso!');
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar informações');
    } finally {
      setIsUpdating(false);
    }
  };

  // Calcular estatísticas
  const ideasGenerated = state.ideas.length;
  const articlesProduced = state.articles.filter(a => a.status === 'Concluído').length;
  const sitesConnected = state.sites.length;

  // Calcular limites restantes
  const ideasUsed = state.ideas.length;
  const articlesUsed = state.articles.filter(a => a.status === 'Concluído').length;
  const sitesUsed = state.sites.length;

  const ideasRemaining = isFreePlan ? Math.max(0, FREE_PLAN_LIMITS.ideas - ideasUsed) : 'Ilimitado';
  const articlesRemaining = isFreePlan ? Math.max(0, FREE_PLAN_LIMITS.articles - articlesUsed) : 'Ilimitado';
  const sitesRemaining = isFreePlan ? Math.max(0, FREE_PLAN_LIMITS.sites - sitesUsed) : 'Ilimitado';

  const ideasProgress = isFreePlan ? (ideasUsed / FREE_PLAN_LIMITS.ideas) * 100 : 0;
  const articlesProgress = isFreePlan ? (articlesUsed / FREE_PLAN_LIMITS.articles) * 100 : 0;
  const sitesProgress = isFreePlan ? (sitesUsed / FREE_PLAN_LIMITS.sites) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Minha Conta</h1>
        <p className="font-montserrat text-gray-600">Gerencie suas informações pessoais e veja os limites do seu plano</p>
      </div>

      {/* Banner de Upgrade - apenas para plano gratuito */}
      {isFreePlan && (
        <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6 text-center">
            <h3 className="font-poppins text-xl text-purple-800 mb-2">
              🚀 Desbloqueie Todo o Potencial da BIA!
            </h3>
            <p className="font-montserrat text-purple-700 mb-4">
              Upgrade seu plano e tenha acesso a mais ideias, artigos e sites
            </p>
            <Button 
              className="font-montserrat text-white"
              style={{ backgroundColor: '#8B5FBF' }}
              onClick={() => onNavigate?.('store')}
            >
              Ver Planos
            </Button>
          </CardContent>
        </Card>
      )}

      {updateSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Informações atualizadas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      {/* Alertas de erro geral do estado, se houver */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
              <User size={20} style={{ color: '#8B5FBF' }} />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="font-montserrat">Nome Completo *</Label>
              <Input
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                className="font-montserrat"
                placeholder="Seu nome completo"
                disabled={isUpdating}
              />
            </div>
            
            {/* Campo E-mail - Somente Leitura */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-montserrat flex items-center space-x-2">
                <span>E-mail *</span>
                <Lock size={14} className="text-gray-500" />
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                className="font-montserrat bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="seu@email.com"
                disabled={true}
                readOnly={true}
              />
              <p className="font-montserrat text-xs text-gray-500">
                📧 O e-mail não pode ser alterado pois é usado como identificação do cadastro
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="font-montserrat">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="(11) 99999-9999"
                className="font-montserrat"
                disabled={isUpdating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf" className="font-montserrat flex items-center space-x-2">
                <span>CPF</span>
                <Lock size={14} className="text-gray-500" />
              </Label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                placeholder="000.000.000-00"
                className="font-montserrat"
                disabled={isUpdating}
              />
              <p className="font-montserrat text-xs text-gray-500">
                🆔 CPF usado como chave secundária de identificação
              </p>
            </div>
            
            {/* Campo Data de Nascimento - Simplificado */}
            <div className="space-y-2">
              <Label htmlFor="dataNascimento" className="font-montserrat">Data de Nascimento</Label>
              <Input
                id="dataNascimento"
                name="dataNascimento"
                type="date"
                value={formData.dataNascimento}
                onChange={handleInputChange}
                className="font-montserrat"
                disabled={isUpdating}
                max={new Date().toISOString().split('T')[0]} // Não permitir datas futuras
              />
              <p className="font-montserrat text-xs text-gray-500">
                📅 Use o calendário ou digite diretamente (AAAA-MM-DD)
              </p>
            </div>

            <Button 
              onClick={handleSave}
              disabled={isUpdating}
              className="w-full font-montserrat text-white"
              style={{ backgroundColor: '#8B5FBF' }}
            >
              <Save className="mr-2" size={16} />
              {isUpdating ? 'Salvando...' : 'Salvar Informações'}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
              <Settings size={20} style={{ color: '#8B5FBF' }} />
              <span>Informações do Plano</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="font-montserrat">Plano Atual</Label>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle size={12} className="mr-1" />
                  Ativo
                </Badge>
                <span className="font-montserrat font-medium text-black">
                  {userData?.plano || 'Free'}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-montserrat">IA Centralizada</Label>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-montserrat text-sm text-blue-800">
                  ✅ A BIA usa IA própria da plataforma
                </p>
                <p className="font-montserrat text-xs text-blue-600">
                  Você não precisa se preocupar com chaves API ou custos extras!
                </p>
              </div>
            </div>

            {/* Limites do plano gratuito */}
            {isFreePlan && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-montserrat">Ideias Geradas</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-montserrat text-gray-600">
                        {ideasUsed} de {FREE_PLAN_LIMITS.ideas}
                      </span>
                      <span className="font-montserrat text-purple-600">
                        {typeof ideasRemaining === 'number' ? `${ideasRemaining} restantes` : 'Ilimitado'}
                      </span>
                    </div>
                    <Progress 
                      value={ideasProgress} 
                      className="w-full h-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-montserrat">Artigos Produzidos</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-montserrat text-gray-600">
                        {articlesUsed} de {FREE_PLAN_LIMITS.articles}
                      </span>
                      <span className="font-montserrat text-purple-600">
                        {typeof articlesRemaining === 'number' ? `${articlesRemaining} restantes` : 'Ilimitado'}
                      </span>
                    </div>
                    <Progress 
                      value={articlesProgress} 
                      className="w-full h-2"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-montserrat">Sites Conectados</Label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-montserrat text-gray-600">
                        {sitesUsed} de {FREE_PLAN_LIMITS.sites}
                      </span>
                      <span className="font-montserrat text-purple-600">
                        {typeof sitesRemaining === 'number' ? `${sitesRemaining} restantes` : 'Ilimitado'}
                      </span>
                    </div>
                    <Progress 
                      value={sitesProgress} 
                      className="w-full h-2"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="font-montserrat text-xs text-gray-500">
                    Plano gratuito com limites não cumulativos
                  </p>
                </div>
              </div>
            )}

            {/* Planos pagos */}
            {!isFreePlan && (
              <div className="space-y-2">
                <Label className="font-montserrat">Recursos do Plano</Label>
                <div className="p-3 bg-green-50 rounded-lg space-y-1">
                  <p className="font-montserrat text-sm text-green-800">
                    ✅ Ideias ilimitadas
                  </p>
                  <p className="font-montserrat text-sm text-green-800">
                    ✅ Artigos ilimitados  
                  </p>
                  <p className="font-montserrat text-sm text-green-800">
                    ✅ Sites ilimitados
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas de uso */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
            <TrendingUp size={20} style={{ color: '#8B5FBF' }} />
            <span>Estatísticas Gerais</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Lightbulb size={24} className="mx-auto mb-2 text-purple-600" />
              <p className="font-poppins text-2xl text-purple-800">{ideasGenerated}</p>
              <p className="font-montserrat text-sm text-purple-600">Ideias Geradas</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Edit3 size={24} className="mx-auto mb-2 text-green-600" />
              <p className="font-poppins text-2xl text-green-800">{articlesProduced}</p>
              <p className="font-montserrat text-sm text-green-600">Artigos Produzidos</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Calendar size={24} className="mx-auto mb-2 text-blue-600" />
              <p className="font-poppins text-2xl text-blue-800">
                {state.articles.filter(a => a.status === 'Agendado').length}
              </p>
              <p className="font-montserrat text-sm text-blue-600">Posts Agendados</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Monitor size={24} className="mx-auto mb-2 text-orange-600" />
              <p className="font-poppins text-2xl text-orange-800">{sitesConnected}</p>
              <p className="font-montserrat text-sm text-orange-600">Sites Conectados</p>
            </div>
          </div>

          {/* Resumo do plano */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <h4 className="font-poppins font-medium text-black mb-2">
              Resumo do Plano {userData?.plano || 'Free'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-montserrat text-gray-600">Ideias:</span>
                <p className="font-montserrat font-medium text-black">
                  {isFreePlan ? `${FREE_PLAN_LIMITS.ideas} por mês` : 'Ilimitadas'}
                </p>
              </div>
              <div>
                <span className="font-montserrat text-gray-600">Artigos:</span>
                <p className="font-montserrat font-medium text-black">
                  {isFreePlan ? `${FREE_PLAN_LIMITS.articles} por mês` : 'Ilimitados'}
                </p>
              </div>
              <div>
                <span className="font-montserrat text-gray-600">Sites:</span>
                <p className="font-montserrat font-medium text-black">
                  {isFreePlan ? `${FREE_PLAN_LIMITS.sites} site` : 'Ilimitados'}
                </p>
              </div>
            </div>
            
            {isFreePlan && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="font-montserrat text-xs text-gray-600">
                  💡 <strong>Dica:</strong> Limites do plano gratuito são não cumulativos. 
                  Faça upgrade para remover todas as limitações.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="font-poppins text-lg text-blue-800">
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => onNavigate?.('ideas')}
              variant="outline"
              className="font-montserrat h-auto p-4 flex flex-col items-center gap-2"
            >
              <Lightbulb size={20} style={{ color: '#8B5FBF' }} />
              <span>Gerar Ideias</span>
              <span className="text-xs text-gray-500">
                {typeof ideasRemaining === 'number' ? `${ideasRemaining} restantes` : 'Ilimitado'}
              </span>
            </Button>
            
            <Button
              onClick={() => onNavigate?.('articles')}
              variant="outline"
              className="font-montserrat h-auto p-4 flex flex-col items-center gap-2"
            >
              <Edit3 size={20} style={{ color: '#8B5FBF' }} />
              <span>Produzir Artigos</span>
              <span className="text-xs text-gray-500">
                {typeof articlesRemaining === 'number' ? `${articlesRemaining} restantes` : 'Ilimitado'}
              </span>
            </Button>
            
            <Button
              onClick={() => onNavigate?.('sites')}
              variant="outline"
              className="font-montserrat h-auto p-4 flex flex-col items-center gap-2"
            >
              <Monitor size={20} style={{ color: '#8B5FBF' }} />
              <span>Meus Sites</span>
              <span className="text-xs text-gray-500">
                {sitesConnected} conectados
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}