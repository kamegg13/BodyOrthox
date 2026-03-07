import 'package:flutter/cupertino.dart';
import 'package:go_router/go_router.dart';

/// Écran résultats d'analyse — stub Story 2.3.
/// Implémentation complète : Epic 3 (Capture Guidée & Analyse ML).
class AnalysisResultsScreen extends StatelessWidget {
  const AnalysisResultsScreen({super.key, required this.analysisId});

  final String analysisId;

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: const Text('Résultats'),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Text('Retour'),
          onPressed: () => context.pop(),
        ),
      ),
      child: Center(
        child: Text('Analyse : $analysisId'),
      ),
    );
  }
}
