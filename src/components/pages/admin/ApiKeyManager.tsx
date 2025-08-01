import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { Eye, EyeOff, Key, CheckCircle, AlertCircle, Save, RefreshCw } from '../../icons';
import { toast } from 'sonner';
import { adminService } from '../../../services/adminService';
import { contentService } from '../../../services/contentService';

export function ApiKeyManager() {
  const [apiKey, setApiKey] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadCurrentApiKey();
  }, []);

  const loadCurrentApiKey = () => {
    try {
      const config = adminService.getSystemConfig();
      const currentKey = config.apiKeys.openai || '';
      setApiKey(currentKey);
      console.log('🔑 Chave API atual carregada:', {
        hasKey: !!currentKey,
        keyLength: currentKey?.length || 0,
        keyPrefix: currentKey ? currentKey.substring(0, 10) + '...' : 'Nenhuma'
      });
    } catch (error) {
      console.error('Erro ao carregar chave API:', error);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite uma chave API válida');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast.error('Chave API deve começar com "sk-"');
      return;
    }

    setIsLoading(true);

    try {
      console.log('💾 Salvando chave API...');
      
      const updatedConfig = {
        apiKeys: {
          openai: apiKey.trim()
        }
      };

      adminService.updateSystemConfig(updatedConfig);
      
      console.log('✅ Chave API salva com sucesso');
      toast.success('Chave API OpenAI salva com sucesso!');
      
      // Limpar resultado de teste anterior
      setTestResult(null);
      
    } catch (error) {
      console.error('❌ Erro ao salvar chave API:', error);
      toast.error('Erro ao salvar chave API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      toast.error('Digite uma chave API para testar');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testando chave API OpenAI...');
      
      // Primeiro, salvar a chave temporariamente para o teste
      const config = adminService.getSystemConfig();
      const originalKey = config.apiKeys.openai;
      
      const updatedConfig = {
        apiKeys: {
          openai: apiKey.trim()
        }
      };
      adminService.updateSystemConfig(updatedConfig);

      // Testar geração de uma ideia simples
      const testParams = {
        nicho: 'Tecnologia',
        palavrasChave: 'teste, API',
        quantidade: 1,
        idioma: 'Português',
        contexto: 'Teste de conectividade da API',
        siteId: 1
      };

      const result = await contentService.generateIdeas(testParams);
      
      if (result.success && result.ideas && result.ideas.length > 0) {
        console.log('✅ Teste da API bem-sucedido');
        setTestResult({
          success: true,
          message: 'Chave API válida e funcionando! Teste de geração realizado com sucesso.'
        });
        toast.success('Chave API testada com sucesso!');
      } else {
        console.warn('⚠️ Teste falhou:', result.error);
        setTestResult({
          success: false,
          message: result.error || 'Erro desconhecido no teste da API'
        });
        
        // Restaurar chave original se o teste falhou
        const restoreConfig = {
          apiKeys: {
            openai: originalKey || ''
          }
        };
        adminService.updateSystemConfig(restoreConfig);
        setApiKey(originalKey || '');
      }

    } catch (error) {
      console.error('❌ Erro ao testar chave API:', error);
      setTestResult({
        success: false,
        message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const maskApiKey = (key: string): string => {
    if (!key || key.length < 10) return key;
    return key.substring(0, 10) + '*'.repeat(key.length - 10);
  };

  const isValidFormat = apiKey.startsWith('sk-') && apiKey.length > 20;
  const hasValidKey = contentService.hasValidApiKey();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-poppins text-2xl text-black mb-2">Gerenciamento de Chave API OpenAI</h2>
        <p className="font-montserrat text-gray-600">Configure a chave API da OpenAI para ativar funcionalidades de IA</p>
      </div>

      {/* Status Atual */}
      <Card className={`border ${hasValidKey ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasValidKey ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p className={`font-montserrat font-medium ${hasValidKey ? 'text-green-800' : 'text-red-800'}`}>
                  {hasValidKey ? 'Chave API Configurada' : 'Chave API Não Configurada'}
                </p>
                <p className={`font-montserrat text-sm ${hasValidKey ? 'text-green-700' : 'text-red-700'}`}>
                  {hasValidKey 
                    ? 'Funcionalidades de IA estão ativas' 
                    : 'Funcionalidades de IA estão desativadas'
                  }
                </p>
              </div>
            </div>
            <Badge className={hasValidKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {hasValidKey ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="font-poppins text-lg flex items-center space-x-2">
            <Key className="h-5 w-5 text-purple-600" />
            <span>Configuração da Chave API</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-montserrat">Chave API OpenAI</Label>
            <div className="relative">
              <Input
                type={isVisible ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="font-montserrat pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setIsVisible(!isVisible)}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Digite sua chave API da OpenAI. Você pode obter uma em{' '}
              <a 
                href="https://platform.openai.com/account/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                platform.openai.com/account/api-keys
              </a>
            </p>
          </div>

          {/* Validação Visual */}
          {apiKey && (
            <div className="flex items-center space-x-2">
              {isValidFormat ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm ${isValidFormat ? 'text-green-700' : 'text-red-700'}`}>
                {isValidFormat ? 'Formato válido' : 'Formato inválido (deve começar com "sk-")'}
              </span>
            </div>
          )}

          {/* Resultado do Teste */}
          {testResult && (
            <Alert className={`border ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex space-x-3">
            <Button
              onClick={handleSave}
              disabled={isLoading || !apiKey.trim() || !isValidFormat}
              className="font-montserrat text-white"
              style={{ backgroundColor: '#8B5FBF' }}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Chave
                </>
              )}
            </Button>

            <Button
              onClick={handleTest}
              disabled={isTesting || !apiKey.trim() || !isValidFormat}
              variant="outline"
              className="font-montserrat"
              style={{ borderColor: '#8B5FBF', color: '#8B5FBF' }}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Testar Chave
                </>
              )}
            </Button>
          </div>

          {/* Informações Importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-poppins font-medium text-blue-800 mb-2">📋 Informações Importantes</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• A chave API é armazenada localmente no navegador de forma segura</li>
              <li>• Certifique-se de que sua conta OpenAI tem créditos disponíveis</li>
              <li>• Use Application Passwords, não senhas regulares</li>
              <li>• O teste gera uma ideia simples para verificar a conectividade</li>
              <li>• Esta chave será usada para todas as funcionalidades de IA do sistema</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}