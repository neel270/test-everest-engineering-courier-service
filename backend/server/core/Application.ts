import { DIContainer } from './DIContainer';
import { EventManager } from '../events/EventManager';
import { DeliveryEventListener } from '../events/EventManager';

export class Application {
  private static instance: Application;
  private container: DIContainer;
  private eventManager: EventManager;

  private constructor() {
    this.container = DIContainer.getInstance();
    this.eventManager = EventManager.getInstance();
  }

  static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Courier Service Application...');

    try {
      // Register all core services
      this.container.registerCoreServices();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize database connections if needed
      await this.initializeDatabase();

      console.log('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    const deliveryListener = new DeliveryEventListener();
    this.eventManager.subscribe('delivery.created', deliveryListener);
    this.eventManager.subscribe('delivery.calculated', deliveryListener);
    this.eventManager.subscribe('delivery.error', deliveryListener);
    this.eventManager.subscribe('package.assigned', deliveryListener);
    this.eventManager.subscribe('vehicle.updated', deliveryListener);
  }

  private async initializeDatabase(): Promise<void> {
    // Database initialization logic would go here
    // For now, we'll assume MongoDB connection is handled elsewhere
    console.log('📊 Database connection ready');
  }

  getContainer(): DIContainer {
    return this.container;
  }

  getEventManager(): EventManager {
    return this.eventManager;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down application...');

    // Clean up resources
    this.eventManager.clearListeners();
    this.container.clear();

    console.log('✅ Application shutdown complete');
  }
}