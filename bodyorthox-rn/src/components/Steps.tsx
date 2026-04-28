import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

interface StepsProps {
  readonly total: number;
  readonly current: number;
}

export function Steps({ total, current }: StepsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => {
        const bg =
          i < current ? colors.teal : i === current ? colors.navyMid : colors.bgSubtle;
        return <View key={i} style={[styles.pill, { backgroundColor: bg }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 4,
  },
  pill: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
});
