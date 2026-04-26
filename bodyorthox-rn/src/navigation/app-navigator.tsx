import React, { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, BottomTabParamList } from "./types";
import { Colors } from "../shared/design-system/colors";
import { useOnboardingStore } from "../features/onboarding/store/onboarding-store";
import { LoginScreen } from "../features/auth/screens/login-screen";
import { useAuthStore } from "../core/auth/auth-store";
import { isDevMode } from "../dev/dev-mode";

// Screens
import { BiometricLockScreen } from "../shared/components/lock-screen";
import { OnboardingScreen } from "../features/onboarding/screens/onboarding-screen";
import { EditPatientScreen } from "../features/patients/screens/edit-patient-screen";
import { CaptureScreen } from "../features/capture/screens/capture-screen";
import { ReplayScreen } from "../features/results/screens/replay-screen";
import { PatientTimelineScreen } from "../features/patients/screens/patient-timeline-screen";
import { AccountScreen } from "../features/account/screens/account-screen";
import { AdminScreen } from "../features/admin/screens/admin-screen";
import { ProtocolsScreen } from "../features/resources/screens/protocols-screen";
import { ReportsScreen } from "../features/resources/screens/reports-screen";
import { ProgressionReportScreen } from "../features/report/screens/progression-report-screen";
// Screens v2 (refonte design)
import {
  DashboardRoute,
  PatientsListRoute,
  PatientDetailRoute,
  CreatePatientRoute,
  ResultsRoute,
  ReportRoute,
  ReportsListRoute,
  ProcessingRoute,
  V2TabBar,
} from "./screens-v2";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Stacks inside each tab — so the tab bar stays visible
const AnalysesStack = createNativeStackNavigator();
const PatientsTabStack = createNativeStackNavigator();
const RapportsTabStack = createNativeStackNavigator();
const CompteStack = createNativeStackNavigator();

const innerScreenOptions = {
  headerStyle: { backgroundColor: Colors.backgroundCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary },
  contentStyle: { backgroundColor: Colors.background },
} as const;

/** Analyses tab: Home + patient detail + results + timeline + protocols + reports */
function AnalysesStackScreen() {
  return (
    <AnalysesStack.Navigator screenOptions={innerScreenOptions}>
      <AnalysesStack.Screen
        name="AnalysesHome"
        component={DashboardRoute}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="CreatePatient"
        component={CreatePatientRoute}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="EditPatient"
        component={EditPatientScreen}
        options={{ title: "Modifier le patient" }}
      />
      <AnalysesStack.Screen
        name="PatientDetail"
        component={PatientDetailRoute}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="Results"
        component={ResultsRoute}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="Replay"
        component={ReplayScreen}
        options={{ title: "Relecture experte" }}
      />
      <AnalysesStack.Screen
        name="Timeline"
        component={PatientTimelineScreen}
        options={{ title: "Progression clinique" }}
      />
      <AnalysesStack.Screen
        name="Protocols"
        component={ProtocolsScreen}
        options={{ title: "Protocoles" }}
      />
      <AnalysesStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: "Rapports PDF" }}
      />
      <AnalysesStack.Screen
        name="Report"
        component={ReportRoute}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="ProgressionReport"
        component={ProgressionReportScreen}
        options={{ title: "Rapport de progression" }}
      />
    </AnalysesStack.Navigator>
  );
}

/** Patients tab: patient list + detail + results */
function PatientsTabStackScreen() {
  return (
    <PatientsTabStack.Navigator screenOptions={innerScreenOptions}>
      <PatientsTabStack.Screen
        name="PatientsList"
        component={PatientsListRoute}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="CreatePatient"
        component={CreatePatientRoute}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="EditPatient"
        component={EditPatientScreen}
        options={{ title: "Modifier le patient" }}
      />
      <PatientsTabStack.Screen
        name="PatientDetail"
        component={PatientDetailRoute}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="Results"
        component={ResultsRoute}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="Timeline"
        component={PatientTimelineScreen}
        options={{ title: "Progression clinique" }}
      />
      <PatientsTabStack.Screen
        name="Report"
        component={ReportRoute}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="ProgressionReport"
        component={ProgressionReportScreen}
        options={{ title: "Rapport de progression" }}
      />
    </PatientsTabStack.Navigator>
  );
}

/** Rapports tab: liste globale des rapports + acces a un rapport individuel */
function RapportsTabStackScreen() {
  return (
    <RapportsTabStack.Navigator screenOptions={innerScreenOptions}>
      <RapportsTabStack.Screen
        name="RapportsHome"
        component={ReportsListRoute}
        options={{ headerShown: false }}
      />
      <RapportsTabStack.Screen
        name="Report"
        component={ReportRoute}
        options={{ headerShown: false }}
      />
    </RapportsTabStack.Navigator>
  );
}

/** Compte tab: just the account screen */
function CompteStackScreen() {
  return (
    <CompteStack.Navigator screenOptions={innerScreenOptions}>
      <CompteStack.Screen
        name="CompteHome"
        component={AccountScreen}
        options={{ headerShown: false }}
      />
      <CompteStack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ title: 'Administration' }}
      />
    </CompteStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <V2TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="AnalysesTab" component={AnalysesStackScreen} />
      <Tab.Screen name="PatientsTab" component={PatientsTabStackScreen} />
      <Tab.Screen name="RapportsTab" component={RapportsTabStackScreen} />
      <Tab.Screen name="CompteTab" component={CompteStackScreen} />
    </Tab.Navigator>
  );
}

const rootScreenOptions = {
  headerStyle: { backgroundColor: Colors.backgroundCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary },
  contentStyle: { backgroundColor: Colors.background },
} as const;

export function AppNavigator() {
  const initialize = useAuthStore((s) => s.initialize);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const checkOnboarding = useOnboardingStore((s) => s.checkOnboarding);
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);
  const isOnboardingLoading = useOnboardingStore((s) => s.isLoading);

  useEffect(() => {
    if (isDevMode()) return;
    initialize();
    checkOnboarding();
  }, [initialize, checkOnboarding]);

  if (isAuthLoading || isOnboardingLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Stack.Navigator
        screenOptions={rootScreenOptions}
        initialRouteName="Login"
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={rootScreenOptions} initialRouteName="Lock">
      <Stack.Screen
        name="Lock"
        component={BiometricLockScreen}
        options={{ headerShown: false }}
      />
      {!isOnboardingCompleted && (
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      )}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      {/* Capture is fullscreen — NO tab bar */}
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          headerShown: false,
          orientation: Platform.OS !== "web" ? "portrait" : undefined,
        }}
      />
      <Stack.Screen
        name="Processing"
        component={ProcessingRoute}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  );
}
