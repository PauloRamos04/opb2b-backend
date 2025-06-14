import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleSheetsService } from './services/google-sheets.service';

@Controller('spreadsheet')
export class SpreadsheetController {
  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @Get('data')
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

  @Post('update-cell')
  async updateCell(@Body() body: { row: number; col: number; value: string }) {
    try {
      console.log('📝 Requisição de atualização recebida:', body);
      
      // Validar dados de entrada
      if (typeof body.row !== 'number' || typeof body.col !== 'number') {
        throw new HttpException('Row e Col devem ser números', HttpStatus.BAD_REQUEST);
      }
      
      if (body.value === undefined || body.value === null) {
        body.value = '';
      }
      
      // Tentar atualizar a célula
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

  @Get('status')
  async getStatus() {
    try {
      console.log('🔍 Verificando status do sistema...');
      
      // Testar conexão básica
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

  // Endpoint para debug - remove depois
  @Post('debug-update')
  async debugUpdate(@Body() body: any) {
    try {
      console.log('🐛 DEBUG - Dados recebidos:', JSON.stringify(body, null, 2));
      console.log('🐛 DEBUG - Tipos:', {
        row: typeof body.row,
        col: typeof body.col,
        value: typeof body.value
      });
      
      // Converter para números se necessário
      const row = Number(body.row);
      const col = Number(body.col);
      const value = String(body.value || '');
      
      console.log('🐛 DEBUG - Dados convertidos:', { row, col, value });
      
      // Calcular range A1
      const columnLetter = this.columnToLetter(col);
      const range = `${columnLetter}${row}`;
      console.log('🐛 DEBUG - Range A1:', range);
      
      // Tentar atualizar
      const result = await this.googleSheetsService.updateCell(row, col, value);
      
      return {
        success: true,
        message: 'Debug update realizado',
        debug: {
          input: body,
          converted: { row, col, value },
          range: range,
          result: result
        },
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Erro no debug:', error);
      
      return {
        success: false,
        message: 'Erro no debug update',
        debug: {
          input: body,
          error: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  // Função auxiliar para converter número da coluna em letra
  private columnToLetter(col: number): string {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }
}