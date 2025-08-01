import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Plus, Eye, Edit, TrendingUp, Users, RefreshCw } from '../../icons';
import { adminService, type AdminUser } from '../../../services/adminService';
import { toast } from 'sonner';

interface UserManagementProps {
  users: AdminUser[];
  onRefresh: () => void;
}

export function UserManagement({ users, onRefresh }: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleEditUser = (userId: number) => {
    // TODO: Implementar modal de edição
    toast.info('Modal de edição em desenvolvimento');
  };

  const handleViewDetails = (userId: number) => {
    // TODO: Implementar visualização de detalhes
    toast.info('Visualização de detalhes em desenvolvimento');
  };

  const handleChangePlan = (userId: number) => {
    // TODO: Implementar alteração de plano
    toast.info('Alteração de plano em desenvolvimento');
  };

  // Calcular estatísticas de planos
  const planStats = users.reduce((acc: any, user) => {
    const plan = user.plan || 'Free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-poppins text-xl text-black">Gerenciamento de Usuários</h2>
          <p className="font-montserrat text-sm text-gray-600">
            {users.length === 0 ? 'Nenhum usuário cadastrado ainda' : `${users.length} usuário(s) cadastrado(s) na plataforma`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={onRefresh}
            className="font-montserrat"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button 
            className="font-montserrat text-white"
            style={{ backgroundColor: '#8B5FBF' }}
            onClick={() => toast.info('Funcionalidade de adicionar usuário será implementada em breve')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {users.length === 0 ? (
        // Estado vazio - nenhum usuário cadastrado
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="font-poppins text-lg text-gray-600 mb-2">Nenhum usuário cadastrado</h3>
            <p className="font-montserrat text-gray-500 mb-4">
              Quando usuários se cadastrarem na plataforma, eles aparecerão aqui.
            </p>
            <p className="font-montserrat text-xs text-gray-400">
              💡 Os usuários são automaticamente registrados quando fazem login no sistema
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-montserrat">Buscar Usuários</Label>
                  <Input
                    placeholder="Nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="font-montserrat"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-montserrat">Filtrar por Plano</Label>
                  <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="font-montserrat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os planos</SelectItem>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Básico">Básico (R$ 149,90)</SelectItem>
                      <SelectItem value="Intermediário">Intermediário (R$ 249,90)</SelectItem>
                      <SelectItem value="Avançado">Avançado (R$ 599,90)</SelectItem>
                      <SelectItem value="BIA">BIA (R$ 999,90)</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-montserrat">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="font-montserrat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de usuários */}
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-poppins text-lg text-black">{user.name}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={`${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </Badge>
                          <Badge className={`${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800">
                            {user.plan}
                          </Badge>
                        </div>
                      </div>
                      <p className="font-montserrat text-sm text-gray-600 mb-2">{user.email}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-500">
                        <span className="font-montserrat">ID: #{user.id}</span>
                        <span className="font-montserrat">Último login: {new Date(user.lastLogin).toLocaleDateString('pt-BR')}</span>
                        <span className="font-montserrat">
                          Cadastrado: {user.role === 'admin' ? 'Sistema' : 'Plataforma'}
                        </span>
                        <span className="font-montserrat">
                          Tipo: {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="font-montserrat"
                        onClick={() => handleViewDetails(user.id)}
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        Detalhes
                      </Button>
                      {user.role !== 'admin' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-montserrat"
                            onClick={() => handleEditUser(user.id)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="font-montserrat"
                            onClick={() => handleChangePlan(user.id)}
                          >
                            <TrendingUp className="mr-1 h-4 w-4" />
                            Plano
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card className="border border-gray-200">
              <CardContent className="p-8 text-center">
                <p className="font-montserrat text-gray-600">Nenhum usuário encontrado com os filtros aplicados.</p>
                <Button 
                  variant="outline" 
                  className="mt-4 font-montserrat"
                  onClick={() => {
                    setSearchTerm('');
                    setPlanFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          <Card className="border border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="font-poppins text-lg text-blue-800">Resumo de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="font-poppins text-2xl text-blue-800">{users.length}</p>
                  <p className="font-montserrat text-sm text-blue-600">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-poppins text-2xl text-green-800">
                    {users.filter(u => u.isActive).length}
                  </p>
                  <p className="font-montserrat text-sm text-green-600">Ativos</p>
                </div>
                <div className="text-center">
                  <p className="font-poppins text-2xl text-purple-800">
                    {users.filter(u => u.plan !== 'Free' && u.plan !== 'Admin').length}
                  </p>
                  <p className="font-montserrat text-sm text-purple-600">Pagos</p>
                </div>
                <div className="text-center">
                  <p className="font-poppins text-2xl text-orange-800">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="font-montserrat text-sm text-orange-600">Admins</p>
                </div>
              </div>

              {/* Distribuição por planos */}
              <div className="border-t border-blue-200 pt-4">
                <h4 className="font-poppins font-medium text-blue-800 mb-3">Distribuição por Planos</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Object.entries(planStats).map(([plan, count]) => (
                    <div key={plan} className="text-center p-2 bg-white rounded-lg border border-blue-100">
                      <p className="font-montserrat text-sm font-medium text-gray-800">{plan}</p>
                      <p className="font-poppins text-lg text-blue-700">{count as number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}