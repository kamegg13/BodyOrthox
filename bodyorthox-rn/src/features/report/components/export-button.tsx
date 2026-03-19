import React, { useState, useCallback } from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Typography } from "../../../shared/design-system/typography";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import { shareReport } from "../data/share-service";

type ExportStatus = "idle" | "sharing" | "error";

interface ExportButtonProps {
  htmlContent: string;
  fileName: string;
  disabled?: boolean;
}

export function ExportButton({
  htmlContent,
  fileName,
  disabled = false,
}: ExportButtonProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePress = useCallback(async () => {
    if (disabled || status === "sharing") return;

    setStatus("sharing");
    setErrorMessage(null);

    const result = await shareReport(htmlContent, fileName);

    if (result.kind === "error") {
      setStatus("error");
      setErrorMessage(result.message);
    } else {
      setStatus("idle");
      setErrorMessage(null);
    }
  }, [htmlContent, fileName, disabled, status]);

  const isDisabled = disabled || status === "sharing";

  return (
    <>
      <Pressable
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isDisabled}
        accessibilityLabel="Exporter le rapport"
        accessibilityRole="button"
        testID="export-button"
      >
        {status === "sharing" ? (
          <ActivityIndicator
            size="small"
            color={Colors.textOnPrimary}
            testID="export-spinner"
          />
        ) : (
          <Text style={[Typography.bodyLarge, styles.buttonText]}>
            Exporter
          </Text>
        )}
      </Pressable>
      {status === "error" && errorMessage && (
        <Text style={styles.errorText} testID="export-error">
          {errorMessage}
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.textOnPrimary,
    fontWeight: "600",
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
