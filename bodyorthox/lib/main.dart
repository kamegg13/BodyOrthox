// Point d'entrée par défaut — ne pas utiliser directement.
// Utiliser les entry points flavor-aware :
//   flutter run --flavor dev -t lib/main_dev.dart
//   flutter run --flavor prod -t lib/main_prod.dart
//
// Ce fichier est conservé pour la compatibilité avec les outils
// qui attendent lib/main.dart, mais le vrai point d'entrée MVP
// est toujours spécifié via -t (target).
import 'package:flutter/material.dart';
import 'core/config/app_config.dart';
import 'app.dart';

void main() {
  // Fallback non-flavor — utilise la config dev par défaut.
  // En production, toujours lancer via --flavor prod -t lib/main_prod.dart.
  runApp(const BodyOrthoxApp(config: AppConfig.dev()));
}
