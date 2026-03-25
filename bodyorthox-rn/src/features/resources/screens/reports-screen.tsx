import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing, BorderRadius } from "../../../shared/design-system/spacing";
import {
  FontSize,
  FontWeight,
  Typography,
} from "../../../shared/design-system/typography";
import { CardShadow } from "../../../shared/design-system/card-styles";
import { LoadingSpinner } from "../../../shared/components/loading-spinner";

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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            showAlert(
              "Générer PDF",
              "La génération de PDF sera disponible prochainement.",
            )
          }
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>Générer PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={() =>
            showAlert("Partager", "Le partage sera disponible prochainement.")
          }
          accessibilityRole="button"
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, styles.shareText]}>Partager</Text>
        </TouchableOpacity>
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
          <Text style={[Typography.h3, styles.emptyTitle]}>
            Aucun rapport généré
          </Text>
          <Text style={[Typography.body, styles.emptySubtitle]}>
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
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  card: {
    ...CardShadow,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardInfo: {
    gap: Spacing.xxs,
  },
  patientName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textOnPrimary,
  },
  shareButton: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  shareText: {
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
