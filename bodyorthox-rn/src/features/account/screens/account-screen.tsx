import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Screen } from "../../../components/Screen";
import { SectionLabel } from "../../../components/SectionLabel";
import { ListRow } from "../../../components/ListRow";
import { Field } from "../../../components/Field";
import { Card } from "../../../components/Card";
import {
  colors,
  fonts,
  fontSize,
  fontWeight,
  sizes,
  spacing,
} from "../../../theme/tokens";
import { useAuthStore } from "../../../core/auth/auth-store";
import { useFeedbackStore } from "../../feedback/store/feedback-store";
import {
  isBiometricLockEnabled,
  setBiometricLockEnabled,
} from "../../../core/security/biometric-lock-setting";

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
// Local building blocks
// ---------------------------------------------------------------------------
/** Séparateur fin entre deux `ListRow` d'un même groupe. */
function RowDivider() {
  return <View style={styles.divider} />;
}

/** Champ profil praticien persisté dans le localStorage (web-safe). */
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
    <Field
      label={label}
      value={value}
      onChangeText={handleChange}
      placeholder={placeholder}
      testID={`input-${storageKey}`}
    />
  );
}

/** Ligne informative non interactive (label + sous-texte), même gabarit que `SwitchRow`. */
function InfoRow({
  label,
  subtitle,
  testID,
}: {
  readonly label: string;
  readonly subtitle: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.switchRow} testID={testID}>
      <View style={styles.switchLabelGroup}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** Ligne à interrupteur (Face ID / Touch ID). */
function SwitchRow({
  label,
  subtitle,
  value,
  onValueChange,
  testID,
}: {
  readonly label: string;
  readonly subtitle?: string;
  readonly value: boolean;
  readonly onValueChange: (v: boolean) => void;
  readonly testID?: string;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchLabelGroup}>
        <Text style={styles.switchLabel}>{label}</Text>
        {subtitle ? <Text style={styles.switchSubtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.borderMid, true: colors.accent }}
        testID={testID}
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
  const [faceIdEnabled, setFaceIdEnabled] = useState(() =>
    isBiometricLockEnabled(),
  );
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const openFeedback = useFeedbackStore((s) => s.openModal);
  const navigation = useNavigation<any>();

  const handleToggleBiometricLock = useCallback((next: boolean) => {
    setFaceIdEnabled(next);
    setBiometricLockEnabled(next);
  }, []);

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
      "Supprimer toutes les données",
      "Cette action est irréversible. Toutes les données patients et analyses seront supprimées.",
      async () => {
        try {
          const { getDatabase } = await import("../../../core/database/init");
          const db = getDatabase();
          await db.execute("DELETE FROM analyses");
          await db.execute("DELETE FROM patients");
          setPatientCount(0);
          setAnalysisCount(0);
          showAlert("Succès", "Toutes les données ont été supprimées.");
        } catch {
          showAlert("Erreur", "Impossible de supprimer les données.");
        }
      },
    );
  }

  function handleLogout() {
    showConfirm("Déconnexion", "Voulez-vous vous déconnecter ?", () => {
      logout();
    });
  }

  return (
    <Screen title="Compte">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="account-screen"
      >
        {/* COMPTE — optionnel : les données vivent en local, le compte ne sert
            qu'aux sauvegardes chiffrées (à venir). */}
        <SectionLabel>Compte</SectionLabel>
        <Card style={styles.group}>
          {isAuthenticated ? (
            <>
              <ListRow
                label="Email"
                value={user?.email ?? "—"}
                chevron={false}
              />
              <RowDivider />
              <ListRow
                label="Rôle"
                value={user?.role === "admin" ? "Administrateur" : "Praticien"}
                chevron={false}
              />
              {user?.role === "admin" ? (
                <>
                  <RowDivider />
                  <ListRow
                    label="Administration des comptes"
                    onPress={() => navigation.navigate("Admin")}
                    testID="admin-button"
                  />
                  <RowDivider />
                  <ListRow
                    label="Calibration HKA"
                    onPress={() => navigation.navigate("Calibration")}
                    testID="calibration-button"
                  />
                </>
              ) : (
                <>
                  <RowDivider />
                  <InfoRow
                    label="Calibration HKA"
                    subtitle="Gérée par votre administrateur — contactez-le pour la modifier."
                    testID="calibration-admin-only-info"
                  />
                </>
              )}
              <RowDivider />
              <ListRow
                label="Se déconnecter"
                destructive
                onPress={handleLogout}
                testID="logout-button"
              />
            </>
          ) : (
            <>
              <InfoRow
                label="Non connecté"
                subtitle="Vos données sont enregistrées uniquement sur cet appareil. La connexion activera les sauvegardes chiffrées (à venir)."
                testID="account-signed-out-info"
              />
              <RowDivider />
              <ListRow
                label="Se connecter"
                onPress={() => navigation.navigate("Login")}
                testID="login-button"
              />
            </>
          )}
        </Card>

        {/* PROFIL PRATICIEN */}
        <SectionLabel>Profil praticien</SectionLabel>
        <View style={styles.fields}>
          <ProfileInput
            label="Nom"
            storageKey="practitioner_name"
            defaultValue=""
            placeholder="Dr. Dupont"
          />
          <ProfileInput
            label="Cabinet"
            storageKey="practitioner_cabinet"
            defaultValue=""
            placeholder="Nom du cabinet / structure"
          />
          <ProfileInput
            label="Spécialité"
            storageKey="practitioner_specialty"
            defaultValue=""
            placeholder="Ex. préparation physique, posturologie…"
          />
        </View>

        {/* ABONNEMENT */}
        <SectionLabel>Abonnement</SectionLabel>
        <Card style={styles.group}>
          <ListRow label="Plan actuel" value="Freemium" chevron={false} />
          <RowDivider />
          <ListRow
            label="Analyses restantes"
            value="10/10 ce mois"
            chevron={false}
          />
          <RowDivider />
          <ListRow
            label="Gérer l'abonnement"
            onPress={() =>
              showAlert(
                "Abonnement",
                "La gestion d'abonnement sera bientôt disponible.",
              )
            }
            testID="manage-subscription-button"
          />
        </Card>

        {/* SÉCURITÉ */}
        <SectionLabel>Sécurité</SectionLabel>
        <Card style={styles.group}>
          <SwitchRow
            label="Face ID / Touch ID"
            subtitle="Verrouiller l'accès à l'app (les données restent chiffrées)"
            value={faceIdEnabled}
            onValueChange={handleToggleBiometricLock}
            testID="faceid-toggle"
          />
        </Card>

        {/* DONNÉES */}
        <SectionLabel>Données</SectionLabel>
        <Card style={styles.group}>
          <ListRow label="Patients" value={String(patientCount)} chevron={false} />
          <RowDivider />
          <ListRow
            label="Analyses"
            value={String(analysisCount)}
            chevron={false}
          />
          <RowDivider />
          <ListRow
            label="Exporter toutes les données"
            onPress={() =>
              showAlert(
                "Exporter",
                "L'export de données sera disponible prochainement.",
              )
            }
            testID="export-data-button"
          />
          <RowDivider />
          <ListRow
            label="Supprimer toutes les données"
            destructive
            onPress={handleDeleteAllData}
            testID="delete-data-button"
          />
        </Card>

        {/* À PROPOS */}
        <SectionLabel>À propos</SectionLabel>
        <Card style={styles.group}>
          <ListRow label="Version" value="1.0.0 (MVP)" chevron={false} />
          <RowDivider />
          <ListRow
            label="Revoir l'introduction"
            onPress={() => navigation.navigate("Onboarding", { mode: "review" })}
            testID="review-onboarding-button"
          />
          <RowDivider />
          <ListRow
            label="Mentions légales"
            onPress={() => navigation.navigate("Legal")}
            testID="legal-button"
          />
          <RowDivider />
          <ListRow
            label="Politique de confidentialité"
            onPress={() => navigation.navigate("Legal")}
            testID="privacy-button"
          />
          <RowDivider />
          <ListRow
            label="Envoyer un feedback"
            onPress={() => openFeedback()}
            testID="feedback-button"
          />
          <RowDivider />
          <ListRow
            label="Contact support"
            onPress={() =>
              showAlert(
                "Contact support",
                "Pour toute question, contactez-nous à support@bodyorthox.com",
              )
            }
            testID="contact-button"
          />
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.s16,
    paddingTop: spacing.s16,
    paddingBottom: spacing.s28,
    gap: spacing.s10,
  },
  group: {
    overflow: "hidden",
    marginBottom: spacing.s8,
  },
  fields: {
    gap: spacing.s12,
    marginBottom: spacing.s8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.s16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: sizes.tap,
    paddingHorizontal: spacing.s16,
    paddingVertical: spacing.s10,
    gap: spacing.s12,
    backgroundColor: colors.bgCard,
  },
  switchLabelGroup: {
    flex: 1,
    gap: 2,
  },
  switchLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.listPrimary,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  switchSubtitle: {
    fontFamily: fonts.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
  bottomSpacer: {
    height: spacing.s16,
  },
});
