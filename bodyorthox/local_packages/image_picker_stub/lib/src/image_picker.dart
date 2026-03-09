// Stub image_picker — API compatible v1.1.2
// Fournit ImagePicker, ImageSource pour dart analyze BodyOrthox Story 3.0.

import 'package:cross_file/cross_file.dart';

/// Source de l'image sélectionnée.
enum ImageSource {
  /// Caméra native de l'appareil.
  camera,

  /// Galerie photos de l'appareil.
  gallery,
}

/// Sélecteur d'image — wraps UIImagePickerController sur iOS.
class ImagePicker {
  /// Sélectionne une image depuis [source].
  ///
  /// Retourne `null` si l'utilisateur annule.
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    bool requestFullMetadata = true,
  }) async {
    // Stub — non implémenté. L'implémentation réelle est fournie par
    // le plugin natif image_picker (iOS : UIImagePickerController).
    throw UnimplementedError('Stub — utiliser image_picker: ^1.1.2 en production.');
  }
}
