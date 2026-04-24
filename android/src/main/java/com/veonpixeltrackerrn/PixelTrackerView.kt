package com.veonpixeltrackerrn

import android.content.Context
import android.util.Log
import android.widget.FrameLayout
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.veonadtech.pixeltracker.PixelTracker
import com.veonadtech.pixeltracker.api.PixelConfig
import com.veonadtech.pixeltracker.api.PixelEventListener
import com.veonadtech.pixeltracker.api.PixelHandle

class PixelTrackerView(context: Context) : FrameLayout(context) {

  companion object {
    private const val TAG = "PixelTrackerView"
  }

  var pixelId: String = ""
  var refreshTimeSeconds: Long = 5L
  var pixelSize: Int = 1
  var visibilityThreshold: Int = 1
  var colorHex: String? = null

  private var handle: PixelHandle? = null
  private var isAttached = false
  private var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null

  fun setEventEmitter(emitter: DeviceEventManagerModule.RCTDeviceEventEmitter) {
    this.eventEmitter = emitter
  }

  /**
   * Called from ViewManager after all props have been set.
   * Prevents duplicate attachment.
   */
  fun attachIfNeeded() {
    if (isAttached) return
    if (pixelId.isBlank()) {
      Log.w(TAG, "pixelId is empty, skipping attach")
      return
    }
    if (!PixelTracker.isInitialized()) {
      Log.e(TAG, "PixelTracker is not initialized")
      return
    }

    val parsedColor = colorHex?.let {
      try { android.graphics.Color.parseColor(it) } catch (e: Exception) { null }
    }

    val config = PixelConfig(
      pixelId = pixelId,
      refreshTimeSeconds = refreshTimeSeconds,
      pixelSize = pixelSize,
      visibilityThreshold = visibilityThreshold,
      color = parsedColor
    )

    val newHandle = PixelTracker.attach(context, this, config)
    if (newHandle == null) {
      Log.e(TAG, "PixelTracker.attach() returned null for pixelId: $pixelId")
      return
    }

    newHandle.setEventListener(object : PixelEventListener {
      override fun onAppearance(pixelId: String, timestamp: String) {
        Log.d(TAG, "onAppearance: $pixelId")
        sendEvent("appearance", pixelId, timestamp)
      }
      override fun onDisappearance(pixelId: String, timestamp: String) {
        Log.d(TAG, "onDisappearance: $pixelId")
        sendEvent("disappearance", pixelId, timestamp)
      }
      override fun onRefresh(pixelId: String, timestamp: String) {
        Log.d(TAG, "onRefresh: $pixelId")
        sendEvent("refresh", pixelId, timestamp)
      }
      override fun onError(pixelId: String, error: String, timestamp: String) {
        Log.e(TAG, "onError: $pixelId - $error")
        sendEvent("error", pixelId, timestamp, error)
      }
    })

    handle = newHandle
    isAttached = true
    newHandle.start()

    Log.d(TAG, "✅ Pixel attached and started: $pixelId")
  }

  fun stop() {
    handle?.stop()
    Log.d(TAG, "Pixel stopped: $pixelId")
  }

  fun destroyPixel() {
    handle?.destroy()
    handle = null
    isAttached = false
    Log.d(TAG, "Pixel destroyed: $pixelId")
  }

  fun updateRefreshTime(seconds: Long) {
    handle?.updateRefreshTime(seconds)
  }

  fun setVisibilityCheckInterval(seconds: Long) {
    handle?.setVisibilityCheckInterval(seconds)
  }

  private fun sendEvent(
    type: String,
    pixelId: String,
    timestamp: String,
    error: String? = null
  ) {
    val params = com.facebook.react.bridge.Arguments.createMap().apply {
      putString("type", type)
      putString("pixelId", pixelId)
      putString("timestamp", timestamp)
      error?.let { putString("error", it) }
    }
    try {
      eventEmitter?.emit("onPixelEvent", params)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to send event: ${e.message}")
    }
  }

}
