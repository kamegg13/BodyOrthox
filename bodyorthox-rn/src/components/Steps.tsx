import React from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

interface StepsProps {
  readonly total: number;
  readonly current: number;
  /** Préfixe de testID : le conteneur reçoit `testID`, chaque segment `${testID}-${i}`. */
  readonly testID?: string;
}

export function Steps({ total, current, testID }: StepsProps) {
  return (
    <View style={styles.row} testID={testID}>
      {Array.from({ length: total }, (_, i) => {
        // Graduation : franchis = accent, actif = encre, à venir = hairline.
        const bg =
          i < current ? colors.accent : i === current ? colors.ink : colors.border;
        return (
          <View
            key={i}
            style={[styles.pill, { backgroundColor: bg }]}
            testID={testID ? `${testID}-${i}` : undefined}
          />
        );
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
  },
});
