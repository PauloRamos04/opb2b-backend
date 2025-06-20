import { ObjectId } from 'mongodb';

export interface IChamado {
  _id?: ObjectId;
  linha: number;
  historico: string;
  dataAbertura: Date;
  operador?: string;
  servico: string;
  status: string;
  retorno?: Date;
  assunto: string;
  carteira: string;
  cidade: string;
  tecnico?: string;
  descricao: string;
  cliente: string;
  uf: string;
  regional: string;
  contrato?: string;
  resolucao?: string;
  dataFinalizacao?: Date;
  ultimaEdicao: Date;
  editadoPor?: string;
  andamentos: IAndamento[];
  tags?: string[];
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  vencimento?: Date;
  tempo?: {
    abertura: Date;
    primeiroAtendimento?: Date;
    ultimaInteracao?: Date;
    finalizacao?: Date;
    tempoTotal?: number;
  };
}

export interface IAndamento {
  _id?: ObjectId;
  timestamp: Date;
  operador: string;
  descricao: string;
  tipo: 'comentario' | 'status' | 'transferencia' | 'finalizacao';
  statusAnterior?: string;
  statusNovo?: string;
  operadorAnterior?: string;
  operadorNovo?: string;
  anexos?: string[];
}

export interface IChamadoHistorico {
  _id?: ObjectId;
  chamadoId: ObjectId;
  linha: number;
  alteracao: {
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  };
  operador: string;
  timestamp: Date;
  motivo?: string;
}

export class PegarChamadoDto {
  linha: number;
  operador: string;
}

export class AdicionarAndamentoDto {
  linha: number;
  andamento: string;
  operador: string;
}

export class AtualizarStatusDto {
  linha: number;
  status: string;
  operador: string;
}

export class FinalizarChamadoDto {
  linha: number;
  resolucao: string;
  operador: string;
}