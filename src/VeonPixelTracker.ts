import { NativeEventEmitter, NativeModules } from 'react-native';
import NativeVeonPixelTrackerRn from './NativeVeonPixelTrackerRn';
import type { Spec } from './NativeVeonPixelTrackerRn';

const LINKING_ERROR =
  `The package 'veon-pixel-tracker-rn' doesn't seem to be linked properly.\n\n` +
  `Make sure:\n` +
  `- You rebuilt the app after installing the package\n` +
  `- You are not using Expo Go\n` +
  `- The module is properly registered in Android/iOS\n`;

class VeonPixelTracker {
  private static isSDKInitialized = false;
  private static _eventEmitter: NativeEventEmitter | null = null;

  private static getNativeModule(): Spec {
    if (!NativeVeonPixelTrackerRn) {
      throw new Error(LINKING_ERROR);
    }
    return NativeVeonPixelTrackerRn;
  }

  private static getEventEmitter(): NativeEventEmitter {
    if (!this._eventEmitter) {
      // NativeEventEmitter requires an object with addListener/removeListeners
      // Take it from NativeModules for compatibility with both architectures
      const nativeModule =
        NativeModules.VeonPixelTrackerRn ?? NativeVeonPixelTrackerRn;
      this._eventEmitter = new NativeEventEmitter(nativeModule);
    }
    return this._eventEmitter;
  }

  static async initialize(
    baseUrl: string,
    debug: boolean = false
  ): Promise<void> {
    if (this.isSDKInitialized) {
      console.warn('⚠️ PixelTracker already initialized');
      return;
    }

    const module = this.getNativeModule();

    try {
      const success = await module.initialize(baseUrl, debug);
      if (success) {
        this.isSDKInitialized = true;
        console.log('✅ PixelTracker initialized successfully');
      }
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  static async isInitialized(): Promise<boolean> {
    if (!this.isSDKInitialized) return false;
    return await this.getNativeModule().isInitialized();
  }

  static async shutdown(): Promise<void> {
    if (!this.isSDKInitialized) return;
    await this.getNativeModule().shutdown();
    this.isSDKInitialized = false;
    this._eventEmitter = null;
    console.log('🔌 PixelTracker shut down');
  }

  static get events(): NativeEventEmitter {
    return this.getEventEmitter();
  }

  static get module(): Spec {
    return this.getNativeModule();
  }
}

export default VeonPixelTracker;
