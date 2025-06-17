
// this class is intented to run in a separate process
export abstract class BaseSubprocess {

  constructor() {
    this.initialize()
  }

  abstract handleMessage(message: any): void;
  async onInitialize(): Promise<void> { }
  async cleanup(): Promise<void> { }

  private async initialize(): Promise<void> {
    try {
      await this.onInitialize();
      process.on('message', this.handleMessage.bind(this));

      process.on('SIGTERM', async () => {
        await this.cleanup();
        process.exit(0);
      })

      process.on('SIGINT', async () => {
        await this.cleanup();
        process.exit(0);
      })

      this.send({ type: 'ready' });
    } catch (error) {
      this.error('Failed to initialize subprocess:', error);
      process.exit(1);
    }
  }

  public send(message: any): void {
    process?.send?.(message);
  }

  private log(level: 'error' | 'warn' | 'info' | 'debug' = 'info', ...args: any[]) {
    const message = {
      type: 'log',
      level: level,
      message: args.join(' '),
      timestamp: new Date().toISOString(),
    }
    this.send(message)
  }

  error(...args: any[]) { this.log('error', ...args); }
  warn(...args: any[]) { this.log('warn', ...args); }
  info(...args: any[]) { this.log('info', ...args); }
  debug(...args: any[]) { this.log('debug', ...args); }
}