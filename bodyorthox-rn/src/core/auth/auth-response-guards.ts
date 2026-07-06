/**
 * Gardes structurelles pour les réponses d'authentification du serveur.
 *
 * Les données réseau ne sont jamais dignes de confiance : une réponse malformée
 * ne doit pas fabriquer un `AuthUser` invalide qui plante en aval (par ex.
 * `user.email.split("@")`). Chaque champ requis est vérifié, avec un message
 * d'erreur explicite en français.
 */

import type { AuthUser } from './auth-service';

const VALID_ROLES: ReadonlyArray<AuthUser['role']> = ['admin', 'practitioner'];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Valide la structure d'un `AuthUser` renvoyé par l'API. */
export function parseAuthUser(data: unknown): AuthUser {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Réponse du serveur invalide : utilisateur manquant.');
  }
  const d = data as Record<string, unknown>;

  if (!isNonEmptyString(d.id)) {
    throw new Error('Réponse du serveur invalide : identifiant utilisateur manquant.');
  }
  if (!isNonEmptyString(d.email)) {
    throw new Error('Réponse du serveur invalide : e-mail utilisateur manquant.');
  }
  if (!isNonEmptyString(d.role) || !VALID_ROLES.includes(d.role as AuthUser['role'])) {
    throw new Error('Réponse du serveur invalide : rôle utilisateur inattendu.');
  }
  if (d.firstName !== undefined && typeof d.firstName !== 'string') {
    throw new Error('Réponse du serveur invalide : prénom utilisateur inattendu.');
  }
  if (d.lastName !== undefined && typeof d.lastName !== 'string') {
    throw new Error('Réponse du serveur invalide : nom utilisateur inattendu.');
  }

  return {
    id: d.id,
    email: d.email,
    role: d.role as AuthUser['role'],
    ...(d.firstName !== undefined ? { firstName: d.firstName as string } : {}),
    ...(d.lastName !== undefined ? { lastName: d.lastName as string } : {}),
  };
}

export interface LoginResponse {
  jwt: string;
  refreshToken: string;
  user: AuthUser;
}

/** Valide la réponse de connexion (tokens + utilisateur). */
export function parseLoginResponse(data: unknown): LoginResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Réponse du serveur invalide : connexion.');
  }
  const d = data as Record<string, unknown>;

  if (!isNonEmptyString(d.jwt)) {
    throw new Error("Réponse du serveur invalide : jeton d'authentification manquant.");
  }
  if (!isNonEmptyString(d.refreshToken)) {
    throw new Error('Réponse du serveur invalide : jeton de rafraîchissement manquant.');
  }

  return { jwt: d.jwt, refreshToken: d.refreshToken, user: parseAuthUser(d.user) };
}

/** Valide la réponse de rafraîchissement de session et renvoie le nouveau JWT. */
export function parseRefreshedJwt(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Réponse du serveur invalide : rafraîchissement de session.');
  }
  const jwt = (data as Record<string, unknown>).jwt;
  if (!isNonEmptyString(jwt)) {
    throw new Error("Réponse du serveur invalide : jeton d'authentification manquant.");
  }
  return jwt;
}
