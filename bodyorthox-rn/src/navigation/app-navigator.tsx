import React, { useEffect } from "react";
import { Platform, Text, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, BottomTabParamList } from "./types";
import { Colors } from "../shared/design-system/colors";
import { useOnboardingStore } from "../features/onboarding/store/onboarding-store";

// Screens
import { BiometricLockScreen } from "../shared/components/lock-screen";
import { OnboardingScreen } from "../features/onboarding/screens/onboarding-screen";
import { PatientsScreen } from "../features/patients/screens/patients-screen";
import { CreatePatientScreen } from "../features/patients/screens/create-patient-screen";
import { PatientDetailScreen } from "../features/patients/screens/patient-detail-screen";
import { CaptureScreen } from "../features/capture/screens/capture-screen";
import { ResultsScreen } from "../features/results/screens/results-screen";
import { ReplayScreen } from "../features/results/screens/replay-screen";
import { PatientTimelineScreen } from "../features/patients/screens/patient-timeline-screen";
import { AccountScreen } from "../features/account/screens/account-screen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: Colors.backgroundCard },
  headerTintColor: Colors.textPrimary,
  headerTitleStyle: { color: Colors.textPrimary },
  contentStyle: { backgroundColor: Colors.background },
} as const;

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

const tabStyles = StyleSheet.create({
  icon: {
    fontSize: 22,
  },
});

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
        component={PatientsScreen}
        options={{
          tabBarLabel: "Analyses",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\uD83D\uDCCA"} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="PatientsTab"
        component={PatientsScreen}
        options={{
          tabBarLabel: "Patients",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\uD83D\uDC65"} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="CompteTab"
        component={AccountScreen}
        options={{
          tabBarLabel: "Compte",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={"\uD83D\uDC64"} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const checkOnboarding = useOnboardingStore((s) => s.checkOnboarding);
  const isOnboardingCompleted = useOnboardingStore((s) => s.isCompleted);
  const isLoading = useOnboardingStore((s) => s.isLoading);

  useEffect(() => {
    checkOnboarding();
  }, [checkOnboarding]);

  // While checking onboarding status, show Lock screen as default
  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={screenOptions} initialRouteName="Lock">
        <Stack.Screen
          name="Lock"
          component={BiometricLockScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions} initialRouteName="Lock">
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
      <Stack.Screen
        name="Patients"
        component={PatientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreatePatient"
        component={CreatePatientScreen}
        options={{ title: "Nouveau patient" }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ title: "Patient" }}
      />
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{
          headerShown: false,
          orientation: Platform.OS !== "web" ? "portrait" : undefined,
        }}
      />
      <Stack.Screen
        name="Results"
        component={ResultsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Replay"
        component={ReplayScreen}
        options={{ title: "Relecture experte" }}
      />
      <Stack.Screen
        name="Timeline"
        component={PatientTimelineScreen}
        options={{ title: "Progression clinique" }}
      />
    </Stack.Navigator>
  );
}
