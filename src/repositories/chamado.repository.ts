import { Injectable } from '@nestjs/common';
import { ObjectId, Collection } from 'mongodb';
import { MongoDBConnection } from '../database/mongodb';
import { IChamado, IAndamento, IChamadoHistorico } from '../models/chamado.model';

@Injectable()
export class ChamadoRepository {
  private getChamadosCollection(): Collection<IChamado> {
    return MongoDBConnection.getDatabase().collection<IChamado>('chamados');
  }

  private getHistoricoCollection(): Collection<IChamadoHistorico> {
    return MongoDBConnection.getDatabase().collection<IChamadoHistorico>('chamados_historico');
  }

  async findByLinha(linha: number): Promise<IChamado | null> {
    const collection = this.getChamadosCollection();
    return await collection.findOne({ linha });
  }

  async updateChamado(linha: number, updateData: Partial<IChamado>, operador: string): Promise<void> {
    const collection = this.getChamadosCollection();
    
    const chamadoAnterior = await this.findByLinha(linha);
    if (!chamadoAnterior) throw new Error('Chamado não encontrado');

    const updatedData = {
      ...updateData,
      ultimaEdicao: new Date(),
      editadoPor: operador,
    };

    await collection.updateOne(
      { linha },
      { $set: updatedData }
    );

    for (const campo of Object.keys(updateData)) {
      if (chamadoAnterior[campo as keyof IChamado] !== updateData[campo as keyof IChamado]) {
        await this.logHistorico(
          chamadoAnterior._id!,
          linha,
          campo,
          chamadoAnterior[campo as keyof IChamado],
          updateData[campo as keyof IChamado],
          operador
        );
      }
    }
  }

  async adicionarAndamento(linha: number, andamento: Omit<IAndamento, '_id' | 'timestamp'>): Promise<void> {
    const collection = this.getChamadosCollection();
    
    const novoAndamento: IAndamento = {
      ...andamento,
      _id: new ObjectId(),
      timestamp: new Date(),
    };

    await collection.updateOne(
      { linha },
      { 
        $push: { andamentos: novoAndamento },
        $set: { 
          ultimaEdicao: new Date(),
          'tempo.ultimaInteracao': new Date()
        }
      }
    );
  }

  async pegarChamado(linha: number, operador: string): Promise<void> {
    const collection = this.getChamadosCollection();
    
    const chamado = await this.findByLinha(linha);
    if (!chamado) throw new Error('Chamado não encontrado');

    const updates: Partial<IChamado> = {
      operador,
      ultimaEdicao: new Date(),
      editadoPor: operador,
    };

    // Corrigir o tipo do tempo
    if (!chamado.tempo?.primeiroAtendimento) {
      updates.tempo = {
        abertura: chamado.tempo?.abertura || new Date(),
        primeiroAtendimento: new Date(),
        ultimaInteracao: chamado.tempo?.ultimaInteracao,
        finalizacao: chamado.tempo?.finalizacao,
        tempoTotal: chamado.tempo?.tempoTotal,
      };
    }

    await collection.updateOne({ linha }, { $set: updates });

    await this.adicionarAndamento(linha, {
      operador,
      descricao: `Chamado atribuído para ${operador}`,
      tipo: 'transferencia',
      operadorNovo: operador,
    });
  }

  async atualizarStatus(linha: number, novoStatus: string, operador: string): Promise<void> {
    const chamado = await this.findByLinha(linha);
    if (!chamado) throw new Error('Chamado não encontrado');

    const statusAnterior = chamado.status;

    await this.updateChamado(linha, { status: novoStatus }, operador);

    await this.adicionarAndamento(linha, {
      operador,
      descricao: `Status alterado de "${statusAnterior}" para "${novoStatus}"`,
      tipo: 'status',
      statusAnterior,
      statusNovo: novoStatus,
    });
  }

