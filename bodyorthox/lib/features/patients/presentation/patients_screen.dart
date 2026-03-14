import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart' show Divider, Material, Colors;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../shared/design_system/app_colors.dart';
import '../application/patients_notifier.dart';
import '../domain/patient.dart';
import 'widgets/patient_list_tile.dart';

/// Écran liste des patients — point d'entrée principal de la feature patients.
///
/// AC1 : champ de recherche filtrant la liste par nom (debounce 200ms).
/// AC2 : apparition immédiate du patient après création (stream réactif Drift).
/// AC3 : état vide — invite à créer le premier patient.
/// AC5 : sélection d'un patient navigue vers sa fiche (/patients/:id).
class PatientsScreen extends ConsumerStatefulWidget {
  const PatientsScreen({super.key});

  @override
  ConsumerState<PatientsScreen> createState() => _PatientsScreenState();
}

class _PatientsScreenState extends ConsumerState<PatientsScreen> {
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 200), () {
      ref.read(patientsProvider.notifier).filterByName(query);
    });
  }

  @override
  Widget build(BuildContext context) {
    final patientsState = ref.watch(patientsProvider);

    return CupertinoPageScaffold(
      backgroundColor: AppColors.surface,
      navigationBar: CupertinoNavigationBar(
        backgroundColor: AppColors.surface,
        middle: const Text('Patients'),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          onPressed: () => context.push('/patients/create'),
          child: const Icon(CupertinoIcons.add, color: AppColors.primary),
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: CupertinoSearchTextField(
                controller: _searchController,
                placeholder: 'Rechercher un patient',
                onChanged: _onSearchChanged,
                onSuffixTap: () {
                  _searchController.clear();
                  _debounce?.cancel();
                  ref.read(patientsProvider.notifier).filterByName('');
                },
              ),
            ),
            Expanded(
              child: switch (patientsState) {
                // Switch exhaustif Dart 3 — interdit : .when()
                AsyncData(:final value) when value.isEmpty =>
                  _EmptyPatientsView(onCreateTap: () => context.push('/patients/create')),
                AsyncData(:final value) => _PatientListView(patients: value),
                AsyncLoading() => const Center(child: CupertinoActivityIndicator()),
                AsyncError(:final error) => Center(
                    child: Text(
                      'Erreur : $error',
                      style: const TextStyle(color: AppColors.error),
                    ),
                  ),
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPatientsView extends StatelessWidget {
  const _EmptyPatientsView({required this.onCreateTap});

  final VoidCallback onCreateTap;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(CupertinoIcons.person_2, size: 64, color: CupertinoColors.systemGrey3),
          const SizedBox(height: 16),
          const Text(
            'Aucun patient',
            style: TextStyle(
              fontSize: 17,
              color: CupertinoColors.secondaryLabel,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Appuyez sur + pour créer le premier profil',
            style: TextStyle(
              fontSize: 13,
              color: CupertinoColors.tertiaryLabel,
            ),
          ),
          const SizedBox(height: 24),
          CupertinoButton(
            onPressed: onCreateTap,
            child: const Text('Créer un patient'),
          ),
        ],
      ),
    );
  }
}

class _PatientListView extends StatelessWidget {
  const _PatientListView({required this.patients});

  final List<Patient> patients;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: ListView.separated(
        itemCount: patients.length,
        separatorBuilder: (_, __) => const Divider(height: 1, indent: 16),
        itemBuilder: (context, index) => PatientListTile(patient: patients[index]),
      ),
    );
  }
}
