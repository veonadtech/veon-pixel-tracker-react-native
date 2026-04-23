package com.veonpixeltrackerrn

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.veonadtech.pixeltracker.PixelTracker
import com.veonadtech.pixeltracker.InitStatus
import com.veonadtech.pixeltracker.api.PixelHandle

class VeonPixelTrackerRnModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  companion object {
    const val NAME = "VeonPixelTrackerRn"
    private const val TAG = "VeonPixelTrackerRn"

    val pixelHandles = mutableMapOf<String, PixelHandle>()
  }

  // ================= INIT =================

  @ReactMethod
  fun initialize(baseUrl: String, debug: Boolean, promise: Promise) {
    PixelTracker.initialize(baseUrl, debug) { status ->
      when (status) {
        is InitStatus.Success -> promise.resolve(true)
        is InitStatus.Failure -> promise.reject("INIT_FAILED", status.reason)
      }
    }
  }

  @ReactMethod
  fun isInitialized(promise: Promise) {
    promise.resolve(PixelTracker.isInitialized())
  }

  @ReactMethod
  fun shutdown(promise: Promise) {
    PixelTracker.shutdown()
    pixelHandles.clear()
    promise.resolve(null)
  }

  // ================= PIXEL CONTROL =================

  @ReactMethod
  fun startTracking(pixelId: String, promise: Promise) {
    pixelHandles[pixelId]?.start()
    promise.resolve(null)
  }

  @ReactMethod
  fun stopTracking(pixelId: String, promise: Promise) {
    pixelHandles[pixelId]?.stop()
    promise.resolve(null)
  }

  @ReactMethod
  fun destroyPixel(pixelId: String, promise: Promise) {
    try {
      pixelHandles[pixelId]?.destroy()
      pixelHandles.remove(pixelId)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("DESTROY_FAILED", e)
    }
  }

  @ReactMethod
  fun updateRefreshTime(pixelId: String, seconds: Int, promise: Promise) {
    pixelHandles[pixelId]?.updateRefreshTime(seconds.toLong())
    promise.resolve(null)
  }

  @ReactMethod
  fun setVisibilityCheckInterval(pixelId: String, seconds: Int, promise: Promise) {
    pixelHandles[pixelId]?.setVisibilityCheckInterval(seconds.toLong())
    promise.resolve(null)
  }

  @ReactMethod
  fun getPixelStats(pixelId: String, promise: Promise) {
    try {
      val stats = pixelHandles[pixelId]?.getStats()

      if (stats == null) {
        promise.resolve(null)
        return
      }

      val map = Arguments.createMap().apply {
        putInt("totalAppearances", stats.totalAppearances.get())
        putBoolean("isCurrentlyVisible", stats.isCurrentlyVisible)
        putBoolean("refreshEnabled", stats.refreshEnabled)
        putDouble("nextRefreshInMs", stats.nextRefreshInMs.toDouble())
        putDouble("nextRefreshInSeconds", stats.nextRefreshInMs / 1000.0)
      }

      promise.resolve(map)
    } catch (e: Exception) {
      promise.reject("GET_STATS_FAILED", e)
    }
  }

  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Int) {}
}
