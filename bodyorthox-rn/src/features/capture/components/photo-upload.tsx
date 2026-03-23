import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";

interface PhotoUploadProps {
  onPhotoSelected: (dataUrl: string) => void;
}

/**
 * Photo upload for web — renders a native HTML label+input.
 * Uses a raw DOM div instead of React Native View to avoid
 * react-native-web event interception issues.
 */
export function PhotoUpload({ onPhotoSelected }: PhotoUploadProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onPhotoSelected);
  callbackRef.current = onPhotoSelected;

  useEffect(() => {
    if (Platform.OS !== "web") return;

    // Create a raw div outside React Native Web's control
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-testid", "photo-upload-button");
    wrapper.style.width = "100%";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.marginTop = "12px";

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.id = "bo-photo-input";
    input.style.display = "none";

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          callbackRef.current(result);
        }
      };
      reader.readAsDataURL(file);
      input.value = "";
    });

    const label = document.createElement("label");
    label.htmlFor = "bo-photo-input";
    label.textContent = "📁 Importer une photo";
    Object.assign(label.style, {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "12px 24px",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: "12px",
      color: "rgba(200,200,210,0.9)",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      userSelect: "none",
    });

    wrapper.appendChild(input);
    wrapper.appendChild(label);

    // Insert into the controls area (parent of this component's mount point)
    divRef.current = wrapper;

    // Find the controls container and append
    const controls = document.querySelector('[data-testid="capture-controls"]');
    if (controls) {
      controls.appendChild(wrapper);
    } else {
      // Fallback: append to body and position
      document.body.appendChild(wrapper);
    }

    return () => {
      if (wrapper.parentElement) {
        wrapper.parentElement.removeChild(wrapper);
      }
    };
  }, []);

  // Render nothing — the DOM is managed manually
  return null;
}
