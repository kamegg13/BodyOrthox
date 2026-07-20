package com.bodyorthox.app

import android.app.Application
import cl.json.ShareApplication
import com.bodyorthox.app.poselandmarker.PoseLandmarkerPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ShareApplication, ReactApplication {

  // Authority du FileProvider déclaré dans AndroidManifest.xml, consommée
  // par react-native-share pour exposer les PDF générés en content://.
  override fun getFileProviderAuthority(): String = BuildConfig.APPLICATION_ID + ".provider"

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // TurboModule maison : détection de pose MediaPipe on-device
          add(PoseLandmarkerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Familles variables déclarées dans res/font/*.xml : les fontWeight
    // 400-700 des styles JS sélectionnent la vraie graisse (API 28+), alors
    // qu'une police posée dans assets/fonts resterait figée à 400.
    ReactFontManager.getInstance().addCustomFont(this, "Lexend", R.font.lexend)
    ReactFontManager.getInstance().addCustomFont(this, "SourceSans3", R.font.sourcesans3)
    loadReactNative(this)
  }
}
