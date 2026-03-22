import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../../shared/design-system/colors";
import { Spacing } from "../../../shared/design-system/spacing";
import { FontSize, FontWeight } from "../../../shared/design-system/typography";
import { CardShadow } from "../../../shared/design-system/card-styles";

// ---------------------------------------------------------------------------
// localStorage helpers (web-safe)
// ---------------------------------------------------------------------------
function getStoredValue(key: string, fallback: string): string {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key) ?? fallback;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function setStoredValue(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore quota errors
  }
}

function showAlert(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

function showConfirm(title: string, message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ]);
  }
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------
function SectionHeader({ title }: { readonly title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingsRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {children}
    </View>
  );
}

function ProfileInput({
  label,
  storageKey,
  defaultValue,
  placeholder,
}: {
  readonly label: string;
  readonly storageKey: string;
  readonly defaultValue: string;
  readonly placeholder: string;
}) {
  const [value, setValue] = useState(() =>
    getStoredValue(storageKey, defaultValue),
  );

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      setStoredValue(storageKey, text);
    },
    [storageKey],
  );

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <TextInput
        style={styles.rowInput}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        testID={`input-${storageKey}`}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export function AccountScreen() {
  const [patientCount, setPatientCount] = useState<number>(0);
  const [analysisCount, setAnalysisCount] = useState<number>(0);
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);

  useEffect(() => {
    loadCounts();
  }, []);

  async function loadCounts() {
    try {
      const { getDatabase } = await import("../../../core/database/init");
      const db = getDatabase();
      const pResult = await db.execute(
        "SELECT COUNT(*) as count FROM patients",
      );
      const aResult = await db.execute(
        "SELECT COUNT(*) as count FROM analyses",
      );
      setPatientCount(Number(pResult.rows[0]?.["count"] ?? 0));
      setAnalysisCount(Number(aResult.rows[0]?.["count"] ?? 0));
    } catch {
      // DB not ready — keep defaults
    }
  }

  async function handleDeleteAllData() {
    showConfirm(
      "Supprimer toutes les donn\u00E9es",
      "Cette action est irr\u00E9versible. Toutes les donn\u00E9es patients et analyses seront supprim\u00E9es.",
      async () => {
        try {
          const { getDatabase } = await import("../../../core/database/init");
          const db = getDatabase();
          await db.execute("DELETE FROM analyses");
          await db.execute("DELETE FROM patients");
          setPatientCount(0);
          setAnalysisCount(0);
          showAlert(
            "Succ\u00E8s",
            "Toutes les donn\u00E9es ont \u00E9t\u00E9 supprim\u00E9es.",
          );
        } catch {
          showAlert("Erreur", "Impossible de supprimer les donn\u00E9es.");
        }
      },
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID="account-screen"
    >
      <Text style={styles.headerTitle}>Compte</Text>

      {/* PROFIL PRATICIEN */}
      <SectionHeader title="PROFIL PRATICIEN" />
      <View style={styles.card}>
        <ProfileInput
          label="Nom"
          storageKey="practitioner_name"
          defaultValue=""
          placeholder="Dr. Dupont"
        />
        <View style={styles.separator} />
        <ProfileInput
          label="Cabinet"
          storageKey="practitioner_cabinet"
          defaultValue=""
          placeholder="Cabinet d'orthop\u00E9die"
        />
        <View style={styles.separator} />
        <ProfileInput
          label="Sp{'\u00E9'}cialit{'\u00E9'}"
          storageKey="practitioner_specialty"
          defaultValue="Orthop\u00E9die"
          placeholder="Orthop\u00E9die"
        />
      </View>

      {/* ABONNEMENT */}
      <SectionHeader title="ABONNEMENT" />
      <View style={styles.card}>
        <SettingsRow label="Plan actuel">
          <Text style={styles.rowValue}>Freemium</Text>
        </SettingsRow>
        <View style={styles.separator} />
        <SettingsRow label="Analyses restantes">
          <Text style={styles.rowValue}>10/10 ce mois</Text>
        </SettingsRow>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            showAlert(
              "Abonnement",
              "La gestion d'abonnement sera bient\u00F4t disponible.",
            )
          }
          accessibilityRole="button"
          testID="manage-subscription-button"
        >
          <Text style={styles.rowLabelLink}>
            G{"\u00E9"}rer l{"\u2019"}abonnement
          </Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </TouchableOpacity>
      </View>

      {/* SECURITE */}
      <SectionHeader title="S{'\u00C9'}CURIT{'\u00C9'}" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowLabelGroup}>
            <Text style={styles.rowLabel}>Face ID / Touch ID</Text>
            <Text style={styles.rowSubtitle}>Verrouillage automatique</Text>
          </View>
          <Switch
            value={faceIdEnabled}
            onValueChange={setFaceIdEnabled}
            trackColor={{
              false: Colors.border,
              true: Colors.primary,
            }}
            testID="faceid-toggle"
          />
        </View>
      </View>

      {/* DONNEES */}
      <SectionHeader title="DONN{'\u00C9'}ES" />
      <View style={styles.card}>
        <SettingsRow label="Patients">
          <Text style={styles.rowValue}>{patientCount}</Text>
        </SettingsRow>
        <View style={styles.separator} />
        <SettingsRow label="Analyses">
          <Text style={styles.rowValue}>{analysisCount}</Text>
        </SettingsRow>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            showAlert(
              "Exporter",
              "L'export de donn\u00E9es sera disponible prochainement.",
            )
          }
          accessibilityRole="button"
          testID="export-data-button"
        >
          <Text style={styles.rowLabelLink}>
            Exporter toutes les donn{"\u00E9"}es
          </Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={handleDeleteAllData}
          accessibilityRole="button"
          testID="delete-data-button"
        >
          <Text style={styles.rowLabelDestructive}>
            Supprimer toutes les donn{"\u00E9"}es
          </Text>
        </TouchableOpacity>
      </View>

      {/* A PROPOS */}
      <SectionHeader title="{'\u00C0'} PROPOS" />
      <View style={styles.card}>
        <SettingsRow label="Version">
          <Text style={styles.rowValue}>1.0.0 (MVP)</Text>
        </SettingsRow>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            showAlert(
              "Mentions l\u00E9gales",
              "BodyOrthox est un outil d\u2019aide \u00E0 la d\u00E9cision clinique. " +
                "Il ne constitue pas un dispositif m\u00E9dical certifi\u00E9 au sens du r\u00E8glement EU MDR 2017/745. " +
                "Les r\u00E9sultats doivent \u00EAtre valid\u00E9s par un professionnel de sant\u00E9 qualifi\u00E9.",
            )
          }
          accessibilityRole="button"
          testID="legal-button"
        >
          <Text style={styles.rowLabelLink}>Mentions l{"\u00E9"}gales</Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            showAlert(
              "Politique de confidentialit\u00E9",
              "BodyOrthox respecte le R\u00E8glement G\u00E9n\u00E9ral sur la Protection des Donn\u00E9es (RGPD). " +
                "Toutes les donn\u00E9es patients sont stock\u00E9es localement sur votre appareil. " +
                "Aucune donn\u00E9e personnelle n\u2019est transmise \u00E0 des serveurs externes. " +
                "Vous pouvez exporter ou supprimer vos donn\u00E9es \u00E0 tout moment depuis les param\u00E8tres.",
            )
          }
          accessibilityRole="button"
          testID="privacy-button"
        >
          <Text style={styles.rowLabelLink}>
            Politique de confidentialit{"\u00E9"}
          </Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.row}
          onPress={() =>
            showAlert(
              "Contact support",
              "Pour toute question, contactez-nous \u00E0 support@bodyorthox.com",
            )
          }
          accessibilityRole="button"
          testID="contact-button"
        >
          <Text style={styles.rowLabelLink}>Contact support</Text>
          <Text style={styles.chevron}>{"\u203A"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  card: {
    ...CardShadow,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  rowLabel: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    flex: 1,
  },
  rowLabelGroup: {
    flex: 1,
    gap: Spacing.xxs,
  },
  rowSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rowLabelLink: {
    fontSize: FontSize.md,
    color: Colors.primary,
    flex: 1,
  },
  rowLabelDestructive: {
    fontSize: FontSize.md,
    color: Colors.error,
    flex: 1,
  },
  rowValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  rowInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: "right",
    paddingVertical: 0,
    minHeight: 22,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textDisabled,
    fontWeight: "300",
    marginLeft: Spacing.sm,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});
