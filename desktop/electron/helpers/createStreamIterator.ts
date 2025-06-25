export function createStreamIterator<T>() {
  const chunks: T[] = [];
  let isCompleted = false;
  let resolveNext: ((value: IteratorResult<T>) => void) | null = null;
  let deferredCompleteTimeout: NodeJS.Timeout | null = null;

  return {
    async *[Symbol.asyncIterator]() {
      while (!isCompleted) {
        if (chunks.length > 0) {
          yield chunks.shift()!;
        } else {
          // Wait for next chunk
          await new Promise<IteratorResult<T>>(resolve => {
            resolveNext = resolve;
          });
          if (chunks.length > 0) {
            yield chunks.shift()!;
          }
        }
      }
    },

    push(chunk: T) {
      // Cancel any pending deferred completion
      if (deferredCompleteTimeout) {
        clearTimeout(deferredCompleteTimeout);
        deferredCompleteTimeout = null;
      }

      chunks.push(chunk);
      if (resolveNext) {
        resolveNext({ value: chunk, done: false });
        resolveNext = null;
      }
    },

    complete() {
      isCompleted = true;
      if (resolveNext) {
        resolveNext({ value: undefined as any, done: true });
        resolveNext = null;
      }
    },

    deferredComplete(intervalMs: number = 500) {
      // Cancel any existing deferred completion
      if (deferredCompleteTimeout) {
        clearTimeout(deferredCompleteTimeout);
      }

      // Set up a new deferred completion
      deferredCompleteTimeout = setTimeout(() => {
        this.complete();
        deferredCompleteTimeout = null;
      }, intervalMs);
    }
  };
}