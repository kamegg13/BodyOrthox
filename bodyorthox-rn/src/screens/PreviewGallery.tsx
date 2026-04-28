import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Dashboard } from "./Dashboard";
import { PatientList } from "./PatientList";
import { PatientDetail, SAMPLE_PATIENT_DETAIL } from "./PatientDetail";
import { NewPatient } from "./NewPatient";
import { Capture } from "./Capture";
import { Processing } from "./Processing";
import { Results, SAMPLE_RESULTS } from "./Results";
import { Report, SAMPLE_REPORT } from "./Report";
import { colors, fonts, fontSize, fontWeight, shadows, spacing } from "../theme/tokens";

const FRAME_W = 390;
const FRAME_H = 844;

interface FrameProps {
  readonly title: string;
  readonly children: React.ReactNode;
}

function Frame({ title, children }: FrameProps) {
  return (
    <View style={styles.frameWrap}>
      <Text style={styles.frameTitle}>{title}</Text>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

export function PreviewGallery() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>BodyOrthox · Refonte design v2</Text>
      <Text style={styles.sub}>8 écrans portés depuis le handoff. Viewport 390×844.</Text>

      <View style={styles.grid}>
        <Frame title="1 · Dashboard">
          <Dashboard />
        </Frame>
        <Frame title="2 · Patient List">
          <PatientList />
        </Frame>
        <Frame title="3 · Patient Detail">
          <PatientDetail data={SAMPLE_PATIENT_DETAIL} />
        </Frame>
        <Frame title="4 · New Patient">
          <NewPatient />
        </Frame>
        <Frame title="5 · Camera Capture">
          <Capture />
        </Frame>
        <Frame title="6 · ML Processing">
          <Processing />
        </Frame>
        <Frame title="7 · Analysis Results">
          <Results data={SAMPLE_RESULTS} />
        </Frame>
        <Frame title="8 · PDF Report">
          <Report data={SAMPLE_REPORT} />
        </Frame>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0C1F35",
  },
  content: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    gap: 24,
  },
  heading: {
    fontFamily: fonts.sans,
    fontSize: 28,
    fontWeight: fontWeight.extraBold,
    color: colors.textInverse,
    letterSpacing: -0.6,
  },
  sub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.body,
    color: "rgba(255,255,255,0.55)",
    marginBottom: spacing.s16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  frameWrap: {
    width: FRAME_W,
    gap: 8,
  },
  frameTitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    backgroundColor: colors.bgCard,
    borderRadius: 32,
    overflow: "hidden",
    ...shadows.lg,
  },
});
