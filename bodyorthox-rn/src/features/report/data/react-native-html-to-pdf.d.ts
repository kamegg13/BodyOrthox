/**
 * `react-native-html-to-pdf@0.12.0` (pinned — see share-service.native.ts)
 * ships no bundled types, and the `@types/react-native-html-to-pdf` package
 * declares named exports that don't match its actual runtime shape (a
 * default-exported native module object with a `.convert` method). This
 * local declaration reflects the real shape instead.
 */
declare module "react-native-html-to-pdf" {
  export interface Options {
    html: string;
    fileName?: string;
    base64?: boolean;
    directory?: string;
    height?: number;
    width?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    padding?: number;
    bgColor?: string;
    fonts?: string[];
  }

  export interface Pdf {
    filePath?: string;
    base64?: string;
  }

  interface RNHTMLtoPDFModule {
    convert(options: Options): Promise<Pdf>;
  }

  const RNHTMLtoPDF: RNHTMLtoPDFModule;
  export default RNHTMLtoPDF;
}
