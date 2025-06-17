import { IpcMainInvokeEvent } from 'electron';
import { Screen, screenManager } from '../helpers/screen-manager.js';
import { BaseEvent } from './base-events.js';

export class WindowScreenChange extends BaseEvent {

  constructor() {
    super('window.screenChange', false, true);
  }

  override async execute(event: IpcMainInvokeEvent, screen: Screen): Promise<any> {
    screenManager.setScreen(screen);
  }
}