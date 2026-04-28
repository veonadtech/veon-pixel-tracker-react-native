package com.veonpixeltrackerrn

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class PixelTrackerViewManager(
  private val reactContext: ReactApplicationContext
) : SimpleViewManager<PixelTrackerView>() {

  companion object {
    const val NAME = "PixelTrackerView"
    private const val TAG = "PixelTrackerViewManager"
  }

  override fun getName(): String = NAME

  override fun createViewInstance(context: ThemedReactContext): PixelTrackerView {
    val view = PixelTrackerView(context)
    val emitter = reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    view.setEventEmitter(emitter)
    return view
  }

  override fun onAfterUpdateTransaction(view: PixelTrackerView) {
    super.onAfterUpdateTransaction(view)
    view.attachIfNeeded()

    if (view.pixelId.isNotBlank()) {
      VeonPixelTrackerRnModule.viewRegistry[view.pixelId] = view
      Log.d(TAG, "View registered: ${view.pixelId}")
    }
  }

  override fun onDropViewInstance(view: PixelTrackerView) {
    super.onDropViewInstance(view)
    VeonPixelTrackerRnModule.viewRegistry.remove(view.pixelId)
    view.destroyPixel()
    Log.d(TAG, "View unregistered: ${view.pixelId}")
  }

  @ReactProp(name = "pixelId")
  fun setPixelId(view: PixelTrackerView, pixelId: String) {
    view.pixelId = pixelId
  }

  @ReactProp(name = "refreshTimeSeconds", defaultInt = 5)
  fun setRefreshTimeSeconds(view: PixelTrackerView, seconds: Int) {
    view.refreshTimeSeconds = seconds.toLong()
  }

  @ReactProp(name = "pixelSize", defaultInt = 1)
  fun setPixelSize(view: PixelTrackerView, size: Int) {
    view.pixelSize = size
  }

  @ReactProp(name = "visibilityThreshold", defaultInt = 1)
  fun setVisibilityThreshold(view: PixelTrackerView, threshold: Int) {
    view.visibilityThreshold = threshold
  }

  @ReactProp(name = "color")
  fun setColor(view: PixelTrackerView, color: String?) {
    view.colorHex = color
  }

}
