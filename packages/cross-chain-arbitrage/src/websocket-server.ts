import { WebSocketServer, WebSocket } from 'ws';
import { log } from './utils';

export interface ArbitrageData {
  type: 'price_update' | 'balance_update' | 'trade_executed' | 'stats_update' | 'opportunity_found' | 'connection_confirmed';
  timestamp: number;
  data: any;
}

export class ArbitrageWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.init();
  }

  private init(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      log(`WebSocket client connected. Total clients: ${this.clients.size + 1}`);
      this.clients.add(ws);

      // Send initial connection confirmation
      this.sendToClient(ws, {
        type: 'connection_confirmed',
        timestamp: Date.now(),
        data: { message: 'Connected to Arbitrage WebSocket Server' }
      });

      ws.on('close', () => {
        log(`WebSocket client disconnected. Total clients: ${this.clients.size - 1}`);
        this.clients.delete(ws);
      });

      ws.on('error', (error: Error) => {
        log(`WebSocket error: ${error}`, 'error');
        this.clients.delete(ws);
      });
    });

    this.wss.on('error', (error: Error) => {
      log(`WebSocket server error: ${error}`, 'error');
    });

    log(`WebSocket server started on port ${this.port}`);
  }

  private sendToClient(ws: WebSocket, data: ArbitrageData): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch (error) {
        log(`Failed to send data to client: ${error}`, 'error');
        this.clients.delete(ws);
      }
    }
  }

  public broadcast(data: ArbitrageData): void {
    const message = JSON.stringify(data);

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          log(`Failed to broadcast to client: ${error}`, 'error');
          this.clients.delete(ws);
        }
      } else {
        this.clients.delete(ws);
      }
    });
  }

  // Broadcast price updates
  public broadcastPriceUpdate(chainName: string, price: any): void {
    this.broadcast({
      type: 'price_update',
      timestamp: Date.now(),
      data: {
        chain: chainName,
        price: price
      }
    });
  }

  // Broadcast balance updates
  public broadcastBalanceUpdate(chainName: string, balance: any): void {
    this.broadcast({
      type: 'balance_update',
      timestamp: Date.now(),
      data: {
        chain: chainName,
        balance: balance
      }
    });
  }

  // Broadcast trade execution
  public broadcastTradeExecuted(trade: any): void {
    this.broadcast({
      type: 'trade_executed',
      timestamp: Date.now(),
      data: trade
    });
  }

  // Broadcast stats update
  public broadcastStatsUpdate(stats: any): void {
    this.broadcast({
      type: 'stats_update',
      timestamp: Date.now(),
      data: stats
    });
  }

  // Broadcast arbitrage opportunity
  public broadcastOpportunityFound(opportunity: any): void {
    this.broadcast({
      type: 'opportunity_found',
      timestamp: Date.now(),
      data: opportunity
    });
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public close(): void {
    this.clients.forEach((ws) => {
      ws.close();
    });
    this.wss.close();
    log('WebSocket server closed');
  }
}

// Singleton instance
let wsServer: ArbitrageWebSocketServer | null = null;

export function getWebSocketServer(): ArbitrageWebSocketServer {
  if (!wsServer) {
    wsServer = new ArbitrageWebSocketServer(8080);
  }
  return wsServer;
}

export function closeWebSocketServer(): void {
  if (wsServer) {
    wsServer.close();
    wsServer = null;
  }
}