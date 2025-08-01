import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Play, Clock, CheckCircle, BookOpen, Video, FileText, Users, MessageCircle, Search, Mail, MessageSquare } from '../icons';
import { Input } from '../ui/input';

interface SuporteProps {
  userData: any;
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  completed?: boolean;
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
}

interface SupportCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  videoCount: number;
  totalDuration: string;
}

const categories: SupportCategory[] = [
  {
    id: 'instalacao',
    name: 'Instalação e Configuração',
    icon: <BookOpen size={20} />,
    videoCount: 2,
    totalDuration: '18:45'
  },
  {
    id: 'configuracao',
    name: 'Configuração OpenAI',
    icon: <Video size={20} />,
    videoCount: 1,
    totalDuration: '7:45'
  },
  {
    id: 'wordpress',
    name: 'WordPress e Modelos',
    icon: <FileText size={20} />,
    videoCount: 1,
    totalDuration: '12:20'
  }
];

const videoTutorials: VideoTutorial[] = [
  {
    id: '1',
    title: 'VISÃO GERAL BIA 2.0',
    description: 'Conheça a versão 2.0 da BIA e todas as suas funcionalidades para geração automática de conteúdo para blogs.',
    duration: '10:15',
    category: 'instalacao',
    thumbnail: 'https://img.youtube.com/vi/lpqeQW-sLaU/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/lpqeQW-sLaU',
    difficulty: 'Básico',
    completed: false
  },
  {
    id: '2',
    title: 'COMO BAIXAR, INSTALAR E ATIVAR A BIA',
    description: 'Passo a passo completo para baixar, instalar e ativar o plugin BIA no seu WordPress.',
    duration: '8:30',
    category: 'instalacao',
    thumbnail: 'https://img.youtube.com/vi/h5pG67Eqqek/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/h5pG67Eqqek',
    difficulty: 'Básico'
  },
  {
    id: '3',
    title: 'COMO CRIAR UMA CHAVE NA OPENAI',
    description: 'Tutorial detalhado para criar e configurar sua chave de API da OpenAI para usar com a BIA.',
    duration: '7:45',
    category: 'configuracao',
    thumbnail: 'https://img.youtube.com/vi/PsePEnxyxOE/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/PsePEnxyxOE',
    difficulty: 'Básico'
  },
  {
    id: '4',
    title: 'COMO INSTALAR O MODELO DE BLOG PRONTO',
    description: 'Aprenda a instalar e configurar os modelos de blog prontos para começar a usar a BIA rapidamente.',
    duration: '12:20',
    category: 'wordpress',
    thumbnail: 'https://img.youtube.com/vi/FjUMg37BuX8/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/FjUMg37BuX8',
    difficulty: 'Intermediário'
  }
];

