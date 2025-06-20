import { Module } from '@nestjs/common';
import { ChamadoController } from '../controllers/chamado.controller';
import { ChamadoService } from '../services/chamado.service';
import { ChamadoRepository } from '../repositories/chamado.repository';
import { AuthModule } from './auth.module';
import { RolesGuard } from '../guards/roles.guard';

@Module({
  imports: [AuthModule],
  controllers: [ChamadoController],
  providers: [ChamadoService, ChamadoRepository, RolesGuard],
  exports: [ChamadoService, ChamadoRepository],
})
export class ChamadoModule {}