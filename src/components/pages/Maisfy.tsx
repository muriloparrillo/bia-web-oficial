import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Users } from '../icons';
import { MAISFY_BENEFITS } from '../../utils/constants';
import { toast } from 'sonner';

interface MaisfyProps {
  userData: any;
}

export function Maisfy({ userData }: MaisfyProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-poppins text-3xl text-black mb-2">Programa de Afiliados Maisfy</h1>
        <p className="font-montserrat text-gray-600">Torne-se um afiliado e ganhe comissões promovendo produtos digitais</p>
      </div>

      {/* Hero Section */}
      <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🤝</div>
          <h2 className="font-poppins text-3xl text-purple-800 mb-4">
            Ganhe Dinheiro Indicando a BIA!
          </h2>
          <p className="font-montserrat text-lg text-purple-700 mb-6">
            Junte-se ao programa de afiliados mais lucrativo do mercado digital brasileiro
          </p>
          <Button 
            size="lg"
            className="font-montserrat text-white text-lg px-8 py-4"
            style={{ backgroundColor: '#8B5FBF' }}
            onClick={() => {
              window.open('https://maisfy.com.br/convite/produto/Ld2f8531', '_blank');
              toast.success('Redirecionando para cadastro...');
            }}
          >
            <Users className="mr-2" size={20} />
            Quero Ser Afiliado Agora
          </Button>
        </CardContent>
      </Card>

      {/* Benefícios */}
      <Card className="border border-gray-200">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-black text-center">
            Por que escolher a Maisfy?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MAISFY_BENEFITS.map((benefit, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="text-3xl mb-3">{benefit.icon}</div>
                <h4 className="font-montserrat font-medium text-black mb-2">{benefit.title}</h4>
                <p className="font-montserrat text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Produtos para promover */}
      <Card className="border border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="font-poppins text-xl text-blue-800">
            Produtos em Destaque para Promover
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h4 className="font-poppins font-medium text-black mb-2">BIA - Blog Infinito Automático</h4>
              <p className="font-montserrat text-sm text-gray-600 mb-3">
                Plugin WordPress para automação de conteúdo com IA
              </p>
              <div className="flex justify-between items-center">
                <Badge className="bg-green-100 text-green-800">Até 50% comissão</Badge>
                <span className="font-montserrat text-sm text-blue-600">R$ 197 - R$ 997</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA final */}
      <Card className="border border-purple-200 bg-purple-50">
        <CardContent className="p-6 text-center">
          <h3 className="font-poppins text-xl text-purple-800 mb-4">
            Pronto para começar a ganhar?
          </h3>
          <p className="font-montserrat text-purple-700 mb-4">
            Cadastre-se agora e comece a promover nossos produtos de alta conversão
          </p>
          <Button 
            className="font-montserrat text-white"
            style={{ backgroundColor: '#8B5FBF' }}
            onClick={() => {
              window.open('https://maisfy.com.br/?partner=W49buhu4', '_blank');
              toast.success('Redirecionando para Maisfy...');
            }}
          >
            <Users className="mr-2" size={16} />
            Cadastrar na Maisfy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}