import { 
  Controller, 
  Post, 
  Put, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request,
  ParseIntPipe 
} from '@nestjs/common';
import { ChamadoService } from '../services/chamado.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { 
  PegarChamadoDto, 
  AdicionarAndamentoDto, 
  AtualizarStatusDto, 
  FinalizarChamadoDto 
} from '../models/chamado.model';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    operador: string;
    role: string;
  };
}

@Controller('chamados')
@UseGuards(AuthGuard, RolesGuard)
export class ChamadoController {
  constructor(private chamadoService: ChamadoService) {}

  @Post('pegar')
  @Roles('admin', 'operador')
  async pegarChamado(
    @Body() pegarChamadoDto: PegarChamadoDto, 
    @Request() req: RequestWithUser
  ) {
    return await this.chamadoService.pegarChamado(pegarChamadoDto, req.user.userId);
  }

  @Post('andamento')
  @Roles('admin', 'operador')
  async adicionarAndamento(
    @Body() adicionarAndamentoDto: AdicionarAndamentoDto, 
    @Request() req: RequestWithUser
  ) {
    return await this.chamadoService.adicionarAndamento(
      adicionarAndamentoDto, 
      req.user.userId, 
      req.user.role
    );
  }

  @Put('status')
  @Roles('admin', 'operador')
  async atualizarStatus(
    @Body() atualizarStatusDto: AtualizarStatusDto, 
    @Request() req: RequestWithUser
  ) {
    return await this.chamadoService.atualizarStatus(
      atualizarStatusDto, 
      req.user.userId, 
      req.user.role
    );
  }

  @Post('finalizar')
  @Roles('admin', 'operador')
  async finalizarChamado(
    @Body() finalizarChamadoDto: FinalizarChamadoDto, 
    @Request() req: RequestWithUser
  ) {
    return await this.chamadoService.finalizarChamado(
      finalizarChamadoDto, 
      req.user.userId, 
      req.user.role
    );
  }

  @Post('transferir')
  @Roles('admin', 'operador')
  async transferirChamado(
    @Body() body: { 
      linha: number; 
      operadorDestino: string; 
      motivo: string; 
    },
    @Request() req: RequestWithUser
  ) {
    const { linha, operadorDestino, motivo } = body;
    return await this.chamadoService.transferirChamado(
      linha,
      req.user.operador,
      operadorDestino,
      motivo,
      req.user.userId
    );
  }

  @Get('historico/:linha')
  @Roles('admin', 'operador', 'viewer')
  async buscarHistorico(@Param('linha', ParseIntPipe) linha: number) {
    return await this.chamadoService.buscarHistorico(linha);
  }

  @Get()
  @Roles('admin', 'operador', 'viewer')
  async buscarChamados(
    @Query() filtros: any,
    @Query('skip', ParseIntPipe) skip = 0,
    @Query('limit', ParseIntPipe) limit = 100
  ) {
    return await this.chamadoService.buscarChamados(filtros, skip, limit);
  }

  @Get('status')
  async getStatus() {
    return {
      success: true,
      message: 'Serviço de chamados funcionando',
      timestamp: new Date().toISOString(),
    };
  }
}