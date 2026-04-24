package com.veonpixeltrackerrn

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.veonadtech.pixeltracker.PixelTracker
import com.veonadtech.pixeltracker.InitStatus
import java.util.concurrent.ConcurrentHashMap

class VeonPixelTrackerRnModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  companion object {
    const val NAME = "VeonPixelTrackerRn"
    private const val TAG = "VeonPixelTrackerRn"

    val viewRegistry = ConcurrentHashMap<String, PixelTrackerView>()
  }

  private val mainHandler = Handler(Looper.getMainLooper())

  // ======================== SDK METHODS ========================

  @ReactMethod
  fun initialize(baseUrl: String, debug: Boolean, promise: Promise) {
    if (baseUrl.isBlank()) {
      promise.reject("INVALID_ARGUMENT", "baseUrl is empty")
      return
    }

    PixelTracker.initialize(baseUrl, debug) { status ->
      when (status) {
        is InitStatus.Success -> {
          sendEvent("onInitialized", Arguments.createMap().apply {
            putString("status", "success")
          })
          promise.resolve(true)
        }
        is InitStatus.Failure -> {
          sendEvent("onInitialized", Arguments.createMap().apply {
            putString("status", "failure")
          })
          promise.reject("INIT_FAILED", status.reason)
        }
      }
    }
  }

  @ReactMethod
  fun isInitialized(promise: Promise) {
    promise.resolve(PixelTracker.isInitialized())
  }

  @ReactMethod
  fun shutdown(promise: Promise) {
    try {
      viewRegistry.clear()
      PixelTracker.shutdown()
      sendEvent("onShutdown", Arguments.createMap())
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SHUTDOWN_ERROR", "Failed to shutdown SDK", e)
    }
  }

  // ======================== PIXEL CONTROL via viewRegistry ========================

  @ReactMethod
  fun startTracking(pixelId: String, nativeTag: Int, promise: Promise) {
    mainHandler.post {
      val view = viewRegistry[pixelId]
      if (view != null) {
        view.start()
      } else {
        Log.w(TAG, "startTracking: pixel '$pixelId' not found in registry")
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun stopTracking(pixelId: String, promise: Promise) {
    mainHandler.post {
      val view = viewRegistry[pixelId]
      if (view != null) {
        view.stop()
      } else {
        Log.w(TAG, "stopTracking: pixel '$pixelId' not found in registry")
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun updateRefreshTime(pixelId: String, seconds: Int, promise: Promise) {
    mainHandler.post {
      viewRegistry[pixelId]?.updateRefreshTime(seconds.toLong())
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun setVisibilityCheckInterval(pixelId: String, seconds: Int, promise: Promise) {
    mainHandler.post {
      viewRegistry[pixelId]?.setVisibilityCheckInterval(seconds.toLong())
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun getPixelStats(pixelId: String, promise: Promise) {
    mainHandler.post {
      val view = viewRegistry[pixelId]
      if (view != null) {
        view.getStats(promise)
      } else {
        promise.resolve(Arguments.createMap())
      }
    }
  }

  @ReactMethod
  fun destroyPixel(pixelId: String, promise: Promise) {
    mainHandler.post {
      val view = viewRegistry[pixelId]
      if (view != null) {
        view.destroyPixel()
        viewRegistry.remove(pixelId)
      } else {
        Log.w(TAG, "destroyPixel: pixel '$pixelId' not found in registry")
      }
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun test(promise: Promise) {
    promise.resolve("OK")
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter
  }

  // ======================== HELPERS ========================

  private fun sendEvent(eventName: String, params: com.facebook.react.bridge.ReadableMap) {
    try {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(eventName, params)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to send event $eventName: ${e.message}")
    }
  }

}
