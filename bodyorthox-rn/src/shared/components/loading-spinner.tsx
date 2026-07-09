import React from "react";
import { LoadingState } from "../../components/LoadingState";

interface LoadingSpinnerProps {
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
}

/**
 * Wrapper rétro-compat autour du composant navy `LoadingState`.
 * API inchangée (message, size, fullScreen) pour les écrans qui l'importent.
 */
export function LoadingSpinner({
  message,
  size = "large",
  fullScreen = false,
}: LoadingSpinnerProps) {
  return <LoadingState message={message} size={size} fullScreen={fullScreen} />;
}