  async finalizarChamado(linha: number, resolucao: string, operador: string): Promise<void> {
    const dataFinalizacao = new Date();
    
    const chamado = await this.findByLinha(linha);
    if (!chamado) throw new Error('Chamado não encontrado');

    const tempoTotal = chamado.tempo?.abertura 
      ? Math.floor((dataFinalizacao.getTime() - chamado.tempo.abertura.getTime()) / (1000 * 60))
      : 0;

    const tempoAtualizado = {
      abertura: chamado.tempo?.abertura || new Date(),
      primeiroAtendimento: chamado.tempo?.primeiroAtendimento,
      ultimaInteracao: chamado.tempo?.ultimaInteracao,
      finalizacao: dataFinalizacao,
      tempoTotal,
    };

    await this.updateChamado(linha, {
      status: 'FINALIZADO',
      resolucao,
      dataFinalizacao,
      tempo: tempoAtualizado,
    }, operador);

    await this.adicionarAndamento(linha, {
      operador,
      descricao: `Chamado finalizado: ${resolucao}`,
      tipo: 'finalizacao',
    });
  }

  async transferirChamado(linha: number, operadorOrigem: string, operadorDestino: string, motivo: string): Promise<void> {
    await this.updateChamado(linha, { operador: operadorDestino }, operadorOrigem);

    await this.adicionarAndamento(linha, {
      operador: operadorOrigem,
      descricao: `Chamado transferido para ${operadorDestino}. Motivo: ${motivo}`,
      tipo: 'transferencia',
      operadorAnterior: operadorOrigem,
      operadorNovo: operadorDestino,
    });
  }

  async buscarChamados(filtros: any = {}, skip = 0, limit = 100): Promise<IChamado[]> {
    const collection = this.getChamadosCollection();
    
    const query: any = {};

    if (filtros.operador) query.operador = filtros.operador;
    if (filtros.status) query.status = { $in: Array.isArray(filtros.status) ? filtros.status : [filtros.status] };
    if (filtros.carteira) query.carteira = { $in: Array.isArray(filtros.carteira) ? filtros.carteira : [filtros.carteira] };
    if (filtros.dataInicio || filtros.dataFim) {
      query.dataAbertura = {};
      if (filtros.dataInicio) query.dataAbertura.$gte = new Date(filtros.dataInicio);
      if (filtros.dataFim) query.dataAbertura.$lte = new Date(filtros.dataFim);
    }
    if (filtros.buscaGeral) {
      query.$or = [
        { cliente: { $regex: filtros.buscaGeral, $options: 'i' } },
        { descricao: { $regex: filtros.buscaGeral, $options: 'i' } },
        { assunto: { $regex: filtros.buscaGeral, $options: 'i' } },
      ];
    }

    return await collection
      .find(query)
      .sort({ dataAbertura: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async contarChamados(filtros: any = {}): Promise<number> {
    const collection = this.getChamadosCollection();
    
    const query: any = {};
    if (filtros.operador) query.operador = filtros.operador;
    if (filtros.status) query.status = { $in: Array.isArray(filtros.status) ? filtros.status : [filtros.status] };

    return await collection.countDocuments(query);
  }

  private async logHistorico(
    chamadoId: ObjectId,
    linha: number,
    campo: string,
    valorAnterior: any,
    valorNovo: any,
    operador: string,
    motivo?: string
  ): Promise<void> {
    const collection = this.getHistoricoCollection();
    
    const historico: Omit<IChamadoHistorico, '_id'> = {
      chamadoId,
      linha,
      alteracao: {
        campo,
        valorAnterior,
        valorNovo,
      },
      operador,
      timestamp: new Date(),
      motivo,
    };

    await collection.insertOne(historico);
  }

  async buscarHistorico(linha: number): Promise<IChamadoHistorico[]> {
    const collection = this.getHistoricoCollection();
    return await collection
      .find({ linha })
      .sort({ timestamp: -1 })
      .toArray();
  }
}