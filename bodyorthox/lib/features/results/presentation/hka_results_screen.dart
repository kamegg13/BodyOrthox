// Écran de résultats HKA — placeholder pour Story 3.4.
//
// Reçoit [AnalysisSuccess] depuis la route `/results` via GoRouter state.extra.
// L'affichage complet (angles, normes, toggle vue simple/experte) sera implémenté
// en Story 3.4 (3-4-affichage-resultats-angle-hka).
//
// Ce fichier sera remplacé/étendu par Story 3.4.
// [Source: docs/implementation-artifacts/3-0-capture-photo-hka.md#T7]

import 'package:flutter/material.dart';

import '../../../core/analysis/analysis_result.dart';

/// Écran de résultats HKA — placeholder Story 3.4.
///
/// Reçoit [analysisSuccess] depuis [CapturePhotoHkaScreen] via GoRouter extra.
/// Affiche les valeurs brutes en attendant l'implémentation complète (Story 3.4).
class HkaResultsScreen extends StatelessWidget {
  final AnalysisSuccess? analysisSuccess;

  const HkaResultsScreen({super.key, this.analysisSuccess});

  @override
  Widget build(BuildContext context) {
    final success = analysisSuccess;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Résultats HKA'),
        centerTitle: true,
      ),
      body: Center(
        child: success == null
            ? const Text('Aucun résultat disponible.')
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Angle HKA gauche : '
                      '${success.measurements['hka_left']?.toStringAsFixed(1)}°',
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Angle HKA droit : '
                      '${success.measurements['hka_right']?.toStringAsFixed(1)}°',
                      style: const TextStyle(fontSize: 18),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Affichage complet disponible en Story 3.4',
                      style: TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
