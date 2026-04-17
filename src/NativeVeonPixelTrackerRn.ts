import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  // Основные методы SDK (аналог Flutter)
  initialize(baseUrl: string, debug: boolean): Promise<boolean>;
  isInitialized(): Promise<boolean>;
  shutdown(): Promise<void>;

  // Методы для управления пикселем
  startTracking(pixelId: string, nativeTag: number): Promise<void>;
  stopTracking(pixelId: string): Promise<void>;
  updateRefreshTime(pixelId: string, seconds: number): Promise<void>;
  setVisibilityCheckInterval(pixelId: string, seconds: number): Promise<void>;

  // Получение статистики пикселя
  getPixelStats(pixelId: string): Promise<{
    totalAppearances: number;
    isCurrentlyVisible: boolean;
    refreshEnabled: boolean;
    nextRefreshInMs: number;
    nextRefreshInSeconds: number;
  }>;

  // Вспомогательные методы
  destroyPixel(pixelId: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('VeonPixelTrackerRn');
