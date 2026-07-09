/**
 * Validation d'un fichier image importé (web).
 *
 * L'attribut `accept="image/*"` d'un `<input type="file">` n'est qu'indicatif :
 * l'utilisateur peut forcer la sélection d'un PDF ou d'un fichier volumineux.
 * On valide donc explicitement le type MIME et la taille avant toute lecture,
 * afin d'éviter qu'une data URL non-image fige l'écran sans message.
 */

/** Taille maximale acceptée pour une photo importée (20 Mo). */
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024;

/** Sous-ensemble de l'interface File réellement utilisé pour la validation. */
export interface ValidatableFile {
  readonly type: string;
  readonly size: number;
}

export type ImageFileValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export function validateImageFile(file: ValidatableFile): ImageFileValidation {
  if (!file.type.startsWith("image/")) {
    return {
      ok: false,
      message: "Ce fichier n'est pas une image. Choisissez une photo (JPEG, PNG…).",
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const maxMb = Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024));
    return {
      ok: false,
      message: `L'image est trop volumineuse (max ${maxMb} Mo). Choisissez une photo plus légère.`,
    };
  }

  return { ok: true };
}
