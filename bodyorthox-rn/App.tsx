import React, { useEffect, Component, ErrorInfo } from "react";
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
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator } from "./src/navigation/app-navigator";
import { Colors } from "./src/shared/design-system/colors";
import { initializeDatabase } from "./src/core/database/init";
import { FeedbackFab } from "./src/features/feedback/components/feedback-fab";
import { FeedbackModal } from "./src/features/feedback/components/feedback-modal";
import { Dashboard } from "./src/screens/Dashboard";
import { PatientList } from "./src/screens/PatientList";
import { PatientDetail, SAMPLE_PATIENT_DETAIL } from "./src/screens/PatientDetail";
import { NewPatient } from "./src/screens/NewPatient";
import { Capture } from "./src/screens/Capture";
import { Processing } from "./src/screens/Processing";
import { Results, SAMPLE_RESULTS } from "./src/screens/Results";
import { Report, SAMPLE_REPORT } from "./src/screens/Report";
import { PreviewGallery } from "./src/screens/PreviewGallery";
import { bootDevMode, isDevMode } from "./src/dev/dev-mode";

// Top-level boot: doit se faire AVANT que React monte AppContent, sinon
// `initialize()` du auth-store resetterait l'etat seedé.
bootDevMode();

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

function AppContent() {
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
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
        <FeedbackFab />
        <FeedbackModal />
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
    case "capture":
      return <Capture />;
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
