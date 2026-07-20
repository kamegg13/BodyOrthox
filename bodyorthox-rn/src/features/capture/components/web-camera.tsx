import React, {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
  useCallback,
} from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Btn } from "../../../components/Btn";
import { Icon } from "../../../components/icons";
import { colors, fonts, spacing } from "../../../theme/tokens";
import { startLuminositySampling, type LumaCanvas } from "../data/luminosity-sampler";

export interface WebCameraRef {
  takePhoto: () => string | null;
  switchCamera: () => void;
}

interface WebCameraProps {
  onPermissionDenied?: (message: string) => void;
  onReady?: () => void;
  /** Luminosité moyenne (0-255) échantillonnée ~2×/s sur le flux live. Web
   * uniquement — aucune mesure n'est fabriquée sur les plateformes sans
   * flux exploitable. */
  onLuminositySample?: (value: number) => void;
}

export const WebCamera = forwardRef<WebCameraRef, WebCameraProps>(
  function WebCamera({ onPermissionDenied, onReady, onLuminositySample }, ref) {
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
    const onLuminositySampleRef = useRef(onLuminositySample);
    onPermissionDeniedRef.current = onPermissionDenied;
    onReadyRef.current = onReady;
    onLuminositySampleRef.current = onLuminositySample;

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

      let stopLuminositySampling: (() => void) | null = null;

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
            // Canvas hors-écran, jamais attaché au DOM — même idiome que
            // takePhoto() ci-dessus, réutilisé ici pour l'échantillonnage
            // périodique de luminosité (web uniquement, ~2 Hz).
            if (onLuminositySampleRef.current) {
              // `HTMLCanvasElement.getContext("2d")` a un type DOM plus
              // riche (overloads drawImage) que l'interface minimale et
              // portable `LumaCanvas` — même idiome de cast que
              // `containerRef` ci-dessus, la forme réelle est un sur-ensemble
              // compatible à l'exécution.
              const samplingCanvas = document.createElement("canvas") as unknown as LumaCanvas;
              stopLuminositySampling = startLuminositySampling(
                video,
                samplingCanvas,
                (value) => onLuminositySampleRef.current?.(value),
              );
            }
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
        stopLuminositySampling?.();
        stopLuminositySampling = null;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        videoRef.current = null;
        if (container.contains(video)) {
          container.removeChild(video);
        }
      };
    }, [retryKey, facingMode]);

    if (Platform.OS !== "web") {
      return null;
    }

    if (error) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.errorContainer]}>
          <Icon name="alert" size={36} color={colors.red} strokeWidth={1.4} />
          <Text style={styles.errorText}>{error}</Text>
          <Btn
            label="Réessayer"
            onPress={handleRetry}
            full={false}
            style={styles.retryButton}
          />
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
  // Noir instrument (cohérent avec l'écran de capture), pas un gris ad hoc.
  errorContainer: {
    backgroundColor: colors.captureBg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s28,
    gap: spacing.s16,
  },
  errorText: {
    color: colors.red,
    fontFamily: fonts.sans,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    marginTop: spacing.s24,
  },
});
