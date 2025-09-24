interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export class CacheDecorator {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export class LoggingDecorator {
  static logMethodCall(
    targetOrPropertyKey: any,
    propertyKeyOrDescriptor: string | PropertyDescriptor,
    descriptor?: PropertyDescriptor
  ): PropertyDescriptor {
    // Handle both static and instance method signatures
    let actualDescriptor: PropertyDescriptor;
    let actualPropertyKey: string;

    if (typeof propertyKeyOrDescriptor === "string" && descriptor) {
      // Instance method: (target, propertyKey, descriptor)
      actualDescriptor = descriptor;
      actualPropertyKey = propertyKeyOrDescriptor;
    } else if (typeof propertyKeyOrDescriptor === "object") {
      // Static method: (propertyKey, descriptor)
      actualDescriptor = propertyKeyOrDescriptor;
      actualPropertyKey = targetOrPropertyKey;
    } else {
      throw new Error("Invalid decorator usage");
    }

    const method = actualDescriptor.value;

    actualDescriptor.value = function (...args: any[]) {
      const startTime = Date.now();
      console.log(
        `[${new Date().toISOString()}] Calling ${actualPropertyKey} with args:`,
        args
      );

      try {
        const result = method.apply(this, args);
        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(
          `[${new Date().toISOString()}] ${actualPropertyKey} completed in ${duration}ms`
        );

        // If result is a Promise, log when it resolves
        if (result && typeof result.then === "function") {
          return result
            .then((finalResult: any) => {
              console.log(
                `[${new Date().toISOString()}] ${actualPropertyKey} resolved with:`,
                finalResult
              );
              return finalResult;
            })
            .catch((error: any) => {
              console.error(
                `[${new Date().toISOString()}] ${actualPropertyKey} failed:`,
                error
              );
              throw error;
            });
        }

        return result;
      } catch (error) {
        console.error(
          `[${new Date().toISOString()}] ${actualPropertyKey} threw error:`,
          error
        );
        throw error;
      }
    };

    return actualDescriptor;
  }

  static logPerformance(
    propertyName: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();

      try {
        const result = await method.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (duration > 1000) {
          // Log only if it takes more than 1 second
          console.warn(
            `⚠️ Performance warning: ${propertyName} took ${duration.toFixed(
              2
            )}ms`
          );
        }

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.error(
          `❌ ${propertyName} failed after ${duration.toFixed(2)}ms:`,
          error
        );
        throw error;
      }
    };

    return descriptor;
  }
}

export class ValidationDecorator {
  static validateInput(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const method = descriptor.value;
    console.log("ValidationDecorator applied to", propertyName);
    console.log("Method:", method);
    console.log("Descriptor before:", descriptor);
    console.log("Target:", target);
    descriptor.value = function (...args: any[]) {
      // Validate packages
      if (args[0] && Array.isArray(args[0])) {
        args[0].forEach((pkg: any, index: number) => {
          if (
            !pkg.id ||
            typeof pkg.weight !== "number" ||
            typeof pkg.distance !== "number"
          ) {
            throw new Error(
              `Invalid package at index ${index}: missing required fields`
            );
          }
        });
      }

      // Validate vehicles
      if (args[1] && Array.isArray(args[1])) {
        args[1].forEach((vehicle: any, index: number) => {
          if (
            typeof vehicle.maxSpeed !== "number" ||
            typeof vehicle.maxCarriableWeight !== "number"
          ) {
            throw new Error(
              `Invalid vehicle at index ${index}: missing required fields`
            );
          }
        });
      }

      return method.apply(this, args);
    };

    return descriptor;
  }
}

export class RetryDecorator {
  static withRetry(maxRetries: number = 3, delay: number = 1000) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ): PropertyDescriptor {
      const method = descriptor.value;
      console.log("RetryDecorator applied to", propertyName);
      console.log("Method:", method);
      console.log("Descriptor before:", descriptor);
      console.log("Target:", target);
      descriptor.value = async function (...args: any[]) {
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            return await method.apply(this, args);
          } catch (error) {
            lastError = error;
            console.warn(
              `Attempt ${attempt + 1} failed for ${propertyName}:`,
              error
            );

            if (attempt < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, delay * Math.pow(2, attempt))
              );
            }
          }
        }

        throw lastError;
      };

      return descriptor;
    };
  }
}

export class CircuitBreakerDecorator {
  private static failures: Map<string, number> = new Map();
  private static lastFailureTime: Map<string, number> = new Map();
  private static state: Map<string, "CLOSED" | "OPEN" | "HALF_OPEN"> =
    new Map();

  static withCircuitBreaker(
    failureThreshold: number = 5,
    timeout: number = 60000
  ) {
    return function (
      target: any,
      propertyName: string,
      descriptor: PropertyDescriptor
    ): PropertyDescriptor {
      const method = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const key = `${target.constructor.name}.${propertyName}`;
        const currentState = CircuitBreakerDecorator.state.get(key) || "CLOSED";

        if (currentState === "OPEN") {
          const lastFailure =
            CircuitBreakerDecorator.lastFailureTime.get(key) || 0;
          if (Date.now() - lastFailure < timeout) {
            throw new Error(`Circuit breaker is OPEN for ${key}`);
          } else {
            CircuitBreakerDecorator.state.set(key, "HALF_OPEN");
          }
        }

        try {
          const result = await method.apply(this, args);

          // Reset failure count on success
          CircuitBreakerDecorator.failures.set(key, 0);
          CircuitBreakerDecorator.state.set(key, "CLOSED");

          return result;
        } catch (error) {
          const currentFailures =
            CircuitBreakerDecorator.failures.get(key) || 0;
          CircuitBreakerDecorator.failures.set(key, currentFailures + 1);
          CircuitBreakerDecorator.lastFailureTime.set(key, Date.now());

          if (currentFailures + 1 >= failureThreshold) {
            CircuitBreakerDecorator.state.set(key, "OPEN");
            console.error(
              `Circuit breaker OPEN for ${key} after ${
                currentFailures + 1
              } failures`
            );
          }

          throw error;
        }
      };

      return descriptor;
    };
  }
}
