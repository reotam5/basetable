import { ipcMain } from "electron";
import "reflect-metadata";
import { Logger } from "./Logger.js";

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

        if (eventName) {
          (ipcMain as any)[eventType](eventName, async (_: any, ...args: any[]) => {
            const result = await this[method](...args);
            return result;
          });
          Logger.debug("Service:", eventName, "->", method);
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