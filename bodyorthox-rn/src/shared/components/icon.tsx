/**
 * BodyOrthox – Icônes SVG unifiées
 * Un seul composant, toutes les icônes déclarées ici.
 * Remplace les emojis éparpillés dans l'app.
 */
import React from "react";
import Svg, { Path, Circle, Rect, Polyline, Line } from "react-native-svg";
import { Colors } from "../design-system/colors";

export type IconName =
  | "clipboard"
  | "document"
  | "user"
  | "play"
  | "edit"
  | "plus"
  | "chevron-right"
  | "check-circle"
  | "alert-circle"
  | "camera"
  | "share"
  | "arrow-left"
  | "trending-up";

interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  color = Colors.textPrimary,
  strokeWidth = 1.75,
}: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "clipboard":
      return (
        <Svg {...props}>
          <Rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
          <Path d="M17 4h1a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" />
          <Path d="M9 12h6M9 16h6" />
        </Svg>
      );

    case "document":
      return (
        <Svg {...props}>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <Polyline points="14,2 14,8 20,8" />
          <Line x1="16" y1="13" x2="8" y2="13" />
          <Line x1="16" y1="17" x2="8" y2="17" />
          <Polyline points="10,9 9,9 8,9" />
        </Svg>
      );

    case "user":
      return (
        <Svg {...props}>
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx="12" cy="7" r="4" />
        </Svg>
      );

    case "play":
      return (
        <Svg {...props}>
          <Polyline points="5,3 19,12 5,21 5,3" />
        </Svg>
      );

    case "edit":
      return (
        <Svg {...props}>
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </Svg>
      );

    case "plus":
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );

    case "chevron-right":
      return (
        <Svg {...props}>
          <Polyline points="9,18 15,12 9,6" />
        </Svg>
      );

    case "check-circle":
      return (
        <Svg {...props}>
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <Polyline points="22,4 12,14.01 9,11.01" />
        </Svg>
      );

    case "alert-circle":
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="8" x2="12" y2="12" />
          <Line x1="12" y1="16" x2="12.01" y2="16" />
        </Svg>
      );

    case "camera":
      return (
        <Svg {...props}>
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <Circle cx="12" cy="13" r="4" />
        </Svg>
      );

    case "share":
      return (
        <Svg {...props}>
          <Circle cx="18" cy="5" r="3" />
          <Circle cx="6" cy="12" r="3" />
          <Circle cx="18" cy="19" r="3" />
          <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </Svg>
      );

    case "arrow-left":
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12,19 5,12 12,5" />
        </Svg>
      );

    case "trending-up":
      return (
        <Svg {...props}>
          <Polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
          <Polyline points="17,6 23,6 23,12" />
        </Svg>
      );

    default:
      return null;
  }
}
