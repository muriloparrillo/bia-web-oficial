import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

interface User {
  id?: string;
  email: string;
  name: string;
  cpf: string;
  whatsapp?: string;
  dataNascimento?: string;
  plano: string;
  created_at?: string;
  updated_at?: string;
}

class UserService {
  private supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  );

  // Registrar novo usuário
  async registerUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('Registrando usuário:', userData.email);

      // Verificar se email já existe usando KV
      const existingUser = await kv.get(`user:email:${userData.email}`);
      if (existingUser) {
        console.log(`Email ${userData.email} já existe no sistema`);
        return {
          success: false,
          error: 'E-mail já cadastrado no sistema'
        };
      }

      // Verificar se CPF já existe (se fornecido)
      if (userData.cpf && userData.cpf.trim()) {
        const existingCpf = await kv.get(`user:cpf:${userData.cpf}`);
        if (existingCpf) {
          console.log(`CPF ${userData.cpf} já existe no sistema`);
          return {
            success: false,
            error: 'CPF já cadastrado no sistema'
          };
        }
      }

      // Gerar ID único
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const user: User = {
        id: userId,
        email: userData.email,
        name: userData.name,
        cpf: userData.cpf || '',
        whatsapp: userData.whatsapp || '',
        dataNascimento: userData.dataNascimento || '',
        plano: userData.plano,
        created_at: now,
        updated_at: now
      };

      // Salvar usuário no KV store
      await kv.set(`user:${userId}`, user);
      await kv.set(`user:email:${userData.email}`, userId);
      
      if (userData.cpf && userData.cpf.trim()) {
        await kv.set(`user:cpf:${userData.cpf}`, userId);
      }

      // Adicionar à lista de usuários
      const usersList = await kv.get('users:list') || [];
      if (!usersList.includes(userId)) {
        await kv.set('users:list', [...usersList, userId]);
      }

      console.log('Usuário cadastrado com sucesso:', userId);
      return { success: true, user };

    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      return {
        success: false,
        error: error.message || 'Erro interno do servidor'
      };
    }
  }

  // Fazer login
  async loginUser(email: string) {
    try {
      console.log('Login de usuário:', email);

      // Buscar ID do usuário pelo email
      const userId = await kv.get(`user:email:${email}`);
      if (!userId) {
        console.log(`Usuário ${email} não encontrado no banco`);
        return { 
          success: false, 
          error: 'Usuário não encontrado no banco de dados' 
        };
      }

      // Buscar dados completos do usuário
      const user = await kv.get(`user:${userId}`);
      if (!user) {
        console.log(`Dados do usuário ${userId} não encontrados`);
        return { 
          success: false, 
          error: 'Dados do usuário não encontrados' 
        };
      }

      // Atualizar último acesso
      const updatedUser = {
        ...user,
        updated_at: new Date().toISOString(),
        last_access: new Date().toISOString()
      };

      await kv.set(`user:${userId}`, updatedUser);

      console.log(`Login realizado com sucesso para: ${email}`);
      return { success: true, user: updatedUser };

    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      };
    }
  }

  // Fazer login por CPF
  async loginUserByCpf(cpf: string) {
    try {
      console.log('Login de usuário por CPF:', cpf ? cpf.substring(0, 3) + '...' : 'CPF vazio');

      if (!cpf || cpf.trim() === '') {
        return { 
          success: false, 
          error: 'CPF não fornecido' 
        };
      }

      // Buscar ID do usuário pelo CPF
      const userId = await kv.get(`user:cpf:${cpf}`);
      if (!userId) {
        console.log(`Usuário com CPF não encontrado no banco`);
        return { 
          success: false, 
          error: 'Usuário não encontrado no banco de dados' 
        };
      }

      // Buscar dados completos do usuário
      const user = await kv.get(`user:${userId}`);
      if (!user) {
        console.log(`Dados do usuário ${userId} não encontrados`);
        return { 
          success: false, 
          error: 'Dados do usuário não encontrados' 
        };
      }

      // Atualizar último acesso
      const updatedUser = {
        ...user,
        updated_at: new Date().toISOString(),
        last_access: new Date().toISOString()
      };

      await kv.set(`user:${userId}`, updatedUser);

      console.log(`Login por CPF realizado com sucesso`);
      return { success: true, user: updatedUser };

    } catch (error) {
      console.error('Erro no login por CPF:', error);
      return { 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      };
    }
  }

  // Atualizar usuário
  async updateUser(userId: string, updates: Partial<User>) {
    try {
      console.log('Atualizando usuário:', userId);

      // Buscar usuário atual
      const currentUser = await kv.get(`user:${userId}`);
      if (!currentUser) {
        throw new Error('Usuário não encontrado');
      }

      // Aplicar atualizações
      const updatedUser = {
        ...currentUser,
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Salvar usuário atualizado
      await kv.set(`user:${userId}`, updatedUser);

      return { success: true, user: updatedUser };

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Listar todos os usuários
  async getAllUsers() {
    try {
      console.log('Buscando todos os usuários...');

      const usersList = await kv.get('users:list') || [];
      const users = [];

      for (const userId of usersList) {
        const user = await kv.get(`user:${userId}`);
        if (user) {
          users.push(user);
        }
      }

      // Ordenar por data de criação (mais recentes primeiro)
      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { success: true, users };

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  // Verificar se usuário existe
  async userExists(email: string) {
    try {
      const userId = await kv.get(`user:email:${email}`);
      return { exists: !!userId, userId };
    } catch (error) {
      return { exists: false, userId: null };
    }
  }

  // Obter estatísticas do sistema
  async getSystemStats() {
    try {
      const usersList = await kv.get('users:list') || [];
      const totalUsers = usersList.length;

      // Calcular estatísticas básicas
      const stats = {
        totalUsers,
        newUsersToday: 0,
        activeUsers: 0,
        totalRevenue: 0
      };

      // Calcular usuários de hoje e receita
      for (const userId of usersList) {
        const user = await kv.get(`user:${userId}`);
        if (user) {
          const userDate = new Date(user.created_at);
          const today = new Date();
          
          if (userDate.toDateString() === today.toDateString()) {
            stats.newUsersToday++;
          }

          // Calcular receita baseada no plano
          const planRevenue = this.getPlanRevenue(user.plano);
          stats.totalRevenue += planRevenue;
        }
      }

      stats.activeUsers = totalUsers; // Por enquanto, consideramos todos ativos

      return { success: true, stats };

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  private getPlanRevenue(planName: string): number {
    const planValues = {
      'Free': 0,
      'Básico': 149.90,
      'Intermediário': 249.90,
      'Avançado': 599.90,
      'BIA': 999.90
    };
    return planValues[planName as keyof typeof planValues] || 0;
  }
}

export const userService = new UserService();