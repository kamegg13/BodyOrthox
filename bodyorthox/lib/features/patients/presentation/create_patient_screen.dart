import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/design_system/app_colors.dart';
import '../../../shared/design_system/app_spacing.dart';
import '../application/patients_notifier.dart';
import '../domain/morphological_profile.dart';

/// Écran de création d'un profil patient.
///
/// AC1 : saisie nom + date de naissance + profil → persistance Drift AES-256
/// AC4 : validation inline — "Nom requis" affiché sous le champ
/// AC5 : persistance via patientsProvider.notifier.createPatient()
/// [Source: docs/implementation-artifacts/2-1-creer-un-profil-patient.md#T5]
class CreatePatientScreen extends ConsumerStatefulWidget {
  const CreatePatientScreen({super.key});

  @override
  ConsumerState<CreatePatientScreen> createState() => _CreatePatientScreenState();
}

class _CreatePatientScreenState extends ConsumerState<CreatePatientScreen> {
  final _nameController = TextEditingController();
  DateTime _dateOfBirth = DateTime(1980, 1, 1);
  MorphologicalProfile _profile = MorphologicalProfile.standard;
  bool _showNameError = false;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _onConfirm() async {
    final name = _nameController.text;
    if (name.trim().isEmpty) {
      setState(() => _showNameError = true);
      return;
    }

    setState(() {
      _showNameError = false;
      _isLoading = true;
    });

    try {
      await ref.read(patientsProvider.notifier).createPatient(
            name: name,
            dateOfBirth: _dateOfBirth,
            morphologicalProfile: _profile,
          );
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        // Afficher une erreur générique si la persistance échoue
        showCupertinoDialog(
          context: context,
          builder: (_) => CupertinoAlertDialog(
            title: const Text('Erreur'),
            content: Text('Impossible de créer le patient : $e'),
            actions: [
              CupertinoDialogAction(
                child: const Text('OK'),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return CupertinoPageScaffold(
      backgroundColor: AppColors.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.surface,
        middle: const Text('Nouveau patient'),
        leading: CupertinoButton(
          padding: EdgeInsets.zero,
          child: const Text('Annuler'),
          onPressed: () => context.pop(),
        ),
      ),
      child: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.margin),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Nom ───────────────────────────────────────────────────────
              const Text(
                'Nom complet',
                style: TextStyle(
                  fontSize: 13,
                  color: CupertinoColors.secondaryLabel,
                ),
              ),
              const SizedBox(height: AppSpacing.base),
              CupertinoTextField(
                controller: _nameController,
                placeholder: 'Ex : Jean Dupont',
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.margin,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: CupertinoColors.tertiarySystemFill,
                  borderRadius: BorderRadius.circular(8),
                  border: _showNameError
                      ? Border.all(color: AppColors.error, width: 1.5)
                      : null,
                ),
                onChanged: (_) {
                  if (_showNameError) setState(() => _showNameError = false);
                },
              ),
              if (_showNameError) ...[
                const SizedBox(height: 4),
                const Text(
                  'Nom requis',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.error,
                  ),
                ),
              ],

              const SizedBox(height: AppSpacing.large),

              // ── Date de naissance ─────────────────────────────────────────
              const Text(
                'Date de naissance',
                style: TextStyle(
                  fontSize: 13,
                  color: CupertinoColors.secondaryLabel,
                ),
              ),
              const SizedBox(height: AppSpacing.base),
              SizedBox(
                height: 180,
                child: CupertinoDatePicker(
                  mode: CupertinoDatePickerMode.date,
                  initialDateTime: _dateOfBirth,
                  maximumDate: DateTime.now(),
                  minimumYear: 1900,
                  onDateTimeChanged: (date) {
                    setState(() => _dateOfBirth = date);
                  },
                ),
              ),

              const SizedBox(height: AppSpacing.large),

              // ── Profil morphologique ──────────────────────────────────────
              const Text(
                'Profil morphologique',
                style: TextStyle(
                  fontSize: 13,
                  color: CupertinoColors.secondaryLabel,
                ),
              ),
              const SizedBox(height: AppSpacing.base),
              CupertinoSegmentedControl<MorphologicalProfile>(
                groupValue: _profile,
                children: const {
                  MorphologicalProfile.standard: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Text('Standard', style: TextStyle(fontSize: 12)),
                  ),
                  MorphologicalProfile.obese: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Text('Obèse', style: TextStyle(fontSize: 12)),
                  ),
                  MorphologicalProfile.pediatric: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Text('Pédia.', style: TextStyle(fontSize: 12)),
                  ),
                  MorphologicalProfile.elderly: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    child: Text('Sénior', style: TextStyle(fontSize: 12)),
                  ),
                },
                onValueChanged: (v) => setState(() => _profile = v),
              ),

              const SizedBox(height: AppSpacing.xlarge),

              // ── Bouton de confirmation ────────────────────────────────────
              SizedBox(
                width: double.infinity,
                height: AppSpacing.touchTarget,
                child: CupertinoButton.filled(
                  onPressed: _isLoading ? null : _onConfirm,
                  child: _isLoading
                      ? const CupertinoActivityIndicator(color: Colors.white)
                      : const Text('Créer le patient'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
