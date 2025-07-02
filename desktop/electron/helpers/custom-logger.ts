import { Logger as _Logger } from '@promisepending/logger.js';
import { app } from 'electron';

class Logger {
  static #instance: Logger;
  private logger: _Logger | null = null

  private constructor() { }

  public static get instance(): Logger {
    if (!Logger.#instance) {
      Logger.#instance = new Logger();
    }

    return Logger.#instance;
  }

  public initialize(): void {
    this.logger = new _Logger({
      prefix: app.name,
      disableFatalCrash: true,
      coloredBackground: false,
      debug: true,
    });
  }

  debug(text: any, ...args: any): void {
    this.logger?.debug(text, ...args);
  }
  info(text: any, ...args: any): void {
    this.logger?.info(text, ...args);
  }
  warn(text: any, ...args: any): void {
    this.logger?.warn(text, ...args);
  }
  error(text: any, ...args: any): void {
    this.logger?.error(text, ...args);
  }
  fatal(text: any, ...args: any): void {
    this.logger?.fatal(text, ...args);
  }
  log(text: any, ...args: any): void {
    this.logger?.log(text, ...args);
  }
}

const logger = Logger.instance;
export { logger as Logger };
