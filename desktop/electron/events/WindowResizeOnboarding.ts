import { screen } from 'electron';
import { Backend } from '../backend.js';
import { BaseEvent } from './BaseEvent.js';

export class WindowResizeOnboarding extends BaseEvent {
  public static readonly WINDOW_WIDTH = 500;
  public static readonly WINDOW_HEIGHT = 600;

  constructor(backend: Backend) {
    super('window.resize.onboarding', backend, false, false);
  }

  override async execute(): Promise<any> {
    const mainWindow = this.backend.getMainWindow();
    if (!mainWindow) return;

    // Get the primary display bounds
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.bounds;

    // Calculate center position
    const targetX = (screenWidth - WindowResizeOnboarding.WINDOW_WIDTH) / 2;
    const targetY = (screenHeight - WindowResizeOnboarding.WINDOW_HEIGHT) / 2;

    const targetBounds = {
      x: targetX,
      y: targetY,
      width: Math.min(WindowResizeOnboarding.WINDOW_WIDTH, screenWidth),
      height: Math.min(WindowResizeOnboarding.WINDOW_HEIGHT, screenHeight),
    };

    mainWindow.setBounds(targetBounds);
    mainWindow.setResizable(false);
  }
}
