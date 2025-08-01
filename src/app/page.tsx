'use client';

import React, { useState, useEffect } from 'react';
import { BiaProvider, useBia } from '@/components/BiaContext';
import { Layout } from '@/components/Layout';
import { LoginRegister } from '@/components/LoginRegister';
import { Dashboard } from '@/components/Dashboard';
import { MeusSites } from '@/components/pages/MeusSites';
import { GerarIdeias } from '@/components/pages/GerarIdeias';
import { ProduzirArtigos } from '@/components/pages/ProduzirArtigos';
import { AdminPanel } from '@/components/pages/AdminPanel';
import { AgendarPosts } from '@/components/pages/AgendarPosts';
import { Calendario } from '@/components/pages/Calendario';
import { Historico } from '@/components/pages/Historico';
import { Excluidos } from '@/components/pages/Excluidos';
import { LojaBIA } from '@/components/pages/LojaBIA';
import { Maisfy } from '@/components/pages/Maisfy';
import { Suporte } from '@/components/pages/Suporte';
import { MinhaConta } from '@/components/pages/MinhaConta';
import { toast, Toaster } from 'sonner';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { actions } = useBia();

  useEffect(() => {
    console.log('App iniciando...');
    const savedUser = localStorage.getItem('bia-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserData(user);
        setIsLoggedIn(true);
        actions.login(user);
        setTimeout(async () => {
          try {
            const { wordpressService } = await import('@/services/wordpressService');
            await wordpressService.syncFromBiaContext();
          } catch (error) {
            console.warn('Erro ao sincronizar WordPress na inicialização:', error);
          }
        }, 500);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        localStorage.removeItem('bia-user');
      }
    }

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setCurrentPage(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLogin = async (user: any) => {
    setUserData(user);
    setIsLoggedIn(true);
    localStorage.setItem('bia-user', JSON.stringify(user));
    actions.login(user);
    toast.success(`Bem-vindo, ${user.name}!`);
    try {
      const { projectId, publicAnonKey } = await import('@/utils/supabase/info');
      const healthCheck = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/health`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!healthCheck.ok) throw new Error('Servidor indisponível');
      const loginResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ email: user.email }),
        signal: AbortSignal.timeout(10000),
      });
      const loginResult = await loginResponse.json();
      if (loginResult.success && loginResult.user) {
        const updatedUser = { ...user, ...loginResult.user };
        setUserData(updatedUser);
        localStorage.setItem('bia-user', JSON.stringify(updatedUser));
        actions.login(updatedUser);
      } else {
        console.log('Usuário não encontrado, tentando migração...');
        const registerResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-53322c0b/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            cpf: user.cpf || '',
            whatsapp: user.whatsapp || '',
            dataNascimento: user.dataNascimento || '',
            plano: user.plano || 'Free',
          }),
          signal: AbortSignal.timeout(10000),
        });
        const registerResult = await registerResponse.json();
        if (registerResult.success && registerResult.user) {
          const updatedUser = { ...user, ...registerResult.user };
          setUserData(updatedUser);
          localStorage.setItem('bia-user', JSON.stringify(updatedUser));
          actions.login(updatedUser);
        } else {
          console.warn('Migração falhou, continuando localmente:', registerResult.error);
        }
      }
    } catch (error) {
      console.warn('Sincronização com banco falhou:', error);
    }
    try {
      const { adminService } = await import('@/services/adminService');
      adminService.addUserToHistory(user);
    } catch (error) {
      console.warn('Erro ao registrar usuário no histórico:', error);
    }
  };

  const handleLogout = () => {
    setUserData(null);
    setIsLoggedIn(false);
    localStorage.removeItem('bia-user');
    setCurrentPage('dashboard');
    window.location.hash = '';
    actions.logout();
    toast.success('Logout realizado com sucesso!');
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    window.location.hash = page;
  };

  const isAdmin = userData?.email === 'admin@bia.com' || userData?.email === 'dev@bia.com';

  const renderCurrentPage = () => {
    if (!isLoggedIn) {
      return <LoginRegister onLogin={handleLogin} />;
    }
    switch (currentPage) {
      case 'sites':
        return <MeusSites userData={userData} />;
      case 'ideas':
        return <GerarIdeias userData={userData} onPageChange={handlePageChange} />;
      case 'articles':
        return <ProduzirArtigos userData={userData} />;
      case 'schedule':
        return <AgendarPosts userData={userData} />;
      case 'calendar':
        return <Calendario userData={userData} />;
      case 'history':
        return <Historico userData={userData} />;
      case 'deleted':
        return <Excluidos userData={userData} />;
      case 'store':
        return <LojaBIA userData={userData} />;
      case 'maisfy':
        return <Maisfy userData={userData} />;
      case 'support':
        return <Suporte userData={userData} />;
      case 'account':
        return <MinhaConta userData={userData} />;
      case 'admin':
        if (!isAdmin) {
          toast.error('Acesso negado. Apenas administradores podem acessar esta área.');
          handlePageChange('dashboard');
          return <Dashboard userData={userData} onNavigate={handlePageChange} />;
        }
        return <AdminPanel />;
      default:
        return <Dashboard userData={userData} onNavigate={handlePageChange} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <LoginRegister onLogin={handleLogin} />
        <Toaster position="top-right" richColors closeButton duration={3000} />
      </div>
    );
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handlePageChange} onLogout={handleLogout} userData={userData} showAdminAccess={isAdmin}>
      {renderCurrentPage()}
      <Toaster position="top-right" richColors closeButton duration={3000} />
    </Layout>
  );
}

export default function Page() {
  return (
    <BiaProvider>
      <AppContent />
    </BiaProvider>
  );
}
