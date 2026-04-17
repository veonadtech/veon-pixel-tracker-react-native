import { NativeEventEmitter, NativeModules } from 'react-native';
import type { Spec } from './NativeVeonPixelTrackerRn';

// Получаем нативный модуль
const nativeModule = NativeModules.VeonPixelTrackerRn as Spec;
const nativeModuleForEvents = NativeModules.VeonPixelTrackerRn;

/**
 * Главный класс Pixel Tracker SDK
 */
class VeonPixelTracker {
  private static instance: VeonPixelTracker | null = null;
  private static isSDKInitialized = false;
  private static eventEmitter: NativeEventEmitter | null = null;
  private static nativeModule: Spec | null = null;

  private constructor() {
    if (!nativeModule) {
      console.error('❌ Native module not available');
      return;
    }
    VeonPixelTracker.nativeModule = nativeModule;

    // Создаем EventEmitter только если модуль поддерживает события
    if (nativeModuleForEvents) {
      VeonPixelTracker.eventEmitter = new NativeEventEmitter(
        nativeModuleForEvents
      );
    }
  }

  private static getInstance(): VeonPixelTracker {
    if (!VeonPixelTracker.instance) {
      VeonPixelTracker.instance = new VeonPixelTracker();
    }
    return VeonPixelTracker.instance;
  }

  static async initialize(
    baseUrl: string,
    debug: boolean = false
  ): Promise<void> {
    if (this.isSDKInitialized) {
      console.warn('⚠️ PixelTracker already initialized');
      return;
    }

    if (!this.nativeModule) {
      throw new Error('Native module not available');
    }

    try {
      const success = await this.nativeModule.initialize(baseUrl, debug);
      if (success) {
        this.isSDKInitialized = true;
        this.getInstance();
        console.log('✅ PixelTracker initialized successfully');
      }
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  static async isInitialized(): Promise<boolean> {
    if (!this.isSDKInitialized || !this.nativeModule) {
      return false;
    }
    return await this.nativeModule.isInitialized();
  }

  static async shutdown(): Promise<void> {
    if (!this.isSDKInitialized || !this.nativeModule) {
      return;
    }

    await this.nativeModule.shutdown();
    this.isSDKInitialized = false;
    console.log('🔌 PixelTracker shut down');
  }

  static get events(): NativeEventEmitter | null {
    return this.eventEmitter;
  }

  static getNativeModule(): Spec | null {
    return this.nativeModule;
  }
}

export default VeonPixelTracker;
