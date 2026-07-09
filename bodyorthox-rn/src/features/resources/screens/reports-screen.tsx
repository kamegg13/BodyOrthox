import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Btn } from "../../../components/Btn";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  radius,
  shadows,
  spacing,
} from "../../../theme/tokens";

interface ReportRow {
  readonly id: string;
  readonly patientName: string;
  readonly date: string;
  readonly hkaAngle: number | null;
}

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate() < 10 ? `0${d.getDate()}` : String(d.getDate());
    const month =
      d.getMonth() + 1 < 10 ? `0${d.getMonth() + 1}` : String(d.getMonth() + 1);
    return `${day}/${month}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function ReportItem({ item }: { readonly item: ReportRow }) {
  return (
    <View style={styles.card} testID={`report-row-${item.id}`}>
      <View style={styles.cardInfo}>
        <Text style={styles.patientName} numberOfLines={1}>
          {item.patientName}
        </Text>
        <Text style={styles.meta}>
          {formatDate(item.date)}
          {item.hkaAngle != null ? ` · HKA ${item.hkaAngle}°` : ""}
        </Text>
      </View>
      <View style={styles.actions}>
        <Btn
          label="Générer PDF"
          onPress={() =>
            showAlert(
              "Générer PDF",
              "La génération de PDF sera disponible prochainement.",
            )
          }
          small
          full={false}
          style={styles.actionButton}
        />
        <Btn
          label="Partager"
          variant="secondary"
          onPress={() =>
            showAlert("Partager", "Le partage sera disponible prochainement.")
          }
          small
          full={false}
          style={styles.actionButton}
        />
      </View>
    </View>
  );
}

export function ReportsScreen() {
  const [reports, setReports] = useState<readonly ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const { getDatabase } = await import("../../../core/database/init");
      const db = getDatabase();

      const analysesResult = await db.execute(
        "SELECT a.id, a.patient_id, a.hka_angle, a.created_at, p.name as patient_name " +
          "FROM analyses a LEFT JOIN patients p ON a.patient_id = p.id " +
          "ORDER BY a.created_at DESC",
      );

      const rows: ReportRow[] = analysesResult.rows.map((row) => ({
        id: String(row["id"] ?? ""),
        patientName: String(row["patient_name"] ?? row["name"] ?? "Patient"),
        date: String(row["created_at"] ?? ""),
        hkaAngle: row["hka_angle"] != null ? Number(row["hka_angle"]) : null,
      }));

      setReports(rows);
    } catch {
      // DB not initialized or no data — show empty state
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LoadingSpinner message="Chargement des rapports..." />
      </View>
    );
  }

  return (
    <View style={styles.container} testID="reports-screen">
      <Text style={styles.headerTitle}>Rapports PDF</Text>

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Aucun rapport généré</Text>
          <Text style={styles.emptySubtitle}>
            Réalisez une analyse pour créer votre premier rapport.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportItem item={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          testID="reports-list"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.s16,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.s16,
  },
  list: {
    gap: spacing.s10,
    paddingBottom: spacing.s28,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.cardLg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    padding: spacing.s16,
    gap: spacing.s10,
  },
  cardInfo: {
    gap: 2,
  },
  patientName: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: fontSize.monoMd,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.s10,
  },
  actionButton: {
    flexGrow: 0,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s16,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.bodyLg,
    fontWeight: fontWeight.regular,
    color: colors.textSecond,
    textAlign: "center",
  },
});
