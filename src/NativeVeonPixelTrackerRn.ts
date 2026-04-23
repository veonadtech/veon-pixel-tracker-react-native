import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

export interface Spec extends TurboModule {
  initialize(baseUrl: string, debug: boolean): Promise<boolean>;
  isInitialized(): Promise<boolean>;
  shutdown(): Promise<void>;
  startTracking(pixelId: string): Promise<void>;
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

const LINKING_ERROR = `
The package 'veon-pixel-tracker-rn' doesn't seem to be linked properly.
Make sure:
- You rebuilt the app after installing the package
- You are not using Expo Go
- The module is properly registered in Android/iOS
`;

// TurboModule (new architecture), fallback to NativeModules (old architecture)
const NativeVeonPixelTrackerRn =
  TurboModuleRegistry.get<Spec>('VeonPixelTrackerRn') ??
  (NativeModules.VeonPixelTrackerRn as Spec | undefined);

if (!NativeVeonPixelTrackerRn) {
  throw new Error(LINKING_ERROR);
}

export default NativeVeonPixelTrackerRn;
