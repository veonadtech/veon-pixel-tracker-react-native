package com.veonpixeltrackerrn

import android.graphics.Rect
import android.view.View
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.os.Handler
import android.os.Looper
import java.util.concurrent.ConcurrentHashMap
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.bridge.UiThreadUtil

/**
 * React Native Module for Pixel Tracker SDK
 */
class VeonPixelTrackerRnModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "VeonPixelTrackerRn"

  // Хранилище активных пикселей
  private val activePixels = ConcurrentHashMap<String, PixelTracker>()

  // Состояние SDK
  private var isSdkInitialized = false
  private var baseUrl: String = ""
  private var isDebugMode = false

  // Главный обработчик для таймеров
  private val mainHandler = Handler(Looper.getMainLooper())

  /**
   * Внутренний класс для отслеживания отдельного пикселя
   */
  inner class PixelTracker(
    val pixelId: String,
    private val viewTag: Int,
    private var refreshTimeSeconds: Int = 5,
    private var visibilityThreshold: Int = 1,
    private var visibilityCheckInterval: Int = 3
  ) {
    private var isTracking = false
    private var isVisible = false
    private var totalAppearances = 0
    private var checkRunnable: Runnable? = null
    private var refreshRunnable: Runnable? = null
    private var lastRefreshTime = 0L

    /**
     * Запуск отслеживания пикселя
     */
    fun startTracking() {
      if (isTracking) return
      isTracking = true
      startVisibilityCheck()
      startRefreshTimer()
      logDebug("Pixel $pixelId: Tracking started")
    }

    /**
     * Остановка отслеживания пикселя
     */
    fun stopTracking() {
      isTracking = false
      stopVisibilityCheck()
      stopRefreshTimer()
      logDebug("Pixel $pixelId: Tracking stopped")
    }

    /**
     * Обновление интервала обновления
     */
    fun updateRefreshTime(seconds: Int) {
      refreshTimeSeconds = seconds
      if (isTracking) {
        stopRefreshTimer()
        startRefreshTimer()
      }
      logDebug("Pixel $pixelId: Refresh time updated to $seconds seconds")
    }

    /**
     * Обновление интервала проверки видимости
     */
    fun updateVisibilityCheckInterval(seconds: Int) {
      visibilityCheckInterval = seconds
      if (isTracking) {
        stopVisibilityCheck()
        startVisibilityCheck()
      }
      logDebug("Pixel $pixelId: Visibility check interval updated to $seconds seconds")
    }

    /**
     * Запуск периодической проверки видимости
     */
    private fun startVisibilityCheck() {
      checkRunnable = object : Runnable {
        override fun run() {
          if (isTracking) {
            checkVisibility()
            mainHandler.postDelayed(this, visibilityCheckInterval * 1000L)
          }
        }
      }
      checkRunnable?.let { mainHandler.post(it) }
    }

    /**
     * Остановка проверки видимости
     */
    private fun stopVisibilityCheck() {
      checkRunnable?.let { mainHandler.removeCallbacks(it) }
      checkRunnable = null
    }

    /**
     * Запуск таймера обновления
     */
    private fun startRefreshTimer() {
      refreshRunnable = object : Runnable {
        override fun run() {
          if (isTracking && isVisible) {
            sendRefreshEvent()
            mainHandler.postDelayed(this, refreshTimeSeconds * 1000L)
          } else if (isTracking) {
            mainHandler.postDelayed(this, refreshTimeSeconds * 1000L)
          }
        }
      }
      refreshRunnable?.let { mainHandler.post(it) }
    }

    /**
     * Остановка таймера обновления
     */
    private fun stopRefreshTimer() {
      refreshRunnable?.let { mainHandler.removeCallbacks(it) }
      refreshRunnable = null
    }

    /**
     * Проверка видимости пикселя
     */
    private fun checkVisibility() {
      try {
        val view = getViewByTag(viewTag)
        if (view == null) {
          logDebug("Pixel $pixelId: View not found")
          return
        }

        val rect = Rect()
        val isViewVisible = view.getGlobalVisibleRect(rect)
        val isSufficientlyVisible = rect.width() >= visibilityThreshold &&
          rect.height() >= visibilityThreshold
        val currentlyVisible = isViewVisible && isSufficientlyVisible

        if (currentlyVisible != isVisible) {
          isVisible = currentlyVisible
          if (isVisible) {
            totalAppearances++
            sendAppearanceEvent()
            logDebug("Pixel $pixelId: Appearance detected (${rect.width()}x${rect.height()})")
          } else {
            sendDisappearanceEvent()
            logDebug("Pixel $pixelId: Disappearance detected")
          }
        }
      } catch (e: Exception) {
        logError("Error checking visibility for pixel $pixelId: ${e.message}")
        sendErrorEvent("Visibility check failed: ${e.message}")
      }
    }

    /**
     * Получение View по тегу
     */
    private fun getViewByTag(tag: Int): View? {
      return try {
        val uiManager = reactApplicationContext.getNativeModule(UIManagerModule::class.java)
        uiManager?.resolveView(tag)
      } catch (e: Exception) {
        logError("Error getting view by tag: ${e.message}")
        null
      }
    }

    /**
     * Отправка события появления
     */
    private fun sendAppearanceEvent() {
      val params = Arguments.createMap().apply {
        putString("type", "appearance")
        putString("pixelId", pixelId)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }
      sendEvent("onPixelEvent", params)
    }

    /**
     * Отправка события исчезновения
     */
    private fun sendDisappearanceEvent() {
      val params = Arguments.createMap().apply {
        putString("type", "disappearance")
        putString("pixelId", pixelId)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }
      sendEvent("onPixelEvent", params)
    }

    /**
     * Отправка события обновления
     */
    private fun sendRefreshEvent() {
      val params = Arguments.createMap().apply {
        putString("type", "refresh")
        putString("pixelId", pixelId)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }
      sendEvent("onPixelEvent", params)
      logDebug("Pixel $pixelId: Refresh event sent")
    }

    /**
     * Отправка события ошибки
     */
    private fun sendErrorEvent(errorMessage: String) {
      val params = Arguments.createMap().apply {
        putString("type", "error")
        putString("pixelId", pixelId)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
        putString("error", errorMessage)
      }
      sendEvent("onPixelEvent", params)
    }

    /**
     * Получение статистики пикселя
     */
    fun getStats(): com.facebook.react.bridge.ReadableMap {
      val nextRefreshMs = if (isVisible && refreshTimeSeconds > 0) {
        val nextTime = lastRefreshTime + (refreshTimeSeconds * 1000L)
        (nextTime - System.currentTimeMillis()).coerceAtLeast(0)
      } else {
        0L
      }

      return Arguments.createMap().apply {
        putInt("totalAppearances", totalAppearances)
        putBoolean("isCurrentlyVisible", isVisible)
        putBoolean("refreshEnabled", isTracking && refreshTimeSeconds > 0)
        putDouble("nextRefreshInMs", nextRefreshMs.toDouble())
        putDouble("nextRefreshInSeconds", (nextRefreshMs / 1000).toDouble())
      }
    }

    /**
     * Уничтожение пикселя
     */
    fun destroy() {
      stopTracking()
      logDebug("Pixel $pixelId: Destroyed")
    }
  }

  // ======================== ПУБЛИЧНЫЕ МЕТОДЫ SDK ========================

  @ReactMethod
  fun initialize(baseUrl: String, debug: Boolean, promise: Promise) {
    try {
      this.baseUrl = baseUrl
      this.isDebugMode = debug
      this.isSdkInitialized = true

      logDebug("SDK initialized with baseUrl: $baseUrl")

      val result = Arguments.createMap().apply {
        putBoolean("success", true)
        putDouble("timestamp", System.currentTimeMillis().toDouble())
      }
      sendEvent("onInitialized", result)
      promise.resolve(true)
    } catch (e: Exception) {
      logError("Initialization failed: ${e.message}")
      promise.reject("INIT_ERROR", "Failed to initialize SDK", e)
    }
  }

  @ReactMethod
  fun isInitialized(promise: Promise) {
    promise.resolve(isSdkInitialized)
  }

  @ReactMethod
  fun shutdown(promise: Promise) {
    try {
      // Останавливаем все активные пиксели
      activePixels.values.forEach { it.destroy() }
      activePixels.clear()

      isSdkInitialized = false
      logDebug("SDK shut down")
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("SHUTDOWN_ERROR", "Failed to shutdown SDK", e)
    }
  }

  @ReactMethod
  fun startTracking(pixelId: String, nativeTag: Int, promise: Promise) {
    if (!isSdkInitialized) {
      promise.reject("NOT_INITIALIZED", "SDK not initialized. Call initialize() first.")
      return
    }

    try {
      var pixel = activePixels[pixelId]
      if (pixel == null) {
        pixel = PixelTracker(pixelId, nativeTag)
        activePixels[pixelId] = pixel
      }
      pixel.startTracking()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("TRACKING_ERROR", "Failed to start tracking", e)
    }
  }

  @ReactMethod
  fun stopTracking(pixelId: String, promise: Promise) {
    try {
      activePixels[pixelId]?.stopTracking()
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("TRACKING_ERROR", "Failed to stop tracking", e)
    }
  }

  @ReactMethod
  fun updateRefreshTime(pixelId: String, seconds: Int, promise: Promise) {
    try {
      activePixels[pixelId]?.updateRefreshTime(seconds)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("UPDATE_ERROR", "Failed to update refresh time", e)
    }
  }

  @ReactMethod
  fun setVisibilityCheckInterval(pixelId: String, seconds: Int, promise: Promise) {
    try {
      activePixels[pixelId]?.updateVisibilityCheckInterval(seconds)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("UPDATE_ERROR", "Failed to update visibility check interval", e)
    }
  }

  @ReactMethod
  fun getPixelStats(pixelId: String, promise: Promise) {
    try {
      val stats = activePixels[pixelId]?.getStats()
      if (stats != null) {
        promise.resolve(stats)
      } else {
        promise.resolve(Arguments.createMap())
      }
    } catch (e: Exception) {
      promise.reject("STATS_ERROR", "Failed to get pixel stats", e)
    }
  }

  @ReactMethod
  fun destroyPixel(pixelId: String, promise: Promise) {
    try {
      activePixels[pixelId]?.destroy()
      activePixels.remove(pixelId)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("DESTROY_ERROR", "Failed to destroy pixel", e)
    }
  }

  // ======================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ========================

  /**
   * Отправка событий в JavaScript часть
   */
  private fun sendEvent(eventName: String, params: com.facebook.react.bridge.ReadableMap) {
    try {
      reactApplicationContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit(eventName, params)
    } catch (e: Exception) {
      logError("Failed to send event $eventName: ${e.message}")
    }
  }

  /**
   * Логирование в режиме отладки
   */
  private fun logDebug(message: String) {
    if (isDebugMode) {
      android.util.Log.d("VeonPixelTrackerRn", message)
    }
  }

  /**
   * Логирование ошибок
   */
  private fun logError(message: String) {
    android.util.Log.e("VeonPixelTrackerRn", message)
  }
}
