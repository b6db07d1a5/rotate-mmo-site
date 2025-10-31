import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import config from '@/config';
import routes from '@/routes';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { generalLimiter } from '@/middleware/rateLimiter';

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST']
      }
    });

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketHandlers();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    this.app.use(generalLimiter);

    // Logging middleware
    if (config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use('/uploads', express.static('uploads'));
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Boss Respawn Tracker API',
        version: '1.0.0',
        documentation: '/api/health',
        endpoints: {
          bosses: '/api/bosses',
          spawns: '/api/spawns',
          users: '/api/users'
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  private initializeSocketHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join server-specific rooms
      socket.on('join-server', (server: string) => {
        socket.join(`server-${server}`);
        console.log(`Client ${socket.id} joined server room: ${server}`);
      });

      // Join boss-specific rooms
      socket.on('join-boss', (bossId: string) => {
        socket.join(`boss-${bossId}`);
        console.log(`Client ${socket.id} joined boss room: ${bossId}`);
      });

      // Join guild-specific rooms
      socket.on('join-guild', (guildId: string) => {
        socket.join(`guild-${guildId}`);
        console.log(`Client ${socket.id} joined guild room: ${guildId}`);
      });

      // Leave rooms
      socket.on('leave-server', (server: string) => {
        socket.leave(`server-${server}`);
      });

      socket.on('leave-boss', (bossId: string) => {
        socket.leave(`boss-${bossId}`);
      });

      socket.on('leave-guild', (guildId: string) => {
        socket.leave(`guild-${guildId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  public listen(): void {
    this.server.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📱 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API URL: http://localhost:${config.port}/api`);
      console.log(`💬 Socket.IO enabled`);
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Create and start the application
const app = new App();
app.listen();

// Export for testing
export default app;
