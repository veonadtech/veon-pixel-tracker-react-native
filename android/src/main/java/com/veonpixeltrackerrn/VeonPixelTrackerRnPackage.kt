package com.veonpixeltrackerrn

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class VeonPixelTrackerRnPackage : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == VeonPixelTrackerRnModule.NAME) {
      VeonPixelTrackerRnModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        VeonPixelTrackerRnModule.NAME to ReactModuleInfo(
          VeonPixelTrackerRnModule.NAME,
          VeonPixelTrackerRnModule::class.java.name,
          false,  // canOverrideExistingModule
          false,  // needsEagerInit
          false,  // hasConstants
          false,  // isCxxModule
          false   // isTurboModule — false для совместимости со старой архитектурой
        )
      )
    }
  }
}
