import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  useCallback,
} from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";

export interface WebCameraRef {
  takePhoto: () => string | null;
  switchCamera: () => void;
}

interface WebCameraProps {
  onPermissionDenied?: (message: string) => void;
  onReady?: () => void;
}

export const WebCamera = forwardRef<WebCameraRef, WebCameraProps>(
  function WebCamera({ onPermissionDenied, onReady }, ref) {
    const containerRef = useRef<View>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryKey, setRetryKey] = useState(0);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    const handleRetry = useCallback(() => {
      setError(null);
      setRetryKey((k) => k + 1);
    }, []);

    const switchCamera = useCallback(() => {
      setError(null);
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
    }, []);

    const takePhoto = useCallback((): string | null => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.9);
    }, []);

    useImperativeHandle(ref, () => ({ takePhoto, switchCamera }), [takePhoto, switchCamera]);

    // Store callbacks in refs to avoid re-running the effect when they change
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    const onReadyRef = useRef(onReady);
    onPermissionDeniedRef.current = onPermissionDenied;
    onReadyRef.current = onReady;

    useEffect(() => {
      if (Platform.OS !== "web") return;

      const container = containerRef.current as unknown as HTMLDivElement;
      if (!container) return;

      const video = document.createElement("video");
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.width = "100%";
      video.style.height = "100%";
      video.style.objectFit = "cover";
      container.appendChild(video);
      videoRef.current = video;

      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          streamRef.current = stream;
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            onReadyRef.current?.();
          };
        })
        .catch((err) => {
          const message =
            err.name === "NotAllowedError"
              ? "Accès caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
              : err.name === "NotFoundError"
                ? "Aucune caméra détectée sur cet appareil."
                : `Erreur caméra : ${err.message}`;
          setError(message);
          onPermissionDeniedRef.current?.(message);
        });

      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        videoRef.current = null;
        if (container.contains(video)) {
          container.removeChild(video);
        }
      };
    }, [retryKey, facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

    if (Platform.OS !== "web") {
      return null;
    }

    if (error) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View
        ref={containerRef}
        style={StyleSheet.absoluteFill}
        testID="web-camera"
      />
    );
  },
);

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: Colors.darkGrey,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  retryText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
