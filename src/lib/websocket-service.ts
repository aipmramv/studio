import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import createSubscriber from 'pg-listen';

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private subscriber: any;

  private constructor() {
    this.subscriber = createSubscriber({ connectionString: process.env.DATABASE_URL });

    this.subscriber.notifications.on('asset_change', (payload: any) => {
      this.handleAssetChange(payload);
    });

    this.subscriber.notifications.on('transfer_change', (payload: any) => {
      this.handleTransferChange(payload);
    });

    this.subscriber.notifications.on('workflow_change', (payload: any) => {
      this.handleWorkflowChange(payload);
    });

    this.subscriber.events.on('error', (error: Error) => {
      console.error('Fatal database connection error:', error);
      process.exit(1);
    });

    process.on('exit', () => {
      this.subscriber.close();
    });
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.setupEventHandlers();
    await this.subscriber.connect();
    await this.subscriber.listenTo('asset_change');
    await this.subscriber.listenTo('transfer_change');
    await this.subscriber.listenTo('workflow_change');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-department', (department: string) => {
        socket.join(`department:${department}`);
        console.log(`Socket ${socket.id} joined department: ${department}`);
      });

      socket.on('join-asset', (assetId: string) => {
        socket.join(`asset:${assetId}`);
        console.log(`Socket ${socket.id} joined asset: ${assetId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private handleAssetChange(payload: any) {
    if (!this.io) return;
    // ... (logic to handle asset changes and emit socket events)
  }

  private handleTransferChange(payload: any) {
    if (!this.io) return;
    // ... (logic to handle transfer changes and emit socket events)
  }

  private handleWorkflowChange(payload: any) {
    if (!this.io) return;
    // ... (logic to handle workflow changes and emit socket events)
  }

  // ... (other methods)
}

export const webSocketService = WebSocketService.getInstance();