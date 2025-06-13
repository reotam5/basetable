import { BrowserWindow, ipcMain } from 'electron';
import { EventEmitter } from 'events';
import "reflect-metadata";

export interface StreamOptions {
  streamId: string;
  channel: string;
  data?: any;
}

export interface StreamData {
  streamId: string;
  chunk: any;
  isComplete?: boolean;
  error?: string;
  metadata?: any;
}

export type StreamHandler = (data: any, stream: StreamContext) => Promise<void> | void;

export class StreamContext {
  private streamId: string;
  private window: BrowserWindow;
  private channel: string;
  private isEnded: boolean = false;
  private isPaused: boolean = false;


  constructor(streamId: string, window: BrowserWindow, channel: string) {
    this.streamId = streamId;
    this.window = window;
    this.channel = channel;

    StreamManager.getInstance().on('streamPaused', this.handlePause.bind(this));
    StreamManager.getInstance().on('streamResumed', this.handleResume.bind(this));
  }

  // Send data chunk to renderer
  write(chunk: any, metadata?: any): void {
    if (this.isEnded) {
      throw new Error('Cannot write to ended stream');
    }
    if (this.isPaused) return;

    const streamData: StreamData = {
      streamId: this.streamId,
      chunk,
      metadata,
      isComplete: false,
    };

    this.window.webContents.send('stream.data', streamData);
  }

  // End the stream
  end(finalChunk?: any): void {
    if (this.isEnded) return;

    const streamData: StreamData = {
      streamId: this.streamId,
      chunk: finalChunk,
      isComplete: true,
    };

    this.window.webContents.send('stream.data', streamData);
    this.isEnded = true;
    StreamManager.getInstance().removeStream(this.streamId);
    StreamManager.getInstance().removeListener('streamPaused', this.handlePause.bind(this));
    StreamManager.getInstance().removeListener('streamResumed', this.handleResume.bind(this));
  }

  // Send error and end stream
  error(error: string | Error): void {
    if (this.isEnded) return;

    const streamData: StreamData = {
      streamId: this.streamId,
      chunk: null,
      isComplete: true,
      error: error instanceof Error ? error.message : error,
    };

    this.window.webContents.send('stream.data', streamData);
    this.isEnded = true;
    StreamManager.getInstance().removeStream(this.streamId);
    StreamManager.getInstance().removeListener('streamPaused', this.handlePause.bind(this));
    StreamManager.getInstance().removeListener('streamResumed', this.handleResume.bind(this));
  }

  getId(): string {
    return this.streamId;
  }

  getChannel(): string {
    return this.channel;
  }

  isStreamEnded(): boolean {
    return this.isEnded;
  }

  isStreamPaused(): boolean {
    return this.isPaused;
  }

  private handlePause(id: string) {
    if (id === this.streamId) this.isPaused = true;
  }

  private handleResume(id: string) {
    if (id === this.streamId) this.isPaused = false;
  }
}

export class StreamManager extends EventEmitter {
  private static instance: StreamManager;
  private streams: Map<string, StreamContext> = new Map();
  private streamHandlers: Map<string, StreamHandler> = new Map();

  private constructor() {
    super();
    this.setupIpcHandlers();
  }

  public static getInstance(): StreamManager {
    if (!StreamManager.instance) {
      StreamManager.instance = new StreamManager();
    }
    return StreamManager.instance;
  }

  private setupIpcHandlers(): void {
    // Handle stream start requests from renderer
    ipcMain.handle('stream.start', (event, options: StreamOptions) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (!window) {
        throw new Error('Window not found');
      }

      return this.startStream(options, window);
    });

    // Handle stream cancellation
    ipcMain.handle('stream.cancel', (event, streamId: string) => {
      return this.cancelStream(streamId);
    });

    // Handle stream pause/resume
    ipcMain.handle('stream.pause', (event, streamId: string) => {
      return this.pauseStream(streamId);
    });

    ipcMain.handle('stream.resume', (event, streamId: string) => {
      return this.resumeStream(streamId);
    });

    ipcMain.handle('stream.isStreaming', (event, streamId: string) => {
      return this.streams.get(streamId)?.isStreamEnded() === false;
    });
  }

  // Register a stream handler for a specific channel
  registerHandler(channel: string, handler: StreamHandler): void {
    this.streamHandlers.set(channel, handler);
  }

  // Unregister a stream handler
  unregisterHandler(channel: string): void {
    this.streamHandlers.delete(channel);
  }

  // Start a new stream
  private async startStream(options: StreamOptions, window: BrowserWindow): Promise<string> {
    const { streamId, channel, data } = options;

    if (this.streams.has(streamId)) {
      throw new Error(`Stream ${streamId} already exists`);
    }

    const handler = this.streamHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler registered for channel: ${channel}`);
    }

    const streamContext = new StreamContext(streamId, window, channel);
    this.streams.set(streamId, streamContext);

    // Execute the handler asynchronously
    setImmediate(async () => {
      try {
        await handler(data, streamContext);
        // If handler doesn't explicitly end the stream, end it automatically
        if (!streamContext.isStreamEnded()) {
          streamContext.end();
        }
      } catch (error) {
        streamContext.error(error instanceof Error ? error : new Error(String(error)));
      }
    });

    return streamId;
  }

  // Cancel a stream
  private cancelStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return false;
    }

    stream.error('Stream cancelled by user');
    this.emit('streamCancelled', streamId);
    return true;
  }

  // Pause a stream (implementation depends on handler)
  private pauseStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return false;
    }

    this.emit('streamPaused', streamId);
    return true;
  }

  // Resume a stream (implementation depends on handler)
  private resumeStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) {
      return false;
    }

    this.emit('streamResumed', streamId);
    return true;
  }

  // Remove stream from active streams
  removeStream(streamId: string): void {
    this.streams.delete(streamId);
    this.emit('streamEnded', streamId);
  }

  // Get active stream count
  getActiveStreamCount(): number {
    return this.streams.size;
  }

  // Get all active stream IDs
  getActiveStreamIds(): string[] {
    return Array.from(this.streams.keys());
  }

  // Clean up all streams
  cleanup(): void {
    for (const [, stream] of this.streams) {
      stream.error('Application shutting down');
    }
    this.streams.clear();
    this.streamHandlers.clear();
  }
}

