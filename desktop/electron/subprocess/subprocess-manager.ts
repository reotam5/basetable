import { ChildProcess, fork, ForkOptions } from "child_process";
import { app } from "electron";
import EventEmitter from "events";
import path from "path";
import { fileURLToPath } from "url";
import { createStreamIterator } from "../helpers/createStreamIterator.js";
import { Logger } from "../helpers/custom-logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ISubprocessConfig {
  modulePath: string;
  serviceName: string;
  args?: any[];
  options?: ForkOptions;
}

interface ISubprocessInfo {
  pid: number;
  serviceName: string;
  process: ChildProcess;
  messageQueue: any[];
  isReady: boolean;
}

// this class is intented to run in main process, managing subprocesses
class SubprocessManager {
  private processInfo: Map<string, ISubprocessInfo>;
  private responseEvent: EventEmitter;

  constructor() {
    this.processInfo = new Map();
    this.responseEvent = new EventEmitter();

    app.on('before-quit', () => this.killAllProcesses());
  }

  async startProcess(config: ISubprocessConfig) {

    return new Promise<ISubprocessInfo>((resolve, reject) => {
      try {
        if (this.processInfo.has(config.serviceName)) return reject(new Error(`Process with service name ${config.serviceName} already exists.`));

        const child = fork(path.join(__dirname, config.modulePath), config.args, config.options)
        if (!child || !child.pid) return reject(new Error("Failed to start subprocess. Child process is undefined or has no PID."));

        const processInfo: ISubprocessInfo = {
          pid: child.pid,
          serviceName: config.serviceName,
          process: child,
          messageQueue: [],
          isReady: false,
        }

        this.processInfo.set(processInfo.serviceName, processInfo);

        child.on('message', (message: any) => {
          // Log the message if it's a log message
          if (message?.type === 'log') {
            const { level, message: logMessage } = message;
            (Logger as any)[level](`${processInfo.serviceName}: ${logMessage}`);
          } else if (message?.type === 'response') {
            this.responseEvent.emit(message.id, message.result, message.isLast);
          }
        });

        child.once('message', (message: any) => {
          // handles ready message only once
          if (message?.type === 'ready') {
            processInfo!.isReady = true;
            this.flushMessageQueue(processInfo.serviceName);
            resolve(processInfo!);
          }
        })

        child.on('exit', () => {
          this.processInfo.delete(processInfo.serviceName);
        })

      } catch (error) {
        reject(error)
        return;
      }
    })
  }

  onMessage(serviceName: string, callback: (message: any) => void): void {
    const processInfo = this.processInfo.get(serviceName);
    if (!processInfo) {
      throw new Error(`Process with service name ${serviceName} does not exist.`);
    }

    processInfo.process.on('message', (message: any) => {
      if (message?.type !== 'log' && message?.type !== 'ready') {
        callback(message);
      }
    });
  }

  async sendMessage(serviceName: string, message: any): Promise<any> {
    const processInfo = this.processInfo.get(serviceName);
    if (!processInfo) {
      throw new Error(`Process with service name ${serviceName} does not exist.`);
    }
    const randomId = Math.random().toString(36).substring(2, 15);

    const data = {
      data: message,
      id: randomId,
      isStreaming: false,
    }
    if (processInfo.isReady) {
      processInfo.process.send(data);
    } else {
      processInfo.messageQueue.push(data);
    }

    return new Promise((resolve) => {
      this.responseEvent.once(randomId, (result: any) => {
        resolve(result);
        this.responseEvent.removeAllListeners(randomId);
      });
    })
  }

  async *sendMessageGenerator<T>(serviceName: string, message: any): AsyncGenerator<T> {
    const processInfo = this.processInfo.get(serviceName);
    if (!processInfo) {
      throw new Error(`Process with service name ${serviceName} does not exist.`);
    }
    const randomId = Math.random().toString(36).substring(2, 15);

    const data = {
      data: message,
      id: randomId,
      isStreaming: true,
    }
    if (processInfo.isReady) {
      processInfo.process.send(data);
    } else {
      processInfo.messageQueue.push(data);
    }

    const streamIterator = createStreamIterator();

    this.responseEvent.on(randomId, (result: any, isLast: boolean) => {
      if (isLast) {
        streamIterator.complete();
      } else {
        streamIterator.push(result);
      }
    })

    for await (const chunk of streamIterator) {
      yield chunk as T;
    }

    this.responseEvent.removeAllListeners(randomId);
  }

  killProcess(serviceName: string): void {
    const processInfo = this.processInfo.get(serviceName);
    if (!processInfo) {
      throw new Error(`Process with service name ${serviceName} does not exist.`);
    }

    processInfo.process.kill();
    this.processInfo.delete(serviceName);
  }

  killAllProcesses(): void {
    for (const [key, subprocess] of this.processInfo.entries()) {
      subprocess.process.kill();
      this.processInfo.delete(key);
    }
  }

  flushMessageQueue(serviceName: string) {
    const processInfo = this.processInfo.get(serviceName);
    if (!processInfo) return;

    while (processInfo.messageQueue.length > 0) {
      const message = processInfo.messageQueue.shift();
      this.processInfo.get(serviceName)?.process.send(message);
    }
  }

  getProcessInfo(serviceName: string) {
    return this.processInfo.get(serviceName) || null;
  }

  getAllProcesses(): ISubprocessInfo[] {
    return Array.from(this.processInfo.values());
  }
}

const subprocessManager = new SubprocessManager();
export { subprocessManager };
