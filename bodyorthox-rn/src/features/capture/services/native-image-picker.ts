// This file exists for TypeScript resolution only.
// React Native resolves .native.ts at runtime; web uses .web.ts.
// Both platform files export the same interface.
export type { ImagePickerResult } from "./native-image-picker.web";
export {
  openNativeCamera,
  openNativeGallery,
  imagePickerResultToDataUrl,
} from "./native-image-picker.web";
