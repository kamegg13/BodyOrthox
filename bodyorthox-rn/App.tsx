import React, { useEffect, Component, ErrorInfo } from "react";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
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

/**
 * Global error boundary — catches JS errors and displays them
 * on screen instead of crashing the app. This helps debug on
 * devices where we can't access adb logcat.
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

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Erreur détectée</Text>
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
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a0000",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#ff4444",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  scroll: { flex: 1 },
  errorName: {
    color: "#ff8888",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  stack: {
    color: "#cccccc",
    fontSize: 11,
    fontFamily: "monospace",
    marginBottom: 12,
  },
  componentStack: {
    color: "#888888",
    fontSize: 10,
    fontFamily: "monospace",
  },
});

function AppContent() {
  useEffect(() => {
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

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
