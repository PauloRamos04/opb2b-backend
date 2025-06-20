import { Controller, Get, Post, Body, HttpException, HttpStatus, Request } from '@nestjs/common';
import { GoogleSheetsService } from '../services/google-sheets.service';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/auth-dto';

@Controller()
export class SpreadsheetController {
  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly authService: AuthService
  ) {}

  @Get()
  getHello(): string {
    return 'OPB2B Backend is running!';
  }

  @Post('auth/login')
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    try {
      const ip = req.ip || req.connection?.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      return await this.authService.login(loginDto, ip, userAgent);
    } catch (error) {
      throw error;
    }
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      cors: 'enabled',
      googleSheetsConfigured: this.googleSheetsService.getConfigurationStatus()
    };
  }

  @Get('spreadsheet/data')
  async getData() {
    if (!this.googleSheetsService.getConfigurationStatus()) {
      return {
        success: false,
        data: null,
        message: 'Google Sheets não configurado. Configure as variáveis de ambiente necessárias.',
        timestamp: new Date().toISOString()
      };
    }

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
    if (!this.googleSheetsService.getConfigurationStatus()) {
      return {
        success: false,
        message: 'Google Sheets não configurado. Configure as variáveis de ambiente necessárias.',
        timestamp: new Date().toISOString()
      };
    }

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
    if (!this.googleSheetsService.getConfigurationStatus()) {
      return {
        success: false,
        message: 'Google Sheets não configurado',
        details: {
          googleSheetsConnected: false,
          configured: false,
          error: 'Credenciais não encontradas nas variáveis de ambiente',
          lastCheck: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    }

    try {
      console.log('🔍 Verificando status do sistema...');
      
      const data = await this.googleSheetsService.getData();
      
      return {
        success: true,
        message: 'Sistema funcionando normalmente',
        details: {
          googleSheetsConnected: true,
          configured: true,
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
          configured: true,
          error: error.message,
          lastCheck: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}