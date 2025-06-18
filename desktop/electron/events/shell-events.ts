import { shell } from 'electron';
import { BaseEvent } from './base-events.js';

export class ShellOpenExternal extends BaseEvent {
  constructor() {
    super('shell.openExternal', false, true);
  }

  override async execute(_receivedEvent: any, url: string): Promise<void> {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Validate URL to prevent potential security issues
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    await shell.openExternal(url);
  }
}