import React, { useCallback, useEffect, useState, Component, ErrorInfo } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/app-navigator";
import { linking } from "./src/navigation/linking";
import { ToastHost } from "./src/components/ToastHost";
import { Colors } from "./src/shared/design-system/colors";
import { initializeDatabase } from "./src/core/database/init";
import { FeedbackFab } from "./src/features/feedback/components/feedback-fab";
import { FeedbackModal } from "./src/features/feedback/components/feedback-modal";
import { Dashboard } from "./src/navigation/screens-v2/dashboard-route";
import { PatientList } from "./src/navigation/screens-v2/patients-list-route";
import { PatientDetail } from "./src/navigation/screens-v2/patient-detail-route";
import { SAMPLE_PATIENT_DETAIL } from "./src/screens/__fixtures__/patient-detail";
import { NewPatient } from "./src/screens/new-patient/new-patient";
import { Processing } from "./src/navigation/screens-v2/processing-route";
import { Results } from "./src/navigation/screens-v2/results-route";
import { SAMPLE_RESULTS } from "./src/screens/__fixtures__/results";
import { Report } from "./src/navigation/screens-v2/report-route";
import { SAMPLE_REPORT } from "./src/screens/__fixtures__/report";
import { PreviewGallery } from "./src/screens/PreviewGallery";
import { bootDevMode, isDevMode } from "./src/dev/dev-mode";
import { installAsyncStorageBackend } from "./src/core/storage/async-storage-backend";

// Top-level boot: doit se faire AVANT que React monte AppContent, sinon
// `initialize()` du auth-store resetterait l'etat seedé.
bootDevMode();

// Persistance clé/valeur native (onboarding, calibration HKA) : hydratation
// AsyncStorage lancée dès le boot ; les consommateurs attendent
// `whenStorageReady()`. Sur web, localStorage est déjà synchrone.
if (Platform.OS !== "web") {
  installAsyncStorageBackend();
}

// Preview mode (web only) — ouvrir avec ?preview=<screen> pour visualiser
// les nouveaux écrans v2 sans passer par l'auth. Aucun impact mobile.
const previewScreen =
  Platform.OS === "web" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview")
    : null;

/**
 * Global error boundary — catches JS errors and lets the user recover
 * via "Recharger" instead of leaving the app stuck. Technical details
 * (stack traces) are only rendered in development builds.
 */
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { error: Error | null; errorInfo: ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Une erreur est survenue</Text>
          <Text style={errorStyles.subtitle}>
            L'application a rencontré un problème inattendu. Vos données ne
            sont pas affectées.
          </Text>
          <TouchableOpacity
            style={errorStyles.resetButton}
            onPress={this.handleReset}
            accessibilityRole="button"
            testID="error-boundary-reset"
          >
            <Text style={errorStyles.resetButtonText}>Recharger</Text>
          </TouchableOpacity>
          {__DEV__ && (
            <ScrollView style={errorStyles.scroll}>
              <Text style={errorStyles.errorName}>
                {this.state.error.name}: {this.state.error.message}
              </Text>
              <Text style={errorStyles.stack}>
                {this.state.error.stack?.substring(0, 2000)}
              </Text>
              {this.state.errorInfo && (
                <Text style={errorStyles.componentStack}>
                  {this.state.errorInfo.componentStack?.substring(0, 1000)}
                </Text>
              )}
            </ScrollView>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    paddingTop: 80,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: Colors.primary,
    borderRadius: 13,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  resetButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  errorName: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  stack: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  componentStack: {
    color: Colors.textDisabled,
    fontSize: 10,
    fontFamily: "monospace",
  },
});

const navigationRef = createNavigationContainerRef();

// Le FAB de feedback n'apparaît que sur l'accueil : partout ailleurs il
// recouvrait des actions critiques (CTA « Générer le rapport PDF » des
// résultats, « Archiver le patient » de la fiche). L'accès permanent au
// feedback reste garanti par l'entrée « Envoyer un feedback » des Réglages.
const FAB_VISIBLE_ROUTES = new Set(["AnalysesHome"]);

function AppContent() {
  const [fabHidden, setFabHidden] = useState(true);

  const syncFabWithRoute = useCallback(() => {
    const routeName = navigationRef.isReady()
      ? navigationRef.getCurrentRoute()?.name
      : undefined;
    setFabHidden(routeName === undefined || !FAB_VISIBLE_ROUTES.has(routeName));
  }, []);

  useEffect(() => {
    if (isDevMode()) return;
    initializeDatabase().catch((err) => {
      Alert.alert("DB Error", String(err));
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.backgroundCard}
        />
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onReady={syncFabWithRoute}
          onStateChange={syncFabWithRoute}
        >
          <AppNavigator />
        </NavigationContainer>
        {!fabHidden && <FeedbackFab />}
        <FeedbackModal />
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function PreviewScreen({ name }: { name: string }) {
  switch (name) {
    case "dashboard":
      return <Dashboard />;
    case "patients":
      return <PatientList />;
    case "patient-detail":
      return <PatientDetail data={SAMPLE_PATIENT_DETAIL} />;
    case "new-patient":
      return <NewPatient />;
    case "processing":
      return <Processing />;
    case "results":
      return <Results data={SAMPLE_RESULTS} />;
    case "report":
      return <Report data={SAMPLE_REPORT} />;
    case "all":
      return <PreviewGallery />;
    default:
      return null;
  }
}

export default function App() {
  if (previewScreen) {
    return (
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <PreviewScreen name={previewScreen} />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
