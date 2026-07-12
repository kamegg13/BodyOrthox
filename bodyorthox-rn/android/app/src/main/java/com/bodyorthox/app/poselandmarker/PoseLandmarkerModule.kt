package com.bodyorthox.app.poselandmarker

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.bodyorthox.app.specs.NativePoseLandmarkerSpec
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import java.io.ByteArrayInputStream
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * TurboModule "PoseLandmarker" — MediaPipe Tasks Vision en mode IMAGE.
 *
 * Contrat (cf. src/specs/NativePoseLandmarker.ts) :
 * - résout `landmarks: []` quand aucune pose n'est détectée (pas un reject) ;
 * - rejette E_INIT_FAILED (modèle introuvable / chargement) ou
 *   E_IMAGE_INVALID (base64 / décodage) ;
 * - le delegate GPU retombe silencieusement en CPU si indisponible.
 */
class PoseLandmarkerModule(reactContext: ReactApplicationContext) :
    NativePoseLandmarkerSpec(reactContext) {

  // Détection séquentielle hors UI thread : un seul executor dédié.
  private val executor: ExecutorService = Executors.newSingleThreadExecutor()

  // Une instance PoseLandmarker par (modèle, delegate effectif), créée au
  // premier appel puis réutilisée (le chargement du modèle est coûteux).
  private val landmarkers = HashMap<String, PoseLandmarker>()

  override fun detectFromImage(imageBase64: String, options: ReadableMap, promise: Promise) {
    executor.execute {
      try {
        val modelAsset = options.getString("modelAsset")
            ?: throw IllegalArgumentException("modelAsset manquant")
        val delegate = options.getString("delegate") ?: "GPU"
        val minDetection = if (options.hasKey("minPoseDetectionConfidence"))
            options.getDouble("minPoseDetectionConfidence").toFloat() else 0.5f
        val minPresence = if (options.hasKey("minPosePresenceConfidence"))
            options.getDouble("minPosePresenceConfidence").toFloat() else 0.5f

        val bitmap = try {
          decodeBitmapWithExifRotation(imageBase64)
        } catch (e: Exception) {
          promise.reject("E_IMAGE_INVALID", "Image invalide : ${e.message}", e)
          return@execute
        }

        val landmarker = try {
          obtainLandmarker(modelAsset, delegate, minDetection, minPresence)
        } catch (e: Exception) {
          promise.reject(
              "E_INIT_FAILED",
              "Impossible de charger le modèle $modelAsset : ${e.message}",
              e,
          )
          return@execute
        }

        val result = landmarker.detect(BitmapImageBuilder(bitmap).build())

        val landmarksArray: WritableArray = Arguments.createArray()
        if (result.landmarks().isNotEmpty()) {
          // numPoses = 1 : seule la première pose est retournée
          for (lm in result.landmarks()[0]) {
            val point = Arguments.createMap()
            point.putDouble("x", lm.x().toDouble())
            point.putDouble("y", lm.y().toDouble())
            point.putDouble("z", lm.z().toDouble())
            point.putDouble("visibility", lm.visibility().orElse(0f).toDouble())
            landmarksArray.pushMap(point)
          }
        }

        val payload = Arguments.createMap()
        payload.putArray("landmarks", landmarksArray)
        payload.putInt("width", bitmap.width)
        payload.putInt("height", bitmap.height)
        promise.resolve(payload)
      } catch (e: Exception) {
        promise.reject("E_INIT_FAILED", e.message, e)
      }
    }
  }

  override fun dispose() {
    executor.execute { closeAll() }
  }

  override fun invalidate() {
    executor.execute { closeAll() }
    executor.shutdown()
    super.invalidate()
  }

  private fun closeAll() {
    for (landmarker in landmarkers.values) {
      try {
        landmarker.close()
      } catch (_: Exception) {
        // close() best-effort : l'instance est abandonnée dans tous les cas
      }
    }
    landmarkers.clear()
  }

  /** Crée (GPU → fallback CPU) ou réutilise l'instance pour ce modèle. */
  private fun obtainLandmarker(
      modelAsset: String,
      delegate: String,
      minDetection: Float,
      minPresence: Float,
  ): PoseLandmarker {
    val wantGpu = delegate.equals("GPU", ignoreCase = true)
    val cacheKeyGpu = "$modelAsset|GPU"
    val cacheKeyCpu = "$modelAsset|CPU"

    if (wantGpu) {
      landmarkers[cacheKeyGpu]?.let { return it }
      // Un fallback CPU déjà créé pour ce modèle signifie que le GPU a
      // échoué précédemment : ne pas retenter à chaque photo.
      landmarkers[cacheKeyCpu]?.let { return it }
      try {
        val gpu = createLandmarker(modelAsset, Delegate.GPU, minDetection, minPresence)
        landmarkers[cacheKeyGpu] = gpu
        return gpu
      } catch (_: Exception) {
        // GPU indisponible (ex. émulateur) — on retombe en CPU ci-dessous
      }
    }

    landmarkers[cacheKeyCpu]?.let { return it }
    val cpu = createLandmarker(modelAsset, Delegate.CPU, minDetection, minPresence)
    landmarkers[cacheKeyCpu] = cpu
    return cpu
  }

  private fun createLandmarker(
      modelAsset: String,
      delegate: Delegate,
      minDetection: Float,
      minPresence: Float,
  ): PoseLandmarker {
    val baseOptions = BaseOptions.builder()
        .setModelAssetPath(modelAsset)
        .setDelegate(delegate)
        .build()
    val options = PoseLandmarker.PoseLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setRunningMode(RunningMode.IMAGE)
        .setNumPoses(1)
        .setMinPoseDetectionConfidence(minDetection)
        .setMinPosePresenceConfidence(minPresence)
        .build()
    return PoseLandmarker.createFromOptions(reactApplicationContext, options)
  }

  /** Décode le base64 en Bitmap et applique la rotation du tag EXIF. */
  private fun decodeBitmapWithExifRotation(imageBase64: String): Bitmap {
    val bytes = Base64.decode(imageBase64, Base64.DEFAULT)
    val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        ?: throw IllegalArgumentException("décodage bitmap impossible")

    val orientation = ExifInterface(ByteArrayInputStream(bytes))
        .getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)

    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
      else -> return bitmap
    }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }

  companion object {
    const val NAME = NativePoseLandmarkerSpec.NAME
  }
}
