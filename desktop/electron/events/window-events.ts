import { screen } from 'electron';
import { backend } from '../backend.js';
import { BaseEvent } from './base-events.js';

export class WindowResizeOnboarding extends BaseEvent {
  public static readonly WINDOW_WIDTH = 500;
  public static readonly WINDOW_HEIGHT = 600;

  constructor() {
    super('window.resize.onboarding', false, false);
  }

  override async execute(): Promise<any> {
    const mainWindow = backend.getMainWindow();
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

    mainWindow.windowInstance.setMinimumSize(WindowResizeOnboarding.WINDOW_WIDTH, WindowResizeOnboarding.WINDOW_HEIGHT);
    mainWindow.setBounds(targetBounds);
    mainWindow.setResizable(false);
  }
}