import React, { useEffect } from "react";
import { Platform, Text, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, BottomTabParamList } from "./types";
import { Colors } from "../shared/design-system/colors";
import { useOnboardingStore } from "../features/onboarding/store/onboarding-store";
import { LoginScreen } from "../features/auth/screens/login-screen";
import { useAuthStore } from "../core/auth/auth-store";

// Screens
import { BiometricLockScreen } from "../shared/components/lock-screen";
import { OnboardingScreen } from "../features/onboarding/screens/onboarding-screen";
import { PatientsScreen } from "../features/patients/screens/patients-screen";
import { PatientsListScreen } from "../features/patients/screens/patients-list-screen";
import { CreatePatientScreen } from "../features/patients/screens/create-patient-screen";
import { PatientDetailScreen } from "../features/patients/screens/patient-detail-screen";
import { CaptureScreen } from "../features/capture/screens/capture-screen";
import { ResultsScreen } from "../features/results/screens/results-screen";
import { ReplayScreen } from "../features/results/screens/replay-screen";
import { PatientTimelineScreen } from "../features/patients/screens/patient-timeline-screen";
import { AccountScreen } from "../features/account/screens/account-screen";
import { AdminScreen } from "../features/admin/screens/admin-screen";
import { ProtocolsScreen } from "../features/resources/screens/protocols-screen";
import { ReportsScreen } from "../features/resources/screens/reports-screen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Stacks inside each tab — so the tab bar stays visible
const AnalysesStack = createNativeStackNavigator();
const PatientsTabStack = createNativeStackNavigator();
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
        component={PatientsScreen}
        options={{ headerShown: false }}
      />
      <AnalysesStack.Screen
        name="CreatePatient"
        component={CreatePatientScreen}
        options={{ title: "Nouveau patient" }}
      />
      <AnalysesStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: "Patient" }}
      />
      <AnalysesStack.Screen
        name="Results"
        component={ResultsScreen}
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
    </AnalysesStack.Navigator>
  );
}

/** Patients tab: patient list + detail + results */
function PatientsTabStackScreen() {
  return (
    <PatientsTabStack.Navigator screenOptions={innerScreenOptions}>
      <PatientsTabStack.Screen
        name="PatientsList"
        component={PatientsListScreen}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: "Patient" }}
      />
      <PatientsTabStack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
      <PatientsTabStack.Screen
        name="Timeline"
        component={PatientTimelineScreen}
        options={{ title: "Progression clinique" }}
      />
    </PatientsTabStack.Navigator>
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

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      style={[
        tabStyles.icon,
        { color: focused ? Colors.primary : Colors.textSecondary },
      ]}
    >
      {emoji}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.backgroundCard,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="AnalysesTab"
        component={AnalysesStackScreen}
        options={{
          tabBarLabel: "Analyses",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PatientsTab"
        component={PatientsTabStackScreen}
        options={{
          tabBarLabel: "Patients",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CompteTab"
        component={CompteStackScreen}
        options={{
          tabBarLabel: "Compte",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
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
    initialize();
    checkOnboarding();
  }, [initialize, checkOnboarding]);

  if (isAuthLoading || isOnboardingLoading) {
    return (
      <Stack.Navigator
        screenOptions={rootScreenOptions}
        initialRouteName="Lock"
      >
        <Stack.Screen
          name="Lock"
          component={BiometricLockScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
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
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  icon: {
    fontSize: 22,
  },
});
