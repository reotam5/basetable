import { useCallback, useEffect, useRef } from 'react';
import { streamClient } from '../lib/StreamClient';

export interface UseStreamOptions<T = any> {
  channel: string;
  onData?: (chunk: T, metadata?: any) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  autoCleanup?: boolean;
}

export function useStream<I = any, O = any>(options: UseStreamOptions<O>) {
  const registeredStreams = useRef<Map<string, boolean>>(new Map());

  const startStream = useCallback(async (streamId: string, data?: I) => {
    try {
      // Cancel existing stream if any
      if (await streamClient.isStreamActive(streamId)) {
        await streamClient.cancelStream(streamId);
      }

      registeredStreams.current.set(streamId, true);

      const response = await streamClient.startStream(options.channel, streamId, data, {
        onData: options.onData,
        onComplete: () => {
          options.onComplete?.();
        },
        onError: (error) => {
          options.onError?.(error);
        },
      });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start stream';
      options.onError?.(errorMessage);
    }
  }, [options]);

  const cancelStream = useCallback(async (streamId: string): Promise<void> => {
    if (await streamClient.isStreamActive(streamId)) {
      await streamClient.cancelStream(streamId);
      registeredStreams.current.delete(streamId);
    }
  }, []);

  const pauseStream = useCallback(async (streamId: string): Promise<boolean> => {
    return await streamClient.pauseStream(streamId);
  }, []);

  const resumeStream = useCallback(async (streamId: string, options: Parameters<typeof streamClient.resumeStream>[1]): Promise<boolean> => {
    return await streamClient.resumeStream(streamId, options);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (options.autoCleanup) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        for (const [streamId, streaming] of registeredStreams.current.entries()) {
          if (streaming) {
            streamClient.cancelStream(streamId);
          }
        }
      }
    };
  }, [options.autoCleanup]);

  return {
    startStream,
    cancelStream,
    pauseStream,
    resumeStream,
  };
}