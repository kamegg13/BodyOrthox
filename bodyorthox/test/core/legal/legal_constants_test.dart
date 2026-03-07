// Tests unitaires — LegalConstants.
// Story 1.1 : Règle architecturale — disclaimer EU MDR centralisé.
// INTERDIT : texte inline dans widgets ou PDF generator.

import 'package:flutter_test/flutter_test.dart';
import 'package:bodyorthox/core/legal/legal_constants.dart';

void main() {
  group('LegalConstants.mdrDisclaimer', () {
    test('est non-vide', () {
      expect(LegalConstants.mdrDisclaimer, isNotEmpty);
    });

    test('est une String (type check)', () {
      expect(LegalConstants.mdrDisclaimer, isA<String>());
    });

    test('contient la mention "outil de documentation clinique" (EU MDR)', () {
      expect(
        LegalConstants.mdrDisclaimer,
        contains('outil de documentation clinique'),
      );
    });

    test('contient la mention de non-substitution au jugement clinique', () {
      expect(
        LegalConstants.mdrDisclaimer,
        contains('jugement'),
      );
    });

    test('ne contient pas "diagnostic" sans le contexte de négation (EU MDR safety)', () {
      // Le disclaimer DOIT nier explicitement l'acte de diagnostic
      expect(LegalConstants.mdrDisclaimer, contains('ne constituent pas'));
    });

    test('contient "BodyOrthox" (identification du produit)', () {
      expect(LegalConstants.mdrDisclaimer, contains('BodyOrthox'));
    });

    test('est const (compilé à la compilation, pas de runtime overhead)', () {
      // Vérifie que la constante est accessible sans instanciation
      const disclaimer = LegalConstants.mdrDisclaimer;
      expect(disclaimer, isNotEmpty);
    });
  });
}