export function Suporte({ userData }: SuporteProps) {
  const [selectedCategory, setSelectedCategory] = useState('instalacao');
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(videoTutorials[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());

  const filteredVideos = videoTutorials.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const markVideoAsComplete = (videoId: string) => {
    setCompletedVideos(prev => new Set([...prev, videoId]));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return 'bg-green-100 text-green-800';
      case 'Intermediário': return 'bg-yellow-100 text-yellow-800';
      case 'Avançado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalVideos = videoTutorials.length;
  const completedCount = completedVideos.size;
  const progressPercentage = (completedCount / totalVideos) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Central de Suporte</h1>
        <p className="font-montserrat text-gray-600">
          Aprenda a usar a BIA com nossos tutoriais em vídeo e documentação
        </p>
      </div>

      {/* Progresso do usuário */}
      <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-poppins text-lg text-black">Seu Progresso</h3>
              <p className="font-montserrat text-sm text-gray-600">
                {completedCount} de {totalVideos} vídeos assistidos
              </p>
            </div>
            <div className="text-right">
              <span className="font-poppins text-2xl text-purple-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: '#8B5FBF'
              }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu lateral de categorias */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="font-poppins text-lg text-black flex items-center space-x-2">
                <BookOpen size={20} style={{ color: '#8B5FBF' }} />
                <span>Categorias</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tutoriais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-montserrat"
                  />
                </div>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 px-4 pb-4">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    className="w-full justify-start font-montserrat"
                    onClick={() => setSelectedCategory('all')}
                    style={selectedCategory === 'all' ? { backgroundColor: '#8B5FBF' } : {}}
                  >
                    <Video className="mr-2" size={16} />
                    Todos os Vídeos
                    <Badge className="ml-auto" variant="secondary">
                      {totalVideos}
                    </Badge>
                  </Button>
                  
                  <Separator className="my-2" />
                  
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'ghost'}
                      className="w-full justify-start font-montserrat"
                      onClick={() => setSelectedCategory(category.id)}
                      style={selectedCategory === category.id ? { backgroundColor: '#8B5FBF' } : {}}
                    >
                      <span className="mr-2" style={{ color: selectedCategory === category.id ? 'white' : '#8B5FBF' }}>
                        {category.icon}
                      </span>
                      <div className="flex-1 text-left">
                        <div>{category.name}</div>
                        <div className="text-xs opacity-70">
                          {category.videoCount} vídeos • {category.totalDuration}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área principal de conteúdo */}
        <div className="lg:col-span-3 space-y-6">
          {/* Player de vídeo */}
          {selectedVideo && (
            <Card className="border border-gray-200">
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                  <iframe
                    src={selectedVideo.videoUrl}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="font-poppins text-xl text-black mb-2">
                        {selectedVideo.title}
                      </h2>
                      <p className="font-montserrat text-gray-600 mb-4">
                        {selectedVideo.description}
                      </p>
                      <div className="flex items-center space-x-4">
                        <Badge className={getDifficultyColor(selectedVideo.difficulty)}>
                          {selectedVideo.difficulty}
                        </Badge>
                        <div className="flex items-center text-gray-500">
                          <Clock size={16} className="mr-1" />
                          <span className="font-montserrat text-sm">{selectedVideo.duration}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => markVideoAsComplete(selectedVideo.id)}
                      disabled={completedVideos.has(selectedVideo.id)}
                      className={`font-montserrat ${
                        completedVideos.has(selectedVideo.id) 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : ''
                      }`}
                      style={!completedVideos.has(selectedVideo.id) ? { backgroundColor: '#8B5FBF' } : {}}
                    >
                      {completedVideos.has(selectedVideo.id) ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Concluído
                        </>
                      ) : (
                        'Marcar como Assistido'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de vídeos */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="font-poppins text-lg text-black">
                {selectedCategory === 'all' 
                  ? 'Todos os Tutoriais' 
                  : categories.find(c => c.id === selectedCategory)?.name || 'Tutoriais'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`flex items-center space-x-4 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      selectedVideo?.id === video.id 
                        ? 'border-purple-200 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative">
                      <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden">
                        <img
                          src={video.thumbnail.replace('maxresdefault', 'hqdefault')}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-70 rounded-full p-1">
                          <Play size={16} className="text-white ml-1" />
                        </div>
                      </div>
                      {completedVideos.has(video.id) && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle size={16} className="text-green-600 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-montserrat font-medium text-black mb-1">
                        {video.title}
                      </h3>
                      <p className="font-montserrat text-sm text-gray-600 mb-2 line-clamp-2">
                        {video.description}
                      </p>
                      <div className="flex items-center space-x-3">
                        <Badge className={getDifficultyColor(video.difficulty)}>
                          {video.difficulty}
                        </Badge>
                        <div className="flex items-center text-gray-500">
                          <Clock size={14} className="mr-1" />
                          <span className="font-montserrat text-xs">{video.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <div className="text-center py-12">
                  <Video size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="font-poppins text-lg text-gray-600 mb-2">
                    Nenhum tutorial encontrado
                  </h3>
                  <p className="font-montserrat text-gray-500">
                    Tente ajustar os filtros ou termo de busca
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de ajuda adicional */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-lg text-black">
            Precisa de Mais Ajuda?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare size={32} className="mx-auto text-green-600 mb-2" />
              <h4 className="font-montserrat font-medium text-black mb-1">WhatsApp</h4>
              <p className="font-montserrat text-sm text-gray-600 mb-3">
                Atendimento 24 horas
              </p>
              <Button 
                variant="outline" 
                className="font-montserrat"
                onClick={() => {
                  window.open('https://wa.me/5511959276469', '_blank');
                }}
              >
                Falar no WhatsApp
              </Button>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Mail className="mx-auto text-blue-600 mb-2" size={32} />
              <h4 className="font-montserrat font-medium text-black mb-1">Email Suporte</h4>
              <p className="font-montserrat text-sm text-gray-600 mb-3">
                Envie sua dúvida por email
              </p>
              <Button 
                variant="outline" 
                className="font-montserrat"
                onClick={() => {
                  window.open('mailto:suporte@bloginfinitoautomatico.com.br', '_blank');
                }}
              >
                Enviar Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}