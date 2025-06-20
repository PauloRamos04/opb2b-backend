import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private sheets;
  private spreadsheetId: string;
  private sheetName: string;
  private isConfigured: boolean = false;

  constructor() {
    console.log('🔧 Inicializando GoogleSheetsService...');
    
    this.spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'HOJE';
    
    console.log('📋 Configurações:');
    console.log(`- Spreadsheet ID: ${this.spreadsheetId ? '✅' : '❌'}`);
    console.log(`- Sheet Name: ${this.sheetName ? '✅' : '❌'}`);
    console.log(`- Service Account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅' : '❌'}`);
    console.log(`- Private Key: ${process.env.GOOGLE_PRIVATE_KEY ? '✅' : '❌'}`);

    if (!this.spreadsheetId || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('⚠️ GoogleSheetsService não está totalmente configurado. Funcionalidades do Google Sheets estarão desabilitadas.');
      this.isConfigured = false;
      return;
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isConfigured = true;
      console.log('✅ GoogleSheetsService inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar GoogleSheetsService:', error);
      this.isConfigured = false;
    }
  }

  private checkConfiguration() {
    if (!this.isConfigured) {
      throw new Error('GoogleSheetsService não está configurado. Verifique as variáveis de ambiente.');
    }
  }

  async getData(): Promise<string[][]> {
    this.checkConfiguration();
    
    try {
      console.log(`📖 Lendo dados da planilha: ${this.sheetName}`);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:AZ`,
      });

      const rows = response.data.values || [];
      console.log(`✅ ${rows.length} linhas lidas da planilha`);
      
      return rows;
    } catch (error) {
      console.error('❌ Erro ao ler dados:', error);
      throw new Error(`Erro ao ler dados da planilha: ${error.message}`);
    }
  }

  async updateCell(row: number, col: number, value: string): Promise<any> {
    this.checkConfiguration();
    
    try {
      console.log(`📝 Atualizando célula [${row}, ${col}] com valor: "${value}"`);
      
      const columnLetter = this.columnToLetter(col);
      const range = `${this.sheetName}!${columnLetter}${row}`;
      
      console.log(`📍 Range calculado: ${range}`);

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[value]]
        }
      });

      console.log('✅ Célula atualizada com sucesso:', {
        range: range,
        updatedCells: response.data.updatedCells,
        updatedRows: response.data.updatedRows
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar célula:', error);
      throw new Error(`Erro ao atualizar célula [${row}, ${col}]: ${error.message}`);
    }
  }

  columnToLetter(col: number): string {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }

  async addRow(data: string[]): Promise<any> {
    this.checkConfiguration();
    
    try {
      console.log('➕ Adicionando nova linha:', data);
      
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.sheetName}!A:A`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [data]
        }
      });

      console.log('✅ Linha adicionada com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao adicionar linha:', error);
      throw new Error(`Erro ao adicionar nova linha: ${error.message}`);
    }
  }

  async getSheetInfo(): Promise<any> {
    this.checkConfiguration();
    
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      return {
        title: response.data.properties.title,
        sheets: response.data.sheets.map(sheet => ({
          title: sheet.properties.title,
          sheetId: sheet.properties.sheetId,
          rowCount: sheet.properties.gridProperties.rowCount,
          columnCount: sheet.properties.gridProperties.columnCount
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao obter info da planilha:', error);
      throw new Error(`Erro ao obter informações da planilha: ${error.message}`);
    }
  }

  getConfigurationStatus(): boolean {
    return this.isConfigured;
  }
}