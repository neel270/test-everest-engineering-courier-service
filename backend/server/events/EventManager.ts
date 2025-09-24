export interface EventListener {
  onEvent(event: string, data: any): void;
}

export interface EventData {
  type: string;
  data: any;
  timestamp: Date;
  source: string;
}

export class EventManager {
  private static instance: EventManager;
  private listeners: Map<string, EventListener[]> = new Map();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  subscribe(eventType: string, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(listener);
  }

  unsubscribe(eventType: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(eventType: string, data: any, source: string = 'system'): void {
    const eventData: EventData = {
      type: eventType,
      data,
      timestamp: new Date(),
      source,
    };

    console.log(`Event emitted: ${eventType} from ${source}`, data);

    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener.onEvent(eventType, eventData);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  getListeners(eventType: string): EventListener[] {
    return this.listeners.get(eventType) || [];
  }

  clearListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Specific event listeners for delivery system
export class DeliveryEventListener implements EventListener {
  onEvent(event: string, data: EventData): void {
    switch (event) {
      case 'delivery.created':
        this.onDeliveryCreated(data.data);
        break;
      case 'delivery.calculated':
        this.onDeliveryCalculated(data.data);
        break;
      case 'delivery.error':
        this.onDeliveryError(data.data);
        break;
      case 'package.assigned':
        this.onPackageAssigned(data.data);
        break;
      case 'vehicle.updated':
        this.onVehicleUpdated(data.data);
        break;
      default:
        console.log(`Unhandled event: ${event}`, data);
    }
  }

  private onDeliveryCreated(data: any): void {
    console.log('Delivery created:', data.deliveryId);
    // Could trigger notifications, logging, analytics, etc.
  }

  private onDeliveryCalculated(data: any): void {
    console.log('Delivery calculated:', {
      deliveryId: data.deliveryId,
      totalCost: data.totalCost,
      totalPackages: data.totalPackages,
    });
    // Could update dashboards, send notifications, etc.
  }

  private onDeliveryError(data: any): void {
    console.error('Delivery error:', data.error, data.deliveryId);
    // Could trigger error reporting, alerts, etc.
  }

  private onPackageAssigned(data: any): void {
    console.log('Package assigned:', {
      packageId: data.packageId,
      vehicleId: data.vehicleId,
    });
    // Could update tracking systems, etc.
  }

  private onVehicleUpdated(data: any): void {
    console.log('Vehicle updated:', {
      vehicleId: data.vehicleId,
      availableTime: data.availableTime,
    });
    // Could update scheduling systems, etc.
  }
}

// Event constants
export const DeliveryEvents = {
  DELIVERY_CREATED: 'delivery.created',
  DELIVERY_CALCULATED: 'delivery.calculated',
  DELIVERY_ERROR: 'delivery.error',
  PACKAGE_ASSIGNED: 'package.assigned',
  VEHICLE_UPDATED: 'vehicle.updated',
  OPTIMIZATION_COMPLETED: 'optimization.completed',
  CALCULATION_STARTED: 'calculation.started',
} as const;