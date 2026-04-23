package com.veonpixeltrackerrn

import android.content.Context
import android.util.Log
import android.widget.FrameLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.veonadtech.pixeltracker.PixelTracker
import com.veonadtech.pixeltracker.api.PixelConfig
import com.veonadtech.pixeltracker.api.PixelEventListener
import com.veonadtech.pixeltracker.api.PixelHandle
import com.veonpixeltrackerrn.VeonPixelTrackerRnModule.Companion.pixelHandles

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

  // ================= ATTACH =================

  fun attachIfNeeded() {
    if (isAttached) return

    if (pixelId.isBlank()) {
      Log.w(TAG, "pixelId is empty")
      return
    }

    if (!PixelTracker.isInitialized()) {
      Log.e(TAG, "PixelTracker not initialized")
      return
    }

    val parsedColor = colorHex?.let {
      try { android.graphics.Color.parseColor(it) } catch (_: Exception) { null }
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
      Log.e(TAG, "attach returned null for $pixelId")
      return
    }

    // ================= EVENTS =================

    newHandle.setEventListener(object : PixelEventListener {
      override fun onAppearance(pixelId: String, timestamp: String) {
        sendEvent("appearance", pixelId, timestamp)
      }

      override fun onDisappearance(pixelId: String, timestamp: String) {
        sendEvent("disappearance", pixelId, timestamp)
      }

      override fun onRefresh(pixelId: String, timestamp: String) {
        sendEvent("refresh", pixelId, timestamp)
      }

      override fun onError(pixelId: String, error: String, timestamp: String) {
        sendEvent("error", pixelId, timestamp, error)
      }
    })

    handle = newHandle
    isAttached = true

    pixelHandles[pixelId] = newHandle

    sendCreatedEvent()

    Log.d(TAG, "✅ Pixel attached: $pixelId")
  }

  // ================= CONTROL =================

  fun start() {
    handle?.start()
    Log.d(TAG, "▶️ start: $pixelId")
  }

  fun stop() {
    handle?.stop()
    Log.d(TAG, "⏸ stop: $pixelId")
  }

  fun destroyPixel() {
    handle?.destroy()
    pixelHandles.remove(pixelId)

    handle = null
    isAttached = false

    Log.d(TAG, "🗑 destroy: $pixelId")
  }

  fun updateRefreshTime(seconds: Long) {
    handle?.updateRefreshTime(seconds)
  }

  fun setVisibilityCheckInterval(seconds: Long) {
    handle?.setVisibilityCheckInterval(seconds)
  }

  // ================= EVENTS =================

  private fun sendCreatedEvent() {
    val params = Arguments.createMap().apply {
      putString("pixelId", pixelId)
    }

    try {
      eventEmitter?.emit("onPixelCreated", params)
    } catch (e: Exception) {
      Log.e(TAG, "Failed to emit onPixelCreated: ${e.message}")
    }
  }

  private fun sendEvent(
    type: String,
    pixelId: String,
    timestamp: String,
    error: String? = null
  ) {
    val params = Arguments.createMap().apply {
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
