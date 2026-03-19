/**
 * Legal constants for EU MDR compliance.
 * These constants MUST be used everywhere a legal disclaimer is needed.
 * Never inline disclaimer text — always reference this module.
 */
export const LEGAL_CONSTANTS = {
  mdrDisclaimer:
    "BodyOrthox est un outil de documentation clinique. " +
    "Les donnees produites ne constituent pas un acte de " +
    "diagnostic medical et ne se substituent pas au jugement " +
    "clinique du praticien.",
} as const;
