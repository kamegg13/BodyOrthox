import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../domain/patient.dart';
import '../../domain/morphological_profile.dart';
import '../../../../shared/design_system/app_colors.dart';
import '../../../../shared/design_system/app_spacing.dart';

class PatientListTile extends StatelessWidget {
  const PatientListTile({super.key, required this.patient});

  final Patient patient;

  @override
  Widget build(BuildContext context) {
    final formattedDate = _formatDate(patient.dateOfBirth);
    final profileLabel = _profileLabel(patient.morphologicalProfile);

    return Semantics(
      label:
          'Patient : ${patient.name}, né le $formattedDate. Bouton : ouvrir la fiche patient.',
      button: true,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.margin,
        ),
        minVerticalPadding: 12, // assure 44pt avec le contenu
        title: Text(
          patient.name,
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        subtitle: Text(
          '$formattedDate · $profileLabel',
          style: const TextStyle(fontSize: 14, color: Color(0xFF8E8E93)),
        ),
        trailing: const Icon(
          CupertinoIcons.chevron_right,
          color: Color(0xFF8E8E93),
          size: 16,
        ),
        onTap: () => context.go('/patients/${patient.id}'),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    return '$day/$month/${date.year}';
  }

  String _profileLabel(MorphologicalProfile profile) {
    return switch (profile) {
      MorphologicalProfile.standard => 'Standard',
      MorphologicalProfile.obese => 'Obèse',
      MorphologicalProfile.pediatric => 'Pédiatrique',
      MorphologicalProfile.elderly => 'Sénior',
    };
  }
}
