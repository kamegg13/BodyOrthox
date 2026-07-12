package com.bodyorthox.app

import android.app.Application
import cl.json.ShareApplication
import com.bodyorthox.app.poselandmarker.PoseLandmarkerPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader

class MainApplication : Application(), ShareApplication, ReactApplication {

  // Authority du FileProvider déclaré dans AndroidManifest.xml, consommée
  // par react-native-share pour exposer les PDF générés en content://.
  override fun getFileProviderAuthority(): String = BuildConfig.APPLICATION_ID + ".provider"

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // TurboModule maison : détection de pose MediaPipe on-device
              add(PoseLandmarkerPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    // Familles variables déclarées dans res/font/*.xml : les fontWeight
    // 400-700 des styles JS sélectionnent la vraie graisse (API 28+), alors
    // qu'une police posée dans assets/fonts resterait figée à 400.
    ReactFontManager.getInstance().addCustomFont(this, "Lexend", R.font.lexend)
    ReactFontManager.getInstance().addCustomFont(this, "SourceSans3", R.font.sourcesans3)
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
  }
}
