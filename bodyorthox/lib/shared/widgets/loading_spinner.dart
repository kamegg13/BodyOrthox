import 'package:flutter/cupertino.dart';

/// Spinner de chargement unifié — utiliser partout à la place de CircularProgressIndicator.
/// Pattern : switch exhaustif Dart 3 avec AsyncLoading() → LoadingSpinner().
class LoadingSpinner extends StatelessWidget {
  const LoadingSpinner({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CupertinoActivityIndicator(),
    );
  }
}
