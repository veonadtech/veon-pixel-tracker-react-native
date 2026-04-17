import NativeVeonPixelTrackerRn from '../NativeVeonPixelTrackerRn';
import type { Spec } from '../NativeVeonPixelTrackerRn';
import type { PixelStats } from '../models/PixelStats';

const nativeModule = NativeVeonPixelTrackerRn as Spec;

class PixelController {
  constructor(
    private pixelId: string,
    private nativeTag: number | null
  ) {}

  async start(): Promise<void> {
    if (!this.nativeTag) return;
    await nativeModule.startTracking(this.pixelId, this.nativeTag);
  }

  async stop(): Promise<void> {
    await nativeModule.stopTracking(this.pixelId);
  }

  async destroy(): Promise<void> {
    await nativeModule.destroyPixel(this.pixelId);
    this.nativeTag = null;
  }

  async updateRefreshTime(seconds: number): Promise<void> {
    await nativeModule.updateRefreshTime(this.pixelId, seconds);
  }

  async setVisibilityCheckInterval(seconds: number): Promise<void> {
    await nativeModule.setVisibilityCheckInterval(this.pixelId, seconds);
  }

  async getStats(): Promise<PixelStats | null> {
    return await nativeModule.getPixelStats(this.pixelId);
  }
}

export default PixelController;
