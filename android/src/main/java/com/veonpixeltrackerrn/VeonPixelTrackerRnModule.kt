package com.veonpixeltrackerrn

import com.facebook.react.bridge.ReactApplicationContext

class VeonPixelTrackerRnModule(reactContext: ReactApplicationContext) :
  NativeVeonPixelTrackerRnSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeVeonPixelTrackerRnSpec.NAME
  }
}
