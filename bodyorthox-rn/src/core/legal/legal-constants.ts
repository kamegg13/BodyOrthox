/**
 * Constantes légales partagées.
 * Toute mention légale affichée à l'utilisateur DOIT venir de ce module.
 * Never inline disclaimer text — always reference this module.
 *
 * Positionnement non-DM (règlement UE 2017/745) : BodyOrthox est un outil de
 * mesure et de documentation. La formulation ci-dessous évite volontairement
 * tout vocabulaire d'« aide à la décision clinique » (déclencheur Règle 11)
 * et n'insinue pas un statut de DM « non certifié » —
 * cf. docs/audit-rgpd-dm-2026-07-17.md (DM-4).
 */
export const LEGAL_CONSTANTS = {
  mdrDisclaimer:
    "BodyOrthox est un outil de mesure et de documentation. " +
    "Il ne constitue pas un dispositif médical : il ne fournit " +
    "ni diagnostic, ni recommandation de traitement, et ne se " +
    "substitue pas au jugement d'un professionnel qualifié.",
} as const;
