import { Module } from '@nestjs/common';
import { SpreadsheetController } from './app.controller';
import { GoogleSheetsService } from './services/google-sheets.service';
import { SpreadsheetGateway } from './gateways/spreadsheet.gateway';

@Module({
  imports: [],
  controllers: [SpreadsheetController],
  providers: [GoogleSheetsService, SpreadsheetGateway],
})
export class AppModule {}