import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, ChevronRight, ChevronLeft } from './icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BRAZILIAN_STATES } from '../utils/constants';

interface LoginRegisterProps {
  onLogin: (userData: any) => void;
}

export function LoginRegister({ onLogin }: LoginRegisterProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [registerStep, setRegisterStep] = useState(1); // 1-4 para as etapas
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    // Etapa 1: Informações Básicas (Nome, WhatsApp, Email)
    nomeCompleto: '',
    whatsapp: '',
    email: '',
    // Etapa 2: Dados Pessoais (CPF, Data Nascimento)
    cpf: '',
    dataNascimento: '',
    // Etapa 3: Endereço
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    // Etapa 4: Senha
    password: '',
    confirmPassword: ''
  });

  // Função para obter IP do usuário (simulada)
  const getUserIP = async () => {
    try {
      // Em produção, usar um serviço real de IP
      return '192.168.1.1'; // IP simulado
    } catch (error) {
      return 'unknown';
    }
  };

  // Função para validar CPF
  const isValidCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
      return numericValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Função para formatar WhatsApp
  const formatWhatsApp = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      return numericValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numericValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 8) {
      return numericValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validações básicas
      if (!loginData.email || !loginData.password) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      // Simular autenticação
      const userData = {
        id: Date.now(),
        name: loginData.email === 'dev@bia.com' ? 'Admin BIA' : 'Usuário Teste',
        email: loginData.email,
        plano: loginData.email === 'dev@bia.com' ? 'BIA' : 'Free',
        createdAt: new Date().toISOString(),
        ip: await getUserIP()
      };

      toast.success('Login realizado com sucesso!');
      onLogin(userData);
    } catch (error) {
      toast.error('Erro no login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Validação para Etapa 1: Nome, WhatsApp e Email
        if (!registerData.nomeCompleto || !registerData.whatsapp || !registerData.email) {
          toast.error('Preencha Nome, WhatsApp e Email');
          return false;
        }
        if (registerData.nomeCompleto.trim().length < 2) {
          toast.error('Nome deve ter pelo menos 2 caracteres');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerData.email)) {
          toast.error('Email inválido');
          return false;
        }
        if (registerData.whatsapp.replace(/\D/g, '').length < 10) {
          toast.error('WhatsApp inválido');
          return false;
        }
        return true;
      
      case 2:
        // Validação para Etapa 2: CPF e Data de Nascimento
        if (!registerData.cpf || !registerData.dataNascimento) {
          toast.error('Preencha CPF e Data de Nascimento');
          return false;
        }
        if (!isValidCPF(registerData.cpf)) {
          toast.error('CPF inválido');
          return false;
        }
        const birthDate = new Date(registerData.dataNascimento);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          toast.error('Você deve ser maior de 18 anos');
          return false;
        }
        return true;
      
      case 3:
        // Validação para Etapa 3: Endereço
        if (!registerData.endereco || !registerData.bairro || !registerData.cidade || 
            !registerData.estado || !registerData.cep) {
          toast.error('Preencha todos os campos de endereço obrigatórios');
          return false;
        }
        return true;
      
      case 4:
        // Validação para Etapa 4: Senha
        if (!registerData.password || !registerData.confirmPassword) {
          toast.error('Preencha a senha e confirmação');
          return false;
        }
        if (registerData.password !== registerData.confirmPassword) {
          toast.error('Senhas não coincidem');
          return false;
        }
        if (registerData.password.length < 6) {
          toast.error('Senha deve ter pelo menos 6 caracteres');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(registerStep)) {
      setRegisterStep(registerStep + 1);
    }
  };

  const handlePrevStep = () => {
    setRegisterStep(registerStep - 1);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;
    
    setIsLoading(true);

    try {
      console.log('Iniciando cadastro no banco de dados...');

      // Preparar dados para o banco
      const registrationData = {
        email: registerData.email,
        name: registerData.nomeCompleto,
        cpf: registerData.cpf,
        whatsapp: registerData.whatsapp,
        dataNascimento: registerData.dataNascimento,
        plano: 'Free'
      };

      console.log('Enviando dados para o servidor:', registrationData);

      // Obter configurações do Supabase
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      // Cadastrar no banco de dados
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(registrationData)
      });

      if (!response.ok) {
        console.error('Erro HTTP no cadastro:', response.status, response.statusText);
        const errorResult = await response.json();
        throw new Error(errorResult.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Resposta do servidor:', result);

      if (!result.success) {
        throw new Error(result.error || 'Erro no cadastro');
      }

      // Se chegou até aqui, cadastro foi bem-sucedido
      const userData = {
        ...result.user,
        // Manter compatibilidade com dados locais
        endereco: {
          rua: registerData.endereco,
          numero: registerData.numero,
          complemento: registerData.complemento,
          bairro: registerData.bairro,
          cidade: registerData.cidade,
          estado: registerData.estado,
          cep: registerData.cep
        },
        ip: await getUserIP(),
        usage: {
          sites: 0,
          ideas: 0,
          articles: 0
        }
      };

      console.log('Usuário cadastrado com sucesso:', userData);
      toast.success('🎉 Cadastro realizado com sucesso! Bem-vindo à BIA!');
      onLogin(userData);

    } catch (error) {
      console.error('Erro no cadastro:', error);
      
      // Mostrar erro específico ou genérico
      const errorMessage = error.message || 'Erro no cadastro. Tente novamente.';
      toast.error(errorMessage);

      // Em caso de erro, criar usuário localmente como fallback
      console.log('Criando usuário localmente como fallback...');
      
      try {
        const userIP = await getUserIP();
        const fallbackUserData = {
          id: Date.now(),
          name: registerData.nomeCompleto,
          email: registerData.email,
          cpf: registerData.cpf,
          dataNascimento: registerData.dataNascimento,
          whatsapp: registerData.whatsapp,
          endereco: {
            rua: registerData.endereco,
            numero: registerData.numero,
            complemento: registerData.complemento,
            bairro: registerData.bairro,
            cidade: registerData.cidade,
            estado: registerData.estado,
            cep: registerData.cep
          },
          plano: 'Free',
          createdAt: new Date().toISOString(),
          ip: userIP,
          usage: {
            sites: 0,
            ideas: 0,
            articles: 0
          }
        };

        console.log('Usuário criado localmente:', fallbackUserData);
        onLogin(fallbackUserData);
        
      } catch (fallbackError) {
        console.error('Erro no fallback local:', fallbackError);
        toast.error('Erro crítico no cadastro. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (activeTab === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      // Formatação especial para alguns campos
      if (field === 'cpf') {
        value = formatCPF(value);
      } else if (field === 'whatsapp') {
        value = formatWhatsApp(value);
      } else if (field === 'cep') {
        value = formatCEP(value);
      }
      
      setRegisterData(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetRegisterForm = () => {
    setRegisterStep(1);
    setRegisterData({
      nomeCompleto: '',
      whatsapp: '',
      email: '',
      cpf: '',
      dataNascimento: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'register') {
      resetRegisterForm();
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return 'Informações Básicas';
      case 2: return 'Dados Pessoais';
      case 3: return 'Endereço';
      case 4: return 'Senha';
      default: return 'Cadastro';
    }
  };

  const getProgressPercentage = () => {
    return (registerStep / 4) * 100;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-6 pb-6">
            {/* Logo */}
            <div className="text-center">
              <ImageWithFallback
                src="https://app.bloginfinitoautomatico.com.br/wp-content/uploads/2025/07/logo-bia-7.png"
                alt="BIA - Blog Infinito Automático"
                className="h-16 w-auto mx-auto"
              />
            </div>
            
            {/* Título */}
            <div className="text-center">
<CardTitle className="font-poppins text-lg font-semibold text-zinc-900 flex items-center space-x-2 justify-center">
  {activeTab === 'login' ? (
    <>
      <User className="text-purple-600" size={20} />
      <span>Entrar na sua conta</span>
    </>
  ) : (
    <>
      <UserPlus className="text-purple-600" size={20} />
      <span>{getStepTitle(registerStep)} ({registerStep}/4)</span>
    </>
  )}
</CardTitle>

            </div>

            {/* Barra de progresso para cadastro */}
            {activeTab === 'register' && (
              <div className="space-y-2">
                <Progress 
                  value={getProgressPercentage()} 
                  className="h-2"
                />
                <div className="text-center">
                  <span className="font-montserrat text-sm text-gray-600">
                    Etapa {registerStep} de 4
                  </span>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="font-montserrat">
                  <User className="mr-2 h-4 w-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="font-montserrat">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-montserrat">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="pl-10 font-montserrat"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-montserrat">
                      Senha *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Sua senha"
                        value={loginData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="pl-10 pr-10 font-montserrat"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

<Button
  type="submit"
  disabled={isLoading}
  className="w-full flex items-center justify-center space-x-2 bg-purple-700 hover:bg-purple-800 text-white font-poppins text-sm font-medium shadow-md transition-all"
>
  {isLoading ? (
    <span>Entrando...</span>
  ) : (
    <>
      <User className="w-4 h-4" />
      <span>Entrar</span>
    </>
  )}
</Button>

                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                {/* Etapa 1: Informações Básicas (Nome, WhatsApp, Email) */}
                {registerStep === 1 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="font-montserrat text-sm text-gray-600">
                        Vamos começar com suas informações básicas
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto" className="font-montserrat">
                        Nome Completo *
                      </Label>
                      <Input
                        id="nomeCompleto"
                        type="text"
                        placeholder="Seu nome completo"
                        value={registerData.nomeCompleto}
                        onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                        className="font-montserrat"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp" className="font-montserrat">
                        WhatsApp *
                      </Label>
                      <Input
                        id="whatsapp"
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={registerData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                        className="font-montserrat"
                        maxLength={15}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-montserrat">
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="font-montserrat"
                        required
                      />
                    </div>

                    <Button
                      onClick={handleNextStep}
                      className="w-full font-montserrat text-white"
                      style={{ backgroundColor: '#8B5FBF' }}
                    >
                      Continuar
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Etapa 2: Dados Pessoais (CPF, Data Nascimento) */}
                {registerStep === 2 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="font-montserrat text-sm text-gray-600">
                        Agora preciso dos seus dados pessoais
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf" className="font-montserrat">
                        CPF *
                      </Label>
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        value={registerData.cpf}
                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                        className="font-montserrat"
                        maxLength={14}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dataNascimento" className="font-montserrat">
                        Data de Nascimento *
                      </Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={registerData.dataNascimento}
                        onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                        className="font-montserrat"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handlePrevStep}
                        variant="outline"
                        className="flex-1 font-montserrat"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        className="flex-1 font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Etapa 3: Endereço */}
                {registerStep === 3 && (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="font-montserrat text-sm text-gray-600">
                        Informe seu endereço completo
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="endereco" className="font-montserrat">
                          Endereço *
                        </Label>
                        <Input
                          id="endereco"
                          type="text"
                          placeholder="Rua, Avenida..."
                          value={registerData.endereco}
                          onChange={(e) => handleInputChange('endereco', e.target.value)}
                          className="font-montserrat"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numero" className="font-montserrat">
                          Número
                        </Label>
                        <Input
                          id="numero"
                          type="text"
                          placeholder="123"
                          value={registerData.numero}
                          onChange={(e) => handleInputChange('numero', e.target.value)}
                          className="font-montserrat"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complemento" className="font-montserrat">
                        Complemento
                      </Label>
                      <Input
                        id="complemento"
                        type="text"
                        placeholder="Apartamento, bloco..."
                        value={registerData.complemento}
                        onChange={(e) => handleInputChange('complemento', e.target.value)}
                        className="font-montserrat"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="bairro" className="font-montserrat">
                          Bairro *
                        </Label>
                        <Input
                          id="bairro"
                          type="text"
                          placeholder="Nome do bairro"
                          value={registerData.bairro}
                          onChange={(e) => handleInputChange('bairro', e.target.value)}
                          className="font-montserrat"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cidade" className="font-montserrat">
                          Cidade *
                        </Label>
                        <Input
                          id="cidade"
                          type="text"
                          placeholder="Nome da cidade"
                          value={registerData.cidade}
                          onChange={(e) => handleInputChange('cidade', e.target.value)}
                          className="font-montserrat"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="estado" className="font-montserrat">
                          Estado *
                        </Label>
                        <Select 
                          value={registerData.estado} 
                          onValueChange={(value) => handleInputChange('estado', value)}
                          required
                        >
                          <SelectTrigger className="font-montserrat">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_STATES.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cep" className="font-montserrat">
                          CEP *
                        </Label>
                        <Input
                          id="cep"
                          type="text"
                          placeholder="00000-000"
                          value={registerData.cep}
                          onChange={(e) => handleInputChange('cep', e.target.value)}
                          className="font-montserrat"
                          maxLength={9}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handlePrevStep}
                        variant="outline"
                        className="flex-1 font-montserrat"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        className="flex-1 font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        Continuar
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Etapa 4: Senha */}
                {registerStep === 4 && (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="font-montserrat text-sm text-gray-600">
                        Por último, crie uma senha segura
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-montserrat">
                        Senha *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={registerData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="pr-10 font-montserrat"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="font-montserrat">
                        Confirmar Senha *
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Digite a senha novamente"
                        value={registerData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="font-montserrat"
                        required
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handlePrevStep}
                        variant="outline"
                        className="flex-1 font-montserrat"
                        type="button"
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 font-montserrat text-white"
                        style={{ backgroundColor: '#8B5FBF' }}
                      >
                        {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}