import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ChamadoRepository } from '../repositories/chamado.repository';
import { UserRepository } from '../repositories/user.repository';
import { 
  PegarChamadoDto, 
  AdicionarAndamentoDto, 
  AtualizarStatusDto, 
  FinalizarChamadoDto 
} from '../models/chamado.model';
import { ObjectId } from 'mongodb';

@Injectable()
export class ChamadoService {
  constructor(
    private chamadoRepository: ChamadoRepository,
    private userRepository: UserRepository,
  ) {}

  async pegarChamado(pegarChamadoDto: PegarChamadoDto, userId: string) {
    const { linha, operador } = pegarChamadoDto;

    const chamado = await this.chamadoRepository.findByLinha(linha);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado');
    }

    if (chamado.operador && chamado.operador !== operador) {
      throw new ForbiddenException('Chamado já está atribuído a outro operador');
    }

    await this.chamadoRepository.pegarChamado(linha, operador);

    await this.userRepository.logActivity({
      userId: new ObjectId(userId),
      acao: 'pegar_chamado',
      detalhes: { linha, operador },
    });

    return { success: true, message: 'Chamado atribuído com sucesso' };
  }

  async adicionarAndamento(adicionarAndamentoDto: AdicionarAndamentoDto, userId: string, userRole: string) {
    const { linha, andamento, operador } = adicionarAndamentoDto;

    const chamado = await this.chamadoRepository.findByLinha(linha);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado');
    }

    if (userRole !== 'admin' && chamado.operador !== operador) {
      throw new ForbiddenException('Você não tem permissão para editar este chamado');
    }

    await this.chamadoRepository.adicionarAndamento(linha, {
      operador,
      descricao: andamento.trim(),
      tipo: 'comentario',
    });

    await this.userRepository.logActivity({
      userId: new ObjectId(userId),
      acao: 'adicionar_andamento',
      detalhes: { linha, andamento: andamento.trim() },
    });

    return { success: true, message: 'Andamento adicionado com sucesso' };
  }

  async atualizarStatus(atualizarStatusDto: AtualizarStatusDto, userId: string, userRole: string) {
    const { linha, status, operador } = atualizarStatusDto;

    const chamado = await this.chamadoRepository.findByLinha(linha);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado');
    }

    if (userRole !== 'admin' && chamado.operador !== operador) {
      throw new ForbiddenException('Você não tem permissão para editar este chamado');
    }

    await this.chamadoRepository.atualizarStatus(linha, status.trim(), operador);

    await this.userRepository.logActivity({
      userId: new ObjectId(userId),
      acao: 'atualizar_status',
      detalhes: { 
        linha, 
        statusAnterior: chamado.status, 
        statusNovo: status.trim() 
      },
    });

    return { success: true, message: 'Status atualizado com sucesso' };
  }

  async finalizarChamado(finalizarChamadoDto: FinalizarChamadoDto, userId: string, userRole: string) {
    const { linha, resolucao, operador } = finalizarChamadoDto;

    const chamado = await this.chamadoRepository.findByLinha(linha);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado');
    }

    if (userRole !== 'admin' && chamado.operador !== operador) {
      throw new ForbiddenException('Você não tem permissão para editar este chamado');
    }

    await this.chamadoRepository.finalizarChamado(linha, resolucao.trim(), operador);

    await this.userRepository.logActivity({
      userId: new ObjectId(userId),
      acao: 'finalizar_chamado',
      detalhes: { linha, resolucao: resolucao.trim() },
    });

    return { success: true, message: 'Chamado finalizado com sucesso' };
  }

  async transferirChamado(linha: number, operadorOrigem: string, operadorDestino: string, motivo: string, userId: string) {
    const chamado = await this.chamadoRepository.findByLinha(linha);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado');
    }

    await this.chamadoRepository.transferirChamado(linha, operadorOrigem, operadorDestino, motivo);

    await this.userRepository.logActivity({
      userId: new ObjectId(userId),
      acao: 'transferir_chamado',
      detalhes: { linha, operadorOrigem, operadorDestino, motivo },
    });

    return { success: true, message: 'Chamado transferido com sucesso' };
  }

  async buscarHistorico(linha: number) {
    const historico = await this.chamadoRepository.buscarHistorico(linha);
    return { success: true, historico };
  }

  async buscarChamados(filtros: any = {}, skip = 0, limit = 100) {
    const chamados = await this.chamadoRepository.buscarChamados(filtros, skip, limit);
    const total = await this.chamadoRepository.contarChamados(filtros);
    
    return {
      success: true,
      data: chamados,
      total,
      skip,
      limit,
    };
  }
}