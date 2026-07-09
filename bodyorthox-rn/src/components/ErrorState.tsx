import React from "react";
import { EmptyState } from "./EmptyState";
import type { IconName } from "./icons";

interface ErrorStateProps {
  readonly message: string;
  readonly title?: string;
  readonly icon?: IconName;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly testID?: string;
}

/**
 * État d'erreur navy : variante « danger » d'EmptyState avec titre par défaut
 * et action primaire (ex. « Réessayer »).
 */
export function ErrorState({
  message,
  title = "Une erreur est survenue",
  icon,
  actionLabel,
  onAction,
  testID,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      message={message}
      icon={icon}
      tone="danger"
      actionLabel={actionLabel}
      actionVariant="primary"
      onAction={onAction}
      testID={testID}
    />
  );
}
