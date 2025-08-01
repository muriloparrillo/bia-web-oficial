import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Trash2, XCircle, RotateCcw, Clock, CheckCircle, AlertCircle } from '../icons';
import { useBia } from '../BiaContext';
import { toast } from 'sonner';

interface ExcluidosProps {
  userData: any;
}

export function Excluidos({ userData }: ExcluidosProps) {
  const { state, actions } = useBia();
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  // Filtrar ideias excluídas
  const ideiasExcluidas = state.ideas.filter(idea => idea.status === 'excluido');

  const handleRestore = (ideaId: number) => {
    try {
      actions.updateIdea(ideaId, { 
        status: 'pendente', // Voltar para status padrão
        deletedDate: undefined
      });
      
      toast.success('Ideia restaurada com sucesso!');
    } catch (error) {
      console.error('Erro ao restaurar ideia:', error);
      toast.error('Erro ao restaurar ideia');
    }
  };

  const handlePermanentDelete = (ideaId: number) => {
    try {
      // Excluir permanentemente do estado
      actions.deleteIdea(ideaId);
      
      toast.success('Ideia excluída permanentemente!');
    } catch (error) {
      console.error('Erro ao excluir permanentemente ideia:', error);
      toast.error('Erro ao excluir permanentemente ideia');
    }
  };

  const getSortedIdeias = () => {
    const sorted = [...ideiasExcluidas];
    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const dateA = a.deletedDate ? new Date(a.deletedDate).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.deletedDate ? new Date(b.deletedDate).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } else {
      sorted.sort((a, b) => a.titulo.localeCompare(b.titulo));
    }
    return sorted;
  };

  const sortedIdeias = getSortedIdeias();

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="font-poppins text-3xl text-black mb-2">Excluídos</h1>
          <p className="font-montserrat text-gray-600">Gerencie ideias excluídas e restaure quando necessário</p>
        </div>
        <div className="flex space-x-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40 font-montserrat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data de Exclusão</SelectItem>
              <SelectItem value="title">Título</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-black flex items-center space-x-2">
            <Trash2 size={20} style={{ color: '#8B5FBF' }} />
            <span>Ideias Excluídas ({sortedIdeias.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedIdeias.length > 0 ? (
            <div className="space-y-4">
              {sortedIdeias.map((idea) => (
                <div key={idea.id} className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors gap-4">
                  <div className="flex-1">
                    <h3 className="font-montserrat font-medium text-black mb-2">{idea.titulo}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Excluída em:</span><br />
                        {idea.deletedDate 
                          ? new Date(idea.deletedDate).toLocaleDateString('pt-BR')
                          : 'Data não disponível'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Categoria:</span><br />
                        {idea.categoria || 'Não informado'}
                      </div>
                      <div>
                        <span className="font-medium">Site:</span><br />
                        {idea.siteId 
                          ? state.sites.find(s => s.id === idea.siteId)?.nome || 'Site não encontrado'
                          : 'Não vinculado'
                        }
                      </div>
                      <div>
                        <span className="font-medium">Criada em:</span><br />
                        {new Date(idea.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    {idea.tags && idea.tags.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-sm text-gray-600">Tags: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {idea.tags.map((tag, index) => (
                            <Badge key={index} className="bg-gray-100 text-gray-700 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 lg:ml-4">
                    <Badge className="font-montserrat text-white bg-red-600 lg:text-center">
                      <XCircle className="mr-1" size={12} />
                      Excluída
                    </Badge>
                    <Button 
                      onClick={() => handleRestore(idea.id)}
                      variant="outline" 
                      size="sm" 
                      className="font-montserrat hover:bg-green-50 hover:border-green-300 flex-1 lg:flex-none"
                    >
                      <RotateCcw className="mr-1" size={14} />
                      Restaurar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir permanentemente esta ideia? Esta ação não pode ser desfeita.')) {
                          handlePermanentDelete(idea.id);
                        }
                      }}
                      variant="destructive" 
                      size="sm" 
                      className="font-montserrat flex-1 lg:flex-none"
                    >
                      <Trash2 className="mr-1" size={14} />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trash2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="font-poppins text-lg text-gray-600 mb-2">Nenhuma ideia excluída</h3>
              <p className="font-montserrat text-gray-500">
                As ideias excluídas aparecerão aqui e poderão ser restauradas.
              </p>
              <p className="font-montserrat text-sm text-gray-400 mt-2">
                Para excluir ideias, vá para "Produzir Artigos", selecione as ideias e clique em "Excluir".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas dos excluídos */}
      {sortedIdeias.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <Trash2 size={24} className="mx-auto text-red-600 mb-2" />
              <p className="font-poppins text-2xl text-red-800">{sortedIdeias.length}</p>
              <p className="font-montserrat text-sm text-red-600">Total Excluídas</p>
            </CardContent>
          </Card>
          <Card className="border border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <Clock size={24} className="mx-auto text-yellow-600 mb-2" />
              <p className="font-poppins text-2xl text-yellow-800">
                {sortedIdeias.filter(i => !i.articleId).length}
              </p>
              <p className="font-montserrat text-sm text-yellow-600">Não Produzidas</p>
            </CardContent>
          </Card>
          <Card className="border border-purple-200 bg-purple-50">
            <CardContent className="p-4 text-center">
              <CheckCircle size={24} className="mx-auto text-purple-600 mb-2" />
              <p className="font-poppins text-2xl text-purple-800">
                {sortedIdeias.filter(i => i.status === 'produzido' || i.articleId).length}
              </p>
              <p className="font-montserrat text-sm text-purple-600">Já Produzidas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Avisos importantes */}
      <Card className="border border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-montserrat font-medium text-orange-800 mb-2">⚠️ Atenção - Ideias Produzidas</h4>
              <p className="font-montserrat text-sm text-orange-700 mb-2">
                Se você restaurar uma ideia que já foi produzida em artigo, o artigo correspondente continuará existindo normalmente na aba "Produzir Artigos".
              </p>
              <p className="font-montserrat text-sm text-orange-700">
                <strong>Ao restaurar uma ideia produzida:</strong> Você terá tanto a ideia quanto o artigo gerado, permitindo produzir novos artigos da mesma ideia se desejar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dica para usuários */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Trash2 size={16} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-montserrat font-medium text-blue-800 mb-1">Como funciona a exclusão de ideias?</h4>
              <ul className="font-montserrat text-sm text-blue-700 space-y-1">
                <li>• Ideias excluídas ficam aqui por segurança</li>
                <li>• Você pode restaurá-las a qualquer momento</li>
                <li>• Ou excluí-las permanentemente se não precisar mais</li>
                <li>• Para excluir ideias, vá em "Produzir Artigos", selecione as ideias e clique em "Excluir"</li>
                <li>• <strong>Restaurar ideia já produzida:</strong> Mantém o artigo existente e permite gerar novos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}