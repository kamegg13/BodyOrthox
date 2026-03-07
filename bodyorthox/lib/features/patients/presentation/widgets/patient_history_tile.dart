// Widget affichant une entrée d'analyse dans la fiche patient.
// AC2 Story 2.3 : affiche date, angles genou/hanche/cheville, score confiance.

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show ListTile;
import 'package:go_router/go_router.dart';
import '../../../../features/capture/domain/analysis.dart';

class PatientHistoryTile extends StatelessWidget {
  const PatientHistoryTile({super.key, required this.analysis});

  final Analysis analysis;

  @override
  Widget build(BuildContext context) {
    final formattedDate = _formatDate(analysis.createdAt);
    final anglesText =
        'G: ${analysis.kneeAngle.toStringAsFixed(1)}° | '
        'H: ${analysis.hipAngle.toStringAsFixed(1)}° | '
        'C: ${analysis.ankleAngle.toStringAsFixed(1)}°';
    final confidenceText =
        'Confiance : ${(analysis.confidenceScore * 100).round()}%';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      minVerticalPadding: 12, // assure 44pt avec le contenu
      title: Text(
        formattedDate,
        style: const TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: Color(0xFF1C1C1E),
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 2),
          Text(
            anglesText,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF1C1C1E),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            confidenceText,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF8E8E93),
            ),
          ),
        ],
      ),
      trailing: const Icon(
        CupertinoIcons.chevron_right,
        color: Color(0xFF8E8E93),
        size: 16,
      ),
      onTap: () =>
          context.go('/patients/${analysis.patientId}/analyses/${analysis.id}'),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      '',
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre',
    ];
    final day = date.day;
    final month = months[date.month];
    final year = date.year;
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day $month $year à $hour:$minute';
  }
}
