import { ipcMain } from "electron";
import "reflect-metadata";
import { StreamManager } from "./stream-manager.js";

// attach this to service class and it will automatically register all methods with @event decorator
export function service<T extends new (...args: any[]) => any>(target: T) {
  return class extends target {
    constructor(...args: any[]) {
      super(...args);

      // get all methods of the class
      const methods = Object.getOwnPropertyNames(target.prototype).filter(name => name !== 'constructor' && typeof this[name] === 'function');
      for (const method of methods) {
        // get decorators of the method
        const eventName = Reflect.getMetadata('event:name', target.prototype, method);
        const eventType = Reflect.getMetadata('event:type', target.prototype, method);
        const streamChannel = Reflect.getMetadata('stream:channel', target.prototype, method);
        const streamInitializer = Reflect.getMetadata('stream:initializer', target.prototype, method);

        if (eventName) {
          (ipcMain as any)[eventType](eventName, async (_: any, ...args: any[]) => {
            const result = await this[method](...args);
            return result;
          });
        }

        if (streamChannel) {
          const manager = StreamManager.getInstance();
          manager.registerHandler(streamChannel, this[method].bind(this));
        }

        if (streamInitializer) {
          const manager = StreamManager.getInstance();
          manager.registerInitializer(streamInitializer, this[method].bind(this));
        }
      }
    }
  };
}

// Decorator to mark a method as an event handler
export function event(name: string, type: 'handle' | 'on' | 'once' = 'handle') {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata about the event
    Reflect.defineMetadata('event:name', name, target, propertyKey);
    Reflect.defineMetadata('event:type', type, target, propertyKey);
    return descriptor;
  };
}

// Decorator for easy stream handler registration
export function streamHandler(channel: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata about the stream handler
    Reflect.defineMetadata('stream:channel', channel, target, propertyKey);
    return descriptor;
  };
}

// Decorator for stream initialization
export function streamInitializer(channel: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Store metadata about the stream handler
    Reflect.defineMetadata('stream:initializer', channel, target, propertyKey);
    return descriptor;
  };
}