import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { GoogleSheetsService } from '../services/google-sheets.service';
import { AuthGuard } from '../guards/auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UpdateCellDto } from '../dto/update-cell.dto';

@Controller('spreadsheet')
@UseGuards(AuthGuard, RolesGuard)
export class SpreadsheetController {
  constructor(private googleSheetsService: GoogleSheetsService) {}

  @Get('data')
  @Roles('admin', 'operador', 'viewer')
  async getData() {
    try {
      const data = await this.googleSheetsService.getData();
      return {
        success: true,
        data,
        message: `${data.length} linhas carregadas`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao carregar dados da planilha',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('update-cell')
  @Roles('admin', 'operador')
  async updateCell(@Body() updateCellDto: UpdateCellDto) {
    try {
      const { row, col, value } = updateCellDto;
      await this.googleSheetsService.updateCell(row, col, value);
      
      return {
        success: true,
        message: 'Célula atualizada com sucesso',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Erro ao atualizar célula',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async getStatus() {
    return {
      success: true,
      message: 'Serviço de planilha funcionando',
      timestamp: new Date().toISOString(),
    };
  }
}