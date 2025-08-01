import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './ui/sheet';
import { 
  Home, 
  Lightbulb, 
  FileText, 
  Calendar, 
  Clock, 
  History, 
  Trash2, 
  Monitor, 
  ShoppingBag, 
  DollarSign, 
  User, 
  Menu,
  LogOut,
  Settings,
  HelpCircle
} from './icons';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ConnectivityStatus } from './ConnectivityStatus';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  userData: any;
  showAdminAccess?: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'sites', label: 'Meus Sites', icon: Monitor },
  { id: 'ideas', label: 'Gerar Ideias', icon: Lightbulb },
  { id: 'articles', label: 'Produzir Artigos', icon: FileText },
  { id: 'schedule', label: 'Agendar Posts', icon: Clock },
  { id: 'calendar', label: 'Calendário', icon: Calendar },
  { id: 'history', label: 'Histórico', icon: History },
  { id: 'deleted', label: 'Excluídos', icon: Trash2 },
  { id: 'store', label: 'Planos', icon: ShoppingBag },
  { id: 'maisfy', label: 'Maisfy', icon: DollarSign },
  { id: 'support', label: 'Suporte', icon: HelpCircle },
  { id: 'account', label: 'Minha Conta', icon: User }
];

export function Layout({ children, currentPage, onNavigate, onLogout, userData, showAdminAccess }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo - Maior */}
      <div className="flex items-center justify-center p-8 border-b border-gray-200">
        <ImageWithFallback
          src="https://app.bloginfinitoautomatico.com.br/wp-content/uploads/2025/07/logo-bia-7.png"
          alt="BIA - Blog Infinito Automático"
          className="h-16 w-auto object-contain"
        />
      </div>

      {/* Menu de navegação */}
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start font-montserrat ${
                  isActive 
                    ? 'text-white' 
                    : 'text-gray-700 hover:text-black hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: '#8B5FBF' } : {}}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon 
                  className="mr-3 h-4 w-4" 
                  style={{ 
                    color: isActive ? 'white' : '#8B5FBF' 
                  }} 
                />
                {item.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer com informações do usuário e opções */}
      <div className="p-3 border-t border-gray-200 space-y-3">
        {/* Informações do usuário */}
        <div className="flex items-center space-x-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback className="font-montserrat text-xs">
              {userData?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-montserrat font-medium text-black text-sm truncate">
              {userData?.name || 'Usuário'}
            </p>
            <div className="flex items-center space-x-2">
              <Badge 
                className="text-xs"
                style={{ 
                  backgroundColor: userData?.plano === 'Free' ? '#f3f4f6' : '#8B5FBF',
                  color: userData?.plano === 'Free' ? '#6b7280' : 'white'
                }}
              >
                {userData?.plano || 'Free'}
              </Badge>
            </div>
            <div className="mt-1">
              <ConnectivityStatus />
            </div>
          </div>
        </div>

        <Separator />

        {/* Botões de ação */}
        <div className="space-y-1">
          {showAdminAccess && (
            <Button
              variant="ghost"
              className="w-full justify-start font-montserrat text-gray-700 hover:text-black hover:bg-gray-100"
              onClick={() => handleNavigate('admin')}
            >
              <Settings className="mr-3 h-4 w-4" style={{ color: '#8B5FBF' }} />
              Painel Admin
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="w-full justify-start font-montserrat text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
        <SidebarContent />
      </div>

      {/* Sidebar Mobile */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden fixed top-4 left-4 z-50">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu principal do sistema BIA com acesso a todas as funcionalidades
          </SheetDescription>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between ml-12">
            <ImageWithFallback
              src="https://app.bloginfinitoautomatico.com.br/wp-content/uploads/2025/07/logo-bia-7.png"
              alt="BIA"
              className="h-8 w-auto object-contain"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={userData?.avatar} />
                  <AvatarFallback className="font-montserrat text-xs">
                    {userData?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Badge 
                  className="text-xs"
                  style={{ 
                    backgroundColor: userData?.plano === 'Free' ? '#f3f4f6' : '#8B5FBF',
                    color: userData?.plano === 'Free' ? '#6b7280' : 'white'
                  }}
                >
                  {userData?.plano || 'Free'}
                </Badge>
              </div>
              <ConnectivityStatus />
            </div>
          </div>
        </div>

        {/* Área de conteúdo */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}