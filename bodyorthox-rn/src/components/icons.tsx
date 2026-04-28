/**
 * Iconographie — paths repris du handoff (`screens-shared.jsx → Ic`).
 * Style : 1.5px stroke, rounded line caps, viewBox 16/20px.
 */
import React from "react";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";
import { colors } from "../theme/tokens";

export type IconName =
  | "back"
  | "chevDown"
  | "chevRight"
  | "search"
  | "check"
  | "eye"
  | "mail"
  | "lock"
  | "user"
  | "hospital"
  | "calendar"
  | "grid"
  | "users"
  | "camera"
  | "chart"
  | "settings"
  | "file"
  | "download"
  | "share"
  | "plus"
  | "bell"
  | "flip"
  | "edit";

interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
}

export function Icon({ name, size = 16, color = colors.textPrimary, strokeWidth = 1.5 }: IconProps) {
  const stroke = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };

  switch (name) {
    case "back":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="10 3 5 8 10 13" {...stroke} />
        </Svg>
      );
    case "chevDown":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="3 6 8 11 13 6" {...stroke} />
        </Svg>
      );
    case "chevRight":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="6 3 11 8 6 13" {...stroke} />
        </Svg>
      );
    case "search":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={7} cy={7} r={4.5} {...stroke} />
          <Line x1={10.5} y1={10.5} x2={13.5} y2={13.5} {...stroke} />
        </Svg>
      );
    case "check":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="3 8 6.5 11.5 13 5" {...stroke} />
        </Svg>
      );
    case "eye":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M1 8 C 3 4 5.5 3 8 3 C 10.5 3 13 4 15 8 C 13 12 10.5 13 8 13 C 5.5 13 3 12 1 8 Z" {...stroke} />
          <Circle cx={8} cy={8} r={2} {...stroke} />
        </Svg>
      );
    case "mail":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={2} y={3.5} width={12} height={9} rx={1.5} {...stroke} />
          <Polyline points="2.5 4.5 8 9 13.5 4.5" {...stroke} />
        </Svg>
      );
    case "lock":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={3} y={7} width={10} height={7} rx={1.5} {...stroke} />
          <Path d="M5 7 V 5 a 3 3 0 0 1 6 0 V 7" {...stroke} />
        </Svg>
      );
    case "user":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={8} cy={5.5} r={2.5} {...stroke} />
          <Path d="M3 13.5 a 5 5 0 0 1 10 0" {...stroke} />
        </Svg>
      );
    case "hospital":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={3} y={3} width={10} height={10} rx={1} {...stroke} />
          <Line x1={8} y1={6} x2={8} y2={10} {...stroke} />
          <Line x1={6} y1={8} x2={10} y2={8} {...stroke} />
        </Svg>
      );
    case "calendar":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={2.5} y={3.5} width={11} height={10} rx={1.5} {...stroke} />
          <Line x1={2.5} y1={6.5} x2={13.5} y2={6.5} {...stroke} />
          <Line x1={5.5} y1={2} x2={5.5} y2={5} {...stroke} />
          <Line x1={10.5} y1={2} x2={10.5} y2={5} {...stroke} />
        </Svg>
      );
    case "grid":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={2.5} y={2.5} width={4.5} height={4.5} rx={1} {...stroke} />
          <Rect x={9} y={2.5} width={4.5} height={4.5} rx={1} {...stroke} />
          <Rect x={2.5} y={9} width={4.5} height={4.5} rx={1} {...stroke} />
          <Rect x={9} y={9} width={4.5} height={4.5} rx={1} {...stroke} />
        </Svg>
      );
    case "users":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={6} cy={5.5} r={2.2} {...stroke} />
          <Path d="M2 13 a 4 4 0 0 1 8 0" {...stroke} />
          <Path d="M11 7.5 a 2 2 0 0 0 0 -4" {...stroke} />
          <Path d="M11.5 13 a 4 4 0 0 0 -1.5 -3.2" {...stroke} />
        </Svg>
      );
    case "camera":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Rect x={1.5} y={4} width={13} height={9} rx={1.5} {...stroke} />
          <Path d="M5 4 L 6 2.5 H 10 L 11 4" {...stroke} />
          <Circle cx={8} cy={8.5} r={2.5} {...stroke} />
        </Svg>
      );
    case "chart":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="2 12 6 7.5 9 10 14 4" {...stroke} />
          <Polyline points="10 4 14 4 14 8" {...stroke} />
        </Svg>
      );
    case "settings":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={8} cy={8} r={2} {...stroke} />
          <Path
            d="M8 1.5 L 9.2 3.5 L 11.5 3 L 12 5.3 L 14 6.5 L 13 8.5 L 14 10.5 L 12 11.7 L 11.5 14 L 9.2 13.5 L 8 15.5 L 6.8 13.5 L 4.5 14 L 4 11.7 L 2 10.5 L 3 8.5 L 2 6.5 L 4 5.3 L 4.5 3 L 6.8 3.5 Z"
            {...stroke}
          />
        </Svg>
      );
    case "file":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M4 1.5 H 9 L 12 4.5 V 14 a 0.5 0.5 0 0 1 -0.5 0.5 H 4 a 0.5 0.5 0 0 1 -0.5 -0.5 V 2 a 0.5 0.5 0 0 1 0.5 -0.5 Z" {...stroke} />
          <Polyline points="9 1.5 9 5 12 5" {...stroke} />
          <Line x1={5.5} y1={9} x2={10.5} y2={9} {...stroke} />
          <Line x1={5.5} y1={11.5} x2={10.5} y2={11.5} {...stroke} />
        </Svg>
      );
    case "download":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Line x1={8} y1={2} x2={8} y2={10} {...stroke} />
          <Polyline points="4.5 7 8 10.5 11.5 7" {...stroke} />
          <Line x1={3} y1={13.5} x2={13} y2={13.5} {...stroke} />
        </Svg>
      );
    case "share":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Circle cx={4} cy={8} r={1.8} {...stroke} />
          <Circle cx={12} cy={4} r={1.8} {...stroke} />
          <Circle cx={12} cy={12} r={1.8} {...stroke} />
          <Line x1={5.5} y1={7} x2={10.5} y2={4.7} {...stroke} />
          <Line x1={5.5} y1={9} x2={10.5} y2={11.3} {...stroke} />
        </Svg>
      );
    case "plus":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Line x1={8} y1={3} x2={8} y2={13} {...stroke} />
          <Line x1={3} y1={8} x2={13} y2={8} {...stroke} />
        </Svg>
      );
    case "bell":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M3.5 11 H 12.5 L 11.5 9.5 V 7 a 3.5 3.5 0 1 0 -7 0 V 9.5 Z" {...stroke} />
          <Path d="M6.5 12.5 a 1.5 1.5 0 0 0 3 0" {...stroke} />
        </Svg>
      );
    case "flip":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Polyline points="3 6 5 4 7 6" {...stroke} />
          <Path d="M5 4 H 11 a 2 2 0 0 1 2 2" {...stroke} />
          <Polyline points="13 10 11 12 9 10" {...stroke} />
          <Path d="M11 12 H 5 a 2 2 0 0 1 -2 -2" {...stroke} />
        </Svg>
      );
    case "edit":
      return (
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <Path d="M11 2.5 L 13.5 5 L 5 13.5 L 2.5 13.5 L 2.5 11 Z" {...stroke} />
          <Line x1={9.5} y1={4} x2={12} y2={6.5} {...stroke} />
        </Svg>
      );
    default:
      return null;
  }
}
