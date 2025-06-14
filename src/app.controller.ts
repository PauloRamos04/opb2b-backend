import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleSheetsService } from './services/google-sheets.service';

@Controller()
export class SpreadsheetController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Get()
  getHello(): string {
    return 'OPB2B Backend is running!';
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      cors: 'enabled'
    };
  }

  @Get('spreadsheet/data')
  async getData() {
    try {
      console.log('📖 Requisição para obter dados recebida');
      const data = await this.googleSheetsService.getData();
      
      console.log(`✅ Dados obtidos: ${data.length} linhas`);
      
      return {
        success: true,
        data: data,
        message: 'Dados obtidos com sucesso',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao obter dados:', error);
      
      return {
        success: false,
        data: null,
        message: error.message || 'Erro ao obter dados',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('spreadsheet/update-cell')
  async updateCell(@Body() body: { row: number; col: number; value: string }) {
    try {
      console.log('📝 Requisição de atualização recebida:', body);
      
      if (typeof body.row !== 'number' || typeof body.col !== 'number') {
        throw new HttpException('Row e Col devem ser números', HttpStatus.BAD_REQUEST);
      }
      
      if (body.value === undefined || body.value === null) {
        body.value = '';
      }
      
      const result = await this.googleSheetsService.updateCell(
        body.row,
        body.col,
        String(body.value)
      );
      
      console.log('✅ Célula atualizada com sucesso:', result);
      
      return {
        success: true,
        message: 'Célula atualizada com sucesso',
        data: {
          row: body.row,
          col: body.col,
          value: body.value,
          result: result
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar célula:', error);
      
      return {
        success: false,
        message: error.message || 'Erro ao atualizar célula',
        error: error.stack,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('spreadsheet/status')
  async getStatus() {
    try {
      console.log('🔍 Verificando status do sistema...');
      
      const data = await this.googleSheetsService.getData();
      
      return {
        success: true,
        message: 'Sistema funcionando normalmente',
        details: {
          googleSheetsConnected: true,
          dataRows: data.length,
          lastCheck: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erro no status:', error);
      
      return {
        success: false,
        message: 'Erro no sistema',
        details: {
          googleSheetsConnected: false,
          error: error.message,
          lastCheck: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}