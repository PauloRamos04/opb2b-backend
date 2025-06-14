import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://opb2b-frontend.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SpreadsheetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    client.emit('connection-status', { connected: true });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('update-cell')
  handleUpdateCell(client: Socket, payload: any) {
    console.log('Atualizando célula via socket:', payload);
    client.broadcast.emit('cell-updated', payload);
  }

  @SubscribeMessage('novo-chamado')
  handleNovoChamado(client: Socket, payload: any) {
    console.log('Novo chamado via socket:', payload);
    client.broadcast.emit('novo-chamado', payload);
  }

  broadcastDataUpdate(data: any) {
    this.server.emit('data-update', data);
  }

  broadcastError(error: any) {
    this.server.emit('error', error);
  }
}