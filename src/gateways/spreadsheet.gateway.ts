import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GoogleSheetsService } from '../services/google-sheets.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})
export class SpreadsheetGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly googleSheetsService: GoogleSheetsService) {}

  @SubscribeMessage('join-room')
  handleJoinRoom(@ConnectedSocket() client: Socket) {
    client.join('spreadsheet-room');
    console.log(`Client ${client.id} joined spreadsheet room`);
  }

  @SubscribeMessage('update-cell')
  async handleUpdateCell(
    @MessageBody() data: { row: number; col: number; value: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      await this.googleSheetsService.updateCell(data.row, data.col, data.value);
      
      client.to('spreadsheet-room').emit('cell-updated', {
        row: data.row,
        col: data.col,
        value: data.value,
        updatedBy: client.id,
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('request-data')
  async handleRequestData(@ConnectedSocket() client: Socket) {
    try {
      const data = await this.googleSheetsService.getData();
      client.emit('data-update', { values: data });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}