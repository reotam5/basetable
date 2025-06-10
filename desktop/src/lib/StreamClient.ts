export interface StreamData {
  streamId: string;
  chunk: any;
  isComplete?: boolean;
  error?: string;
  metadata?: any;
}

export interface StreamSubscription {
  streamId: string;
}

interface StreamOptions {
  onData?: (chunk: any, metadata?: any) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export class StreamClient {
  private subscriptions: Map<string, StreamOptions> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for stream data from main process
    window.electronAPI.stream.onData((streamData: StreamData) => {
      const subscription = this.subscriptions.get(streamData.streamId);
      if (!subscription) return;

      if (streamData.error) {
        subscription.onError?.(streamData.error);
        this.subscriptions.delete(streamData.streamId);
      } else if (streamData.isComplete) {
        if (streamData.chunk !== null && streamData.chunk !== undefined) {
          subscription.onData?.(streamData.chunk, streamData.metadata);
        }
        subscription.onComplete?.();
        this.subscriptions.delete(streamData.streamId);
      } else {
        subscription.onData?.(streamData.chunk, streamData.metadata);
      }
    });
  }

  // Start a new stream
  async startStream(
    channel: string,
    streamId: string = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data?: any,
    options: StreamOptions = {}
  ): Promise<StreamSubscription> {

    // Store subscription callbacks
    this.subscriptions.set(streamId, {
      onData: options.onData,
      onComplete: options.onComplete,
      onError: options.onError,
    });

    try {
      await window.electronAPI.stream.start({
        streamId,
        channel,
        data,
      });

      return {
        streamId,
      };
    } catch (error) {
      this.subscriptions.delete(streamId);
      throw error;
    }
  }

  // Cancel a stream
  async cancelStream(streamId: string): Promise<void> {
    try {
      await window.electronAPI.stream.cancel(streamId);
    } catch (error) {
      console.warn('Failed to cancel stream:', error);
    } finally {
      this.subscriptions.delete(streamId);
    }
  }

  // Pause a stream
  async pauseStream(streamId: string): Promise<boolean> {
    this.subscriptions.delete(streamId);
    return window.electronAPI.stream.pause(streamId);
  }

  // Resume a stream
  async resumeStream(streamId: string, options: StreamOptions): Promise<boolean> {
    this.subscriptions.set(streamId, {
      onData: options.onData,
      onComplete: options.onComplete,
      onError: options.onError,
    });
    return window.electronAPI.stream.resume(streamId);
  }

  // Check if stream is active
  async isStreamActive(streamId: string): Promise<boolean> {
    return await window.electronAPI.stream.isStreaming(streamId);
  }

  // Get all active stream IDs
  getActiveStreamIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  // Cleanup all streams
  cleanup(): void {
    const streamIds = Array.from(this.subscriptions.keys());
    streamIds.forEach(streamId => this.cancelStream(streamId));
    this.subscriptions.clear();
  }
}

// Create a singleton instance
export const streamClient = new StreamClient();
