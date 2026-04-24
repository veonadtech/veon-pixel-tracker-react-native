import NativeVeonPixelTrackerRn from '../NativeVeonPixelTrackerRn';
import type { PixelStats } from '../models/PixelStats';

const LINKING_ERROR =
  `The package 'veon-pixel-tracker-rn' doesn't seem to be linked properly.\n\n` +
  `Make sure:\n` +
  `- You rebuilt the app after installing the package\n` +
  `- You are not using Expo Go\n` +
  `- The module is properly registered in Android/iOS\n`;

class PixelController {
  constructor(
    private pixelId: string,
    private nativeTag: number | null
  ) {}

  private get native() {
    if (!NativeVeonPixelTrackerRn) {
      throw new Error(LINKING_ERROR);
    }
    return NativeVeonPixelTrackerRn;
  }

  async start(): Promise<void> {
    if (!this.nativeTag) return;
    await this.native.startTracking(this.pixelId, this.nativeTag);
  }

  async stop(): Promise<void> {
    await this.native.stopTracking(this.pixelId);
  }

  async destroy(): Promise<void> {
    await this.native.destroyPixel(this.pixelId);
    this.nativeTag = null;
  }

  async updateRefreshTime(seconds: number): Promise<void> {
    await this.native.updateRefreshTime(this.pixelId, seconds);
  }

  async setVisibilityCheckInterval(seconds: number): Promise<void> {
    await this.native.setVisibilityCheckInterval(this.pixelId, seconds);
  }

  async getStats(): Promise<PixelStats | null> {
    return await this.native.getPixelStats(this.pixelId);
  }
}

export default PixelController;
