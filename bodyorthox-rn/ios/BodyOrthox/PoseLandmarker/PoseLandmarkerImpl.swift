import Foundation
import MediaPipeTasksVision
import UIKit

/// Implémentation Swift du TurboModule "PoseLandmarker" (MediaPipe Tasks
/// Vision, mode IMAGE). La glue Obj-C++ (RCTPoseLandmarker.mm) délègue ici.
///
/// Contrat (cf. src/specs/NativePoseLandmarker.ts) :
/// - résout `landmarks: []` quand aucune pose n'est détectée ;
/// - rejette E_INIT_FAILED (modèle) ou E_IMAGE_INVALID (base64/décodage) ;
/// - delegate GPU avec repli CPU silencieux.
@objc public class PoseLandmarkerImpl: NSObject {

  /// Queue sérielle dédiée : la détection ne bloque jamais le main thread.
  private let queue = DispatchQueue(label: "com.bodyorthox.poselandmarker")

  /// Instances mises en cache par "modèle|delegate" (chargement coûteux).
  private var landmarkers: [String: PoseLandmarker] = [:]

  @objc public func detect(
    fromImage imageBase64: String,
    modelAsset: String,
    delegate: String,
    minPoseDetectionConfidence: Double,
    minPosePresenceConfidence: Double,
    resolve: @escaping ([String: Any]) -> Void,
    reject: @escaping (String, String, Error?) -> Void
  ) {
    queue.async {
      guard let data = Data(base64Encoded: imageBase64, options: .ignoreUnknownCharacters),
            let uiImage = UIImage(data: data)
      else {
        reject("E_IMAGE_INVALID", "Image invalide : décodage base64/UIImage impossible", nil)
        return
      }

      // Le delegate GPU (Metal) de MediaPipe abort() sur simulateur au premier
      // detect() — irrécupérable (abseil FailWithoutStackTrace). CPU forcé.
      #if targetEnvironment(simulator)
      let wantGpu = false
      #else
      let wantGpu = delegate.uppercased() == "GPU"
      #endif

      let landmarker: PoseLandmarker
      do {
        landmarker = try self.obtainLandmarker(
          modelAsset: modelAsset,
          wantGpu: wantGpu,
          minDetection: Float(minPoseDetectionConfidence),
          minPresence: Float(minPosePresenceConfidence)
        )
      } catch {
        reject(
          "E_INIT_FAILED",
          "Impossible de charger le modèle \(modelAsset) : \(error.localizedDescription)",
          error
        )
        return
      }

      do {
        // MPImage(uiImage:) respecte imageOrientation — la rotation EXIF
        // portée par UIImage est appliquée par MediaPipe.
        let mpImage = try MPImage(uiImage: uiImage)
        let result = try landmarker.detect(image: mpImage)

        var landmarks: [[String: Any]] = []
        if let pose = result.landmarks.first {
          landmarks = pose.map { lm in
            [
              "x": Double(lm.x),
              "y": Double(lm.y),
              "z": Double(lm.z),
              "visibility": Double(truncating: lm.visibility ?? 0),
            ]
          }
        }

        resolve([
          "landmarks": landmarks,
          "width": Int(uiImage.size.width * uiImage.scale),
          "height": Int(uiImage.size.height * uiImage.scale),
        ])
      } catch {
        reject("E_INIT_FAILED", "Détection impossible : \(error.localizedDescription)", error)
      }
    }
  }

  @objc public func dispose() {
    queue.async {
      self.landmarkers.removeAll()
    }
  }

  private func obtainLandmarker(
    modelAsset: String,
    wantGpu: Bool,
    minDetection: Float,
    minPresence: Float
  ) throws -> PoseLandmarker {
    let gpuKey = "\(modelAsset)|GPU"
    let cpuKey = "\(modelAsset)|CPU"

    if wantGpu {
      if let cached = landmarkers[gpuKey] { return cached }
      // Un repli CPU déjà présent signifie que le GPU a échoué : ne pas retenter.
      if let cached = landmarkers[cpuKey] { return cached }
      if let gpu = try? createLandmarker(
        modelAsset: modelAsset, delegate: .GPU,
        minDetection: minDetection, minPresence: minPresence
      ) {
        landmarkers[gpuKey] = gpu
        return gpu
      }
    }

    if let cached = landmarkers[cpuKey] { return cached }
    let cpu = try createLandmarker(
      modelAsset: modelAsset, delegate: .CPU,
      minDetection: minDetection, minPresence: minPresence
    )
    landmarkers[cpuKey] = cpu
    return cpu
  }

  private func createLandmarker(
    modelAsset: String,
    delegate: Delegate,
    minDetection: Float,
    minPresence: Float
  ) throws -> PoseLandmarker {
    let modelName = (modelAsset as NSString).deletingPathExtension
    guard let modelPath = Bundle.main.path(forResource: modelName, ofType: "task") else {
      throw NSError(
        domain: "PoseLandmarker",
        code: 404,
        userInfo: [NSLocalizedDescriptionKey: "Modèle \(modelAsset) absent du bundle"]
      )
    }

    let options = PoseLandmarkerOptions()
    options.baseOptions.modelAssetPath = modelPath
    options.baseOptions.delegate = delegate
    options.runningMode = .image
    options.numPoses = 1
    options.minPoseDetectionConfidence = minDetection
    options.minPosePresenceConfidence = minPresence
    return try PoseLandmarker(options: options)
  }
}
