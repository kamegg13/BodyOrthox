import React from "react";
import { ErrorState } from "../../components/ErrorState";

interface ErrorWidgetProps {
  message: string;
  onRetry?: () => void;
  title?: string;
}

/**
 * Wrapper rétro-compat autour du composant navy `ErrorState`.
 * API inchangée (message, onRetry, title) pour les écrans qui l'importent.
 */
export function ErrorWidget({
  message,
  onRetry,
  title = "Une erreur est survenue",
}: ErrorWidgetProps) {
  return (
    <ErrorState
      title={title}
      message={message}
      actionLabel={onRetry ? "Réessayer" : undefined}
      onAction={onRetry}
    />
  );
}
