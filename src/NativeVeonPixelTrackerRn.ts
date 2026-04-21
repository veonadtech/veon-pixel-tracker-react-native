import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  initialize(baseUrl: string, debug: boolean): Promise<boolean>;
  isInitialized(): Promise<boolean>;
  shutdown(): Promise<void>;
  startTracking(pixelId: string, nativeTag: number): Promise<void>;
  stopTracking(pixelId: string): Promise<void>;
  updateRefreshTime(pixelId: string, seconds: number): Promise<void>;
  setVisibilityCheckInterval(pixelId: string, seconds: number): Promise<void>;
  getPixelStats(pixelId: string): Promise<{
    totalAppearances: number;
    isCurrentlyVisible: boolean;
    refreshEnabled: boolean;
    nextRefreshInMs: number;
    nextRefreshInSeconds: number;
  }>;
  destroyPixel(pixelId: string): Promise<void>;
  test(): Promise<string>;
}

// TurboModule (new architecture), fallback to NativeModules (old architecture)
const NativeVeonPixelTrackerRn: Spec | null =
  TurboModuleRegistry.get<Spec>('VeonPixelTrackerRn') ??
  (NativeModules.VeonPixelTrackerRn as Spec | undefined) ??
  null;

export default NativeVeonPixelTrackerRn;
